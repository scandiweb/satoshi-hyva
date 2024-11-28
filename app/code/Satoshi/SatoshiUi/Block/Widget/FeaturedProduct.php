<?php

namespace Satoshi\SatoshiUi\Block\Widget;

use Magento\Catalog\Block\Product\Context;
use Magento\Framework\App\ObjectManager;
use Magento\Framework\View\Element\Template;
use Magento\Widget\Block\BlockInterface;
use Magento\Catalog\Api\ProductRepositoryInterface;
use Magento\Catalog\Model\Product;
use Magento\Catalog\Model\Product\Gallery\ImagesConfigFactoryInterface;
use Magento\Catalog\Model\Product\Image\UrlBuilder;

/**
 * Featured product widget block
 */
class FeaturedProduct extends Template implements BlockInterface
{
    /**
     * @var string
     */
    protected $_template = 'Satoshi_SatoshiUi::widgets/featured-product.phtml';

    /**
     * @var ProductRepositoryInterface
     */
    private $productRepository;

    /**
     * @var ImagesConfigFactoryInterface
     */
    private $galleryImagesConfigFactory;

    /**
     * @var array
     */
    private $galleryImagesConfig;

    /**
     * @var UrlBuilder
     */
    private $imageUrlBuilder;

    /**
     * @param  Context  $context
     * @param  ProductRepositoryInterface  $productRepository
     * @param  array  $data
     * @param  ImagesConfigFactoryInterface|null  $imagesConfigFactory
     * @param  array  $galleryImagesConfig
     * @param UrlBuilder|null $urlBuilder
     */
    public function __construct(
        Context $context,
        ProductRepositoryInterface $productRepository,
        array $data = [],
        ImagesConfigFactoryInterface $imagesConfigFactory = null,
        array $galleryImagesConfig = [],
        UrlBuilder $urlBuilder = null,
    ) {
        $this->productRepository = $productRepository ?? ObjectManager::getInstance()->get(ProductRepositoryInterface::class);
        $this->galleryImagesConfigFactory = $imagesConfigFactory ?: ObjectManager::getInstance()
            ->get(ImagesConfigFactoryInterface::class);
        $this->galleryImagesConfig = $galleryImagesConfig;
        $this->imageUrlBuilder = $urlBuilder ?? ObjectManager::getInstance()->get(UrlBuilder::class);
        parent::__construct(
            $context,
            $data
        );
    }


    /**
     * @return Product|null
     */
    public function getProduct()
    {
        $productId = $this->getData('product_id');
        try {
            return $this->productRepository->getById($productId);
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Retrieve collection of gallery images
     *
     * @return Collection
     */
    public function getGalleryImages()
    {
        $product = $this->getProduct();
        $images = $product->getMediaGalleryImages();
        if (!$images instanceof \Magento\Framework\Data\Collection) {
            return $images;
        }

        foreach ($images as $image) {
            $galleryImagesConfig = $this->getGalleryImagesConfig()->getItems();
            foreach ($galleryImagesConfig as $imageConfig) {
                $image->setData(
                    $imageConfig->getData('data_object_key'),
                    $this->imageUrlBuilder->getUrl($image->getFile(), $imageConfig['image_id'])
                );
            }
        }

        return $images;
    }

    /**
     * Returns image gallery config object
     *
     * @return Collection
     */
    private function getGalleryImagesConfig()
    {
        if (false === $this->hasData('gallery_images_config')) {
            $galleryImageConfig = $this->galleryImagesConfigFactory->create($this->galleryImagesConfig);
            $this->setData('gallery_images_config', $galleryImageConfig);
        }

        return $this->getData('gallery_images_config');
    }
}
