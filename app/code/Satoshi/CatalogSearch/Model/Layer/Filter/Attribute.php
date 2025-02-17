<?php

declare(strict_types=1);

namespace Satoshi\CatalogSearch\Model\Layer\Filter;

use Magento\Catalog\Api\Data\ProductAttributeInterface;
use Magento\CatalogSearch\Model\Layer\Filter\Attribute as BaseAttribute;
use Magento\CatalogSearch\Model\ResourceModel\Fulltext\Collection;
use Magento\Framework\App\RequestInterface;
use Magento\Framework\Exception\LocalizedException;
use Magento\Swatches\Helper\Data as SwatchHelper;

/**
 * Layer attribute filter
 */
class Attribute extends BaseAttribute
{
    /**
     * @var \Magento\Framework\Filter\StripTags
     */
    private $tagFilter;

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
        \Magento\Catalog\Model\Layer\Filter\Item\DataBuilder $itemDataBuilder,
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
     * Apply attribute option filter to product collection
     *
     * @param  RequestInterface  $request
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

        $labels = [];
        foreach ((array)$attributeValue as $value) {
            $label = $this->getOptionText($value);
            $labels[] = is_array($label) ? $label : [$label];
        }

        foreach (array_unique(array_merge([], ...$labels)) as $label) {
            $this->getLayer()
                ->getState()
                ->addFilter($this->_createItem($label, $attributeValue));
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

        $this->itemDataBuilder->addItemData(
            $this->tagFilter->filter($option['label']),
            $value,
            $count
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
}
