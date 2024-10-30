<?php

namespace Satoshi\Wishlist\Block\Customer\Wishlist\Item\Column;

use Magento\Wishlist\Block\Customer\Wishlist\Item\Column\Info as SourceInfo;
use Magento\Catalog\Block\Product\Context;
use Magento\Framework\App\Http\Context as HttpContext;
use Magento\Framework\View\ConfigInterface;
use Magento\Catalog\Model\Product\Image\UrlBuilder;
use Magento\Catalog\Model\CategoryRepository;
use Magento\Catalog\Api\Data\CategoryInterface;
use Magento\Catalog\Model\Product;
use Magento\Review\Model\ResourceModel\Review\CollectionFactory as ReviewCollectionFactory;
use Magento\Review\Model\Review;
use Magento\Review\Model\RatingFactory;

class Info extends SourceInfo
{
    /**
     * @var CategoryRepository
     */
    private $categoryRepository;

    /**
     * @var ReviewCollectionFactory
     */
    private $reviewCollectionFactory;

    /**
     * @var RatingFactory
     */
    private $ratingFactory;

    /**
     * @param Context $context
     * @param HttpContext $httpContext
     * @param CategoryRepository $categoryRepository
     * @param ReviewCollectionFactory $reviewCollectionFactory
     * @param RatingFactory $ratingFactory
     * @param array $data
     * @param ConfigInterface|null $config
     * @param UrlBuilder|null $urlBuilder
     */
    public function __construct(
        Context $context,
        HttpContext $httpContext,
        CategoryRepository $categoryRepository,
        ReviewCollectionFactory $reviewCollectionFactory,
        RatingFactory $ratingFactory,
        array $data = [],
        ConfigInterface $config = null,
        UrlBuilder $urlBuilder = null
    ) {
        $this->categoryRepository = $categoryRepository;
        $this->reviewCollectionFactory = $reviewCollectionFactory;
        $this->ratingFactory = $ratingFactory;
        parent::__construct($context, $httpContext, $data, $config, $urlBuilder);
    }

    /**
     * Get category name of the product
     *
     * @param Product $product
     *
     * @return string|null
     */
    public function getCategoryName($product)
    {
        $categoryIds = $product->getCategoryIds();
        if (!empty($categoryIds)) {
            return $this->categoryRepository->get($categoryIds[0])->getName();
        }
        return null;
    }

    /**
     * Get product review count
     *
     * @param Product $product
     *
     * @return int
     */
    public function getProductReviewCount($product)
    {
        $reviewCollection = $this->reviewCollectionFactory->create()
            ->addStoreFilter($product->getStoreId())
            ->addEntityFilter('product', $product->getId())
            ->addStatusFilter(Review::STATUS_APPROVED);

        return $reviewCollection->getSize();
    }

    /**
     * Get product review average rating
     *
     * @param Product $product
     *
     * @return float
     */
    public function getProductReviewAverageRating($product)
    {
        $reviewCollection = $this->reviewCollectionFactory->create()
            ->addStoreFilter($product->getStoreId())
            ->addEntityFilter('product', $product->getId())
            ->addStatusFilter(Review::STATUS_APPROVED);

        $reviewCount = $reviewCollection->getSize();

        if ($reviewCount == 0) {
            return 0;
        }

        $reviewCollection->load()->addRateVotes();
        $reviews = $reviewCollection->getItems();
        $totalRating = 0;

        foreach ($reviews as $review) {
            foreach ($review->getRatingVotes() as $vote) {
                // Convert rating from 0-100 to 0-5 scale
                $rating = $vote->getPercent() / 20;
                $totalRating += $rating;
            }
        }

        // Calculate the average rating and round to 1 decimal place
        $averageRating = round($totalRating / $reviewCount, 1);

        return $averageRating;
    }
}
