<?php

namespace Satoshi\Wishlist\Controller\Index;

use Magento\Framework\DataObject;
use Magento\Framework\Exception\NoSuchEntityException;
use Magento\Framework\Controller\Result\JsonFactory;
use Magento\Catalog\Api\ProductRepositoryInterface;
use Magento\Customer\Model\Session;
use Magento\Framework\App\Action\Context;
use Magento\Framework\Data\Form\FormKey\Validator;
use Magento\Framework\Exception\LocalizedException;
use Magento\Wishlist\Controller\WishlistProviderInterface;


class Add extends \Magento\Wishlist\Controller\Index\Add
{
    /**
     * @var JsonFactory
     */
    protected $jsonFactory;

    public function __construct(
        Context $context,
        Session $customerSession,
        WishlistProviderInterface $wishlistProvider,
        ProductRepositoryInterface $productRepository,
        Validator $formKeyValidator,
        JsonFactory $jsonFactory
    ) {
        $this->jsonFactory = $jsonFactory;
        parent::__construct($context, $customerSession, $wishlistProvider, $productRepository, $formKeyValidator);
    }

    public function execute()
    {
        $resultJson = $this->jsonFactory->create();

        if (!$this->formKeyValidator->validate($this->getRequest())) {
            return $resultJson->setData([
                'success' => false,
                'message' => __('Invalid form key.')
            ]);
        }

        $wishlist = $this->wishlistProvider->getWishlist();
        if (!$wishlist) {
            return $resultJson->setData([
                'success' => false,
                'message' => __('Wishlist not found.')
            ]);
        }

        $session = $this->_customerSession;

        $requestParams = $this->getRequest()->getParams();

        if ($session->getBeforeWishlistRequest()) {
            $requestParams = $session->getBeforeWishlistRequest();
            $session->unsBeforeWishlistRequest();
        }

        $productId = isset($requestParams['product']) ? (int)$requestParams['product'] : null;
        if (!$productId) {
            return $resultJson->setData([
                'success' => false,
                'message' => __('Product not specified.')
            ]);
        }

        try {
            $product = $this->productRepository->getById($productId);
        } catch (NoSuchEntityException $e) {
            $product = null;
        }

        if (!$product || !$product->isVisibleInCatalog()) {
            return $resultJson->setData([
                'success' => false,
                'message' => __('We can\'t specify a product.')
            ]);
        }

        try {
            $buyRequest = new DataObject($requestParams);

            $result = $wishlist->addNewItem($product, $buyRequest);
            if (is_string($result)) {
                throw new LocalizedException(__($result));
            }
            if ($wishlist->isObjectNew()) {
                $wishlist->save();
            }
            $this->_eventManager->dispatch(
                'wishlist_add_product',
                ['wishlist' => $wishlist, 'product' => $product, 'item' => $result]
            );

            $this->_objectManager->get(\Magento\Wishlist\Helper\Data::class)->calculate();

            return $resultJson->setData([
                'success' => true,
                'message' => __('The product %1 has been added to your wishlist.', $product->getName())
            ]);
        } catch (LocalizedException $e) {
            return $resultJson->setData([
                'success' => false,
                'message' => __('We can\'t add the item to Wish List right now: %1.', $e->getMessage())
            ]);
        } catch (\Exception $e) {
            return $resultJson->setData([
                'success' => false,
                'message' => __('We can\'t add the item to Wish List right now.')
            ]);
        }
    }
}

