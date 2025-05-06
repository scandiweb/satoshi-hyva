<?php

declare(strict_types=1);

namespace Satoshi\Theme\ViewModel;

use Hyva\Theme\ViewModel\ProductList as SourceProductList;
use Magento\Catalog\Api\CategoryRepositoryInterface;
use Magento\Catalog\Api\Data\ProductInterface;
use Magento\Catalog\Model\Category;
use Magento\Catalog\Model\CategoryFactory;
use Magento\Catalog\Model\Config as CatalogConfig;
use Magento\Catalog\Model\Product\Link;
use Magento\Catalog\Model\Product\LinkFactory as ProductLinkFactory;
use Magento\Catalog\Model\Product\Visibility as ProductVisibility;
use Magento\Catalog\Model\ResourceModel\Product\Collection as ProductCollection;
use Magento\Catalog\Model\ResourceModel\Product\CollectionFactory as ProductCollectionFactory;
use Magento\Catalog\Model\ResourceModel\Product\Link\Product\Collection as ProductLinkCollection;
use Magento\Catalog\Model\ResourceModel\Product\Link\Product\CollectionFactory as ProductLinkCollectionFactory;
use Magento\Framework\Api\FilterBuilder;
use Magento\Framework\Api\SearchCriteria\CollectionProcessorInterface;
use Magento\Framework\Api\SearchCriteriaBuilder;
use Magento\Framework\Api\SearchCriteriaInterface;
use Magento\Framework\Api\SortOrderBuilder;
use Magento\Framework\App\Config\ScopeConfigInterface;
use Magento\Framework\Data\Collection\AbstractDb;
use Magento\Framework\EntityManager\MetadataPool as EntityMetadataPool;
use Magento\Framework\Exception\LocalizedException;
use Magento\Framework\Exception\NoSuchEntityException;
use Magento\Review\Model\ResourceModel\Review\Summary as ReviewSummaryResource;
use Magento\Review\Model\Review;

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
     * @var ProductLinkFactory
     */
    private $productLinkFactory;

    /**
     * @var CatalogConfig
     */
    private $catalogConfig;

    /**
     * @var ProductLinkCollectionFactory
     */
    private $productLinkCollectionFactory;

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
        $this->productCollectionFactory     = $productCollectionFactory;
        $this->productLinkFactory           = $productLinkFactory;
        $this->catalogConfig                = $catalogConfig;
        $this->productLinkCollectionFactory = $productLinkCollectionFactory;
        $this->collectionProcessor          = $collectionProcessor;
        $this->reviewSummaryResource        = $reviewSummaryResource;
        $this->productVisibility            = $productVisibility;
        $this->isIncludingReviewSummary     = $isIncludingReviewSummary;
        $this->categoryFactory              = $categoryFactory;
        $this->categoryRepository           = $categoryRepository;
        $this->useAnchorAttribute           = $useAnchorAttribute;
    }

    /**
     * @return array|ProductInterface[]
     * @throws LocalizedException
     */
    public function getItems(): array
    {
        $collection = $this->createProductCollection();
        $this->applyCriteria($this->searchCriteriaBuilder->create(), $collection);
        $collection->each('setDoNotUseCategoryId', [true]);

        $collection->addMediaGalleryData();
        return $collection->getItems();
    }

    /**
     * @param SearchCriteriaInterface $criteria
     * @param AbstractDb $collection
     * @return void
     */
    private function applyCriteria(SearchCriteriaInterface $criteria, AbstractDb $collection): void
    {
        $this->collectionProcessor->process($criteria, $collection);
        if ($this->categoryIdFilter && $collection instanceof ProductCollection) {
            $category = $this->getCategory();
            $collection->addCategoryFilter($category);
        }
        $this->categoryIdFilter = null;
    }

    /**
     * @return ProductCollection
     */
    private function createProductCollection(): ProductCollection
    {
        $collection = $this->productCollectionFactory->create();
        $collection->addStoreFilter()
                   ->setVisibility($this->productVisibility->getVisibleInCatalogIds())
                   ->addAttributeToSelect($this->catalogConfig->getProductAttributes());

        $this->loadReviewSummariesIfEnabled($collection);

        return $collection;
    }

    /**
     * @param ProductCollection $collection
     * @return void
     * @throws LocalizedException
     */
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

    /**
     * @return Category
     */
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

    /**
     * @param string $linkType
     * @param array $productIds
     * @return ProductLinkCollection
     * @throws LocalizedException
     */
    private function createProductLinkCollection(string $linkType, array $productIds): ProductLinkCollection
    {
        $collection = $this->productLinkCollectionFactory->create(['productIds' => $productIds]);
        $collection->setLinkModel($this->getLinkTypeModel($linkType))
            ->setIsStrongMode()
            ->setPositionOrder()
            ->addStoreFilter()
            ->setVisibility($this->productVisibility->getVisibleInCatalogIds())
            ->addAttributeToSelect($this->catalogConfig->getProductAttributes())
            ->addMediaGalleryData();

        $this->loadReviewSummariesIfEnabled($collection);

        return $collection;
    }

    /**
     * @param string $linkType
     * @return Link
     */
    private function getLinkTypeModel(string $linkType): Link
    {
        $linkModel = $this->productLinkFactory->create();
        switch ($linkType) {
            case 'crosssell':
                $linkModel->useCrossSellLinks();
                break;
            case 'related':
                $linkModel->useRelatedLinks();
                break;
            case 'upsell':
                $linkModel->useUpSellLinks();
                break;
        }
        return $linkModel;
    }
}
