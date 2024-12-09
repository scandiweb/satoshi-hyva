<?php

declare(strict_types=1);

namespace Satoshi\Newsletter\Controller\Manage;

use Magento\Customer\Api\CustomerRepositoryInterface as CustomerRepository;
use Magento\Customer\Api\Data\CustomerInterface;
use Magento\Newsletter\Model\Subscriber;
use Magento\Newsletter\Model\SubscriptionManagerInterface;
use Magento\Newsletter\Controller\Manage\Save as SourceSave;

class Save extends SourceSave
{
    /**
     * @var SubscriptionManagerInterface
     */
    private $subscriptionManager;

    /**
     * Initialize dependencies.
     *
     * @param \Magento\Framework\App\Action\Context $context
     * @param \Magento\Customer\Model\Session $customerSession
     * @param \Magento\Framework\Data\Form\FormKey\Validator $formKeyValidator
     * @param \Magento\Store\Model\StoreManagerInterface $storeManager
     * @param CustomerRepository $customerRepository
     * @param SubscriptionManagerInterface $subscriptionManager
     */
    public function __construct(
        \Magento\Framework\App\Action\Context $context,
        \Magento\Customer\Model\Session $customerSession,
        \Magento\Framework\Data\Form\FormKey\Validator $formKeyValidator,
        \Magento\Store\Model\StoreManagerInterface $storeManager,
        CustomerRepository $customerRepository,
        SubscriptionManagerInterface $subscriptionManager
    ) {
        parent::__construct(
            $context,
            $customerSession,
            $formKeyValidator,
            $storeManager,
            $customerRepository,
            $subscriptionManager
        );
        $this->subscriptionManager = $subscriptionManager;
    }

    /**
     * Save newsletter subscription preference action
     *
     * @return \Magento\Framework\App\ResponseInterface
     */
    public function execute()
    {
        if (!$this->formKeyValidator->validate($this->getRequest())) {
            return $this->_redirect('customer/account/');
        }

        $customerId = $this->_customerSession->getCustomerId();
        if ($customerId === null) {
            $this->_customerSession->setErrorMessage(__('Something went wrong while saving your subscription.'));
        } else {
            try {
                $customer = $this->customerRepository->getById($customerId);
                $storeId = (int)$this->storeManager->getStore()->getId();
                $customer->setStoreId($storeId);
                $isSubscribedState = $customer->getExtensionAttributes()->getIsSubscribed();
                $isSubscribedParam = (boolean)$this->getRequest()->getParam('is_subscribed', false);
                if ($isSubscribedParam !== $isSubscribedState) {
                    // No need to validate customer and customer address while saving subscription preferences
                    $this->setIgnoreValidationFlag($customer);
                    $this->customerRepository->save($customer);
                    if ($isSubscribedParam) {
                        $subscribeModel = $this->subscriptionManager->subscribeCustomer((int)$customerId, $storeId);
                        $subscribeStatus = (int)$subscribeModel->getStatus();
                        if ($subscribeStatus === Subscriber::STATUS_SUBSCRIBED) {
                            $this->_customerSession->setSuccessMessage(__('We have saved your subscription.'));
                        } else {
                            $this->_customerSession->setSuccessMessage(__('A confirmation request has been sent.'));
                        }
                    } else {
                        $this->subscriptionManager->unsubscribeCustomer((int)$customerId, $storeId);
                        $this->_customerSession->setSuccessMessage(__('We have removed your newsletter subscription.'));
                    }
                } else {
                    $this->_customerSession->setSuccessMessage(__('We have updated your subscription.'));
                }
            } catch (\Exception $e) {
                $this->_customerSession->setErrorMessage(__('Something went wrong while saving your subscription.'));
            }
        }
        return $this->_redirect('customer/account/');
    }

    /**
     * Set ignore_validation_flag to skip unnecessary address and customer validation
     *
     * @param CustomerInterface $customer
     * @return void
     */
    private function setIgnoreValidationFlag(CustomerInterface $customer): void
    {
        $customer->setData('ignore_validation_flag', true);
    }
}
