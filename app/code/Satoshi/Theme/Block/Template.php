<?php

namespace Satoshi\Theme\Block;

use Magento\Framework\View\Element\Template as MagentoTemplate;
use Magento\Framework\View\Element\Template\Context;

class Template extends MagentoTemplate
{

    public function __construct(
        Context $context,
        array $data = []
    ) {
        parent::__construct($context, $data);
    }

    public function setChildTemplate(string $childTemplate)
    {
        $this->setChild(
            'child-content',
            $this->getLayout()->createBlock(Template::class)->setTemplate($childTemplate)
        );
        return $this;
    }

    public function render(string $template)
    {
        return $this->setTemplate($template)->toHtml();
    }
}
