<?php

declare(strict_types=1);

namespace Satoshi\Checkout\Controller\Cart;

use Magento\Checkout\Model\Cart as CustomerCart;
use Magento\Framework\Escaper;
use Magento\Sales\Model\Order\Item;
use Magento\Checkout\Controller\Cart\Addgroup as SourceAddgroup;

class Addgroup extends SourceAddgroup
{
    /**
     * @var \Magento\Customer\Model\Session $session
     */
    protected $_customerSession;

    /**
     * @param \Magento\Framework\App\Action\Context $context
     * @param \Magento\Framework\App\Config\ScopeConfigInterface $scopeConfig
     * @param \Magento\Checkout\Model\Session $checkoutSession
     * @param \Magento\Store\Model\StoreManagerInterface $storeManager
     * @param \Magento\Framework\Data\Form\FormKey\Validator $formKeyValidator
     * @param CustomerCart $cart
     * @param Escaper|null $escaper
     */
    public function __construct(
        \Magento\Framework\App\Action\Context $context,
        \Magento\Framework\App\Config\ScopeConfigInterface $scopeConfig,
        \Magento\Checkout\Model\Session $checkoutSession,
        \Magento\Store\Model\StoreManagerInterface $storeManager,
        \Magento\Framework\Data\Form\FormKey\Validator $formKeyValidator,
        CustomerCart $cart,
        Escaper $escaper = null
    ) {
        parent::__construct(
            $context,
            $scopeConfig,
            $checkoutSession,
            $storeManager,
            $formKeyValidator,
            $cart,
            $escaper,
        );

        $this->_customerSession = $this->cart->getCustomerSession();
    }

    /**
     * Add items in group.
     *
     * @return \Magento\Framework\Controller\Result\Redirect
     */
    public function execute()
    {
        $orderItemIds = $this->getRequest()->getPost('order_items');
        if (is_array($orderItemIds)) {
            $itemsCollection = $this->_objectManager->create(\Magento\Sales\Model\Order\Item::class)
                ->getCollection()
                ->addIdFilter($orderItemIds)
                ->load();
            /* @var $itemsCollection \Magento\Sales\Model\ResourceModel\Order\Item\Collection */
            foreach ($itemsCollection as $item) {
                try {
                    $this->addOrderItem($item);
                } catch (\Magento\Framework\Exception\LocalizedException $e) {
                    $this->_customerSession->setErrorMessage($e->getMessage());
                } catch (\Exception $e) {
                    $this->_customerSession->setErrorMessage($e->getMessage() ?: __('We can\'t add this item to your shopping cart right now.'));
                    $this->_objectManager->get(\Psr\Log\LoggerInterface::class)->critical($e);
                    return $this->_goBack();
                }
            }
            $this->cart->save();
        } else {
            $this->_customerSession->setErrorMessage(__('Please select at least one product to add to cart'));
        }
        return $this->_goBack();
    }

    /**
     * Add item to cart.
     *
     * Add item to cart only if it's belongs to customer.
     *
     * @param Item $item
     * @return void
     */
    private function addOrderItem(Item $item)
    {
        if ($this->_customerSession->isLoggedIn()) {
            $orderCustomerId = $item->getOrder()->getCustomerId();
            $currentCustomerId = $this->_customerSession->getCustomer()->getId();
            if ($orderCustomerId == $currentCustomerId) {
                $this->cart->addOrderItem($item, 1);
            }
        }
    }
}
