<?php

namespace Satoshi\Theme\Plugin\Customer\Controller\Account;

use Magento\Customer\Controller\Account\ForgotPasswordPost;
use Magento\Customer\Api\AccountManagementInterface;
use Magento\Customer\Model\AccountManagement;
use Magento\Customer\Model\Session;
use Magento\Framework\App\Action\Context;
use Magento\Framework\Controller\Result\Redirect;
use Magento\Framework\Escaper;
use Magento\Framework\Exception\NoSuchEntityException;
use Magento\Framework\Exception\SecurityViolationException;
use Magento\Framework\Validator\EmailAddress;
use Magento\Framework\Validator\ValidatorChain;
use Magento\Framework\Controller\Result\JsonFactory;


class ForgotPassPost extends ForgotPasswordPost
{
    public function __construct(
        Context                    $context,
        Session                    $customerSession,
        AccountManagementInterface $customerAccountManagement,
        Escaper                    $escaper,
        JsonFactory                $jsonFactory,
    )
    {
        $this->jsonFactory = $jsonFactory;
        parent::__construct($context, $customerSession, $customerAccountManagement, $escaper);
    }

    protected JsonFactory $jsonFactory;

    public function execute()
    {
        $resultJson = $this->jsonFactory->create();
        return $resultJson->setData(['success' => false, 'message' => __('The email address is incorrect. Verify the email address and try again.'), 'field' => 'username']);
        /** @var Redirect $resultRedirect */
        $resultRedirect = $this->resultRedirectFactory->create();
        $email = (string)$this->getRequest()->getPost('email');
        if ($email) {
            if (!ValidatorChain::is($email, EmailAddress::class)) {
                $this->session->setForgottenEmail($email);
                return $resultJson->setData(['success' => false, 'message' => __('The email address is incorrect. Verify the email address and try again.'), 'field' => 'username']);
            }

            try {
                $this->customerAccountManagement->initiatePasswordReset(
                    $email,
                    AccountManagement::EMAIL_RESET
                );
                // phpcs:ignore Magento2.CodeAnalysis.EmptyBlock.DetectedCatch
            } catch (NoSuchEntityException $exception) {
                // Do nothing, we don't want anyone to use this action to determine which email accounts are registered.
            } catch (SecurityViolationException $exception) {
                return $resultJson->setData(['success' => false, 'message' => __($exception->getMessage()), 'field' => 'username']);
            } catch (\Exception $exception) {
                return $resultJson->setData(['success' => false, 'message' => __('We\'re unable to send the password reset email.'), 'field' => 'username']);
            }
            $this->messageManager->addSuccessMessage($this->getSuccessMessage($email));
            return $resultRedirect->setPath('*/*/');
        } else {
            return $resultJson->setData(['success' => false, 'message' => __('Please enter your email.'), 'field' => 'username']);
        }
    }

}
