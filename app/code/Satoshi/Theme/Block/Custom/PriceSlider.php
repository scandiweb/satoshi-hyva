<?php
namespace Satoshi\Theme\Block\Custom;

use Magento\Framework\View\Element\Template;
use Magento\Framework\App\Request\Http as Request;

class PriceSlider extends Template
{
    protected $request;

    public function __construct(
        Template\Context $context,
        Request $request,
        array $data = []
    ) {
        $this->request = $request;
        parent::__construct($context, $data);
    }

    /**
     * Get the price parameter from URL
     *
     * @return int[]
     */
    public function getPriceParam()
    {
        $priceParam = $this->request->getParam('price');

        if ($priceParam) {
            $prices = explode('-', $priceParam);

            if (count($prices) == 2 && is_numeric($prices[0]) && is_numeric($prices[1])) {
                $minPrice = (int) $prices[0];
                $maxPrice = (int) $prices[1];
                return [$minPrice, $maxPrice];
            }
        }

        return [0, 0];
    }
}
