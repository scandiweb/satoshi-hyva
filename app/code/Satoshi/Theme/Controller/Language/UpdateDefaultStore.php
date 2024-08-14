<?php
declare(strict_types=1);

namespace Satoshi\Theme\Controller\Language;

use Magento\Framework\App\ActionInterface;
use Magento\Framework\App\RequestInterface;
use Magento\Framework\Controller\ResultFactory;
use Magento\Store\Model\StoreManagerInterface;
use Magento\Framework\App\Response\RedirectInterface;
use Magento\Framework\Session\SessionManagerInterface;
use Magento\Framework\Stdlib\CookieManagerInterface;
use Magento\Framework\Stdlib\Cookie\CookieMetadataFactory;

class UpdateDefaultStore implements ActionInterface
{
    protected StoreManagerInterface $storeManager;
    protected RequestInterface $request;
    protected ResultFactory $resultFactory;
    protected RedirectInterface $redirect;
    protected SessionManagerInterface $sessionManager;
    protected CookieManagerInterface $cookieManager;
    protected CookieMetadataFactory $cookieMetadataFactory;

    public function __construct(
        StoreManagerInterface $storeManager,
        RequestInterface $request,
        ResultFactory $resultFactory,
        RedirectInterface $redirect,
        SessionManagerInterface $sessionManager,
        CookieManagerInterface $cookieManager,
        CookieMetadataFactory $cookieMetadataFactory
    ) {
        $this->storeManager = $storeManager;
        $this->request = $request;
        $this->resultFactory = $resultFactory;
        $this->redirect = $redirect;
        $this->sessionManager = $sessionManager;
        $this->cookieManager = $cookieManager;
        $this->cookieMetadataFactory = $cookieMetadataFactory;
    }

    public function execute()
    {
        $languageCode = $this->request->getParam('language_code');
        $store = $this->storeManager->getStore($languageCode);

        if ($store) {
            // Set the store view for the current session
            $this->storeManager->setCurrentStore($store);

            // Optionally store in session
            $this->sessionManager->setLanguageCode($languageCode);

            // Optionally store in cookie
            $cookieMetadata = $this->cookieMetadataFactory->createPublicCookieMetadata()
                ->setPath('/')
                ->setDuration(86400 * 30); // 86400 == 1 day

            $this->cookieManager->setPublicCookie('language_code', $languageCode, $cookieMetadata);

            // Redirect back to the appropriate store
            return $this->resultFactory->create(ResultFactory::TYPE_REDIRECT)->setUrl($store->getBaseUrl());
        }

        return $this->resultFactory->create(ResultFactory::TYPE_REDIRECT)->setPath('/');
    }
}

