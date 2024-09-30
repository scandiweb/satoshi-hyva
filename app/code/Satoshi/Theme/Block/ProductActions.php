<?php

namespace Satoshi\Theme\Block;

use Magento\Checkout\Model\Session;
use Magento\Framework\View\Element\Template;
use Magento\Framework\View\Element\Template\Context;

class ProductActions extends Template
{
    /**
     * @var Session
     */
    protected Session $checkoutSession;

    /**
     * @param  Context  $context
     * @param  Session  $checkoutSession
     * @param  array  $data
     */
    public function __construct(
        Context $context,
        Session $checkoutSession,
        array $data = []
    ) {
        parent::__construct($context, $data);
        $this->checkoutSession = $checkoutSession;
    }

    /**
     * Cart flash message.
     *
     * @return string
     */
    public function getCartMessage()
    {
        $message = $this->checkoutSession->getCartMessage();
        $this->checkoutSession->unsCartMessage();
        return $message;
    }
}
