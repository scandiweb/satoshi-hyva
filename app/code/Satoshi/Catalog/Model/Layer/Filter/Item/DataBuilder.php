<?php

declare(strict_types=1);

namespace Satoshi\Catalog\Model\Layer\Filter\Item;

use Magento\Catalog\Model\Layer\Filter\Item\DataBuilder as BaseDataBuilder;

class DataBuilder extends BaseDataBuilder
{
    /**
     * Add Item Data
     *
     * @param string $label
     * @param string $value
     * @param int $count
     * @param string|null $paramKey
     * @param string|null $swatchValue
     * @return void
     */
    public function addItemData($label, $value, $count, $paramKey = null, $swatchValue = null): void
    {
        $this->_itemsData[] = [
            'label' => $label,
            'value' => $value,
            'count' => $count,
            'param_key' => $paramKey,
            'swatch_value' => $swatchValue,
        ];
    }
}
