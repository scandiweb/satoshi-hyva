<?php

declare(strict_types=1);

namespace Satoshi\Wishlist\Controller\Index;

use Magento\Framework\App\Action;
use Magento\Framework\Data\Form\FormKey\Validator;
use Magento\Framework\Exception\NotFoundException;
use Magento\Framework\Controller\ResultFactory;
use Magento\Wishlist\Controller\WishlistProviderInterface;
use Magento\Wishlist\Model\Item;
use Magento\Wishlist\Model\Product\AttributeValueProvider;
use Magento\Wishlist\Controller\Index\Remove as SourceRemove;

/**
 * Implement session-based message.
 */
class Remove extends SourceRemove
{
    /**
     * @var \Magento\Customer\Model\Session
     */
    protected $_customerSession;

    /**
     * @var AttributeValueProvider
     */
    private $attributeValueProvider;

    /**
     * @param Action\Context $context
     * @param WishlistProviderInterface $wishlistProvider
     * @param Validator $formKeyValidator
     * @param AttributeValueProvider|null $attributeValueProvider
     * @param \Magento\Customer\Model\Session $customerSession
     */
    public function __construct(
        Action\Context $context,
        WishlistProviderInterface $wishlistProvider,
        Validator $formKeyValidator,
        AttributeValueProvider $attributeValueProvider = null,
        \Magento\Customer\Model\Session $customerSession,
        protected \Psr\Log\LoggerInterface $logger
    ) {
        $this->_customerSession = $customerSession;
        $this->attributeValueProvider = $attributeValueProvider
            ?: \Magento\Framework\App\ObjectManager::getInstance()->get(AttributeValueProvider::class);

        parent::__construct(
            $context,
            $wishlistProvider,
            $formKeyValidator,
            $attributeValueProvider,
        );
    }

    /**
     * Remove item
     *
     * @return \Magento\Framework\Controller\Result\Redirect
     * @throws NotFoundException
     */
    public function execute()
    {
        /** @var \Magento\Framework\Controller\Result\Redirect $resultRedirect */
        $resultRedirect = $this->resultFactory->create(ResultFactory::TYPE_REDIRECT);
        if (!$this->formKeyValidator->validate($this->getRequest())) {
            return $resultRedirect->setPath('*/*/');
        }

        $id = (int)$this->getRequest()->getParam('item');
        /** @var Item $item */
        $item = $this->_objectManager->create(Item::class)->load($id);
        if (!$item->getId()) {
            throw new NotFoundException(__('Page not found.'));
        }
        $wishlist = $this->wishlistProvider->getWishlist($item->getWishlistId());
        if (!$wishlist) {
            throw new NotFoundException(__('Page not found.'));
        }
        try {
            $item->delete();
            $wishlist->save();
            // Cast the product ID to an integer to ensure the correct type is passed.
            // This resolves a TypeError that occurs when getRawAttributeValue expects an int but receives a string.
            $productName = $this->attributeValueProvider
                ->getRawAttributeValue((int)$item->getProductId(), 'name');
            $this->_customerSession->setSuccessMessage(
                __('%1 has been removed from your Wish List.', $productName)
            );
        } catch (\Magento\Framework\Exception\LocalizedException $e) {
            $this->_customerSession->setErrorMessage(
                __('We can\'t delete the item from Wish List right now because of an error: %1.', $e->getMessage())
            );
        } catch (\Exception $e) {
            $this->_customerSession->setErrorMessage(__('We can\'t delete the item from the Wish List right now.'));
        }

        $this->_objectManager->get(\Magento\Wishlist\Helper\Data::class)->calculate();
        $refererUrl = $this->_redirect->getRefererUrl();
        if ($refererUrl) {
            $redirectUrl = $refererUrl;
        } else {
            $redirectUrl = $this->_redirect->getRedirectUrl($this->_url->getUrl('*/*'));
        }
        $resultRedirect->setUrl($redirectUrl);
        return $resultRedirect;
    }
}
