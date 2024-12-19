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
}
