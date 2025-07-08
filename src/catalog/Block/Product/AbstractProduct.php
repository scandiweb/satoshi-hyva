<?php

declare(strict_types=1);

namespace Satoshi\Catalog\Block\Product;

use Magento\Catalog\Block\Product\AbstractProduct as SourceAbstractProduct;

class AbstractProduct extends SourceAbstractProduct
{
    /**
     * Retrieve product details html
     * Overridden to pass $isReadonly, and $cacheKey to the renderer
     *
     * @param \Magento\Catalog\Model\Product $product
     * @param bool $isReadonly
     * @return mixed
     */
    public function getProductDetailsHtml(\Magento\Catalog\Model\Product $product, bool $isReadonly = false)
    {
        $renderer = $this->getDetailsRenderer($product->getTypeId());
        if ($renderer) {
            $renderer->setProduct($product);
            $renderer->setIsReadonly($isReadonly);
            $cacheKey = 'product_details_' . $product->getId() . '_readonly_' . ($isReadonly ? 'yes' : 'no');
            $renderer->setCacheKey($cacheKey);
            return $renderer->toHtml();
        }
        return '';
    }
}
