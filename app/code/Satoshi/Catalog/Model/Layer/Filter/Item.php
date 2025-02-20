<?php

declare(strict_types=1);

namespace Satoshi\Catalog\Model\Layer\Filter;

use Magento\Catalog\Model\Layer\Filter\Item as BaseItem;

class Item extends BaseItem
{
    use FilterTypeTrait;

    /**
     * Get the URL for the filter item
     *
     * @return string
     */
    public function getUrl(): string
    {
        $filterName = $this->getFilter()->getRequestVar();
        $filterValue = $this->getValue();

        // Get current query parameters and filter values
        $queryParams = [];
        $queryString = parse_url($this->_url->getCurrentUrl(), PHP_URL_QUERY);
        if ($queryString) {
            parse_str($queryString, $queryParams);
        }

        if ($this->isRadioFilter($this->getName())) {
            $queryParams[$filterName] = $filterValue;
        } else {
            // For checkboxes filters, handle comma-separated values
            $currentFilterValues = isset($queryParams[$filterName]) ? explode(',', $queryParams[$filterName]) : [];

            // Only add the filter value if it's not already selected
            if (!in_array($filterValue, $currentFilterValues)) {
                $currentFilterValues[] = $filterValue;
            }

            // Update the URL query parameter with the updated filter values (comma-separated)
            $queryParams[$filterName] = implode(',', $currentFilterValues);
        }

        return str_replace('%2C', ',', $this->_url->getUrl('*/*/*', [
            '_current' => true,
            '_use_rewrite' => true,
            '_query' => $queryParams
        ]));
    }

    /**
     * Get the URL for removing a specific item from the filter list
     *
     * @return string
     */
    public function getRemoveUrl()
    {
        $filterName = $this->getFilter()->getRequestVar();
        $filterValue = $this->getValue();

        // Handle multiple filter values (comma-separated)
        if (is_string($filterValue) && strpos($filterValue, ',')) {
            $updatedFilterValues = $this->getUpdatedFilterValues($filterValue, $this->getSingleValue());

            $queryParams = [];
            $queryString = parse_url($this->_url->getCurrentUrl(), PHP_URL_QUERY);
            if ($queryString) {
                parse_str($queryString, $queryParams);
            }

            // Update the filter values or remove the filter if no values are left
            if (empty($updatedFilterValues)) {
                unset($queryParams[$filterName]);
            } else {
                $queryParams[$filterName] = $updatedFilterValues;
            }

            return str_replace('%2C', ',', $this->_url->getUrl('*/*/*', [
                '_current' => true,
                '_use_rewrite' => true,
                '_query' => $queryParams
            ]));
        }

        // Reset the filter to its default value (if only one value)
        return str_replace('%2C', ',', $this->_url->getUrl('*/*/*', [
            '_current' => true,
            '_use_rewrite' => true,
            '_query' => [$filterName => $this->getFilter()->getResetValue()],
            '_escape' => true
        ]));
    }

    /**
     * Helper method to remove a specific value from filter values
     *
     * @param string $filterValue
     * @param string $valueToRemove
     * @return string
     */
    public function getUpdatedFilterValues($filterValue, $valueToRemove)
    {
        $filterValues = explode(',', $filterValue);
        $updatedValues = array_diff($filterValues, [$valueToRemove]);

        return implode(',', $updatedValues);
    }
}
