<?php

declare(strict_types=1);

namespace Satoshi\InventorySales\Model\IsProductSalableForRequestedQtyCondition;

use Magento\InventorySales\Model\IsProductSalableCondition\IsAnySourceItemInStockCondition as IsAnySourceItemInStock;
use Magento\InventorySalesApi\Api\Data\ProductSalabilityErrorInterfaceFactory;
use Magento\InventorySalesApi\Api\Data\ProductSalableResultInterface;
use Magento\InventorySalesApi\Api\Data\ProductSalableResultInterfaceFactory;
use Magento\InventorySales\Model\IsProductSalableForRequestedQtyCondition\IsAnySourceItemInStockCondition as SourceIsAnySourceItemInStockCondition;

/**
 * Overrides to improve the error message for out-of-stock products.
 */
class IsAnySourceItemInStockCondition extends SourceIsAnySourceItemInStockCondition
{
    /**
     * @var IsAnySourceItemInStock
     */
    private $isAnySourceInStockCondition;

    /**
     * @var ProductSalabilityErrorInterfaceFactory
     */
    private $productSalabilityErrorFactory;

    /**
     * @var ProductSalableResultInterfaceFactory
     */
    private $productSalableResultFactory;

    /**
     * @var \Magento\Catalog\Api\ProductRepositoryInterface
     */
    private $productRepository;

    /**
     * @param IsAnySourceItemInStock $isAnySourceInStockCondition
     * @param ProductSalabilityErrorInterfaceFactory $productSalabilityErrorFactory
     * @param ProductSalableResultInterfaceFactory $productSalableResultFactory
     * @param \Magento\Catalog\Api\ProductRepositoryInterface $productRepository
     */
    public function __construct(
        IsAnySourceItemInStock                 $isAnySourceInStockCondition,
        ProductSalabilityErrorInterfaceFactory $productSalabilityErrorFactory,
        ProductSalableResultInterfaceFactory            $productSalableResultFactory,
        \Magento\Catalog\Api\ProductRepositoryInterface $productRepository
    )
    {
        $this->isAnySourceInStockCondition = $isAnySourceInStockCondition;
        $this->productSalabilityErrorFactory = $productSalabilityErrorFactory;
        $this->productSalableResultFactory = $productSalableResultFactory;
        $this->productRepository = $productRepository;

        parent::__construct(
            $isAnySourceInStockCondition,
            $productSalabilityErrorFactory,
            $productSalableResultFactory
        );
    }

    /**
     * @inheritdoc
     *
     * @SuppressWarnings(PHPMD.UnusedFormalParameter)
     */
    public function execute(string $sku, int $stockId, float $requestedQty): ProductSalableResultInterface
    {
        $errors = [];

        try {
            $product = $this->productRepository->get($sku);
            $productName = sprintf("'%s' (SKU: %s)", $product->getName(), $sku);
        } catch (\Magento\Framework\Exception\NoSuchEntityException $e) {
            $productName = sprintf("SKU: '%s'", $sku);
        }

        if (!$this->isAnySourceInStockCondition->execute($sku, $stockId)) {
            $data = [
                'code' => 'is_any_source_item_in_stock-no_source_items_in_stock',
                'message' => __(
                    'The product %1 is out of stock across all locations. Please update the quantity or check back later.',
                    $productName,
                )
            ];
            $errors[] = $this->productSalabilityErrorFactory->create($data);
        }

        return $this->productSalableResultFactory->create(['errors' => $errors]);
    }
}
