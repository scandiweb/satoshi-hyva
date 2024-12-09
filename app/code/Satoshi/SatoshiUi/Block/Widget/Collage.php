<?php

declare(strict_types=1);

namespace Satoshi\SatoshiUi\Block\Widget;

use Magento\Catalog\Api\CategoryRepositoryInterface;
use Magento\Catalog\Api\Data\ProductInterface;
use Magento\Catalog\Api\ProductRepositoryInterface;
use Magento\Catalog\Block\Product\Context;
use Magento\Catalog\Helper\Image;
use Magento\Framework\App\ObjectManager;
use Magento\Framework\Data\Wysiwyg\Normalizer;
use Magento\Framework\Exception\LocalizedException;
use Magento\Framework\Exception\NoSuchEntityException;
use Magento\Framework\Serialize\Serializer\Json;
use Magento\Framework\View\Element\Template;
use Magento\Widget\Block\BlockInterface;

/**
 * Collage widget block
 */
class Collage extends Template implements BlockInterface
{
    /**
     * @var string
     */
    protected $_template = 'Satoshi_SatoshiUi::widgets/collage.phtml';

    /**
     * @var CategoryRepositoryInterface
     */
    private $categoryRepository;

    /**
     * @var ProductRepositoryInterface
     */
    private $productRepository;

    /**
     * @var Image
     */
    private $imageHelper;

    /**
     * @var Json
     */
    private $serializer;

    /**
     * @var Normalizer
     */
    private $normalizer;

    /**
     * @param  Context  $context
     * @param  CategoryRepositoryInterface  $categoryRepository
     * @param  ProductRepositoryInterface  $productRepository
     * @param  Image  $imageHelper
     * @param  Json|null  $serializer
     * @param  Normalizer|null  $normalizer
     * @param  array  $data
     */
    public function __construct(
        Context $context,
        CategoryRepositoryInterface $categoryRepository,
        ProductRepositoryInterface $productRepository,
        Image $imageHelper,
        Json $serializer = null,
        Normalizer $normalizer = null,
        array $data = []
    ) {
        $this->categoryRepository = $categoryRepository ?? ObjectManager::getInstance()->get(CategoryRepositoryInterface::class);
        $this->productRepository = $productRepository ?? ObjectManager::getInstance()->get(ProductRepositoryInterface::class);
        $this->imageHelper = $imageHelper ?: ObjectManager::getInstance()->get(Image::class);
        $this->serializer = $serializer ?: ObjectManager::getInstance()->get(Json::class);
        $this->normalizer = $normalizer ?: ObjectManager::getInstance()->get(Normalizer::class);
        parent::__construct(
            $context,
            $data
        );
    }

    /**
     * @return array|bool|float|int|mixed|string|null
     */
    public function getCollage()
    {
        return $this->getData('collage_items') ? $this->decode($this->getData('collage_items')) : [];
    }

    /**
     * @param $categoryId
     * @return array
     * @throws LocalizedException
     * @throws NoSuchEntityException
     */
    public function getCategory($categoryId)
    {
        $category = $this->categoryRepository->get($categoryId, $this->_storeManager->getStore()->getId());

        return [
            'id' => $category->getId(),
            'name' => $category->getName(),
            'url' => $category->getUrl(),
            'image' => $category->getImageUrl()
        ];
    }

    /**
     * @param $productId
     * @return ProductInterface
     * @throws NoSuchEntityException
     */
    public function getProduct($productId)
    {
        return $this->productRepository->getById($productId);
    }

    /**
     * @param $product
     * @return array
     */
    public function getProductData($product)
    {
        return [
            'id' => $product->getId(),
            'name' => $product->getName(),
            'url' => $product->getProductUrl(),
            'image' => $this->imageHelper->init($product, 'product_page_image_medium')->getUrl()
        ];
    }

    /**
     * @param $value
     * @return array|bool|float|int|mixed|string|null
     */
    public function decode($value)
    {
        return $this->serializer->unserialize(
            $this->normalizer->restoreReservedCharacters($value)
        );
    }

    /**
     * @return bool|int|null
     */
    protected function getCacheLifetime()
    {
        return parent::getCacheLifetime() ?: 3600;
    }

    /**
     * @return array
     */
    public function getCacheKeyInfo()
    {
        return [
            'SATOSHI_COLLAGE_WIDGET',
            $this->getData('collage_items')
        ];
    }
}
