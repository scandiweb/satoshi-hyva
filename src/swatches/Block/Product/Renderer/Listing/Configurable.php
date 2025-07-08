<?php

declare(strict_types=1);

namespace Satoshi\Swatches\Block\Product\Renderer\Listing;

use Magento\Swatches\Block\Product\Renderer\Listing\Configurable as SourceConfigurable;
use Magento\Catalog\Block\Product\Context;
use Magento\Catalog\Helper\Product as CatalogProduct;
use Magento\Catalog\Model\Layer\Resolver;
use Magento\ConfigurableProduct\Helper\Data;
use Magento\ConfigurableProduct\Model\ConfigurableAttributeData;
use Magento\Customer\Helper\Session\CurrentCustomer;
use Magento\Framework\Json\EncoderInterface;
use Magento\Framework\Pricing\PriceCurrencyInterface;
use Magento\Framework\Stdlib\ArrayUtils;
use Magento\Swatches\Helper\Data as SwatchData;
use Magento\Swatches\Helper\Media;
use Magento\Swatches\Model\SwatchAttributesProvider;
use Satoshi\Core\Helper\IsThemeActive;

class Configurable extends SourceConfigurable
{
    /**
     * @var IsThemeActive
     */
    private IsThemeActive $isThemeActive;

    /**
     * @SuppressWarnings(PHPMD.ExcessiveParameterList)
     * @param Context $context
     * @param ArrayUtils $arrayUtils
     * @param EncoderInterface $jsonEncoder
     * @param Data $helper
     * @param CatalogProduct $catalogProduct
     * @param CurrentCustomer $currentCustomer
     * @param PriceCurrencyInterface $priceCurrency
     * @param ConfigurableAttributeData $configurableAttributeData
     * @param SwatchData $swatchHelper
     * @param Media $swatchMediaHelper
     * @param IsThemeActive $isThemeActive
     * @param array $data
     * @param SwatchAttributesProvider|null $swatchAttributesProvider
     * @param \Magento\Framework\Locale\Format|null $localeFormat
     * @param \Magento\ConfigurableProduct\Model\Product\Type\Configurable\Variations\Prices|null $variationPrices
     * @param Resolver $layerResolver
     */
    public function __construct(
        Context $context,
        ArrayUtils $arrayUtils,
        EncoderInterface $jsonEncoder,
        Data $helper,
        CatalogProduct $catalogProduct,
        CurrentCustomer $currentCustomer,
        PriceCurrencyInterface $priceCurrency,
        ConfigurableAttributeData $configurableAttributeData,
        SwatchData $swatchHelper,
        Media $swatchMediaHelper,
        IsThemeActive $isThemeActive,
        array $data = [],
        ?SwatchAttributesProvider $swatchAttributesProvider = null,
        ?\Magento\Framework\Locale\Format $localeFormat = null,
        ?\Magento\ConfigurableProduct\Model\Product\Type\Configurable\Variations\Prices $variationPrices = null,
        ?Resolver $layerResolver = null
    ) {
        parent::__construct(
            $context,
            $arrayUtils,
            $jsonEncoder,
            $helper,
            $catalogProduct,
            $currentCustomer,
            $priceCurrency,
            $configurableAttributeData,
            $swatchHelper,
            $swatchMediaHelper,
            $data,
            $swatchAttributesProvider,
            $localeFormat,
            $variationPrices,
            $layerResolver
        );
        $this->isThemeActive = $isThemeActive;
    }

    /**
     * Get Swatch config data
     *
     * @return string
     */
    public function getJsonSwatchConfig()
    {
        if (!$this->isThemeActive->isSatoshiTheme()) {
            return parent::getJsonSwatchConfig();
        }

        $this->unsetData('allow_products');
        $attributesData = $this->getSwatchAttributesData();
        $allOptionIds = $this->getConfigurableOptionsIds($attributesData);

        $swatchesData = $this->swatchHelper->getSwatchesByOptionsId($allOptionIds);

        $config = [];
        foreach ($attributesData as $attributeId => $attributeDataArray) {
            if (isset($attributeDataArray['options'])) {
                $config[$attributeId] = $this->addSwatchDataForAttribute(
                    $attributeDataArray['options'],
                    $swatchesData,
                    $attributeDataArray
                );
            }
            if (isset($attributeDataArray['additional_data'])) {
                $config[$attributeId]['additional_data'] = $attributeDataArray['additional_data'];
            }
        }

        return $this->jsonEncoder->encode($config);
    }
}
