<?php

namespace Satoshi\Checkout\Controller\Cart;

use Magento\Checkout\Controller\Cart\CouponPost as CoreCouponPost;

class CouponPost extends CoreCouponPost
{
    /**
     * @var \Satoshi\Core\Helper\IsThemeActive
     */
    private $isThemeActive;

    /**
     * @param \Magento\Framework\App\Action\Context $context
     * @param \Magento\Framework\App\Config\ScopeConfigInterface $scopeConfig
     * @param \Magento\Checkout\Model\Session $checkoutSession
     * @param \Magento\Store\Model\StoreManagerInterface $storeManager
     * @param \Magento\Framework\Data\Form\FormKey\Validator $formKeyValidator
     * @param \Magento\Checkout\Model\Cart $cart
     * @param \Magento\SalesRule\Model\CouponFactory $couponFactory
     * @param \Magento\Quote\Api\CartRepositoryInterface $quoteRepository
     * @param \Satoshi\Core\Helper\IsThemeActive $isThemeActive
     * @codeCoverageIgnore
     */
    public function __construct(
        \Magento\Framework\App\Action\Context $context,
        \Magento\Framework\App\Config\ScopeConfigInterface $scopeConfig,
        \Magento\Checkout\Model\Session $checkoutSession,
        \Magento\Store\Model\StoreManagerInterface $storeManager,
        \Magento\Framework\Data\Form\FormKey\Validator $formKeyValidator,
        \Magento\Checkout\Model\Cart $cart,
        \Magento\SalesRule\Model\CouponFactory $couponFactory,
        \Magento\Quote\Api\CartRepositoryInterface $quoteRepository,
        \Satoshi\Core\Helper\IsThemeActive $isThemeActive
    ) {
        parent::__construct(
            $context,
            $scopeConfig,
            $checkoutSession,
            $storeManager,
            $formKeyValidator,
            $cart,
            $couponFactory,
            $quoteRepository
        );
        $this->isThemeActive = $isThemeActive;
    }

    /**
     * Initialize coupon
     *
     * @return \Magento\Framework\Controller\Result\Redirect
     * @SuppressWarnings(PHPMD.CyclomaticComplexity)
     * @SuppressWarnings(PHPMD.NPathComplexity)
     */
    public function execute()
    {
        if (!$this->isThemeActive->isSatoshiTheme()) {
            return parent::execute();
        }

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