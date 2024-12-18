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
     * @param IsAnySourceItemInStock $isAnySourceInStockCondition
     * @param ProductSalabilityErrorInterfaceFactory $productSalabilityErrorFactory
     * @param ProductSalableResultInterfaceFactory $productSalableResultFactory
     */
    public function __construct(
        IsAnySourceItemInStock                 $isAnySourceInStockCondition,
        ProductSalabilityErrorInterfaceFactory $productSalabilityErrorFactory,
        ProductSalableResultInterfaceFactory   $productSalableResultFactory
    )
    {
        $this->isAnySourceInStockCondition = $isAnySourceInStockCondition;
        $this->productSalabilityErrorFactory = $productSalabilityErrorFactory;
        $this->productSalableResultFactory = $productSalableResultFactory;

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

        if (!$this->isAnySourceInStockCondition->execute($sku, $stockId)) {
            $data = [
                'code' => 'is_any_source_item_in_stock-no_source_items_in_stock',
                'message' => __('This product is currently unavailable in any stock location')
            ];
            $errors[] = $this->productSalabilityErrorFactory->create($data);
        }

        return $this->productSalableResultFactory->create(['errors' => $errors]);
    }
}
