<?php

declare(strict_types=1);

namespace Satoshi\PLP\Block;

use Magento\Framework\View\Element\Template;
use Satoshi\PLP\Helper\Data;

class ImageList extends Template
{
    /**
     * @var Data
     */
    protected $dataHelper;

    /**
     * @param Template\Context $context
     * @param Data $dataHelper
     * @param array $data
     */
    public function __construct(
        Template\Context $context,
        Data             $dataHelper,
        array            $data = []
    )
    {
        $this->dataHelper = $dataHelper;
        parent::__construct($context, $data);
    }

    /**
     * @return array
     */
    public function getPreloadImageList()
    {
        return $this->dataHelper->getFirstFourProductImages();
    }
}
