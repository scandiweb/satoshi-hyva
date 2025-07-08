<?php

declare(strict_types=1);

namespace Satoshi\SatoshiUi\Block\Widget;

use Magento\Catalog\Block\Product\Context;
use Magento\Catalog\Model\ResourceModel\Category\CollectionFactory;
use Magento\Framework\App\ObjectManager;
use Magento\Framework\Data\Wysiwyg\Normalizer;
use Magento\Framework\Exception\LocalizedException;
use Magento\Framework\Exception\NoSuchEntityException;
use Magento\Framework\Serialize\Serializer\Json;
use Magento\Framework\View\Element\Template;
use Magento\Store\Model\StoreManagerInterface;
use Magento\Widget\Block\BlockInterface;

/**
 * Shop the look widget block
 */
class Categories extends Template implements BlockInterface
{
    /**
     * @var string
     */
    protected $_template = 'Satoshi_SatoshiUi::widgets/categories.phtml';

    /**
     * @var StoreManagerInterface
     */
    private $storeManager;

    /**
     * @var CollectionFactory
     */
    private $categoryCollectionFactory;

    /**
     * @var Json
     */
    private $serializer;

    /**
     * @var Normalizer
     */
    private $normalizer;

    /**
     * @param Context $context
     * @param StoreManagerInterface $storeManager
     * @param CollectionFactory $categoryCollectionFactory
     * @param Json|null $serializer
     * @param Normalizer|null $normalizer
     * @param array $data
     */
    public function __construct(
        Context               $context,
        StoreManagerInterface $storeManager,
        CollectionFactory     $categoryCollectionFactory,
        Json                  $serializer = null,
        Normalizer            $normalizer = null,
        array                 $data = []
    )
    {
        $this->storeManager = $storeManager ?? ObjectManager::getInstance()->get(StoreManagerInterface::class);
        $this->categoryCollectionFactory = $categoryCollectionFactory ?? ObjectManager::getInstance()->get(CollectionFactory::class);
        $this->serializer = $serializer ?: ObjectManager::getInstance()->get(Json::class);
        $this->normalizer = $normalizer ?: ObjectManager::getInstance()->get(Normalizer::class);
        parent::__construct(
            $context,
            $data
        );
    }

    /**
     * @return array|array[]
     * @throws LocalizedException
     * @throws NoSuchEntityException
     */
    public function getCategories()
    {
        $ids = $this->getData('categories') ? $this->decode($this->getData('categories')) : [];
        if (!count($ids)) return [];
        $ids = array_map(fn($id) => $id['category_id'], $ids);

        $storeId = $this->storeManager->getStore()->getId();
        $collection = $this->categoryCollectionFactory->create()
            ->addAttributeToSelect(['name', 'url', 'image'])
            ->addFieldToFilter('entity_id', ['in' => $ids])
            ->addFieldToFilter('level', ['gt' => 1])
            ->setStoreId($storeId);

        $categories = array_map(fn($category) => [
            'id' => $category->getId(),
            'name' => $category->getName(),
            'url' => $category->getUrl(),
            'image' => $category->getImageUrl()
        ], [...$collection]);

        // Sort categories by the order of IDs
        $idPositionMap = array_flip($ids);
        usort($categories, function ($a, $b) use ($idPositionMap) {
            return $idPositionMap[$a['id']] <=> $idPositionMap[$b['id']];
        });

        return $categories;
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
            'SATOSHI_CATEGORIES_WIDGET',
            $this->getData('categories'),
            $this->getData('auto_resize_items'),
            $this->getData('display_as_buttons'),
            $this->getData('view_all_button'),
            $this->getData('heading'),
        ];
    }
}
