<?php

declare(strict_types=1);

namespace Satoshi\CatalogSearch\Model\Layer\Filter;

use Magento\CatalogSearch\Model\ResourceModel\Fulltext\Collection;
use Magento\Framework\Exception\LocalizedException;
use Magento\CatalogSearch\Model\Layer\Filter\Attribute as BaseAttribute;
use Magento\Swatches\Helper\Data as SwatchHelper;
use Satoshi\Catalog\Model\Layer\Filter\Item;

class Attribute extends BaseAttribute
{
    /**
     * @var \Magento\Framework\Filter\StripTags
     */
    private \Magento\Framework\Filter\StripTags $tagFilter;

    /**
     * @var SwatchHelper
     */
    private SwatchHelper $swatchHelper;

    /**
     * @param ItemFactory $filterItemFactory
     * @param \Magento\Store\Model\StoreManagerInterface $storeManager
     * @param \Magento\Catalog\Model\Layer $layer
     * @param \Satoshi\Catalog\Model\Layer\Filter\Item\DataBuilder $itemDataBuilder
     * @param \Magento\Framework\Filter\StripTags $tagFilter
     * @param SwatchHelper $swatchHelper
     * @param array $data
     */
    public function __construct(
        \Magento\Catalog\Model\Layer\Filter\ItemFactory $filterItemFactory,
        \Magento\Store\Model\StoreManagerInterface $storeManager,
        \Magento\Catalog\Model\Layer $layer,
        \Satoshi\Catalog\Model\Layer\Filter\Item\DataBuilder $itemDataBuilder,
        \Magento\Framework\Filter\StripTags $tagFilter,
        SwatchHelper $swatchHelper,
        array $data = []
    ) {
        $this->tagFilter = $tagFilter;
        $this->swatchHelper = $swatchHelper;

        parent::__construct(
            $filterItemFactory,
            $storeManager,
            $layer,
            $itemDataBuilder,
            $tagFilter,
            $data
        );
    }

    /**
     * Get Hashcode of Visual swatch by option id
     *
     * @param int $optionId
     * @return string|null
     */
    public function getAttributeSwatchHashcode($optionId): ?string
    {
        $hashcodeData = $this->swatchHelper->getSwatchesByOptionsId([$optionId]);
        return isset($hashcodeData[$optionId]) ? $hashcodeData[$optionId]['value'] : null;
    }

    /**
     * Get data array for building attribute filter items
     *
     * @return array
     * @throws \Magento\Framework\Exception\LocalizedException
     */
    protected function _getItemsData(): array
    {
        $attribute = $this->getAttributeModel();
        /** @var Collection $productCollection */
        $productCollection = $this->getLayer()->getProductCollection();
        $optionsFacetedData = $productCollection->getFacetedData($attribute->getAttributeCode());

        $isAttributeFilterable = $this->getAttributeIsFilterable($attribute) === static::ATTRIBUTE_OPTIONS_ONLY_WITH_RESULTS;

        if (count($optionsFacetedData) === 0 && !$isAttributeFilterable) {
            return $this->itemDataBuilder->build();
        }

        $options = $attribute->getFrontend()->getSelectOptions();
        foreach ($options as $option) {
            $this->buildOptionData($option, $isAttributeFilterable, $optionsFacetedData);
        }

        return $this->itemDataBuilder->build();
    }

    /**
     * Build option data
     *
     * @param array $option
     * @param boolean $isAttributeFilterable
     * @param array $optionsFacetedData
     * @return void
     * @throws LocalizedException
     */
    private function buildOptionData($option, $isAttributeFilterable, $optionsFacetedData): void
    {
        $value = $this->getOptionValue($option);
        if ($value === false) {
            return;
        }
        $count = $this->getOptionCount($value, $optionsFacetedData);
        if ($isAttributeFilterable && $count === 0) {
            return;
        }

        $swatchValue = null;
        if ($this->getAttributeModel()->getAttributeCode() === 'color') {
            $swatchValue = $this->getAttributeSwatchHashcode($value);
        }

        $this->itemDataBuilder->addItemData(
            $this->tagFilter->filter($option['label']),
            $value,
            $count,
            $swatchValue
        );
    }

    /**
     * Retrieve option value if it exists
     *
     * @param array $option
     * @return float|bool|int|string
     */
    private function getOptionValue($option): float|bool|int|string
    {
        if (empty($option['value']) && !is_numeric($option['value'])) {
            return false;
        }
        return $option['value'];
    }

    /**
     * Retrieve count of the options
     *
     * @param int|string $value
     * @param array $optionsFacetedData
     * @return int
     */
    private function getOptionCount($value, $optionsFacetedData): int
    {
        return isset($optionsFacetedData[$value]['count'])
            ? (int)$optionsFacetedData[$value]['count']
            : 0;
    }


    // Methods below are overridden from AbstractFilter class

    /**
     * Initialize filter items
     *
     * @return  $this
     * @throws LocalizedException
     */
    protected function _initItems()
    {
        $data = $this->_getItemsData();
        $items = [];
        foreach ($data as $itemData) {
            $items[] = $this->_createItem(
                $itemData['label'],
                $itemData['value'],
                $itemData['count'],
                $itemData['swatch_value'] ?? null
            );
        }
        $this->_items = $items;
        return $this;
    }

    /**
     * Create filter item object
     *
     * @param string $label
     * @param mixed $value
     * @param int $count
     * @param string|null $swatchValue
     * @return  Item
     */
    protected function _createItem($label, $value, $count = 0, $swatchValue = null)
    {
        return $this->_filterItemFactory->create()
            ->setFilter($this)
            ->setLabel($label)
            ->setValue($value)
            ->setSwatchValue($swatchValue)
            ->setCount($count);
    }
}
