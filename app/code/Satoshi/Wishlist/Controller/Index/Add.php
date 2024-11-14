<?php

declare(strict_types=1);

namespace Satoshi\Wishlist\Controller\Index;

use Magento\Catalog\Api\ProductRepositoryInterface;
use Magento\Customer\Model\Session;
use Magento\Framework\App\Action\Context;
use Magento\Framework\Controller\ResultInterface;
use Magento\Framework\Data\Form\FormKey\Validator;
use Magento\Framework\Exception\LocalizedException;
use Magento\Framework\Exception\NotFoundException;
use Magento\Framework\Exception\NoSuchEntityException;
use Magento\Framework\Controller\ResultFactory;
use Magento\Framework\UrlInterface;
use Magento\Framework\App\Response\RedirectInterface;
use Magento\Wishlist\Controller\WishlistProviderInterface;
use Magento\Framework\App\ObjectManager;
use Magento\Wishlist\Controller\Index\Add as SourceWishlist;

class Add extends SourceWishlist
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
     * @var Session
     */
    private $session;

    /**
     * @param Context $context
     * @param Session $customerSession
     * @param WishlistProviderInterface $wishlistProvider
     * @param ProductRepositoryInterface $productRepository
     * @param Validator $formKeyValidator
     * @param RedirectInterface|null $redirect
     * @param UrlInterface|null $urlBuilder
     */
    public function __construct(
        Context $context,
        Session $customerSession,
        WishlistProviderInterface $wishlistProvider,
        ProductRepositoryInterface $productRepository,
        Validator $formKeyValidator,
        ?RedirectInterface $redirect = null,
        ?UrlInterface $urlBuilder = null
    ) {
        $this->redirect = $redirect ?: ObjectManager::getInstance()->get(RedirectInterface::class);
        $this->urlBuilder = $urlBuilder ?: ObjectManager::getInstance()->get(UrlInterface::class);
        $this->session = $customerSession;

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
     * @return ResultInterface
     * @throws LocalizedException
     * @throws NotFoundException
     */
    public function execute()
    {
        $resultRedirect = $this->resultFactory->create(ResultFactory::TYPE_REDIRECT);
        $session = $this->_customerSession;
        $requestParams = $this->getRequest()->getParams();

        // Validate form key
        if (!$this->formKeyValidator->validate($this->getRequest())) {
            return $resultRedirect->setPath('*/');
        }

        $wishlist = $this->wishlistProvider->getWishlist();
        if (!$wishlist) {
            throw new NotFoundException(__('Page not found.'));
        }

        $productId = isset($requestParams['product']) ? (int)$requestParams['product'] : null;
        if (!$productId) {
            $resultRedirect->setPath('*/');
            return $resultRedirect;
        }

        try {
            $product = $this->productRepository->getById($productId);
        } catch (NoSuchEntityException $e) {
            $product = null;
        }

        if (!$product || !$product->isVisibleInCatalog()) {
            $this->session->setErrorMessage(__('We can\'t specify a product.'));
            $resultRedirect->setPath('*/');
            return $resultRedirect;
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

            $referer = $session->getBeforeWishlistUrl() ?: $this->_redirect->getRefererUrl();
            $session->setBeforeWishlistUrl(null);

            $this->_objectManager->get(\Magento\Wishlist\Helper\Data::class)->calculate();

            $this->session->setSuccessMessage(
                __('The product %1 has been added to your wishlist.', $product->getName())
            );
        } catch (LocalizedException $e) {
            $this->session->setErrorMessage(
                __('We can\'t add the item to the Wishlist right now: %1.', $e->getMessage())
            );
        } catch (\Exception $e) {
            $this->session->setErrorMessage(
                __('We can\'t add the item to the Wishlist right now.')
            );
        }

        if ($this->getRequest()->isAjax()) {
            $url = $this->urlBuilder->getUrl(
                '*',
                $this->redirect->updatePathParams(
                    ['wishlist_id' => $wishlist->getId()]
                )
            );
            $resultJson = $this->resultFactory->create(ResultFactory::TYPE_JSON);
            $resultJson->setData(['backUrl' => $url]);

            return $resultJson;
        }

        // Redirect to referer or PDP if available, otherwise default wishlist page
        $resultRedirect->setUrl($referer ?: $this->urlBuilder->getUrl('wishlist'));

        return $resultRedirect;
    }
}
