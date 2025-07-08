<?php

namespace Satoshi\Theme\Block;

use Magento\Checkout\Model\Session;
use Magento\Framework\View\Element\Template;
use Magento\Framework\View\Element\Template\Context;

class Minicart extends Template
{

    /**
     * @var string
     */
    protected $_template = 'Magento_Theme::html/header/cart/minicart-button.phtml';

    /**
     * @var Session
     */
    protected Session $checkoutSession;

    /**
     * @param Context $context
     * @param Session $checkoutSession
     * @param array $data
     */
    public function __construct(
        Context $context,
        Session $checkoutSession,
        array   $data = []
    )
    {
        parent::__construct($context, $data);
        $this->checkoutSession = $checkoutSession;
    }

    /**
     * MiniCart flash message.
     *
     * @return string
     */
    public function getMiniCartErrorMessage()
    {
        $message = $this->checkoutSession->getMiniCartErrorMessage();
        $this->checkoutSession->unsMiniCartErrorMessage();
        return $message;
    }

    /**
     * Product addtocart flash message.
     *
     * @return string
     */
    public function getProductCartErrorMessage()
    {
        $message = $this->checkoutSession->getProductCartErrorMessage();
        $this->checkoutSession->unsProductCartErrorMessage();
        return $message;
    }
}
