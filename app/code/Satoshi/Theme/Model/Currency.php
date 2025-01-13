<?php

declare(strict_types=1);

namespace Satoshi\Theme\Model;

use Magento\Framework\Locale\ResolverInterface as LocalResolverInterface;
use Magento\Framework\NumberFormatterFactory;
use Magento\Framework\Serialize\Serializer\Json;
use Magento\Directory\Model\CurrencyConfig;
use Magento\Directory\Model\Currency as SourceCurrency;

/**
 * This class extends the Magento Directory Currency model to customize the way
 * currency values are formatted in the frontend. Specifically, the `formatPrecision`
 * method has been modified to remove the additional `price` CSS class
 * from the span element wrapping the formatted price.
 */
class Currency extends SourceCurrency
{
    /**
     * @param \Magento\Framework\Model\Context $context
     * @param \Magento\Framework\Registry $registry
     * @param \Magento\Framework\Locale\FormatInterface $localeFormat
     * @param \Magento\Store\Model\StoreManagerInterface $storeManager
     * @param \Magento\Directory\Helper\Data $directoryHelper
     * @param Currency\FilterFactory $currencyFilterFactory
     * @param \Magento\Framework\Locale\CurrencyInterface $localeCurrency
     * @param \Magento\Framework\Model\ResourceModel\AbstractResource|null $resource
     * @param \Magento\Framework\Data\Collection\AbstractDb|null $resourceCollection
     * @param array $data
     * @param CurrencyConfig|null $currencyConfig
     * @param LocalResolverInterface|null $localeResolver
     * @param NumberFormatterFactory|null $numberFormatterFactory
     * @param Json|null $serializer
     * @SuppressWarnings(PHPMD.ExcessiveParameterList)
     */
    public function __construct(
        \Magento\Framework\Model\Context $context,
        \Magento\Framework\Registry $registry,
        \Magento\Framework\Locale\FormatInterface $localeFormat,
        \Magento\Store\Model\StoreManagerInterface $storeManager,
        \Magento\Directory\Helper\Data $directoryHelper,
        \Magento\Directory\Model\Currency\FilterFactory $currencyFilterFactory,
        \Magento\Framework\Locale\CurrencyInterface $localeCurrency,
        \Magento\Framework\Model\ResourceModel\AbstractResource $resource = null,
        \Magento\Framework\Data\Collection\AbstractDb $resourceCollection = null,
        array $data = [],
        CurrencyConfig $currencyConfig = null,
        LocalResolverInterface $localeResolver = null,
        \Magento\Framework\NumberFormatterFactory $numberFormatterFactory = null,
        Json $serializer = null
    ) {
        parent::__construct(
            $context,
            $registry,
            $localeFormat,
            $storeManager,
            $directoryHelper,
            $currencyFilterFactory,
            $localeCurrency,
            $resource,
            $resourceCollection,
            $data,
            $currencyConfig,
            $localeResolver,
            $numberFormatterFactory,
            $serializer
        );
    }

    /**
     * Apply currency format to number with specific rounding precision
     *
     * @param   float $price
     * @param   int $precision
     * @param   array $options
     * @param   bool $includeContainer
     * @param   bool $addBrackets
     * @return  string
     */
    public function formatPrecision(
        $price,
        $precision,
        $options = [],
        $includeContainer = true,
        $addBrackets = false
    ) {
        if (!isset($options['precision'])) {
            $options['precision'] = $precision;
        }
        if ($includeContainer) {
            return '<span>' . ($addBrackets ? '[' : '') . $this->formatTxt(
                    $price,
                    $options
                ) . ($addBrackets ? ']' : '') . '</span>';
        }
        return $this->formatTxt($price, $options);
    }
}
