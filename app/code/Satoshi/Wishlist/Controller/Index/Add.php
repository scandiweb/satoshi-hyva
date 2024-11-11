<?php
namespace Satoshi\Wishlist\Controller\Index;

use Magento\Catalog\Api\ProductRepositoryInterface;
use Magento\Customer\Model\Session;
use Magento\Framework\App\Action\Context;
use Magento\Framework\Data\Form\FormKey\Validator;
use Magento\Framework\Exception\LocalizedException;
use Magento\Framework\Exception\NotFoundException;
use Magento\Framework\Exception\NoSuchEntityException;
use Magento\Framework\Controller\ResultFactory;
use Magento\Framework\UrlInterface;
use Magento\Framework\App\Response\RedirectInterface;
use Magento\Framework\Controller\ResultInterface;
use Magento\Wishlist\Controller\WishlistProviderInterface;
use Magento\Framework\App\ObjectManager;
use Magento\Wishlist\Controller\Index\Add as WishlistAdd;
use Magento\Wishlist\Helper\Data;
use Satoshi\Wishlist\CustomerData\Wishlist as WishlistData;


class Add extends WishlistAdd
{
    /**
     * @var RedirectInterface
     */
    private $redirect;

    /**
     * @var UrlInterface
     */
    private $urlBuilder;

    /**
     * @var WishlistData
     */
    private $wishlistData;

    /**
     * Add constructor.
     *
     * @param Context $context
     * @param Session $customerSession
     * @param WishlistProviderInterface $wishlistProvider
     * @param ProductRepositoryInterface $productRepository
     * @param Validator $formKeyValidator
     * @param WishlistData $wishlistData
     * @param RedirectInterface|null $redirect
     * @param UrlInterface|null $urlBuilder
     */
    public function __construct(
        Context $context,
        Session $customerSession,
        WishlistProviderInterface $wishlistProvider,
        ProductRepositoryInterface $productRepository,
        Validator $formKeyValidator,
        WishlistData $wishlistData,
        ?RedirectInterface $redirect = null,
        ?UrlInterface $urlBuilder = null,
    ) {
        $this->redirect = $redirect ?: ObjectManager::getInstance()->get(RedirectInterface::class);
        $this->urlBuilder = $urlBuilder ?: ObjectManager::getInstance()->get(UrlInterface::class);
        $this->wishlistData = $wishlistData;

        parent::__construct(
            $context,
            $customerSession,
            $wishlistProvider,
            $productRepository,
            $formKeyValidator,
            $redirect,
            $urlBuilder
        );
    }

    /**
     * Adding new item
     *
     * @return ResultInterface
     * @throws NotFoundException
     * @SuppressWarnings(PHPMD.CyclomaticComplexity)
     * @SuppressWarnings(PHPMD.NPathComplexity)
     * @SuppressWarnings(PHPMD.UnusedLocalVariable)
     * @SuppressWarnings(PHPMD.ExcessiveMethodLength)
     */
    public function execute()
    {
        $requestParams = $this->getRequest()->getParams();

        if (!$this->formKeyValidator->validate($this->getRequest())) {
            return $this->createJsonResponse(['error' => true, 'message' => __('Invalid form key')]);
        }

        $wishlist = $this->wishlistProvider->getWishlist();
        if (!$wishlist) {
            throw new NotFoundException(__('Page not found.'));
        }

        $productId = isset($requestParams['product']) ? (int)$requestParams['product'] : null;
        if (!$productId) {
            return $this->createJsonResponse(['error' => true, 'message' => __('Product ID is missing')]);
        }

        try {
            $product = $this->productRepository->getById($productId);
        } catch (NoSuchEntityException $e) {
            return $this->createJsonResponse(['error' => true, 'message' => __('Product not found')]);
        }

        if (!$product || !$product->isVisibleInCatalog()) {
            return $this->createJsonResponse(['error' => true, 'message' => __('We can\'t specify a product.')]);
        }

        try {
            $buyRequest = new \Magento\Framework\DataObject($requestParams);
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

            $this->_objectManager->get(Data::class)->calculate();

            return $this->createJsonResponse([
                'success' => true,
                'message' => __('%1 has been added to your wishlist.', $product->getName()),
                'item' => $this->wishlistData->getItemData($result)
            ]);

        } catch (LocalizedException $e) {
            return $this->createJsonResponse(['error' => true, 'message' => __('%1.', $e->getMessage())]);
        } catch (\Exception $e) {
            return $this->createJsonResponse(['error' => true, 'message' => __('We can\'t add the item to Wish List right now.')]);
        }
    }

    /**
     * Helper method to create a JSON response.
     *
     * @param array $data
     * @return \Magento\Framework\Controller\Result\Json
     */
    private function createJsonResponse(array $data)
    {
        /** @var \Magento\Framework\Controller\Result\Json $resultJson */
        $resultJson = $this->resultFactory->create(ResultFactory::TYPE_JSON);
        return $resultJson->setData($data);
    }
}
