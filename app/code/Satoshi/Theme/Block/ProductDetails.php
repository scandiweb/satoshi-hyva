<?php

namespace Satoshi\Theme\Block;

use Magento\Framework\View\Element\Template;
use Magento\Store\Model\StoreManagerInterface;
use Magento\Framework\Pricing\Helper\Data;

class ProductDetails extends Template
{
    protected $storeManager;
    protected $pricingHelper;

    public function __construct(
        Template\Context $context,
        StoreManagerInterface $storeManager,
        Data $pricingHelper,
        array $data = []
    ) {
        $this->storeManager = $storeManager;
        $this->pricingHelper = $pricingHelper;
        parent::__construct($context, $data);
    }

    public function getProductImageUrl($product)
    {
        echo $product->getImage();
        if ($product && $product->getImage()) {
            $mediaUrl = $this->storeManager->getStore()->getBaseUrl(\Magento\Framework\UrlInterface::URL_TYPE_MEDIA);
            return $mediaUrl . 'catalog/product' . $product->getImage();
        }
        return null; // Return a placeholder or null if no image is found
    }

    public function kle()
    {
        return 'hola';
    }

    public function getFormattedPrice($price)
    {
        if ($price) {
            if (floor($price) == $price) {
                $formattedPrice = $this->pricingHelper->currency($price, true, false);
                return strtok($formattedPrice, '.');
            }
            return $this->pricingHelper->currency($price, true, false);
        }
        return __('N/A');
    }
}
