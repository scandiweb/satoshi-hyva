<?php

declare(strict_types=1);

namespace Satoshi\Checkout\Controller\Cart;

use Magento\Checkout\Model\Cart\RequestQuantityProcessor;
use Magento\Checkout\Controller\Cart\UpdatePost as SourceUpdatePost;

/**
 * Post update shopping cart.
 */
class UpdatePost extends SourceUpdatePost
{
    /**
     * @var RequestQuantityProcessor
     */
    private $quantityProcessor;

    /**
     * @var \Magento\Checkout\Model\Session
     */
    protected $_checkoutSession;

    /**
     * @param \Magento\Framework\App\Action\Context $context
     * @param \Magento\Framework\App\Config\ScopeConfigInterface $scopeConfig
     * @param \Magento\Checkout\Model\Session $checkoutSession
     * @param \Magento\Store\Model\StoreManagerInterface $storeManager
     * @param \Magento\Framework\Data\Form\FormKey\Validator $formKeyValidator
     * @param \Magento\Checkout\Model\Cart $cart
     * @param RequestQuantityProcessor $quantityProcessor
     */
    public function __construct(
        \Magento\Framework\App\Action\Context              $context,
        \Magento\Framework\App\Config\ScopeConfigInterface $scopeConfig,
        \Magento\Checkout\Model\Session                    $checkoutSession,
        \Magento\Store\Model\StoreManagerInterface         $storeManager,
        \Magento\Framework\Data\Form\FormKey\Validator     $formKeyValidator,
        \Magento\Checkout\Model\Cart                       $cart,
        RequestQuantityProcessor                           $quantityProcessor = null
    )
    {
        parent::__construct(
            $context,
            $scopeConfig,
            $checkoutSession,
            $storeManager,
            $formKeyValidator,
            $cart
        );

        $this->quantityProcessor = $quantityProcessor ?: $this->_objectManager->get(RequestQuantityProcessor::class);
        $this->_checkoutSession = $checkoutSession;
    }

    /**
     * Empty customer's shopping cart
     *
     * @return void
     */
    protected function _emptyShoppingCart()
    {
        try {
            $this->cart->truncate()->save();
        } catch (\Magento\Framework\Exception\LocalizedException $exception) {
            $this->_checkoutSession->setCartMessage([
                'error' => $exception->getMessage()
            ]);
        } catch (\Exception $exception) {
            $this->_checkoutSession->setCartMessage([
                'error' => $exception->getMessage() ?? __('We can\'t update the shopping cart.')
            ]);
        }
    }

    /**
     * Update customer's shopping cart
     *
     * @return void
     */
    protected function _updateShoppingCart()
    {
        try {
            $cartData = $this->getRequest()->getParam('cart');
            if (is_array($cartData)) {
                if (!$this->cart->getCustomerSession()->getCustomerId() && $this->cart->getQuote()->getCustomerId()) {
                    $this->cart->getQuote()->setCustomerId(null);
                }
                $cartData = $this->quantityProcessor->process($cartData);
                $cartData = $this->cart->suggestItemsQty($cartData);
                $this->cart->updateItems($cartData)->save();
            }
        } catch (\Magento\Framework\Exception\LocalizedException $e) {
            $this->_checkoutSession->setCartMessage([
                'error' => $this->_objectManager->get(\Magento\Framework\Escaper::class)->escapeHtml($e->getMessage())
            ]);
        } catch (\Exception $e) {
            $this->_checkoutSession->setCartMessage([
                'error' => $e->getMessage() ?? __('We can\'t update the shopping cart.')
            ]);
            $this->_objectManager->get(\Psr\Log\LoggerInterface::class)->critical($e);
        }
    }
}
