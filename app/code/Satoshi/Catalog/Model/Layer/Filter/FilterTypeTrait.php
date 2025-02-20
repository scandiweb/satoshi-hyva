<?php

declare(strict_types=1);

namespace Satoshi\Catalog\Model\Layer\Filter;

trait FilterTypeTrait
{
    /**
     * Check if the filter is of type 'radio'
     *
     * @param string $attributeName
     * @return bool
     */
    public function isRadioFilter($attributeName): bool
    {
        $radioFilters = [
            'Price',
        ];

        return in_array($attributeName, $radioFilters);
    }
}