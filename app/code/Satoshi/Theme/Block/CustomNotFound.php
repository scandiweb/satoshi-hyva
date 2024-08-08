<?php

namespace Satoshi\Theme\Block;

use Magento\Framework\View\Element\Template;
use Magento\Framework\View\Element\Template\Context;

class CustomNotFound extends Template
{
    public function __construct(
        Context $context,
        array $data = []
    ) {
        parent::__construct($context, $data);
    }

    public function getNotFoundText()
    {
        return __('404');
    }

    public function getNotFoundTitle()
    {
        return __('Page not be found.');
    }

    public function getContinueShoppingUrl()
    {
        return $this->getUrl('/'); // Replace with the actual URL for the all products collection
    }

    public function getContinueShoppingText()
    {
        return __('Continue Shopping');
    }
}
