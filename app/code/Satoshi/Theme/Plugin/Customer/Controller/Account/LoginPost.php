<?php

namespace Satoshi\Theme\Plugin\Customer\Controller\Account;

use Magento\Customer\Model\Session;
use Magento\Framework\App\Action\Context;
use Magento\Framework\View\Result\PageFactory;
use Magento\Customer\Controller\Account\Login;
use Magento\Framework\Controller\Result\JsonFactory;
use Magento\Customer\Model\Account\Redirect as AccountRedirect;
use Magento\Customer\Api\AccountManagementInterface;
use Magento\Customer\Model\Url as CustomerUrl;
use Magento\Framework\App\ResponseInterface;
use Magento\Framework\Controller\Result\Json;
use Magento\Framework\Controller\ResultInterface;
use Magento\Framework\Exception\EmailNotConfirmedException;
use Magento\Framework\Exception\AuthenticationException;
use Magento\Framework\Data\Form\FormKey\Validator;
use Magento\Framework\Exception\LocalizedException;;


class LoginPost extends Login
{
    protected AccountManagementInterface $customerAccountManagement;
    protected Validator $formKeyValidator;
    protected AccountRedirect $accountRedirect;

    private $customerUrl;
    protected JsonFactory $jsonFactory;


    public function __construct(
        Context $context,
        Session $customerSession,
        PageFactory $resultPageFactory,
        JsonFactory $jsonFactory,
        AccountManagementInterface $customerAccountManagement,
        CustomerUrl $customerHelperData,
        Validator $formKeyValidator,
        AccountRedirect $accountRedirect,
    ) {
        $this->customerAccountManagement = $customerAccountManagement;
        $this->customerUrl = $customerHelperData;
        $this->formKeyValidator = $formKeyValidator;
        $this->accountRedirect = $accountRedirect;
        $this->jsonFactory = $jsonFactory;
        parent::__construct($context, $customerSession, $resultPageFactory);
    }


    /**
     * Customer login form page with error message for invalid credentials
     *
     * @return Json|ResultInterface|ResponseInterface
     */
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
