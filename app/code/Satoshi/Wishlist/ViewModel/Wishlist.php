<?php

declare(strict_types=1);

namespace Satoshi\Wishlist\ViewModel;

use Magento\Wishlist\Helper\Data as WishlistHelper;
use Magento\Framework\View\Element\Block\ArgumentInterface;

class Wishlist implements ArgumentInterface
{
    /**
     * @var WishlistHelper $wishlistHelper
     */
    protected $wishlistHelper;

    /**
     * @param WishlistHelper $wishlistHelper
     */
    public function __construct(WishlistHelper $wishlistHelper) {
        $this->wishlistHelper = $wishlistHelper;
    }

    /**
     * Get wishlist items quantity
     *
     * @return int
     */
    public function getWishlistItemsQty()
    {
        $collection = $this->wishlistHelper->getWishlistItemCollection();
        return $collection->clear()->setInStockFilter(true)->getSize();
    }
}
