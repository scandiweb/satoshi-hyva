<?php

namespace Satoshi\Checkout\Controller\Cart;

use Magento\Checkout\Controller\Cart\CouponPost as CoreCouponPost;

class CouponPost extends CoreCouponPost
{
    /**
     * Initialize coupon
     *
     * @return \Magento\Framework\Controller\Result\Redirect
     * @SuppressWarnings(PHPMD.CyclomaticComplexity)
     * @SuppressWarnings(PHPMD.NPathComplexity)
     */
    public function execute()
    {
        $couponCode = $this->getRequest()->getParam('remove') == 1
            ? ''
            : trim($this->getRequest()->getParam('coupon_code', ''));

        $cartQuote = $this->cart->getQuote();
        $oldCouponCode = $cartQuote->getCouponCode() ?? '';

        $codeLength = strlen($couponCode);
        if (!$codeLength && !strlen($oldCouponCode)) {
            return $this->_goBack();
        }

        try {
            $isCodeLengthValid = $codeLength && $codeLength <= \Magento\Checkout\Helper\Cart::COUPON_CODE_MAX_LENGTH;

            $itemsCount = $cartQuote->getItemsCount();
            if ($itemsCount) {
                $cartQuote->getShippingAddress()->setCollectShippingRates(true);
                $cartQuote->setCouponCode($isCodeLengthValid ? $couponCode : '')->collectTotals();
                $this->quoteRepository->save($cartQuote);
            }

            if ($codeLength) {
                $escaper = $this->_objectManager->get(\Magento\Framework\Escaper::class);
                $coupon = $this->couponFactory->create();
                $coupon->load($couponCode, 'code');
                if (!$itemsCount) {
                    if ($isCodeLengthValid && $coupon->getId()) {
                        $this->_checkoutSession->getQuote()->setCouponCode($couponCode)->save();
                        $this->_checkoutSession->setCouponMessage([
                            'status' => 'success',
                            'message' => __(
                                'You used coupon code "%1".',
                                $escaper->escapeHtml($couponCode)
                            )
                        ]);
                    } else {
                        $this->_checkoutSession->setCouponMessage([
                            'status' => 'error',
                            'message' => __(
                                'The coupon code "%1" is not valid.',
                                $escaper->escapeHtml($couponCode)
                            )
                        ]);
                    }
                } else {
                    if ($isCodeLengthValid && $coupon->getId() && $couponCode == $cartQuote->getCouponCode()) {
                        $this->_checkoutSession->setCouponMessage([
                            'status' => 'success',
                            'message' => __(
                                'You used coupon code "%1".',
                                $escaper->escapeHtml($couponCode)
                            )
                        ]);
                    } else {
                        $this->_checkoutSession->setCouponMessage([
                            'status' => 'error',
                            'message' => __(
                                'The coupon code "%1" is not valid.',
                                $escaper->escapeHtml($couponCode)
                            )
                        ]);
                    }
                }
            } else {
                $this->_checkoutSession->setCouponMessage([
                    'status' => 'success',
                    'message' => __('You canceled the coupon code.')
                ]);
            }
        } catch (\Magento\Framework\Exception\LocalizedException $e) {
            $this->_checkoutSession->setCouponMessage([
                'status' => 'error',
                'message' => $e->getMessage()
            ]);
        } catch (\Exception $e) {
            $this->_checkoutSession->setCouponMessage([
                'status' => 'error',
                'message' => __('We cannot apply the coupon code.')
            ]);
            $this->_objectManager->get(\Psr\Log\LoggerInterface::class)->critical($e);
        }

        return $this->_goBack();
    }
}