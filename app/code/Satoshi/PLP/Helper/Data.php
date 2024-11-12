<?php

declare(strict_types=1);

namespace Satoshi\PLP\Helper;

use Magento\Framework\App\Helper\AbstractHelper;
use Magento\Catalog\Model\ResourceModel\Product\CollectionFactory;
use Magento\Catalog\Helper\Image as ImageHelper;
use Magento\Catalog\Model\Layer\Resolver;
use Magento\Framework\App\Helper\Context;

class Data extends AbstractHelper
{
    /**
     * @var CollectionFactory
     */
    protected $productCollectionFactory;

    /**
     * @var ImageHelper
     */
    protected $imageHelper;

    /**
     * @var Resolver
     */
    protected $layerResolver;

    /**
     * @param CollectionFactory $productCollectionFactory Factory for product collections.
     * @param ImageHelper $imageHelper Helper for getting image URLs.
     * @param Resolver $layerResolver Resolver for the current layer.
     * @param Context $context Context for helper functionality.
     */
    public function __construct(
        CollectionFactory $productCollectionFactory,
        ImageHelper       $imageHelper,
        Resolver          $layerResolver,
        Context           $context
    )
    {
        $this->productCollectionFactory = $productCollectionFactory;
        $this->imageHelper = $imageHelper;
        $this->layerResolver = $layerResolver;
        parent::__construct($context);
    }

    /**
     * @return array List of image URLs for the first 4 products on the current PLP.
     */
    public function getFirstFourProductImages(): array
    {
        $images = [];
        $layer = $this->layerResolver->get();
        $collection = $layer->getProductCollection();
        $i = 0;
        foreach ($collection as $product) {
            if ($i >= 4) break; // Stop after 4 items

            $imageUrl = $this->imageHelper->init($product, 'category_page_grid')
                ->setImageFile($product->getImage())
                ->getUrl();

            $images[] = $imageUrl;
            $i++;
        }

        return $images;
    }
}
