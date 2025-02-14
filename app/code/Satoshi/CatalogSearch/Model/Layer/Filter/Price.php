<?php

declare(strict_types=1);

namespace Satoshi\CatalogSearch\Model\Layer\Filter;

use Magento\CatalogSearch\Model\Layer\Filter\Price as BasePrice;

class Price extends BasePrice
{
    /**
     * Get the minimum value for the price filter.
     *
     * @return float
     */
    public function getMinRange(): float
    {
        return 0;
    }

    /**
     * Get the maximum value for the price filter.
     *
     * @return float
     */
    public function getMaxRange(): float
    {
        return 200;
    }
}
