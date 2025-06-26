<?php

namespace Satoshi\Customer\Controller\Account;

use Exception;
use Magento\Customer\Api\AccountManagementInterface;
use Magento\Customer\Controller\Account\ForgotPasswordPost as SourceForgotPasswordPost;
use Magento\Customer\Model\AccountManagement;
use Magento\Customer\Model\Session;
use Magento\Framework\App\Action\Context;
use Magento\Framework\Controller\Result\JsonFactory;
use Magento\Framework\Controller\Result\Redirect;
use Magento\Framework\Escaper;
use Magento\Framework\Exception\NoSuchEntityException;
use Magento\Framework\Exception\SecurityViolationException;
use Magento\Framework\Validator\EmailAddress;
use Magento\Framework\Validator\ValidateException;
use Magento\Framework\Validator\ValidatorChain;

class ForgotPasswordPost extends SourceForgotPasswordPost
{
    /**
     * @var JsonFactory
     */
    protected JsonFactory $jsonFactory;

    /**
     * @var Session
     */
    protected $session;

    /**
     * @param Context $context
     * @param Session $customerSession
     * @param AccountManagementInterface $customerAccountManagement
     * @param Escaper $escaper
     * @param JsonFactory $jsonFactory
     */
    public function __construct(
        Context                    $context,
        Session                    $customerSession,
        AccountManagementInterface $customerAccountManagement,
        Escaper                    $escaper,
        JsonFactory                $jsonFactory,
    ) {
        $this->jsonFactory = $jsonFactory;
        $this->session = $customerSession;
        parent::__construct($context, $customerSession, $customerAccountManagement, $escaper);
    }

    /**
     * @return Redirect
     * @throws ValidateException
     */
    public function execute(): Redirect
    {
        $resultRedirect = $this->resultRedirectFactory->create();
        $email = (string)$this->getRequest()->getPost('email');

        if ($email) {
            if (!ValidatorChain::is($email, EmailAddress::class)) {
                $this->session->setForgottenEmail($email);
                $this->session->setErrorMessage(__('The email address is incorrect. Verify the email address and try again.'));
                return $resultRedirect->setPath('*/*/forgotpassword');
            }

            try {
                $this->customerAccountManagement->initiatePasswordReset(
                    $email,
                    AccountManagement::EMAIL_RESET
                );
            } catch (NoSuchEntityException $exception) {
                // Do nothing, we don't want to disclose if the email exists or not
            } catch (SecurityViolationException $exception) {
                $this->session->setErrorMessage($exception->getMessage());
                return $resultRedirect->setPath('*/*/forgotpassword');
            } catch (Exception $exception) {
                $this->session->setErrorMessage(__('We\'re unable to send the password reset email.'));
                return $resultRedirect->setPath('*/*/forgotpassword');
            }
            $this->session->setSuccessMessage($this->getSuccessMessage($email));
            return $resultRedirect->setPath('*/*/');
        } else {
            $this->session->setErrorMessage(__('Please enter your email.'));
            return $resultRedirect->setPath('*/*/forgotpassword');
        }
    }
}
