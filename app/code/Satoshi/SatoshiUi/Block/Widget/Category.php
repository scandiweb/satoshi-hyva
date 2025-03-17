<?php

declare(strict_types=1);

namespace Satoshi\SatoshiUi\Block\Widget;

use Magento\Catalog\Api\CategoryRepositoryInterface;
use Magento\Catalog\Api\Data\CategoryInterface;
use Magento\Catalog\Block\Product\Context;
use Magento\Catalog\Model\Product\Visibility;
use Magento\Catalog\Model\ResourceModel\Product\Collection;
use Magento\Catalog\Model\ResourceModel\Product\CollectionFactory;
use Magento\CatalogWidget\Block\Product\ProductsList;
use Magento\CatalogWidget\Model\Rule;
use Magento\Framework\App\Http\Context as HttpContext;
use Magento\Framework\App\ObjectManager;
use Magento\Framework\Exception\LocalizedException;
use Magento\Framework\Exception\NoSuchEntityException;
use Magento\Framework\Serialize\Serializer\Json;
use Magento\Framework\Url\EncoderInterface;
use Magento\Framework\View\LayoutFactory;
use Magento\Rule\Model\Condition\Combine;
use Magento\Rule\Model\Condition\Sql\Builder as SqlBuilder;
use Magento\Widget\Helper\Conditions;
use Hyva\Theme\ViewModel\Currency;

/**
 * Category widget block
 */
class Category extends ProductsList
{

    /**
     * @var string
     */
    protected $_template = 'Satoshi_SatoshiUi::widgets/category.phtml';

    /**
     * @var int
     */
    public $collectionSize = 0;

    /**
     * @var CategoryInterface
     */
    public $category;

    /**
     * @var Currency
     */
    protected $currencyViewModel;

    /**
     * @var CategoryRepositoryInterface
     */
    private $categoryRepository;

    /**
     * @param Context $context
     * @param CollectionFactory $productCollectionFactory
     * @param Visibility $catalogProductVisibility
     * @param HttpContext $httpContext
     * @param SqlBuilder $sqlBuilder
     * @param Rule $rule
     * @param Conditions $conditionsHelper
     * @param Currency $currencyViewModel
     * @param array $data
     * @param Json|null $json
     * @param LayoutFactory|null $layoutFactory
     * @param EncoderInterface|null $urlEncoder
     * @param CategoryRepositoryInterface|null $categoryRepository
     *
     * @SuppressWarnings(PHPMD.ExcessiveParameterList)
     */
    public function __construct(
        Context           $context,
        CollectionFactory $productCollectionFactory,
        Visibility        $catalogProductVisibility,
        HttpContext       $httpContext,
        SqlBuilder        $sqlBuilder,
        Rule              $rule,
        Conditions        $conditionsHelper,
        Currency          $currencyViewModel,
        array             $data = [],
        Json              $json = null,
        LayoutFactory     $layoutFactory = null,
        EncoderInterface  $urlEncoder = null,
        CategoryRepositoryInterface $categoryRepository = null
    )
    {
        $this->currencyViewModel = $currencyViewModel;
        $this->categoryRepository = $categoryRepository ?? ObjectManager::getInstance()->get(CategoryRepositoryInterface::class);
        parent::__construct(
            $context,
            $productCollectionFactory,
            $catalogProductVisibility,
            $httpContext,
            $sqlBuilder,
            $rule,
            $conditionsHelper,
            $data,
            $json,
            $layoutFactory,
            $urlEncoder,
            $categoryRepository
        );
    }

    /**
     * Prepare and return product collection
     *
     * @return Collection
     * @SuppressWarnings(PHPMD.RequestAwareBlockMethod)
     * @throws LocalizedException
     */
    public function createCollection()
    {
        /** @var $collection Collection */
        $collection = $this->productCollectionFactory->create();

        if ($this->getData('store_id') !== null) {
            $collection->setStoreId($this->getData('store_id'));
        }

        $collection->setVisibility($this->catalogProductVisibility->getVisibleInCatalogIds());

        /**
         * Change sorting attribute to entity_id because created_at can be the same for products fastly created
         * one by one and sorting by created_at is indeterministic in this case.
         */
        $collection = $this->_addProductAttributesAndPrices($collection)
            ->addStoreFilter()
            ->addAttributeToSort('entity_id', 'desc')
            ->setPageSize($this->getProductsCount());

        $conditions = $this->getConditions();
        $conditions->collectValidatedAttributes($collection);
        $this->sqlBuilder->attachConditionToCollection($collection, $conditions);

        /**
         * Prevent retrieval of duplicate records. This may occur when multiselect product attribute matches
         * several allowed values from condition simultaneously
         */
        $collection->distinct(true);

        $this->collectionSize = $collection->getSize();

        return $collection;
    }

    /**
     * Get conditions
     *
     * @return Combine
     */
    protected function getConditions()
    {
        $conditions = [
            '1' => [
                'aggregate' => 'all',
                'new_child' => '',
                'type' => 'Magento\\CatalogWidget\\Model\\Rule\\Condition\\Combine',
                'value' => '1'
            ],
            '1--1' => [
                'operator' => '==',
                'type' => 'Magento\\CatalogWidget\\Model\\Rule\\Condition\\Product',
                'attribute' => 'category_ids',
                'value' => $this->getData('category_id')
            ]
        ];

        foreach ($conditions as $key => $condition) {
            if (!empty($condition['attribute'])) {
                if (in_array($condition['attribute'], ['special_from_date', 'special_to_date'])) {
                    $conditions[$key]['value'] = date('Y-m-d H:i:s', strtotime($condition['value']));
                }

                if ($condition['attribute'] == 'category_ids') {
                    $conditions[$key] = $this->updateAnchorCategoryConditions($condition);
                }
            }
        }

        $this->rule->loadPost(['conditions' => $conditions]);
        return $this->rule->getConditions();
    }

    /**
     * Update conditions if the category is an anchor category
     *
     * @param array $condition
     * @return array
     */
    private function updateAnchorCategoryConditions(array $condition): array
    {
        if (array_key_exists('value', $condition)) {
            $categoryId = $condition['value'];

            try {
                $this->category = $this->categoryRepository->get($categoryId, $this->_storeManager->getStore()->getId());
            } catch (NoSuchEntityException $e) {
                return $condition;
            }

            $children = $this->category->getIsAnchor() ? $this->category->getChildren(true) : [];
            if ($children) {
                $children = explode(',', $children);
                $condition['operator'] = "()";
                $condition['value'] = array_merge([$categoryId], $children);
            }
        }

        return $condition;
    }


    /**
     * Retrieve how many products should be displayed
     *
     * @return int
     */
    public function getProductsCount()
    {
        if ($this->hasData('max_products_count')) {
            return $this->getData('max_products_count');
        }

        if (null === $this->getData('max_products_count')) {
            $this->setData('max_products_count', self::DEFAULT_PRODUCTS_COUNT);
        }

        return $this->getData('max_products_count');
    }

    /**
     * @return bool|int|null
     */
    protected function getCacheLifetime()
    {
        return parent::getCacheLifetime() ?: 3600;
    }

    /**
     * Get key pieces for caching block content
     *
     * @return array
     * @SuppressWarnings(PHPMD.RequestAwareBlockMethod)
     */
    public function getCacheKeyInfo()
    {
        return [
            'SATOSHI_CATEGORY_WIDGET',
            $this->getData('heading'),
            $this->getData('category_id'),
            $this->getData('view_all_button'),
            $this->getData('auto_resize_items'),
            $this->getData('max_products_count'),
            $this->currencyViewModel->getCurrentCurrencyCode(),
        ];
    }
}
