<?php

namespace Satoshi\SatoshiUi\Block\Widget;

use Magento\Catalog\Api\CategoryRepositoryInterface;
use Magento\Catalog\Api\ProductRepositoryInterface;
use Magento\Catalog\Block\Product\Context;
use Magento\Catalog\Helper\Image;
use Magento\Framework\App\ObjectManager;
use Magento\Framework\Data\Wysiwyg\Normalizer;
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

    public function getCollage()
    {
        return $this->getData('collage_items') ? $this->decode($this->getData('collage_items')) : [];
    }

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

    public function getProduct($productId)
    {
        return $this->productRepository->getById($productId);
    }

    public function getProductData($product)
    {
        return [
            'id' => $product->getId(),
            'name' => $product->getName(),
            'url' => $product->getProductUrl(),
            'image' => $this->imageHelper->init($product, 'product_page_image_medium')->getUrl()
        ];
    }

    public function decode($value)
    {
        return $this->serializer->unserialize(
            $this->normalizer->restoreReservedCharacters($value)
        );
    }
}
