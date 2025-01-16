<?php

declare(strict_types=1);

namespace Satoshi\Swatches\Block\Product\Renderer\Listing;

use Magento\Swatches\Block\Product\Renderer\Listing\Configurable as SourceConfigurable;


class Configurable extends SourceConfigurable
{
    /**
     * Get Swatch config data
     *
     * @return string
     */
    public function getJsonSwatchConfig()
    {
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
