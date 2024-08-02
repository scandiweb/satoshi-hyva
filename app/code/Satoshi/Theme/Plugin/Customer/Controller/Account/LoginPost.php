<?php

namespace Satoshi\Theme\Plugin\Customer\Controller\Account;

use Magento\Framework\App\Action\HttpPostActionInterface as HttpPostActionInterface;
use Magento\Customer\Model\Account\Redirect as AccountRedirect;
use Magento\Framework\App\Action\Context;
use Magento\Customer\Model\Session;
use Magento\Customer\Api\AccountManagementInterface;
use Magento\Customer\Model\Url as CustomerUrl;
use Magento\Framework\App\CsrfAwareActionInterface;
use Magento\Framework\App\Request\InvalidRequestException;
use Magento\Framework\App\RequestInterface;
use Magento\Framework\App\ResponseInterface;
use Magento\Framework\Controller\Result\Json;
use Magento\Framework\Controller\Result\JsonFactory;
use Magento\Framework\Controller\ResultInterface;
use Magento\Framework\Exception\EmailNotConfirmedException;
use Magento\Framework\Exception\AuthenticationException;
use Magento\Framework\Data\Form\FormKey\Validator;
use Magento\Framework\Exception\LocalizedException;
use Magento\Framework\Exception\State\UserLockedException;
use Magento\Customer\Controller\AbstractAccount;
use Magento\Framework\Phrase;

class LoginPost extends AbstractAccount implements CsrfAwareActionInterface, HttpPostActionInterface
{
    protected $customerAccountManagement;
    protected $formKeyValidator;
    protected $accountRedirect;
    protected $session;
    private $scopeConfig;
    private $cookieMetadataFactory;
    private $cookieMetadataManager;
    private $customerUrl;
    protected $jsonFactory;

    public function __construct(
        Context $context,
        Session $customerSession,
        AccountManagementInterface $customerAccountManagement,
        CustomerUrl $customerHelperData,
        Validator $formKeyValidator,
        AccountRedirect $accountRedirect,
        JsonFactory $jsonFactory
    ) {
        $this->session = $customerSession;
        $this->customerAccountManagement = $customerAccountManagement;
        $this->customerUrl = $customerHelperData;
        $this->formKeyValidator = $formKeyValidator;
        $this->accountRedirect = $accountRedirect;
        $this->jsonFactory = $jsonFactory;
        parent::__construct($context);
    }

    private function getScopeConfig()
    {
        if (!($this->scopeConfig instanceof \Magento\Framework\App\Config\ScopeConfigInterface)) {
            return \Magento\Framework\App\ObjectManager::getInstance()->get(
                \Magento\Framework\App\Config\ScopeConfigInterface::class
            );
        } else {
            return $this->scopeConfig;
        }
    }

    private function getCookieManager()
    {
        if (!$this->cookieMetadataManager) {
            $this->cookieMetadataManager = \Magento\Framework\App\ObjectManager::getInstance()->get(
                \Magento\Framework\Stdlib\Cookie\PhpCookieManager::class
            );
        }
        return $this->cookieMetadataManager;
    }

    private function getCookieMetadataFactory()
    {
        if (!$this->cookieMetadataFactory) {
            $this->cookieMetadataFactory = \Magento\Framework\App\ObjectManager::getInstance()->get(
                \Magento\Framework\Stdlib\Cookie\CookieMetadataFactory::class
            );
        }
        return $this->cookieMetadataFactory;
    }

    public function createCsrfValidationException(
        RequestInterface $request
    ): ?InvalidRequestException {
        $resultRedirect = $this->resultRedirectFactory->create();
        $resultRedirect->setPath('*/*/');
        return new InvalidRequestException(
            $resultRedirect,
            [new Phrase('Invalid Form Key. Please refresh the page.')]
        );
    }

    public function validateForCsrf(RequestInterface $request): ?bool
    {
        return null;
    }

    public function execute(): Json|ResultInterface|ResponseInterface
    {
        $resultJson = $this->jsonFactory->create();
        if ($this->session->isLoggedIn() || !$this->formKeyValidator->validate($this->getRequest())) {
            return $resultJson->setData(['success' => false, 'message' => __('Invalid Form Key. Please refresh the page.')]);
        }

        if ($this->getRequest()->isPost()) {
            $login = $this->getRequest()->getPost('login');
            if (!empty($login['username']) && !empty($login['password'])) {
                try {
                    $customer = $this->customerAccountManagement->authenticate($login['username'], $login['password']);
                    $this->session->setCustomerDataAsLoggedIn($customer);

                    return $resultJson->setData(['success' => true]);
                } catch (EmailNotConfirmedException $e) {
                    return $resultJson->setData(['success' => false, 'message' => __('Email not confirmed.'), 'field' => 'username']);
                } catch (AuthenticationException $e) {
                    return $resultJson->setData(['success' => false, 'message' => __('Incorrect email or password..'), 'field' => 'username']);
                } catch (UserLockedException $e) {
                    return $resultJson->setData(['success' => false, 'message' => __('Your account is locked.'), 'field' => 'username']);
                } catch (LocalizedException $e) {
                    return $resultJson->setData(['success' => false, 'message' => $e->getMessage(), 'field' => 'password']);
                } catch (\Exception $e) {
                    return $resultJson->setData(['success' => false, 'message' => __('An error occurred. Please try again.'), 'field' => '']);
                }
            } else {
                return $resultJson->setData(['success' => false, 'message' => __('A login and a password are required.')]);
            }
        }

        return $resultJson->setData(['success' => false, 'message' => __('Invalid request.')]);
    }
}
