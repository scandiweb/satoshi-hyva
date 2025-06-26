<?php

declare(strict_types=1);

namespace Satoshi\Checkout\CustomerData;

use Magento\Checkout\CustomerData\Cart;
use Satoshi\Theme\ViewModel\Cart\Cart as CartViewModel;
use Satoshi\Core\Helper\IsThemeActive;

class CartPlugin
{
    /**
     * @var null
     */
    protected $quote = null;

    /**
     * @var CartViewModel
     */
    protected CartViewModel $cartViewModel;

    /**
     * @var IsThemeActive
     */
    private IsThemeActive $isThemeActive;

    /**
     * @param CartViewModel $cartViewModel
     * @param IsThemeActive $isThemeActive
     */
    public function __construct(
        CartViewModel $cartViewModel,
        IsThemeActive $isThemeActive
    ) {
        $this->cartViewModel = $cartViewModel;
        $this->isThemeActive = $isThemeActive;
    }

    /**
     * Add cart totals data to result
     */
    public function afterGetSectionData(Cart $subject, $result)
    {
        // Guard clause: only execute if Satoshi theme is active
        if (!$this->isThemeActive->isSatoshiTheme()) {
            return $result;
        }

        $result['cartTotals'] = $this->cartViewModel->getCartTotals();
        return $result;
    }
}
