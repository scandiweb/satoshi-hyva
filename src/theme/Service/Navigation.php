<?php

declare(strict_types=1);

namespace Satoshi\Theme\Service;

use Hyva\Theme\Service\Navigation as HyvaNavigation;
use Magento\Catalog\Model\Category;
use Magento\Catalog\Model\ResourceModel\Category\Collection as CategoryCollection;
use Magento\Framework\Data\Collection;
use Magento\Framework\Exception\LocalizedException;

/**
 * Extended to include category description within navigation
 */
class Navigation extends HyvaNavigation
{
    /**
     * Get Category Tree
     *
     * @param  int  $storeId
     * @param  int  $rootId
     * @param  int  $maxLevel
     * @return CategoryCollection
     * @throws LocalizedException
     */
    public function getCategoryTree($storeId, $rootId, $maxLevel = 0)
    {
        /** @var CategoryCollection $collection */
        $collection = $this->collectionFactory->create();
        $collection->setStoreId($storeId);
        $collection->addAttributeToSelect(['name', 'image', 'description']);
        $collection->addFieldToFilter('path', ['like' => '1/'.$rootId.'/%']); //load only from store root
        $collection->addAttributeToFilter('include_in_menu', 1);
        $collection->addIsActiveFilter();
        if ($maxLevel > 0) {
            $collection->addLevelFilter($maxLevel);
        } else {
            $collection->addNavigationMaxDepthFilter();
        }
        $collection->addUrlRewriteToResult();
        $collection->addOrder('level', Collection::SORT_ORDER_ASC);
        $collection->addOrder('position', Collection::SORT_ORDER_ASC);
        $collection->addOrder('parent_id', Collection::SORT_ORDER_ASC);
        $collection->addOrder('entity_id', Collection::SORT_ORDER_ASC);

        return $collection;
    }

    /**
     * Convert category to array
     *
     * @param  Category  $category
     * @param  Category  $currentCategory
     * @param  bool  $isParentActive
     * @return array
     * @throws LocalizedException
     */
    public function getCategoryAsArray($category, $currentCategory, $isParentActive)
    {
        $categoryId = $category->getId();

        return [
            'name' => $category->getName(),
            'description' => $category->getDescription(),
            'id' => 'category-node-'.$categoryId,
            'url' => $this->catalogCategory->getCategoryUrl($category),
            'image' => $category->getImageUrl(),
            'has_active' => in_array((string) $categoryId, explode('/', (string) $currentCategory->getPath()), true),
            'is_active' => $categoryId == $currentCategory->getId(),
            'is_category' => true,
            'is_parent_active' => $isParentActive,
            'position' => $category->getData('position'),
            'identities' => $category->getIdentities(),
            'path' => $category->getPath()
        ];
    }
}