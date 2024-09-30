<?php

declare(strict_types=1);

namespace Satoshi\Theme\ViewModel;

use Hyva\Theme\ViewModel\BlockCache;
use Hyva\Theme\ViewModel\CurrentCategory;
use Hyva\Theme\ViewModel\ProductListItem as CoreProductListItem;
use Hyva\Theme\ViewModel\ProductPage;
use Magento\Catalog\Model\Product;
use Magento\Customer\Model\Session as CustomerSession;
use Magento\Framework\View\Element\AbstractBlock;
use Magento\Framework\View\LayoutInterface;

/**
 * Extend to pass loop index, and breadcrumbs to product card
 */
class ProductListItem extends CoreProductListItem
{
    /**
     * @var LayoutInterface
     */
    private LayoutInterface $layout;

    /**
     * @var BlockCache
     */
    private BlockCache $blockCache;

    /**
     * @param  LayoutInterface  $layout
     * @param  ProductPage  $productViewModel
     * @param  CurrentCategory  $currentCategory
     * @param  BlockCache  $blockCache
     * @param  CustomerSession  $customerSession
     */
    public function __construct(
        LayoutInterface $layout,
        ProductPage $productViewModel,
        CurrentCategory $currentCategory,
        BlockCache $blockCache,
        CustomerSession $customerSession
    ) {
        parent::__construct($layout, $productViewModel, $currentCategory, $blockCache, $customerSession);
        $this->layout = $layout;
        $this->blockCache = $blockCache;
    }


    /**
     * @param  Product  $product
     * @param  AbstractBlock  $parentBlock
     * @param  string  $viewMode
     * @param  string  $templateType
     * @param  string  $imageDisplayArea
     * @param  bool  $showDescription
     * @param  int|null  $index
     * @param  array  $breadcrumbs
     * @return string
     */
    public function getItemHtml(
        Product $product,
        AbstractBlock $parentBlock,
        string $viewMode,
        string $templateType,
        string $imageDisplayArea,
        bool $showDescription,
        int $index = null,
        array $breadcrumbs = []
    ): string {
        /** @var AbstractBlock $itemRendererBlock */
        $itemRendererBlock = $this->layout->getBlock('product_list_item');

        if (!$itemRendererBlock) {
            return '';
        }

        return $this->getItemHtmlWithRenderer(
            $itemRendererBlock,
            $product,
            $parentBlock,
            $viewMode,
            $templateType,
            $imageDisplayArea,
            $showDescription,
            $index,
            $breadcrumbs
        );
    }

    /**
     * @param  AbstractBlock  $itemRendererBlock
     * @param  Product  $product
     * @param  AbstractBlock  $parentBlock
     * @param  string  $viewMode
     * @param  string  $templateType
     * @param  string  $imageDisplayArea
     * @param  bool  $showDescription
     * @param  int|null  $index
     * @param  array  $breadcrumbs
     * @return string
     */
    public function getItemHtmlWithRenderer(
        AbstractBlock $itemRendererBlock,
        Product $product,
        AbstractBlock $parentBlock,
        string $viewMode,
        string $templateType,
        string $imageDisplayArea,
        bool $showDescription,
        int $index = null,
        array $breadcrumbs = []
    ): string {
        return $this->withParentChildLayoutRelationshipExecute($parentBlock, $itemRendererBlock,
            [$this, 'renderItemHtml'], func_get_args());
    }

    /**
     * Temporarily set the parent - child relationship in the layout structure and execute the given callback
     *
     * @param  AbstractBlock  $newParent
     * @param  AbstractBlock  $child
     * @param  callable  $fn
     * @param  mixed[]  $args
     * @return mixed
     */
    private function withParentChildLayoutRelationshipExecute(
        AbstractBlock $newParent,
        AbstractBlock $child,
        callable $fn,
        array $args = []
    ) {
        $childName = $child->getNameInLayout();
        $origParentBlock = $child->getParentBlock();
        $origAlias = $this->layout->getElementAlias($childName);
        $this->layout->setChild($newParent->getNameInLayout(), $childName, $childName);

        //phpcs:ignore Magento2.Functions.DiscouragedFunction.Discouraged
        $result = call_user_func_array($fn, $args);

        if ($origParentBlock) {
            $this->layout->setChild($origParentBlock->getNameInLayout(), $childName, $origAlias ?: $childName);
        }

        return $result;
    }

    /**
     * @param  AbstractBlock  $itemRendererBlock
     * @param  Product  $product
     * @param  AbstractBlock  $parentBlock
     * @param  string  $viewMode
     * @param  string  $templateType
     * @param  string  $imageDisplayArea
     * @param  bool  $showDescription
     * @param  int|null  $index
     * @param  array  $breadcrumbs
     * @return string
     */
    private function renderItemHtml(
        AbstractBlock $itemRendererBlock,
        Product $product,
        AbstractBlock $parentBlock,
        string $viewMode,
        string $templateType,
        string $imageDisplayArea,
        bool $showDescription,
        int $index = null,
        array $breadcrumbs = []
    ): string {
        // Careful! Temporal coupling!
        // First the values on the block need to be set, then the cache key info array can be created.

        $itemRendererBlock->setData('product', $product)
                          ->setData('index', $index)
                          ->setData('breadcrumbs', $breadcrumbs)
                          ->setData('view_mode', $viewMode)
                          ->setData('item_relation_type', $parentBlock->getData('item_relation_type'))
                          ->setData('image_display_area', $imageDisplayArea)
                          ->setData('show_description', $showDescription)
                          ->setData('position', $parentBlock->getPositioned())
                          ->setData('pos', $parentBlock->getPositioned())
                          ->setData('template_type', $templateType)
                          ->setData('cache_lifetime', 3600)
                          ->setData('cache_tags', $product->getIdentities())
                          ->setData('hideDetails', $parentBlock->getData('hideDetails'))
                          ->setData('hide_rating_summary', $parentBlock->getData('hide_rating_summary'));

        $itemCacheKeyInfo = $this->getItemCacheKeyInfo($product, $itemRendererBlock, $viewMode, $templateType);
        $itemRendererBlock->setData('cache_key', $this->blockCache->hashCacheKeyInfo($itemCacheKeyInfo));

        foreach (($itemRendererBlock->getData('additional_item_renderer_processors') ?? []) as $processor) {
            if (method_exists($processor, 'beforeListItemToHtml')) {
                //phpcs:ignore Magento2.Functions.DiscouragedFunction.Discouraged
                call_user_func([$processor, 'beforeListItemToHtml'], $itemRendererBlock, $product);
            }
        }

        return $itemRendererBlock->toHtml();
    }
}
