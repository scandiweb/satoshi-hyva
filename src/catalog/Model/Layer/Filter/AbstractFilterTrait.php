<?php

declare(strict_types=1);

namespace Satoshi\Catalog\Model\Layer\Filter;

use Magento\Framework\Exception\LocalizedException;

/**
 * * Trait AbstractFilterTrait
 *
 * Magento does not instantiate `Magento\Catalog\Model\Layer\Filter\AbstractFilter` directly.
 * Instead, it instantiates its concrete subclasses, such as:
 * - `Magento\Catalog\Model\Layer\Filter\Attribute`
 * - `Magento\Catalog\Model\Layer\Filter\Category`
 * - `Magento\Catalog\Model\Layer\Filter\Price`
 * - `Magento\CatalogSearch\Model\Layer\Filter\Attribute`
 *
 * Because of this, overriding `AbstractFilter` via `di.xml` has no effect, as Magento’s
 * dependency injection system only replaces concrete, instantiated classes, not abstract ones.
 *
 * To work around this limitation, we utilize a trait (`AbstractFilterTrait`) to encapsulate
 * the custom logic we need. Then, we extend the appropriate concrete class (e.g.,
 * `Magento\CatalogSearch\Model\Layer\Filter\Attribute`) and use the trait to inject our modified behavior.
 *
 * This trait was specifically created to enable adding the swatch value to the filter item.
 */
trait AbstractFilterTrait
{
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
     * @return  Item
     */
    protected function _createItem(
        $label,
        $value,
        $count = 0,
        $paramKey = null,
    )
    {
        return $this->_filterItemFactory->create()
            ->setFilter($this)
            ->setLabel($label)
            ->setValue($value)
            ->setCount($count)
            ->setParamKey($paramKey);
    }
}