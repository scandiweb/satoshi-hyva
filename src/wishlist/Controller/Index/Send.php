<?php

declare(strict_types=1);

namespace Satoshi\Wishlist\Controller\Index;

use Magento\Captcha\Helper\Data as CaptchaHelper;
use Magento\Captcha\Model\DefaultModel as CaptchaModel;
use Magento\Captcha\Observer\CaptchaStringResolver;
use Magento\Customer\Model\Customer;
use Magento\Framework\App\Action;
use Magento\Framework\App\Config\ScopeConfigInterface;
use Magento\Framework\App\ObjectManager;
use Magento\Framework\Controller\ResultFactory;
use Magento\Framework\Escaper;
use Magento\Framework\Exception\NotFoundException;
use Magento\Framework\Session\Generic as WishlistSession;
use Magento\Framework\Validator\EmailAddress;
use Magento\Framework\Validator\ValidateException;
use Magento\Framework\Validator\ValidatorChain;
use Magento\Store\Model\StoreManagerInterface;
use Magento\Wishlist\Controller\Index\Send as SourceSend;

class Send extends SourceSend
{
    /**
     * @var Escaper
     */
    private $escaper;

    /**
     * @var CaptchaHelper
     */
    private $captchaHelper;

    /**
     * @var CaptchaStringResolver
     */
    private $captchaStringResolver;

    /**
     * @param Action\Context $context
     * @param \Magento\Framework\Data\Form\FormKey\Validator $formKeyValidator
     * @param \Magento\Customer\Model\Session $customerSession
     * @param \Magento\Wishlist\Controller\WishlistProviderInterface $wishlistProvider
     * @param \Magento\Wishlist\Model\Config $wishlistConfig
     * @param \Magento\Framework\Mail\Template\TransportBuilder $transportBuilder
     * @param \Magento\Framework\Translate\Inline\StateInterface $inlineTranslation
     * @param \Magento\Customer\Helper\View $customerHelperView
     * @param WishlistSession $wishlistSession
     * @param ScopeConfigInterface $scopeConfig
     * @param StoreManagerInterface $storeManager
     * @param CaptchaHelper|null $captchaHelper
     * @param CaptchaStringResolver|null $captchaStringResolver
     * @param Escaper|null $escaper
     * @SuppressWarnings(PHPMD.ExcessiveParameterList)
     */
    public function __construct(
        Action\Context                                         $context,
        \Magento\Framework\Data\Form\FormKey\Validator         $formKeyValidator,
        \Magento\Customer\Model\Session                        $customerSession,
        \Magento\Wishlist\Controller\WishlistProviderInterface $wishlistProvider,
        \Magento\Wishlist\Model\Config                         $wishlistConfig,
        \Magento\Framework\Mail\Template\TransportBuilder      $transportBuilder,
        \Magento\Framework\Translate\Inline\StateInterface     $inlineTranslation,
        \Magento\Customer\Helper\View                          $customerHelperView,
        WishlistSession                                        $wishlistSession,
        ScopeConfigInterface                                   $scopeConfig,
        StoreManagerInterface                                  $storeManager,
        ?CaptchaHelper                                         $captchaHelper = null,
        ?CaptchaStringResolver                                 $captchaStringResolver = null,
        Escaper                                                $escaper = null
    )
    {
        $this->captchaHelper = $captchaHelper ?: ObjectManager::getInstance()->get(CaptchaHelper::class);
        $this->captchaStringResolver = $captchaStringResolver ?: ObjectManager::getInstance()->get(
            CaptchaStringResolver::class
        );
        $this->escaper = $escaper ?? ObjectManager::getInstance()->get(
            Escaper::class
        );

        parent::__construct(
            $context,
            $formKeyValidator,
            $customerSession,
            $wishlistProvider,
            $wishlistConfig,
            $transportBuilder,
            $inlineTranslation,
            $customerHelperView,
            $wishlistSession,
            $scopeConfig,
            $storeManager,
            $captchaHelper,
            $captchaStringResolver,
            $escaper
        );
    }

    /**
     * Share wishlist
     *
     * @return \Magento\Framework\Controller\Result\Redirect
     * @throws NotFoundException|ValidateException
     * @SuppressWarnings(PHPMD.CyclomaticComplexity)
     * @SuppressWarnings(PHPMD.NPathComplexity)
     * @SuppressWarnings(PHPMD.ExcessiveMethodLength)
     */
    public function execute()
    {
        /** @var \Magento\Framework\Controller\Result\Redirect $resultRedirect */
        $resultRedirect = $this->resultFactory->create(ResultFactory::TYPE_REDIRECT);
        $captchaForName = 'share_wishlist_form';
        /** @var CaptchaModel $captchaModel */
        $captchaModel = $this->captchaHelper->getCaptcha($captchaForName);

        if (!$this->_formKeyValidator->validate($this->getRequest())) {
            $resultRedirect->setPath('*/*/');
            return $resultRedirect;
        }

        $isCorrectCaptcha = $this->validateCaptcha($captchaModel, $captchaForName);

        $this->logCaptchaAttempt($captchaModel);

        if (!$isCorrectCaptcha) {
            $this->_customerSession->setErrorMessage([
                'captcha' => __('Incorrect CAPTCHA.')
            ]);
            $resultRedirect->setPath('*/*/share');
            return $resultRedirect;
        }

        $wishlist = $this->wishlistProvider->getWishlist();
        if (!$wishlist) {
            throw new NotFoundException(__('Page not found.'));
        }

        $sharingLimit = $this->_wishlistConfig->getSharingEmailLimit();
        $textLimit = $this->_wishlistConfig->getSharingTextLimit();
        $emailsLeft = $sharingLimit - $wishlist->getShared();

        $emails = $this->getRequest()->getPost('emails');
        $emails = empty($emails) ? $emails : explode(',', $emails);

        $error = false;
        $message = (string)$this->getRequest()->getPost('message');
        if (strlen($message) > $textLimit) {
            $error = __('Message length must not exceed %1 symbols', $textLimit);
        } else {
            $message = nl2br((string)$this->escaper->escapeHtml($message));
            if (empty($emails)) {
                $error = __('Please enter an email address.');
            } else {
                if (count($emails) > $emailsLeft) {
                    $error = __('Maximum of %1 emails can be sent.', $emailsLeft);
                } else {
                    foreach ($emails as $index => $email) {
                        $email = $email !== null ? trim($email) : '';
                        if (!ValidatorChain::is($email, EmailAddress::class)) {
                            $error = __('Please enter a valid email address.');
                            break;
                        }
                        $emails[$index] = $email;
                    }
                }
            }
        }

        if ($error) {
            $this->_customerSession->setErrorMessage([
                'emails' => $error,
            ]);
            $this->wishlistSession->setSharingForm($this->getRequest()->getPostValue());
            $resultRedirect->setPath('*/*/share');
            return $resultRedirect;
        }
        /** @var \Magento\Framework\View\Result\Layout $resultLayout */
        $resultLayout = $this->resultFactory->create(ResultFactory::TYPE_LAYOUT);
        $this->addLayoutHandles($resultLayout);
        $this->inlineTranslation->suspend();

        $sent = 0;

        try {
            $customer = $this->_customerSession->getCustomerDataObject();
            $customerName = $this->_customerHelperView->getCustomerName($customer);

            $message .= $this->getRssLink($wishlist->getId(), $resultLayout);
            $emails = array_unique($emails);
            $sharingCode = $wishlist->getSharingCode();

            try {
                foreach ($emails as $email) {
                    $transport = $this->_transportBuilder->setTemplateIdentifier(
                        $this->scopeConfig->getValue(
                            'wishlist/email/email_template',
                            \Magento\Store\Model\ScopeInterface::SCOPE_STORE
                        )
                    )->setTemplateOptions(
                        [
                            'area' => \Magento\Framework\App\Area::AREA_FRONTEND,
                            'store' => $this->storeManager->getStore()->getStoreId(),
                        ]
                    )->setTemplateVars(
                        [
                            'customer' => $customer,
                            'customerName' => $customerName,
                            'salable' => $wishlist->isSalable() ? 'yes' : '',
                            'items' => $this->getWishlistItems($resultLayout),
                            'viewOnSiteLink' => $this->_url->getUrl('*/shared/index', ['code' => $sharingCode]),
                            'message' => $message,
                            'store' => $this->storeManager->getStore(),
                        ]
                    )->setFrom(
                        $this->scopeConfig->getValue(
                            'wishlist/email/email_identity',
                            \Magento\Store\Model\ScopeInterface::SCOPE_STORE
                        )
                    )->addTo(
                        $email
                    )->getTransport();

                    $transport->sendMessage();

                    $sent++;
                }
            } catch (\Exception $e) {
                $wishlist->setShared($wishlist->getShared() + $sent);
                $wishlist->save();
                throw $e;
            }
            $wishlist->setShared($wishlist->getShared() + $sent);
            $wishlist->save();

            $this->inlineTranslation->resume();

            $this->_eventManager->dispatch('wishlist_share', ['wishlist' => $wishlist]);
            $this->_customerSession->setSuccessMessage(__('Your wish list has been shared.'));
            $resultRedirect->setPath('*/*', ['wishlist_id' => $wishlist->getId()]);
            return $resultRedirect;
        } catch (\Exception $e) {
            $this->inlineTranslation->resume();
            $this->_customerSession->setErrorMessage([
                'general' => $e->getMessage(),
            ]);
            $this->wishlistSession->setSharingForm($this->getRequest()->getPostValue());
            $resultRedirect->setPath('*/*/share');
            return $resultRedirect;
        }
    }

    /**
     * Log customer action attempts
     *
     * @param CaptchaModel $captchaModel
     * @return void
     */
    private function logCaptchaAttempt(CaptchaModel $captchaModel): void
    {
        /** @var  Customer $customer */
        $customer = $this->_customerSession->getCustomer();
        $email = '';

        if ($customer->getId()) {
            $email = $customer->getEmail();
        }

        $captchaModel->logAttempt($email);
    }

    /**
     * Captcha validate logic
     *
     * @param CaptchaModel $captchaModel
     * @param string $captchaFormName
     * @return bool
     */
    private function validateCaptcha(CaptchaModel $captchaModel, string $captchaFormName): bool
    {
        if ($captchaModel->isRequired()) {
            $word = $this->captchaStringResolver->resolve(
                $this->getRequest(),
                $captchaFormName
            );

            if (!$captchaModel->isCorrect($word)) {
                return false;
            }
        }

        return true;
    }
}
