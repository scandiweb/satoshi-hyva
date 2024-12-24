<?php

namespace Satoshi\Theme\Block;

use Magento\Framework\Exception\LocalizedException;
use Magento\Framework\View\Element\AbstractBlock;
use Magento\Framework\View\Element\Template;
use Magento\Framework\View\Element\Template\Context;
use Magento\Framework\View\Element\Text;

class Popup extends Template
{
    /**
     * @var string
     */
    protected $_template = 'Satoshi_Theme::popup.phtml';

    /**
     * @param Context $context
     * @param array $data
     */
    public function __construct(
        Context $context,
        array   $data = []
    )
    {
        parent::__construct($context, $data);
    }

    /**
     * @param string $childTemplate
     * @param array $data
     * @return $this
     * @throws LocalizedException
     */
    public function setChildTemplate(string $childTemplate, array $data = [])
    {
        $this->setChild(
            'popup-content',
            $this->getLayout()->createBlock(Template::class)->setTemplate($childTemplate)->setData($data)
        );
        return $this;
    }

    /**
     * @param AbstractBlock|string $childBlock
     * @return $this
     */
    public function setChildBlock(AbstractBlock|string $childBlock)
    {
        $this->setChild(
            'popup-content',
            $childBlock
        );
        return $this;
    }

    /**
     * @param string $childHtml
     * @return $this
     * @throws LocalizedException
     */
    public function setChildHtml(string $childHtml)
    {
        $this->setChild(
            'popup-content',
            $this->getLayout()->createBlock(Text::class)->setText($childHtml)
        );
        return $this;
    }

    /**
     * @return string
     */
    public function render()
    {
        return $this->toHtml();
    }
}
