<?php

declare(strict_types=1);

namespace Satoshi\CatalogSearch\Model\Layer\Filter;

use Magento\Catalog\Model\Layer\Filter\DataProvider\Category as CategoryDataProvider;
use Magento\CatalogSearch\Model\Layer\Filter\Category as BaseCategory;
use Satoshi\Catalog\Model\Layer\Filter\AbstractFilterTrait;
use Satoshi\Catalog\Model\Layer\Filter\FilterTypeTrait;

class Category extends BaseCategory
{
    use FilterTypeTrait;
    use AbstractFilterTrait;

    /**
     * @var \Magento\Framework\Escaper
     */
    private $escaper;

    /**
     * @var CategoryDataProvider
     */
    private $dataProvider;

    /**
     * Category constructor.
     *
     * @param \Magento\Catalog\Model\Layer\Filter\ItemFactory $filterItemFactory
     * @param \Magento\Store\Model\StoreManagerInterface $storeManager
     * @param \Magento\Catalog\Model\Layer $layer
     * @param \Magento\Catalog\Model\Layer\Filter\Item\DataBuilder $itemDataBuilder
     * @param \Magento\Framework\Escaper $escaper
     * @param \Magento\Catalog\Model\Layer\Filter\DataProvider\CategoryFactory $categoryDataProviderFactory
     * @param array $data
     * @throws \Magento\Framework\Exception\LocalizedException
     */
    public function __construct(
        \Magento\Catalog\Model\Layer\Filter\ItemFactory                  $filterItemFactory,
        \Magento\Store\Model\StoreManagerInterface                       $storeManager,
        \Magento\Catalog\Model\Layer                                     $layer,
        \Magento\Catalog\Model\Layer\Filter\Item\DataBuilder             $itemDataBuilder,
        \Magento\Framework\Escaper                                       $escaper,
        \Magento\Catalog\Model\Layer\Filter\DataProvider\CategoryFactory $categoryDataProviderFactory,
        array                                                            $data = []
    )
    {
        parent::__construct(
            $filterItemFactory,
            $storeManager,
            $layer,
            $itemDataBuilder,
            $escaper,
            $categoryDataProviderFactory,
            $data
        );
        $this->escaper = $escaper;
        $this->_requestVar = 'cat';
        $this->dataProvider = $categoryDataProviderFactory->create(['layer' => $this->getLayer()]);
    }

    /**
     * Apply category filter to product collection
     *
     * @param \Magento\Framework\App\RequestInterface $request
     * @return  $this
     */
    public function apply(\Magento\Framework\App\RequestInterface $request)
    {
        $categoryId = $request->getParam($this->_requestVar) ?: $request->getParam('id');
        if (!empty($categoryId)) {
            $this->dataProvider->setCategoryId($categoryId);

            $category = $this->dataProvider->getCategory();

            $this->getLayer()->getProductCollection()->addCategoryFilter($category);

            if ($request->getParam('id') != $category->getId() && $this->dataProvider->isValid()) {
                $this->getLayer()->getState()->addFilter($this->_createItem($category->getName(), $categoryId, paramKey: $this->_requestVar));
            }
        }

        $category = $this->dataProvider->getCategory();
        if ($category) {
            $childrenCategoryIds = [];
            foreach ($category->getChildrenCategories() as $category) {
                $childrenCategoryIds[] = $category->getId();
            }
            if ($childrenCategoryIds) {
                $this->getLayer()->getProductCollection()
                    ->addFieldToFilter(
                        'category_ids_to_aggregate',
                        $childrenCategoryIds
                    );
            }
        }

        return $this;
    }

    /**
     * Get data array for building category filter items
     *
     * @return array
     */
    protected function _getItemsData()
    {
        /** @var \Magento\CatalogSearch\Model\ResourceModel\Fulltext\Collection $productCollection */
        $productCollection = $this->getLayer()->getProductCollection();
        $optionsFacetedData = $productCollection->getFacetedData('category');
        $category = $this->dataProvider->getCategory();
        $categories = $category->getChildrenCategories();

        $collectionSize = $productCollection->getSize();

        if ($category->getIsActive()) {
            foreach ($categories as $category) {
                if ($category->getIsActive()
                    && isset($optionsFacetedData[$category->getId()])
                    && $this->isOptionReducesResults($optionsFacetedData[$category->getId()]['count'], $collectionSize)
                ) {
                    $this->itemDataBuilder->addItemData(
                        $this->escaper->escapeHtml($category->getName()),
                        $category->getId(),
                        $optionsFacetedData[$category->getId()]['count'],
                        $this->_requestVar
                    );
                }
            }
        }

        return $this->itemDataBuilder->build();
    }
}
