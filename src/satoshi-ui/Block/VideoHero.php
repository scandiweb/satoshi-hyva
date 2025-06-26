<?php

declare(strict_types=1);

namespace Satoshi\SatoshiUi\Block;

use Magento\Catalog\Block\Product\Context;
use Magento\Catalog\Model\ResourceModel\Category\CollectionFactory;
use Magento\Framework\App\ObjectManager;
use Magento\Framework\View\Element\Template;
use Magento\Store\Model\StoreManagerInterface;

class VideoHero extends Template
{
    /**
     * @var string
     */
    protected $_template = 'Satoshi_SatoshiUi::satoshi_ui/video-hero.phtml';

    /**
     * @var StoreManagerInterface|mixed
     */
    private $storeManager;

    /**
     * @var CollectionFactory|mixed
     */
    private $categoryCollectionFactory;

    public function __construct(
        Context $context,
        StoreManagerInterface $storeManager,
        CollectionFactory $categoryCollectionFactory,
        array $data = []
    ) {
        $this->storeManager = $storeManager ?? ObjectManager::getInstance()->get(StoreManagerInterface::class);
        $this->categoryCollectionFactory = $categoryCollectionFactory ??
            ObjectManager::getInstance()->get(CollectionFactory::class);
        parent::__construct(
            $context,
            $data
        );
    }

    public function getCategory()
    {
        $categoryId = $this->getData('category_id') ?? null;

        if ($categoryId) {
            $storeId = $this->storeManager->getStore()->getId();
            $collection = $this->categoryCollectionFactory->create()
                ->addAttributeToSelect(['name', 'url', 'image'])
                ->addFieldToFilter('entity_id', ['eq' => $categoryId])
                ->addFieldToFilter('level', ['gt' => 1])
                ->setStoreId($storeId);
            $category = $collection->getFirstItem();


            if ($category->getId()) {
                return [
                    'id' => $category->getId(),
                    'name' => $category->getName(),
                    'url' => $category->getUrl(),
                    'image' => $category->getImageUrl()
                ];
            }
        }

        return null;
    }

}
