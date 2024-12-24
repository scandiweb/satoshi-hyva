<?php

namespace Satoshi\Checkout\Controller\Cart;

use Exception;
use Magento\Checkout\Controller\Cart\UpdatePost as SourceUpdatePost;
use Magento\Checkout\Model\Cart;
use Magento\Checkout\Model\Cart\RequestQuantityProcessor;
use Magento\Checkout\Model\Session;
use Magento\Framework\App\Action\Context;
use Magento\Framework\App\Config\ScopeConfigInterface;
use Magento\Framework\Controller\Result\Redirect;
use Magento\Framework\Data\Form\FormKey\Validator;
use Magento\Framework\Exception\LocalizedException;
use Magento\Store\Model\StoreManagerInterface;
use Psr\Log\LoggerInterface;

/**
 * Post update shopping cart.
 *
 * Extended to return error messages with keys
 */
class UpdatePost extends SourceUpdatePost
{
    /**
     * @var RequestQuantityProcessor
     */
    private $quantityProcessor;

    /**
     * @param Context $context
     * @param ScopeConfigInterface $scopeConfig
     * @param Session $checkoutSession
     * @param StoreManagerInterface $storeManager
     * @param Validator $formKeyValidator
     * @param Cart $cart
     * @param RequestQuantityProcessor|null $quantityProcessor
     */
    public function __construct(
        Context                  $context,
        ScopeConfigInterface     $scopeConfig,
        Session                  $checkoutSession,
        StoreManagerInterface    $storeManager,
        Validator                $formKeyValidator,
        Cart                     $cart,
        RequestQuantityProcessor $quantityProcessor = null
    )
    {
        parent::__construct(
            $context,
            $scopeConfig,
            $checkoutSession,
            $storeManager,
            $formKeyValidator,
            $cart,
            $quantityProcessor
        );
        $this->quantityProcessor = $quantityProcessor ?: $this->_objectManager->get(RequestQuantityProcessor::class);
    }

    /**
     * Update shopping cart data action
     *
     * @return Redirect
     */
    public function execute()
    {
        if (!$this->_formKeyValidator->validate($this->getRequest())) {
            return $this->resultRedirectFactory->create()->setPath('*/*/');
        }

        $updateAction = (string)$this->getRequest()->getParam('update_cart_action');

        switch ($updateAction) {
            case 'empty_cart':
                $this->_emptyShoppingCart();
                break;
            case 'update_qty':
                $this->_updateShoppingCart();
                break;
            default:
                $this->_updateShoppingCart();
        }

        return $this->_goBack();
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
        } catch (LocalizedException $exception) {
            $this->_checkoutSession->setMiniCartErrorMessage($exception->getMessage());
        } catch (Exception $exception) {
            $this->_checkoutSession->setMiniCartErrorMessage(__('We can\'t update the shopping cart.'));
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
        } catch (LocalizedException $e) {
            $this->_checkoutSession->setMiniCartErrorMessage(__('Some of the products are out of stock.'));
        } catch (Exception $e) {
            $this->_checkoutSession->setMiniCartErrorMessage(__('We can\'t update the shopping cart.'));
            $this->_objectManager->get(LoggerInterface::class)->critical($e);
        }
    }
}
