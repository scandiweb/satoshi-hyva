<?php

declare(strict_types=1);

namespace Satoshi\CatalogSearch\Model\Layer\Filter;

use Magento\Catalog\Api\Data\ProductAttributeInterface;
use Magento\CatalogSearch\Model\Layer\Filter\Attribute as BaseAttribute;
use Magento\CatalogSearch\Model\ResourceModel\Fulltext\Collection;
use Magento\Framework\App\RequestInterface;
use Magento\Framework\Exception\LocalizedException;
use Magento\Framework\Filter\StripTags;
use Magento\Swatches\Helper\Data as SwatchHelper;
use Satoshi\Catalog\Model\Layer\Filter\Item;
use Satoshi\Catalog\Model\Layer\Filter\FilterTypeTrait;

/**
 * Layer attribute filter
 */
class Attribute extends BaseAttribute
{
    use FilterTypeTrait;

    /**
     * @var StripTags
     */
    private StripTags $tagFilter;

    /**
     * @var SwatchHelper
     */
    private SwatchHelper $swatchHelper;

    /**
     * @param ItemFactory $filterItemFactory
     * @param \Magento\Store\Model\StoreManagerInterface $storeManager
     * @param \Magento\Catalog\Model\Layer $layer
     * @param \Satoshi\Catalog\Model\Layer\Filter\Item\DataBuilder $itemDataBuilder
     * @param StripTags $tagFilter
     * @param SwatchHelper $swatchHelper
     * @param array $data
     */
    public function __construct(
        \Magento\Catalog\Model\Layer\Filter\ItemFactory $filterItemFactory,
        \Magento\Store\Model\StoreManagerInterface      $storeManager,
        \Magento\Catalog\Model\Layer                    $layer,
        \Magento\Catalog\Model\Layer\Filter\Item\DataBuilder $itemDataBuilder,
        StripTags                                       $tagFilter,
        SwatchHelper                                    $swatchHelper,
        array                                           $data = []
    )
    {
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
     * Apply attribute option filter to product collection
     *
     * @param RequestInterface $request
     *
     * @return $this
     * @throws LocalizedException
     */
    public function apply(RequestInterface $request)
    {
        $attributeValue = $request->getParam($this->_requestVar);
        if (empty($attributeValue) && !is_numeric($attributeValue)) {
            return $this;
        }

        $attribute = $this->getAttributeModel();
        /** @var Collection $productCollection */
        $productCollection = $this->getLayer()
            ->getProductCollection();

        $attributeValues = explode(',', $attributeValue);
        $productCollection->addFieldToFilter(
            $attribute->getAttributeCode(),
            array_map(function ($value) use ($attribute) {
                return $this->convertAttributeValue($attribute, $value);
            }, $attributeValues)
        );

        $filters = [];
        foreach ($attributeValues as $value) {
            $label = $this->getOptionText($value);
            if (is_array($label)) {
                $label = implode(' ', $label);
            }

            $filters[] = [
                'label' => $label,
                'value' => $value
            ];
        }

        foreach ($filters as $filter) {
            $this->getLayer()
                ->getState()
                ->addFilter($this->_createItem($filter['label'], $attributeValue, singleValue: $filter['value']));
        }

        return $this;
    }

    /**
     * Convert attribute value according to its backend type.
     *
     * @param ProductAttributeInterface $attribute
     * @param mixed $value
     * @return int|string
     */
    private function convertAttributeValue(ProductAttributeInterface $attribute, $value)
    {
        if ($attribute->getBackendType() === 'int') {
            return (int)$value;
        }

        return $value;
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
    protected function _getItemsData()
    {
        $attribute = $this->getAttributeModel();
        /** @var Collection $productCollection */
        $productCollection = $this->getLayer()
            ->getProductCollection();

        $optionsFacetedData = $productCollection->getFacetedData($attribute->getAttributeCode());
        $isAttributeFilterable =
            $this->getAttributeIsFilterable($attribute) === static::ATTRIBUTE_OPTIONS_ONLY_WITH_RESULTS;

        if (count($optionsFacetedData) === 0 && !$isAttributeFilterable) {
            return $this->itemDataBuilder->build();
        }

        $options = $attribute->getFrontend()
            ->getSelectOptions();

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
    private function buildOptionData($option, $isAttributeFilterable, $optionsFacetedData)
    {
        $value = $this->getOptionValue($option);
        if ($value === false) {
            return;
        }
        $count = $this->getOptionCount($value, $optionsFacetedData);
        if ($isAttributeFilterable && $count === 0) {
            return;
        }

        $paramKey = $this->getAttributeModel()->getAttributeCode();
        $swatchValue = null;
        if ($paramKey === 'color') {
            $swatchValue = $this->getAttributeSwatchHashcode($value);
        }

        $this->itemDataBuilder->addItemData(
            $this->tagFilter->filter($option['label']),
            $value,
            $count,
            $paramKey,
            $swatchValue,
        );
    }

    /**
     * Retrieve option value if it exists
     *
     * @param array $option
     * @return bool|string
     */
    private function getOptionValue($option)
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
    private function getOptionCount($value, $optionsFacetedData)
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
                $itemData['param_key'],
                $itemData['swatch_value'] ?? null,
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
     * @param string|null $paramKey
     * @param string|null $swatchValue
     * @param mixed|null $singleValue
     * @return  Item
     */
    protected function _createItem(
        $label,
        $value,
        $count = 0,
        $paramKey = null,
        $swatchValue = null,
        $singleValue = null,
    )
    {
        return $this->_filterItemFactory->create()
            ->setFilter($this)
            ->setLabel($label)
            ->setValue($value)
            ->setCount($count)
            ->setParamKey($paramKey)
            ->setSwatchValue($swatchValue)
            ->setSingleValue($singleValue ?? $value);
    }
}
