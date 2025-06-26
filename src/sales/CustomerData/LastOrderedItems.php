<?php

declare(strict_types=1);

namespace Satoshi\Sales\CustomerData;

use Magento\Catalog\Model\Product;
use Magento\CatalogInventory\Api\StockRegistryInterface;
use Magento\Catalog\Api\ProductRepositoryInterface;
use Magento\Customer\Model\Session;
use Magento\Framework\Exception\NoSuchEntityException;
use Magento\Sales\Model\Order\Config;
use Magento\Sales\Model\Order\Item;
use Magento\Sales\Model\ResourceModel\Order\CollectionFactoryInterface;
use Magento\Store\Model\StoreManagerInterface;
use Psr\Log\LoggerInterface;
use Magento\Sales\CustomerData\LastOrderedItems as SourceLastOrderedItems;

/**
 * Retrieves the product SKU along with the items array to facilitate animation
 *  when a product is added to the cart.
 */
class LastOrderedItems extends SourceLastOrderedItems
{
    /**
     * @var StoreManagerInterface
     */
    private $_storeManager;

    /**
     * @var ProductRepositoryInterface
     */
    private $productRepository;

    /**
     * @var LoggerInterface
     */
    private $logger;

    /**
     * @param CollectionFactoryInterface $orderCollectionFactory
     * @param Config $orderConfig
     * @param Session $customerSession
     * @param StockRegistryInterface $stockRegistry
     * @param StoreManagerInterface $storeManager
     * @param ProductRepositoryInterface $productRepository
     * @param LoggerInterface $logger
     */
    public function __construct(
        CollectionFactoryInterface $orderCollectionFactory,
        Config $orderConfig,
        Session $customerSession,
        StockRegistryInterface $stockRegistry,
        StoreManagerInterface $storeManager,
        ProductRepositoryInterface $productRepository,
        LoggerInterface $logger
    ) {
        $this->_storeManager = $storeManager;
        $this->productRepository = $productRepository;
        $this->logger = $logger;

        parent::__construct(
            $orderCollectionFactory,
            $orderConfig,
            $customerSession,
            $stockRegistry,
            $storeManager,
            $productRepository,
            $logger,
        );
    }

    /**
     * Get list of last ordered products
     *
     * @return array
     * @throws NoSuchEntityException
     */
    protected function getItems(): array
    {
        $items = [];
        $order = $this->getLastOrder();
        $limit = self::SIDEBAR_ORDER_LIMIT;

        if ($order) {
            $website = $this->_storeManager->getStore()->getWebsiteId();
            /** @var Item $item */
            foreach ($order->getParentItemsRandomCollection($limit) as $item) {
                /** @var Product $product */
                try {
                    $product = $this->productRepository->getById(
                        $item->getProductId(),
                        false,
                        $this->_storeManager->getStore()->getId()
                    );
                } catch (NoSuchEntityException $noEntityException) {
                    $this->logger->critical($noEntityException);
                    continue;
                }
                if (in_array($website, $product->getWebsiteIds())) {
                    $url = $product->isVisibleInSiteVisibility() ? $product->getProductUrl() : null;
                    $items[] = [
                        'id' => $item->getId(),
                        'name' => $item->getName(),
                        'url' => $url,
                        'is_saleable' => $this->isItemAvailableForReorder($item),
                        'product_id' => $item->getProductId(),
                        'product_sku' => $item->getSku(),
                    ];
                }
            }
        }

        return $items;
    }
}
