<?php

declare(strict_types=1);

namespace Satoshi\Sales\Helper;

use Magento\Customer\Model\Session;
use Magento\Framework\Api\SearchCriteriaBuilder;
use Magento\Framework\App as App;
use Magento\Framework\App\ObjectManager;
use Magento\Framework\Controller\Result\Redirect;
use Magento\Framework\Controller\Result\RedirectFactory;
use Magento\Framework\Exception\InputException;
use Magento\Framework\Exception\NoSuchEntityException;
use Magento\Framework\Message\ManagerInterface;
use Magento\Framework\Registry;
use Magento\Framework\Stdlib\Cookie\CookieMetadataFactory;
use Magento\Framework\Stdlib\Cookie\CookieSizeLimitReachedException;
use Magento\Framework\Stdlib\Cookie\FailureToSendException;
use Magento\Framework\Stdlib\CookieManagerInterface;
use Magento\Sales\Api\Data\OrderInterface;
use Magento\Sales\Api\OrderRepositoryInterface;
use Magento\Sales\Helper\Guest as SourceGuest;
use Magento\Sales\Model\Order;
use Magento\Sales\Model\OrderFactory;
use Magento\Store\Model\StoreManagerInterface;

/**
 * Class Guest
 */
class Guest extends SourceGuest
{
    /**
     * @var OrderRepositoryInterface
     */
    private $orderRepository;

    /**
     * @var SearchCriteriaBuilder
     */
    private $searchCriteriaBuilder;

    /**
     * @var StoreManagerInterface
     */
    private $storeManager;

    private $inputExceptionMessage = 'You entered incorrect data. Please try again.';

    /**
     * Guest constructor.
     *
     * @param App\Helper\Context $context
     * @param StoreManagerInterface $storeManager
     * @param Registry $coreRegistry
     * @param Session $customerSession
     * @param CookieManagerInterface $cookieManager
     * @param CookieMetadataFactory $cookieMetadataFactory
     * @param ManagerInterface $messageManager
     * @param OrderFactory $orderFactory
     * @param RedirectFactory $resultRedirectFactory
     * @param OrderRepositoryInterface|null $orderRepository
     * @param SearchCriteriaBuilder|null $searchCriteria
     */
    public function __construct(
        App\Helper\Context $context,
        StoreManagerInterface $storeManager,
        Registry $coreRegistry,
        Session $customerSession,
        CookieManagerInterface $cookieManager,
        CookieMetadataFactory $cookieMetadataFactory,
        ManagerInterface $messageManager,
        OrderFactory $orderFactory,
        RedirectFactory $resultRedirectFactory,
        OrderRepositoryInterface $orderRepository = null,
        SearchCriteriaBuilder $searchCriteria = null
    ) {
        $this->customerSession = $customerSession;
        $this->storeManager = $storeManager;
        $this->orderRepository = $orderRepository ?: ObjectManager::getInstance()->get(OrderRepositoryInterface::class);
        $this->searchCriteriaBuilder = $searchCriteria ?: ObjectManager::getInstance()->get(SearchCriteriaBuilder::class);

        parent::__construct(
            $context,
            $storeManager,
            $coreRegistry,
            $customerSession,
            $cookieManager,
            $cookieMetadataFactory,
            $messageManager,
            $orderFactory,
            $resultRedirectFactory,
            $orderRepository,
            $searchCriteria
        );
    }

    /**
     * Try to load valid order by $_POST or $_COOKIE
     *
     * @param App\RequestInterface $request
     * @return Redirect|bool
     * @throws \RuntimeException
     * @throws InputException
     * @throws CookieSizeLimitReachedException
     * @throws FailureToSendException|NoSuchEntityException
     */
    public function loadValidOrder(App\RequestInterface $request)
    {
        if ($this->customerSession->isLoggedIn()) {
            return $this->resultRedirectFactory->create()->setPath('sales/order/history');
        }
        $post = $request->getPostValue();
        $post = filter_var($post, FILTER_CALLBACK, ['options' => 'trim']);
        $fromCookie = $this->cookieManager->getCookie(self::COOKIE_NAME);
        if (empty($post) && !$fromCookie) {
            return $this->resultRedirectFactory->create()->setPath('sales/guest/form');
        }
        try {
            $order = (!empty($post)
                && isset($post['oar_order_id'], $post['oar_type'])
                && !$this->hasPostDataEmptyFields($post))
                ? $this->loadFromPost($post) : $this->loadFromCookie($fromCookie);
            $this->coreRegistry->register('current_order', $order);
            return true;
        } catch (InputException $e) {
            // Change here: using session to set error message
            $this->customerSession->setErrorMessage($e->getMessage());
            return $this->resultRedirectFactory->create()->setPath('sales/guest/form');
        }
    }

    /**
     * Set guest-view cookie
     *
     * @param string $cookieValue
     * @return void
     * @throws InputException
     * @throws CookieSizeLimitReachedException
     * @throws FailureToSendException
     */
    private function setGuestViewCookie(string $cookieValue)
    {
        $metadata = $this->cookieMetadataFactory->createPublicCookieMetadata()
            ->setPath(self::COOKIE_PATH)
            ->setHttpOnly(true)
            ->setSameSite('Lax');
        $this->cookieManager->setPublicCookie(self::COOKIE_NAME, $cookieValue, $metadata);
    }

    /**
     * Load order from cookie
     *
     * @param string $fromCookie
     * @return OrderInterface
     * @throws InputException
     * @throws CookieSizeLimitReachedException
     * @throws FailureToSendException|NoSuchEntityException
     */
    private function loadFromCookie($fromCookie)
    {
        if (!is_string($fromCookie)) {
            throw new InputException(__($this->inputExceptionMessage));
        }
        // phpcs:ignore Magento2.Functions.DiscouragedFunction
        $cookieData = explode(':', base64_decode($fromCookie));
        $protectCode = $cookieData[0] ?? null;
        $incrementId = $cookieData[1] ?? null;
        if ($protectCode && $incrementId) {
            $order = $this->getOrderRecord($incrementId);
            if (hash_equals((string)$order->getProtectCode(), $protectCode)) {
                $this->setGuestViewCookie($fromCookie);
                return $order;
            }
        }
        throw new InputException(__($this->inputExceptionMessage));
    }

    /**
     * Load order data from post
     *
     * @param array $postData
     * @return Order
     * @throws InputException
     * @throws CookieSizeLimitReachedException
     * @throws FailureToSendException|NoSuchEntityException
     */
    private function loadFromPost(array $postData)
    {
        /** @var $order Order */
        $order = $this->getOrderRecord($postData['oar_order_id']);
        if (!$this->compareStoredBillingDataWithInput($order, $postData)) {
            throw new InputException(__('You entered incorrect data. Please try again.'));
        }
        $toCookie = base64_encode($order->getProtectCode() . ':' . $postData['oar_order_id']);
        $this->setGuestViewCookie($toCookie);
        return $order;
    }

    /**
     * Check that billing data from the order and from the input are equal
     *
     * @param Order $order
     * @param array $postData
     * @return bool
     */
    private function compareStoredBillingDataWithInput(Order $order, array $postData)
    {
        $type = $postData['oar_type'];
        $email = $postData['oar_email'];
        $lastName = $postData['oar_billing_lastname'];
        $zip = $postData['oar_zip'];
        $billingAddress = $order->getBillingAddress();
        return $this->normalizeStr($lastName) === $this->normalizeStr($billingAddress->getLastname()) &&
            ($type === 'email' && $this->normalizeStr($email) === $this->normalizeStr($billingAddress->getEmail()) ||
                $type === 'zip' && $this->normalizeStr($zip) === $this->normalizeStr($billingAddress->getPostcode()));
    }

    /**
     * Trim and convert to lower case
     *
     * @param string $str
     * @return string
     */
    private function normalizeStr(string $str)
    {
        return trim(strtolower($str));
    }

    /**
     * Check post data for empty fields
     *
     * @param array $postData
     * @return bool
     * @throws NoSuchEntityException
     */
    private function hasPostDataEmptyFields(array $postData)
    {
        return empty($postData['oar_order_id']) || empty($postData['oar_billing_lastname']) ||
            empty($postData['oar_type']) || empty($this->storeManager->getStore()->getId()) ||
            !in_array($postData['oar_type'], ['email', 'zip'], true) ||
            ('email' === $postData['oar_type'] && empty($postData['oar_email'])) ||
            ('zip' === $postData['oar_type'] && empty($postData['oar_zip']));
    }

    /**
     * Get order by increment_id and store_id
     *
     * @param string $incrementId
     * @return OrderInterface
     * @throws InputException|NoSuchEntityException
     */
    private function getOrderRecord(string $incrementId)
    {
        $records = $this->orderRepository->getList(
            $this->searchCriteriaBuilder
                ->addFilter('increment_id', $incrementId)
                ->addFilter('store_id', $this->storeManager->getStore()->getId())
                ->create()
        );

        $items = $records->getItems();
        if (empty($items)) {
            throw new InputException(__($this->inputExceptionMessage));
        }

        return array_shift($items);
    }
}
