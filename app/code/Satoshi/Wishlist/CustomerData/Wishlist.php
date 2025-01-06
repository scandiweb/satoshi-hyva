<?php

declare(strict_types=1);

namespace Satoshi\Wishlist\CustomerData;

use Magento\Wishlist\CustomerData\Wishlist as SourceWishlist;
use Magento\Framework\App\ObjectManager;
use Magento\Wishlist\Model\Item as WishlistItem;
use Magento\Catalog\Model\Product;

class Wishlist extends SourceWishlist
{
    /**
     * @var \Magento\Catalog\Helper\Product\ConfigurationPool
     */
    protected $configurationPool;

    /**
     * @var \Magento\Catalog\Model\Product\Configuration\Item\ItemResolverInterface
     */
    private $itemResolver;

    /**
     * @var \Magento\Framework\Escaper
     */
    private $escaper;

    /**
     * @param \Magento\Wishlist\Helper\Data $wishlistHelper
     * @param \Magento\Wishlist\Block\Customer\Sidebar $block
     * @param \Magento\Catalog\Helper\ImageFactory $imageHelperFactory
     * @param \Magento\Framework\App\ViewInterface $view
     * @param \Magento\Catalog\Helper\Product\ConfigurationPool $configurationPool
     * @param \Magento\Catalog\Model\Product\Configuration\Item\ItemResolverInterface|null $itemResolver
     * @param \Magento\Framework\Escaper|null $escaper
     */
    public function __construct(
        \Magento\Wishlist\Helper\Data $wishlistHelper,
        \Magento\Wishlist\Block\Customer\Sidebar $block,
        \Magento\Catalog\Helper\ImageFactory $imageHelperFactory,
        \Magento\Framework\App\ViewInterface $view,
        \Magento\Catalog\Helper\Product\ConfigurationPool $configurationPool,
        \Magento\Catalog\Model\Product\Configuration\Item\ItemResolverInterface $itemResolver = null,
        \Magento\Framework\Escaper $escaper = null
    ) {
        $this->configurationPool = $configurationPool;
        $this->itemResolver = $itemResolver ?: ObjectManager::getInstance()->get(
            \Magento\Catalog\Model\Product\Configuration\Item\ItemResolverInterface::class
        );
        $this->escaper = $escaper ?: ObjectManager::getInstance()->get(\Magento\Framework\Escaper::class);
        parent::__construct($wishlistHelper, $block, $imageHelperFactory, $view, $itemResolver);
    }

    /**
     * Get wishlist items
     *
     * @return array
     */
    protected function getItems()
    {
        $this->view->loadLayout();

        $collection = $this->wishlistHelper->getWishlistItemCollection();
        $collection->clear()->setInStockFilter(true)->setOrder('added_at');

        $items = [];
        foreach ($collection as $wishlistItem) {
            $items[] = $this->getItemData($wishlistItem);
        }
        return $items;
    }

    /**
     * Retrieve wishlist item data
     *
     * @param WishlistItem $wishlistItem
     * @return array
     */
    protected function getItemData(WishlistItem $wishlistItem)
    {
        $product = $wishlistItem->getProduct();
        return [
            'item_id' => $wishlistItem->getId(),
            'image' => $this->getImageData($this->itemResolver->getFinalProduct($wishlistItem)),
            'product_sku' => $product->getSku(),
            'product_id' => $product->getId(),
            'product_url' => $this->wishlistHelper->getProductUrl($wishlistItem),
            'product_name' => $this->escaper->escapeHtml($product->getName()),
            'product_price' => $this->block->getProductPriceHtml(
                $product,
                'wishlist_configured_price',
                \Magento\Framework\Pricing\Render::ZONE_ITEM_LIST,
                ['item' => $wishlistItem]
            ),
            'product_is_saleable_and_visible' => $product->isSaleable() && $product->isVisibleInSiteVisibility(),
            'product_has_required_options' => $product->getTypeInstance()->hasRequiredOptions($product),
            'add_to_cart_params' => $this->wishlistHelper->getAddToCartParams($wishlistItem),
            'delete_item_params' => $this->wishlistHelper->getRemoveParams($wishlistItem),
            'options' => $this->getOptionList($wishlistItem),
        ];
    }

    /**
     * Get list of all options for product
     *
     * @param WishlistItem $item
     * @return array
     */
    protected function getOptionList(WishlistItem $item)
    {
        return $this->configurationPool->getByProductType($item->getProduct()->getTypeId())->getOptions($item);
    }
}
