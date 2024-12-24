<?php

declare(strict_types=1);

namespace Satoshi\Theme\Block;

use Magento\Framework\View\Element\Template;
use Magento\Customer\Model\Session as CustomerSession;
use Magento\Sales\Model\ResourceModel\Order\CollectionFactory as OrderCollectionFactory;
use Magento\Wishlist\Model\ResourceModel\Wishlist\CollectionFactory as WishlistCollectionFactory;
use Magento\Catalog\CustomerData\CompareProducts;

class SidebarAdditional extends Template
{
    /**
     * @var CustomerSession
     */
    protected CustomerSession $customerSession;

    /**
     * @var OrderCollectionFactory
     */
    protected OrderCollectionFactory $orderCollectionFactory;

    /**
     * @var WishlistCollectionFactory
     */
    protected WishlistCollectionFactory $wishlistCollectionFactory;

    /**
     * @var CompareProducts
     */
    protected CompareProducts $compareProducts;

    public function __construct(
        Template\Context $context,
        CustomerSession $customerSession,
        OrderCollectionFactory $orderCollectionFactory,
        WishlistCollectionFactory $wishlistCollectionFactory,
        CompareProducts $compareProducts,
        array $data = []
    ) {
        parent::__construct($context, $data);
        $this->customerSession = $customerSession;
        $this->orderCollectionFactory = $orderCollectionFactory;
        $this->wishlistCollectionFactory = $wishlistCollectionFactory;
        $this->compareProducts = $compareProducts;
    }

    public function isLoggedIn(): bool
    {
        return $this->customerSession->isLoggedIn();
    }

    public function hasRecentOrders(): bool
    {
        if (!$this->isLoggedIn()) {
            return false;
        }

        $customerId = $this->customerSession->getCustomerId();
        $orders = $this->orderCollectionFactory->create()
            ->addFieldToFilter('customer_id', $customerId)
            ->setPageSize(1);

        return (bool) $orders->getSize();
    }

    public function hasWishlistItems(): bool
    {
        if (!$this->isLoggedIn()) {
            return false;
        }

        $wishlist = $this->wishlistCollectionFactory->create()
            ->addFieldToFilter('customer_id', $this->customerSession->getCustomerId());

        return (bool) $wishlist->getSize();
    }

    public function hasCompareItems(): bool
    {
        $compareList = $this->getCompareList();

        return isset($compareList['items']) && count($compareList['items']) > 0;
    }

    public function getCompareList(): array
    {
        return $this->compareProducts->getSectionData();
    }
}
