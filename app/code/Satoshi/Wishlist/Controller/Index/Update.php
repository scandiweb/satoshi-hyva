<?php

declare(strict_types=1);

namespace Satoshi\Wishlist\Controller\Index;

use Magento\Framework\App\Action;
use Magento\Framework\Exception\NotFoundException;
use Magento\Framework\Controller\ResultFactory;
use Magento\Wishlist\Controller\Index\Update as SourceUpdate;

/**
 * Implement session-based message.
 */
class Update extends SourceUpdate
{
    /**
     * @var \Magento\Customer\Model\Session
     */
    protected $_customerSession;

    /**
     * @param Action\Context $context
     * @param \Magento\Framework\Data\Form\FormKey\Validator $formKeyValidator
     * @param \Magento\Wishlist\Controller\WishlistProviderInterface $wishlistProvider
     * @param \Magento\Wishlist\Model\LocaleQuantityProcessor $quantityProcessor
     * @param \Magento\Customer\Model\Session $customerSession
     */
    public function __construct(
        Action\Context $context,
        \Magento\Framework\Data\Form\FormKey\Validator $formKeyValidator,
        \Magento\Wishlist\Controller\WishlistProviderInterface $wishlistProvider,
        \Magento\Wishlist\Model\LocaleQuantityProcessor $quantityProcessor,
        \Magento\Customer\Model\Session $customerSession,
    ) {
        $this->_customerSession = $customerSession;

        parent::__construct(
            $context,
            $formKeyValidator,
            $wishlistProvider,
            $quantityProcessor,
        );
    }

    /**
     * Update wishlist item comments
     *
     * @return \Magento\Framework\Controller\Result\Redirect
     * @throws NotFoundException
     * @SuppressWarnings(PHPMD.CyclomaticComplexity)
     * @SuppressWarnings(PHPMD.NPathComplexity)
     */
    public function execute()
    {
        /** @var \Magento\Framework\Controller\Result\Redirect $resultRedirect */
        $resultRedirect = $this->resultFactory->create(ResultFactory::TYPE_REDIRECT);
        if (!$this->_formKeyValidator->validate($this->getRequest())) {
            $resultRedirect->setPath('*/*/');
            return $resultRedirect;
        }
        $wishlist = $this->wishlistProvider->getWishlist();
        if (!$wishlist) {
            throw new NotFoundException(__('Page not found.'));
        }

        $post = $this->getRequest()->getPostValue();
        $resultRedirect->setPath('*', ['wishlist_id' => $wishlist->getId()]);
        if (!$post) {
            return $resultRedirect;
        }

        if (isset($post['description']) && is_array($post['description'])) {
            $updatedItems = 0;

            foreach ($post['description'] as $itemId => $description) {
                $item = $this->_objectManager->create(\Magento\Wishlist\Model\Item::class)->load($itemId);
                if ($item->getWishlistId() != $wishlist->getId()) {
                    continue;
                }

                // Extract new values
                $description = (string)$description;

                if ($description == $this->_objectManager->get(
                        \Magento\Wishlist\Helper\Data::class
                    )->defaultCommentString()
                ) {
                    $description = '';
                }

                $qty = null;
                if (isset($post['qty'][$itemId])) {
                    $qty = $this->quantityProcessor->process($post['qty'][$itemId]);
                }
                if ($qty === null) {
                    $qty = $item->getQty();
                    if (!$qty) {
                        $qty = 1;
                    }
                } elseif (0 == $qty) {
                    try {
                        $item->delete();
                    } catch (\Exception $e) {
                        $this->_objectManager->get(\Psr\Log\LoggerInterface::class)->critical($e);
                        $this->_customerSession->setErrorMessage(__('We can\'t delete item from Wish List right now.'));
                    }
                }

                // Check that we need to save
                if ($item->getDescription() == $description && $item->getQty() == $qty) {
                    continue;
                }
                try {
                    $item->setDescription($description)->setQty($qty)->save();
                    $this->_customerSession->setSuccessMessage(
                        __('%1 has been updated in your Wish List.', $item->getProduct()->getName())
                    );
                    $updatedItems++;
                } catch (\Exception $e) {
                    $this->_customerSession->setErrorMessage(
                        __(
                            'Can\'t save description %1',
                            $this->_objectManager->get(\Magento\Framework\Escaper::class)->escapeHtml($description)
                        )
                    );
                }
            }

            // save wishlist model for setting date of last update
            if ($updatedItems) {
                try {
                    $wishlist->save();
                    $this->_objectManager->get(\Magento\Wishlist\Helper\Data::class)->calculate();
                } catch (\Exception $e) {
                    $this->_customerSession->setErrorMessage(__('Can\'t update wish list'));
                }
            }
        }

        if (isset($post['save_and_share'])) {
            $resultRedirect->setPath('*/*/share', ['wishlist_id' => $wishlist->getId()]);
        }

        return $resultRedirect;
    }
}
