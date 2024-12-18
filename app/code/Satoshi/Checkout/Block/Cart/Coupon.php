<?php

namespace Satoshi\Checkout\Block\Cart;

use Magento\Checkout\Block\Cart\Coupon as CoreCoupon;

class Coupon extends CoreCoupon
{

    /**
     * Coupon flash message.
     *
     * @return string
     */
    public function getCouponMessage()
    {
        $message = $this->_checkoutSession->getCouponMessage();
        $this->_checkoutSession->unsCouponMessage();
        return $message;
    }

    /**
     * Retrieve and clear the error message from the session
     *
     * @return string|null
     */
    public function getErrorMessage()
    {
        $errorMessage = $this->_checkoutSession->getErrorMessage();
        $this->_checkoutSession->unsErrorMessage();
        return $errorMessage;
    }
}
