<?php
declare(strict_types=1);

namespace Satoshi\Checkout\CustomerData;

use Magento\Checkout\CustomerData\Cart;
use Satoshi\Theme\ViewModel\Cart\Cart as CartViewModel;

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
     * @param CartViewModel $cartViewModel
     */
    public function __construct(CartViewModel $cartViewModel)
    {
        $this->cartViewModel = $cartViewModel;
    }

    /**
     * Add cart totals data to result
     */
    public function afterGetSectionData(Cart $subject, $result)
    {
        $result['cartTotals'] = $this->cartViewModel->getCartTotals();
        return $result;
    }
}
