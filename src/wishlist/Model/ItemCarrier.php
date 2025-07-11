<?php

declare(strict_types=1);

namespace Satoshi\Wishlist\Model;

use Magento\Catalog\Model\Product\Exception as ProductException;
use Magento\Checkout\Helper\Cart as CartHelper;
use Magento\Checkout\Model\Cart;
use Magento\Customer\Model\Session;
use Magento\Framework\App\Response\RedirectInterface;
use Magento\Framework\Exception\LocalizedException;
use Magento\Wishlist\Model\LocaleQuantityProcessor;
use Psr\Log\LoggerInterface as Logger;
use Magento\Framework\Message\ManagerInterface as MessageManager;
use Magento\Framework\UrlInterface;
use Magento\Wishlist\Helper\Data as WishlistHelper;
use Magento\Wishlist\Model\ItemCarrier as SourceItemCarrier;
use Satoshi\Core\Helper\IsThemeActive;

/**
 * Implement session-based message.
 */
class ItemCarrier extends SourceItemCarrier
{
    /**
     * @var IsThemeActive
     */
    private IsThemeActive $isThemeActive;

    /**
     * @param Session $customerSession
     * @param LocaleQuantityProcessor $quantityProcessor
     * @param Cart $cart
     * @param Logger $logger
     * @param WishlistHelper $helper
     * @param CartHelper $cartHelper
     * @param UrlInterface $urlBuilder
     * @param MessageManager $messageManager
     * @param RedirectInterface $redirector
     * @param IsThemeActive $isThemeActive
     */
    public function __construct(
        Session $customerSession,
        LocaleQuantityProcessor $quantityProcessor,
        Cart $cart,
        Logger $logger,
        WishlistHelper $helper,
        CartHelper $cartHelper,
        UrlInterface $urlBuilder,
        MessageManager $messageManager,
        RedirectInterface $redirector,
        IsThemeActive $isThemeActive
    ) {
        $this->isThemeActive = $isThemeActive;
        parent::__construct(
            $customerSession,
            $quantityProcessor,
            $cart,
            $logger,
            $helper,
            $cartHelper,
            $urlBuilder,
            $messageManager,
            $redirector
        );
    }

    /**
     * Move all wishlist item to cart
     *
     * @param \Magento\Wishlist\Model\Wishlist $wishlist
     * @param array $qtys
     * @return string
     * @SuppressWarnings(PHPMD.CyclomaticComplexity)
     * @SuppressWarnings(PHPMD.NPathComplexity)
     * @SuppressWarnings(PHPMD.ExcessiveMethodLength)
     */
    public function moveAllToCart(\Magento\Wishlist\Model\Wishlist $wishlist, $qtys)
    {
        if (!$this->isThemeActive->isSatoshiTheme()) {
            return parent::moveAllToCart($wishlist, $qtys);
        }

        $isOwner = $wishlist->isOwner($this->customerSession->getCustomerId());

        $messages = [];
        $addedProducts = [];
        $notSalable = [];

        $cart = $this->cart;
        $collection = $wishlist->getItemCollection()->setVisibilityFilter();

        foreach ($collection as $item) {
            /** @var $item \Magento\Wishlist\Model\Item */
            try {
                $disableAddToCart = $item->getProduct()->getDisableAddToCart();
                $item->unsProduct();

                // Set qty
                if (isset($qtys[$item->getId()])) {
                    $qty = $this->quantityProcessor->process($qtys[$item->getId()]);
                    if ($qty) {
                        $item->setQty($qty);
                    }
                }
                $item->getProduct()->setDisableAddToCart($disableAddToCart);
                // Add to cart
                if ($item->addToCart($cart, $isOwner)) {
                    $addedProducts[] = $item->getProduct();
                }
            } catch (LocalizedException $e) {
                if ($e instanceof ProductException) {
                    $notSalable[] = $item;
                } else {
                    $messages[] = __('%1 for "%2".', trim($e->getMessage(), '.'), $item->getProduct()->getName());
                }

                $cartItem = $cart->getQuote()->getItemByProduct($item->getProduct());
                if ($cartItem) {
                    $cart->getQuote()->deleteItem($cartItem);
                }
            } catch (\Exception $e) {
                $this->logger->critical($e);
                $messages[] = __('We can\'t add this item to your shopping cart right now.');
            }
        }

        if ($isOwner) {
            $indexUrl = $this->helper->getListUrl($wishlist->getId());
        } else {
            $indexUrl = $this->urlBuilder->getUrl('wishlist/shared', ['code' => $wishlist->getSharingCode()]);
        }
        if ($this->cartHelper->getShouldRedirectToCart()) {
            $redirectUrl = $this->cartHelper->getCartUrl();
        } elseif ($this->redirector->getRefererUrl()) {
            $redirectUrl = $this->redirector->getRefererUrl();
        } else {
            $redirectUrl = $indexUrl;
        }

        if ($notSalable) {
            $products = [];
            foreach ($notSalable as $item) {
                $products[] = '"' . $item->getProduct()->getName() . '"';
            }
            $messages[] = __(
                'We couldn\'t add the following product(s) to the shopping cart: %1.',
                join(', ', $products)
            );
        }

        if ($messages) {
            foreach ($messages as $message) {
                $this->customerSession->setErrorMessage($message);
            }
            $redirectUrl = $indexUrl;
        }

        if ($addedProducts) {
            // save wishlist model for setting date of last update
            try {
                $wishlist->save();
            } catch (\Exception $e) {
                $this->customerSession->setErrorMessage(__('We can\'t update the Wish List right now.'));
                $redirectUrl = $indexUrl;
            }

            $products = [];
            foreach ($addedProducts as $product) {
                /** @var $product \Magento\Catalog\Model\Product */
                $products[] = '"' . $product->getName() . '"';
            }

            // save cart and collect totals
            $cart->save()->getQuote()->collectTotals();
        }
        $this->helper->calculate();
        return $redirectUrl;
    }
}
