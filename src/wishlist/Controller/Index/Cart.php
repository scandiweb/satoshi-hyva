<?php

declare(strict_types=1);

namespace Satoshi\Wishlist\Controller\Index;

use Magento\Catalog\Helper\Product;
use Magento\Catalog\Model\Product\Exception as ProductException;
use Magento\Checkout\Model\Cart as CheckoutCart;
use Magento\Checkout\Helper\Cart as CartHelper;
use Magento\Framework\App\Action;
use Magento\Framework\App\ObjectManager;
use Magento\Framework\Controller\Result\Json;
use Magento\Framework\Controller\Result\Redirect;
use Magento\Framework\Controller\ResultFactory;
use Magento\Framework\Controller\ResultInterface;
use Magento\Framework\Data\Form\FormKey\Validator;
use Magento\Framework\Escaper;
use Magento\Framework\Exception\LocalizedException;
use Magento\Framework\Stdlib\Cookie\CookieMetadataFactory;
use Magento\Framework\Stdlib\Cookie\PublicCookieMetadata;
use Magento\Framework\Stdlib\CookieManagerInterface;
use Magento\Wishlist\Controller\WishlistProviderInterface;
use Magento\Wishlist\Helper\Data;
use Magento\Wishlist\Model\Item\OptionFactory;
use Magento\Wishlist\Model\ItemFactory;
use Magento\Wishlist\Model\LocaleQuantityProcessor;
use Magento\Wishlist\Model\ResourceModel\Item\Option\Collection;
use Magento\Wishlist\Controller\Index\Cart as SourceCart;
use Satoshi\Core\Helper\IsThemeActive;

/**
 * Implement session-based message.
 */
class Cart extends SourceCart
{
    /**
     * @var OptionFactory
     */
    private $optionFactory;

    /**
     * @var CookieManagerInterface
     */
    private $cookieManager;

    /**
     * @var CookieMetadataFactory
     */
    private $cookieMetadataFactory;

    /**
     * @var \Magento\Customer\Model\Session
     */
    protected $_customerSession;

    /**
     * @var IsThemeActive
     */
    private IsThemeActive $isThemeActive;

    /**
     * @param Action\Context $context
     * @param WishlistProviderInterface $wishlistProvider
     * @param LocaleQuantityProcessor $quantityProcessor
     * @param ItemFactory $itemFactory
     * @param CheckoutCart $cart
     * @param OptionFactory $optionFactory
     * @param Product $productHelper
     * @param Escaper $escaper
     * @param Data $helper
     * @param CartHelper $cartHelper
     * @param Validator $formKeyValidator
     * @param CookieManagerInterface|null $cookieManager
     * @param CookieMetadataFactory|null $cookieMetadataFactory
     * @param \Magento\Customer\Model\Session $customerSession
     * @param IsThemeActive $isThemeActive
     *
     * @SuppressWarnings(PHPMD.ExcessiveParameterList)
     */
    public function __construct(
        Action\Context $context,
        WishlistProviderInterface $wishlistProvider,
        LocaleQuantityProcessor $quantityProcessor,
        ItemFactory $itemFactory,
        CheckoutCart $cart,
        OptionFactory $optionFactory,
        Product $productHelper,
        Escaper $escaper,
        Data $helper,
        CartHelper $cartHelper,
        Validator $formKeyValidator,
        \Magento\Customer\Model\Session $customerSession,
        IsThemeActive $isThemeActive,
        ?CookieManagerInterface $cookieManager = null,
        ?CookieMetadataFactory $cookieMetadataFactory = null
    ) {
        $this->optionFactory = $optionFactory;
        $this->cookieManager = $cookieManager ?: ObjectManager::getInstance()->get(CookieManagerInterface::class);
        $this->cookieMetadataFactory = $cookieMetadataFactory ?:
            ObjectManager::getInstance()->get(CookieMetadataFactory::class);
        $this->_customerSession = $customerSession;
        $this->isThemeActive = $isThemeActive;
        parent::__construct(
            $context,
            $wishlistProvider,
            $quantityProcessor,
            $itemFactory,
            $cart,
            $optionFactory,
            $productHelper,
            $escaper,
            $helper,
            $cartHelper,
            $formKeyValidator,
            $cookieManager,
            $cookieMetadataFactory
        );
    }

    /**
     * Add wishlist item to shopping cart and remove from wishlist
     *
     * If Product has required options - item removed from wishlist and redirect
     * to product view page with message about needed defined required options
     *
     * @return ResultInterface
     * @SuppressWarnings(PHPMD.CyclomaticComplexity)
     * @SuppressWarnings(PHPMD.NPathComplexity)
     * @SuppressWarnings(PHPMD.ExcessiveMethodLength)
     */
    public function execute()
    {
        if (!$this->isThemeActive->isSatoshiTheme()) {
            return parent::execute();
        }

        /** @var Redirect $resultRedirect */
        $resultRedirect = $this->resultFactory->create(ResultFactory::TYPE_REDIRECT);
        if (!$this->formKeyValidator->validate($this->getRequest())) {
            return $resultRedirect->setPath('*/*/');
        }

        $itemId = (int)$this->getRequest()->getParam('item');
        /* @var $item \Magento\Wishlist\Model\Item */
        $item = $this->itemFactory->create()->load($itemId);
        if (!$item->getId()) {
            $resultRedirect->setPath('*/*');
            return $resultRedirect;
        }
        $wishlist = $this->wishlistProvider->getWishlist($item->getWishlistId());
        if (!$wishlist) {
            $resultRedirect->setPath('*/*');
            return $resultRedirect;
        }

        // Set qty
        $qty = $this->getRequest()->getParam('qty');
        $postQty = $this->getRequest()->getPostValue('qty');
        if ($postQty !== null && $qty !== $postQty) {
            $qty = $postQty;
        }
        if (is_array($qty)) {
            if (isset($qty[$itemId])) {
                $qty = $qty[$itemId];
            } else {
                $qty = 1;
            }
        }
        $qty = $this->quantityProcessor->process($qty);
        if ($qty) {
            $item->setQty($qty);
        }

        $redirectUrl = $this->_url->getUrl('*/*');
        $configureUrl = $this->_url->getUrl(
            '*/*/configure/',
            [
                'id' => $item->getId(),
                'product_id' => $item->getProductId(),
            ]
        );

        try {
            /** @var Collection $options */
            $options = $this->optionFactory->create()->getCollection()->addItemFilter([$itemId]);
            $item->setOptions($options->getOptionsByItem($itemId));

            $buyRequest = $this->productHelper->addParamsToBuyRequest(
                $this->getRequest()->getParams(),
                ['current_config' => $item->getBuyRequest()]
            );

            $item->mergeBuyRequest($buyRequest);
            $item->addToCart($this->cart, true);

            $related = $this->getRequest()->getParam('related_product');
            if (!empty($related)) {
                $this->cart->addProductsByIds(explode(',', $related));
            }

            $this->cart->save()->getQuote()->collectTotals();
            $wishlist->save();

            if (!$this->cart->getQuote()->getHasError()) {
                $productsToAdd = [
                    [
                        'sku' => $item->getProduct()->getSku(),
                        'name' => $item->getProduct()->getName(),
                        'price' => $item->getProduct()->getFinalPrice(),
                        'qty' => $item->getQty(),
                    ]
                ];

                /** @var PublicCookieMetadata $publicCookieMetadata */
                $publicCookieMetadata = $this->cookieMetadataFactory->createPublicCookieMetadata()
                    ->setDuration(3600)
                    ->setPath('/')
                    ->setHttpOnly(false)
                    ->setSameSite('Strict');

                $this->cookieManager->setPublicCookie(
                    'add_to_cart',
                    \rawurlencode(\json_encode($productsToAdd)),
                    $publicCookieMetadata
                );
            }

            if ($this->cartHelper->getShouldRedirectToCart()) {
                $redirectUrl = $this->cartHelper->getCartUrl();
            } else {
                $refererUrl = $this->_redirect->getRefererUrl();
                if ($refererUrl && $refererUrl != $configureUrl) {
                    $redirectUrl = $refererUrl;
                }
            }
        } catch (ProductException $e) {
            $this->_customerSession->setErrorMessage(__('This product(s) is out of stock.'));
        } catch (LocalizedException $e) {
            $this->_customerSession->setErrorMessage($e->getMessage());
            $redirectUrl = $configureUrl;
        } catch (\Exception $e) {
            $this->_customerSession->setErrorMessage($e, __('We can\'t add the item to the cart right now.'));
        }

        $this->helper->calculate();

        if ($this->getRequest()->isAjax()) {
            /** @var Json $resultJson */
            $resultJson = $this->resultFactory->create(ResultFactory::TYPE_JSON);
            $resultJson->setData(['backUrl' => $redirectUrl]);
            return $resultJson;
        }

        $resultRedirect->setUrl($redirectUrl);
        return $resultRedirect;
    }
}
