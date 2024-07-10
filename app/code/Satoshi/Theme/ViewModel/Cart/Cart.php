<?php
declare(strict_types=1);

namespace Satoshi\Theme\ViewModel\Cart;

use Magento\Checkout\Model\Session;
use Magento\Framework\View\Element\Block\ArgumentInterface;

class Cart implements ArgumentInterface
{
    /**
     * @var Session
     */
    protected $checkoutSession;

    /**
     * Items constructor.
     * @param Session $checkoutSession
     */
    public function __construct(
        Session $checkoutSession
    ) {
        $this->checkoutSession = $checkoutSession;
    }

    public function getCartItemsQty() {
        return $this->checkoutSession->getQuote()->getItemsQty();
    }
}
