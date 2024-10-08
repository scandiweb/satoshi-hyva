<?php

declare(strict_types=1);

namespace Satoshi\Theme\ViewModel;

use Magento\Catalog\Api\CategoryRepositoryInterface;
use Magento\Catalog\Api\Data\ProductInterface;
use Magento\Catalog\Model\Category;
use Magento\Catalog\Model\CategoryFactory;
use Magento\Catalog\Model\Config as CatalogConfig;
use Magento\Catalog\Model\Product\LinkFactory as ProductLinkFactory;
use Magento\Catalog\Model\Product\Visibility as ProductVisibility;
use Magento\Catalog\Model\ResourceModel\Product\Collection as ProductCollection;
use Magento\Catalog\Model\ResourceModel\Product\CollectionFactory as ProductCollectionFactory;
use Magento\Catalog\Model\ResourceModel\Product\Link\Product\CollectionFactory as ProductLinkCollectionFactory;
use Magento\Framework\Api\FilterBuilder;
use Magento\Framework\Api\SearchCriteria\CollectionProcessorInterface;
use Magento\Framework\Api\SearchCriteriaBuilder;
use Magento\Framework\Api\SearchCriteriaInterface;
use Magento\Framework\Api\SortOrderBuilder;
use Magento\Framework\Data\Collection\AbstractDb;
use Magento\Framework\EntityManager\MetadataPool as EntityMetadataPool;
use Magento\Framework\App\Config\ScopeConfigInterface;
use Magento\Framework\Exception\NoSuchEntityException;
use Magento\Review\Model\ResourceModel\Review\Summary as ReviewSummaryResource;
use Magento\Review\Model\Review;
use Hyva\Theme\ViewModel\ProductList as SourceProductList;

/**
 * @SuppressWarnings(PHPMD.LongVariable)
 * @SuppressWarnings(PHPMD.UnusedPrivateMethod)
 * @SuppressWarnings(PHPMD.CouplingBetweenObjects)
 * @SuppressWarnings(PHPMD.ExcessiveParameterList)
 * 
 * Extended to eager load media gallery
 */
class ProductList extends SourceProductList
{
    public const XML_CROSSSELL_PRODUCTS_LIMIT = 'hyva_theme_catalog/crosssell_products/limit';

    /**
     * @var SearchCriteriaBuilder
     */
    private $searchCriteriaBuilder;

    /**
     * @var ?int
     */
    private $categoryIdFilter;


    /**
     * @var CatalogConfig
     */
    private $catalogConfig;


    /**
     * @var CollectionProcessorInterface
     */
    private $collectionProcessor;


    /**
     * @var ReviewSummaryResource
     */
    private $reviewSummaryResource;

    /**
     * @var ProductCollectionFactory
     */
    private $productCollectionFactory;

    /**
     * @var bool
     */
    private $isIncludingReviewSummary;

    /**
     * @var CategoryFactory
     */
    private $categoryFactory;

    /**
     * @var CategoryRepositoryInterface
     */
    private $categoryRepository;

    /**
     * @var bool
     */
    private $useAnchorAttribute;

    /**
     * @var ProductVisibility
     */
    private $productVisibility;


    public function __construct(
        SearchCriteriaBuilder $searchCriteriaBuilder,
        FilterBuilder $filterBuilder,
        SortOrderBuilder $sortOrderBuilder,
        ProductCollectionFactory $productCollectionFactory,
        ProductLinkCollectionFactory $productLinkCollectionFactory,
        ProductLinkFactory $productLinkFactory,
        CatalogConfig $catalogConfig,
        CollectionProcessorInterface $collectionProcessor,
        CategoryFactory $categoryFactory,
        CategoryRepositoryInterface $categoryRepository,
        ReviewSummaryResource $reviewSummaryResource,
        ProductVisibility $productVisibility,
        EntityMetadataPool $entityMetadataPool,
        ScopeConfigInterface $scopeConfig,
        bool $isIncludingReviewSummary = true,
        int $maxCrosssellItemCount = 4,
        bool $useAnchorAttribute = false
    ) {
        parent::__construct(
          $searchCriteriaBuilder,
          $filterBuilder,
          $sortOrderBuilder,
          $productCollectionFactory,
          $productLinkCollectionFactory,
          $productLinkFactory,
          $catalogConfig,
          $collectionProcessor,
          $categoryFactory,
          $categoryRepository,
          $reviewSummaryResource,
          $productVisibility,
          $entityMetadataPool,
          $scopeConfig,
          $isIncludingReviewSummary,
          $maxCrosssellItemCount,
          $useAnchorAttribute
        );
        $this->searchCriteriaBuilder        = $searchCriteriaBuilder;
        $this->filterBuilder                = $filterBuilder;
        $this->sortOrderBuilder             = $sortOrderBuilder;
        $this->productCollectionFactory     = $productCollectionFactory;
        $this->productLinkFactory           = $productLinkFactory;
        $this->catalogConfig                = $catalogConfig;
        $this->productLinkCollectionFactory = $productLinkCollectionFactory;
        $this->collectionProcessor          = $collectionProcessor;
        $this->reviewSummaryResource        = $reviewSummaryResource;
        $this->productVisibility            = $productVisibility;
        $this->entityMetadataPool           = $entityMetadataPool;
        $this->scopeConfig                  = $scopeConfig;
        $this->isIncludingReviewSummary     = $isIncludingReviewSummary;
        $this->maxCrosssellItemCount        = $maxCrosssellItemCount;
        $this->categoryFactory              = $categoryFactory;
        $this->categoryRepository           = $categoryRepository;
        $this->useAnchorAttribute           = $useAnchorAttribute;
    }

    /**
     * @return ProductInterface[]
     */
    public function getItems(): array
    {
        $collection = $this->createProductCollection();
        $this->applyCriteria($this->searchCriteriaBuilder->create(), $collection);
        $collection->each('setDoNotUseCategoryId', [true]);

        $collection->addMediaGalleryData();
        return $collection->getItems();
    }

    private function applyCriteria(SearchCriteriaInterface $criteria, AbstractDb $collection): void
    {
        $this->collectionProcessor->process($criteria, $collection);
        if ($this->categoryIdFilter && $collection instanceof ProductCollection) {
            $category = $this->getCategory();
            $collection->addCategoryFilter($category);
        }
        $this->categoryIdFilter = null;
    }

    private function createProductCollection(): ProductCollection
    {
        $collection = $this->productCollectionFactory->create();
        $collection->addStoreFilter()
                   ->setVisibility($this->productVisibility->getVisibleInCatalogIds())
                   ->addAttributeToSelect($this->catalogConfig->getProductAttributes());

        $this->loadReviewSummariesIfEnabled($collection);

        return $collection;
    }

    private function loadReviewSummariesIfEnabled(ProductCollection $collection): void
    {
        if ($this->isIncludingReviewSummary) {
            $this->reviewSummaryResource->appendSummaryFieldsToCollection(
                $collection,
                $collection->getStoreId(),
                Review::ENTITY_PRODUCT_CODE
            );
        }
    }

    private function getCategory(): Category
    {
        if ($this->useAnchorAttribute) {
            // phpcs:disable Magento2.CodeAnalysis.EmptyBlock.DetectedCatch
            try {
                // Return a loaded category, which will cause child category products to be displayed for anchor categories
                $category = $this->categoryRepository->get($this->categoryIdFilter);
                if ($category instanceof Category) {
                    return $category;
                }
            } catch (NoSuchEntityException $e) {
                // If the category does not exist, there will be no child category products anyway, so we can ignore this error
            }
        }

        // Return unloaded category, which will cause only the products directly associated with the category to be displayed
        $category = $this->categoryFactory->create();
        $category->setData($category->getIdFieldName(), $this->categoryIdFilter);

        return $category;
    }
}
