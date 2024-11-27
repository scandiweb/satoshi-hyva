<?php

namespace Satoshi\SatoshiUi\Block\Widget;

use Magento\Catalog\Block\Product\Context;
use Magento\Framework\App\ObjectManager;
use Magento\Framework\Data\Wysiwyg\Normalizer;
use Magento\Framework\Serialize\Serializer\Json;
use Magento\Framework\View\Element\Template;
use Magento\Widget\Block\BlockInterface;
use \Magento\Catalog\Model\ResourceModel\Product\CollectionFactory;

/**
 * Shop the look widget block
 */
class ShopTheLook extends Template implements BlockInterface
{
    /**
     * @var string
     */
    protected $_template = 'Satoshi_SatoshiUi::widgets/shop-the-look.phtml';

    /**
     * @var CollectionFactory
     */
    private $collectionFactory;

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
     * @param  CollectionFactory  $collectionFactory
     * @param  Json|null  $serializer
     * @param  Normalizer|null  $normalizer
     * @param  array  $data
     */
    public function __construct(
        Context $context,
        CollectionFactory $collectionFactory,
        Json $serializer = null,
        Normalizer $normalizer = null,
        array $data = []
    ) {
        $this->collectionFactory = $collectionFactory ?? ObjectManager::getInstance()->get(CollectionFactory::class);
        $this->serializer = $serializer ?: ObjectManager::getInstance()->get(Json::class);
        $this->normalizer = $normalizer ?: ObjectManager::getInstance()->get(Normalizer::class);
        parent::__construct(
            $context,
            $data
        );
    }

    public function getProducts()
    {
        return $this->getData('products') ? $this->decode($this->getData('products')) : [];
    }

    public function getProductsData()
    {
        $products = $this->getProducts();
        $collection = $this->collectionFactory->create();
        $collection->addAttributeToSelect('*')
            ->addFieldToFilter('status', \Magento\Catalog\Model\Product\Attribute\Source\Status::STATUS_ENABLED)
            ->addIdFilter(array_map(fn($product) => $product['product_id'], $products));

        return $collection->getItems();
    }

    public function getImage()
    {
        return $this->getData('image') ? $this->decode($this->getData('image')) : [];
    }

    public function decode($value)
    {
        return $this->serializer->unserialize(
            $this->normalizer->restoreReservedCharacters($value)
        );
    }
}
