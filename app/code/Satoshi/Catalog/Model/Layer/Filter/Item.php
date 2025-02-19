<?php

declare(strict_types=1);

namespace Satoshi\Catalog\Model\Layer\Filter;

use Magento\Catalog\Model\Layer\Filter\Item as BaseItem;

class Item extends BaseItem
{
    public function getSwatchValue(): ?string
    {
        return $this->getDataByKey('swatch_value');
    }
}
