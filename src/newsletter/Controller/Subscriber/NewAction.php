<?php

declare(strict_types=1);

namespace Satoshi\Newsletter\Controller\Subscriber;

use Magento\Newsletter\Controller\Subscriber\NewAction as SourceNewAction;
use Magento\Customer\Api\AccountManagementInterface as CustomerAccountManagement;
use Magento\Customer\Api\CustomerRepositoryInterface;
use Magento\Customer\Model\Session;
use Magento\Customer\Model\Url as CustomerUrl;
use Magento\Framework\App\Action\Context;
use Magento\Framework\App\ObjectManager;
use Magento\Framework\Exception\LocalizedException;
use Magento\Framework\Phrase;
use Magento\Framework\Validator\EmailAddress as EmailValidator;
use Magento\Newsletter\Model\Subscriber;
use Magento\Newsletter\Model\SubscriptionManagerInterface;
use Magento\Store\Model\StoreManagerInterface;
use Magento\Newsletter\Model\SubscriberFactory;
use Magento\Framework\Controller\Result\JsonFactory;

class NewAction extends SourceNewAction
{
    /**
     * @var CustomerRepositoryInterface
     */
    private $customerRepository;

    /**
     * @var SubscriptionManagerInterface
     */
    private $subscriptionManager;

    /**
     * @var JsonFactory
     */
    protected $jsonFactory;

    /**
     * Initialize dependencies.
     *
     * @param Context $context
     * @param SubscriberFactory $subscriberFactory
     * @param Session $customerSession
     * @param StoreManagerInterface $storeManager
     * @param CustomerUrl $customerUrl
     * @param CustomerAccountManagement $customerAccountManagement
     * @param SubscriptionManagerInterface $subscriptionManager
     * @param EmailValidator|null $emailValidator
     * @param CustomerRepositoryInterface|null $customerRepository
     * @param JsonFactory $jsonFactory
     */
    public function __construct(
        Context $context,
        SubscriberFactory $subscriberFactory,
        Session $customerSession,
        StoreManagerInterface $storeManager,
        CustomerUrl $customerUrl,
        CustomerAccountManagement $customerAccountManagement,
        SubscriptionManagerInterface $subscriptionManager,
        EmailValidator $emailValidator = null,
        CustomerRepositoryInterface $customerRepository = null,
        JsonFactory $jsonFactory,
    ) {
        $this->subscriptionManager = $subscriptionManager;
        $this->customerRepository = $customerRepository ?: ObjectManager::getInstance()
            ->get(CustomerRepositoryInterface::class);
        $this->jsonFactory = $jsonFactory;
        parent::__construct(
            $context,
            $subscriberFactory,
            $customerSession,
            $storeManager,
            $customerUrl,
            $customerAccountManagement,
            $subscriptionManager,
            $emailValidator,
            $customerRepository
        );
    }

    /**
     * Check if customer with provided email exists and return its id
     *
     * @param string $email
     * @param int $websiteId
     * @return int|null
     */
    private function getCustomerId(string $email, int $websiteId): ?int
    {
        try {
            $customer = $this->customerRepository->get($email, $websiteId);
            return (int)$customer->getId();
        } catch (\Magento\Framework\Exception\NoSuchEntityException $e) {
            return null;
        }
    }

    /**
     * Overridden to implement the error messages
     *
     * @return Json
     */
    public function execute()
    {
        $resultJson = $this->jsonFactory->create();
        if ($this->getRequest()->isPost() && $this->getRequest()->getPost('email')) {
            $email = (string)$this->getRequest()->getPost('email');

            try {
                $this->validateEmailFormat($email);
                $this->validateGuestSubscription();
                $this->validateEmailAvailable($email);

                $websiteId = (int)$this->_storeManager->getStore()->getWebsiteId();
                /** @var Subscriber $subscriber */
                $subscriber = $this->_subscriberFactory->create()->loadBySubscriberEmail($email, $websiteId);
                if ($subscriber->getId()
                    && (int)$subscriber->getSubscriberStatus() === Subscriber::STATUS_SUBSCRIBED) {
                    throw new LocalizedException(
                        __('This email address is already subscribed.')
                    );
                }

                $storeId = (int)$this->_storeManager->getStore()->getId();
                $currentCustomerId = $this->getCustomerId($email, $websiteId);

                $subscriber = $currentCustomerId
                    ? $this->subscriptionManager->subscribeCustomer($currentCustomerId, $storeId)
                    : $this->subscriptionManager->subscribe($email, $storeId);
                $message = $this->getSuccessMessage((int)$subscriber->getSubscriberStatus());
                return $resultJson->setData(['success' => true, 'message' => $message, 'field' => '']);
            } catch (LocalizedException $e) {
                return $resultJson->setData(['success' => false, 'message' => $e->getMessage(), 'field' => 'email']);
            } catch (\Exception $e) {
                return $resultJson->setData(['success' => false, 'message' => __('Something went wrong with the subscription.'), 'field' => 'email']);
            }
        }

        return $resultJson->setData(['success' => false, 'message' => __('Something went wrong with the subscription.'), 'field' => 'email']);
    }

    /**
     * Get success message
     *
     * @param int $status
     * @return Phrase
     */
    private function getSuccessMessage(int $status): Phrase
    {
        if ($status === Subscriber::STATUS_NOT_ACTIVE) {
            return __('The confirmation request has been sent.');
        }

        return __('Thank you for your subscription.');
    }
}
