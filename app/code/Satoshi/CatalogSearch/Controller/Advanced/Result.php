<?php

declare(strict_types=1);

namespace Satoshi\CatalogSearch\Controller\Advanced;

use Magento\CatalogSearch\Controller\Advanced\Result as SourceResult;
use Magento\CatalogSearch\Model\Advanced as ModelAdvanced;
use Magento\Customer\Model\Session;
use Magento\Framework\App\Action\Context;
use Magento\Framework\UrlFactory;

/**
 * Implement session-based message.
 */
class Result extends SourceResult
{
    /**
     * @var Session
     */
    protected $_customerSession;

    /**
     * Construct
     *
     * @param Context $context
     * @param ModelAdvanced $catalogSearchAdvanced
     * @param UrlFactory $urlFactory
     * @param Session $customerSession
     */
    public function __construct(
        Context $context,
        ModelAdvanced $catalogSearchAdvanced,
        UrlFactory $urlFactory,
        Session $customerSession,
    ) {
        $this->_customerSession = $customerSession;

        parent::__construct(
            $context,
            $catalogSearchAdvanced,
            $urlFactory,
        );
    }

    /**
     * @inheritdoc
     */
    public function execute()
    {
        try {
            $this->_catalogSearchAdvanced->addFilters($this->getRequest()->getQueryValue());
            $this->_view->getPage()->initLayout();
            $handles = $this->_view->getLayout()->getUpdate()->getHandles();
            $handles[] = static::DEFAULT_NO_RESULT_HANDLE;
            $this->_view->loadLayout($handles);
            $this->_view->renderLayout();
        } catch (\Magento\Framework\Exception\LocalizedException $e) {
            $this->_customerSession->setErrorMessage($e->getMessage());
            $defaultUrl = $this->_urlFactory->create()
                ->addQueryParams($this->getRequest()->getQueryValue())
                ->getUrl('*/*/');
            $resultRedirect = $this->resultRedirectFactory->create();
            $resultRedirect->setUrl($this->_redirect->error($defaultUrl));
            return $resultRedirect;
        }
    }
}
