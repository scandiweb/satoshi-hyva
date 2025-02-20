<?php

declare(strict_types=1);

namespace Satoshi\CatalogSearch\Model\Layer\Filter;

use Magento\CatalogSearch\Model\Layer\Filter\Price as BasePrice;
use Satoshi\Catalog\Model\Layer\Filter\AbstractFilterTrait;
use Satoshi\Catalog\Model\Layer\Filter\FilterTypeTrait;

class Price extends BasePrice
{
    use FilterTypeTrait;
    use AbstractFilterTrait;

    /**
     * @var \Magento\Catalog\Model\Layer\Filter\DataProvider\Price
     */
    private $dataProvider;

    /**
     * @var \Magento\Catalog\Model\ResourceModel\Layer\Filter\Price
     */
    private $resource;

    /**
     * @param \Magento\Catalog\Model\Layer\Filter\ItemFactory $filterItemFactory
     * @param \Magento\Store\Model\StoreManagerInterface $storeManager
     * @param \Magento\Catalog\Model\Layer $layer
     * @param \Magento\Catalog\Model\Layer\Filter\Item\DataBuilder $itemDataBuilder
     * @param \Magento\Catalog\Model\ResourceModel\Layer\Filter\Price $resource
     * @param \Magento\Customer\Model\Session $customerSession
     * @param \Magento\Framework\Search\Dynamic\Algorithm $priceAlgorithm
     * @param \Magento\Framework\Pricing\PriceCurrencyInterface $priceCurrency
     * @param \Magento\Catalog\Model\Layer\Filter\Dynamic\AlgorithmFactory $algorithmFactory
     * @param \Magento\Catalog\Model\Layer\Filter\DataProvider\PriceFactory $dataProviderFactory
     * @param array $data
     * @SuppressWarnings(PHPMD.ExcessiveParameterList)
     * @SuppressWarnings(PHPMD.UnusedFormalParameter)
     */
    public function __construct(
        \Magento\Catalog\Model\Layer\Filter\ItemFactory               $filterItemFactory,
        \Magento\Store\Model\StoreManagerInterface                    $storeManager,
        \Magento\Catalog\Model\Layer                                  $layer,
        \Magento\Catalog\Model\Layer\Filter\Item\DataBuilder          $itemDataBuilder,
        \Magento\Catalog\Model\ResourceModel\Layer\Filter\Price       $resource,
        \Magento\Customer\Model\Session                               $customerSession,
        \Magento\Framework\Search\Dynamic\Algorithm                   $priceAlgorithm,
        \Magento\Framework\Pricing\PriceCurrencyInterface             $priceCurrency,
        \Magento\Catalog\Model\Layer\Filter\Dynamic\AlgorithmFactory  $algorithmFactory,
        \Magento\Catalog\Model\Layer\Filter\DataProvider\PriceFactory $dataProviderFactory,
        array                                                         $data = []
    )
    {
        $this->_requestVar = 'price';
        parent::__construct(
            $filterItemFactory,
            $storeManager,
            $layer,
            $itemDataBuilder,
            $resource,
            $customerSession,
            $priceAlgorithm,
            $priceCurrency,
            $algorithmFactory,
            $dataProviderFactory,
            $data
        );
        $this->dataProvider = $dataProviderFactory->create(['layer' => $this->getLayer()]);
    }

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

    /**
     * Get data array for building attribute filter items
     *
     * @return array
     *
     * @SuppressWarnings(PHPMD.NPathComplexity)
     */
    protected function _getItemsData()
    {
        $attribute = $this->getAttributeModel();
        $this->_requestVar = $attribute->getAttributeCode();

        /** @var \Magento\CatalogSearch\Model\ResourceModel\Fulltext\Collection $productCollection */
        $productCollection = $this->getLayer()->getProductCollection();
        $facets = $productCollection->getFacetedData($attribute->getAttributeCode());

        $data = [];
        if (count($facets) > 1) { // two range minimum
            $lastFacet = array_key_last($facets);
            foreach ($facets as $key => $aggregation) {
                $count = $aggregation['count'];
                if (strpos($key, '_') === false) {
                    continue;
                }

                $isLast = $lastFacet === $key;
                $data[] = $this->prepareData($key, $count, $isLast, $this->_requestVar);
            }
        }

        return $data;
    }

    /**
     * Prepare filter data.
     *
     * @param string $key
     * @param int $count
     * @param boolean $isLast
     * @param string|null $paramKey
     * @return array
     */
    private function prepareData($key, $count, $isLast = false, $paramKey = null)
    {
        [$from, $to] = explode('_', $key);
        $label = $this->_renderRangeLabel($from, $to, $isLast);
        $value = $from . '-' . $to . $this->dataProvider->getAdditionalRequestData();

        $data = [
            'label' => $label,
            'value' => $value,
            'count' => $count,
            'from' => $from,
            'to' => $to,
            'param_key' => $paramKey,
        ];

        return $data;
    }
}
