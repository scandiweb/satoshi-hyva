<?php

declare(strict_types=1);

namespace Satoshi\CatalogSearch\Block\Advanced;

use Magento\CatalogSearch\Block\Advanced\Form as SourceForm;
use Magento\CatalogSearch\Helper\Data as CatalogSearchHelper;
use Magento\CatalogSearch\Model\Advanced;
use Magento\Customer\Model\Session;
use Magento\Directory\Model\CurrencyFactory;
use Magento\Framework\View\Element\Template\Context;

/**
 * Implement session-based message.
 */
class Form extends SourceForm
{
    /**
     * @var Session
     */
    protected $_customerSession;

    /**
     * @param Context $context
     * @param Advanced $catalogSearchAdvanced
     * @param CurrencyFactory $currencyFactory
     * @param Session $customerSession
     * @param array $data
     * @param CatalogSearchHelper|null $catalogSearchHelper
     */
    public function __construct(
        Context $context,
        Advanced $catalogSearchAdvanced,
        CurrencyFactory $currencyFactory,
        Session $customerSession,
        array $data = [],
        ?CatalogSearchHelper $catalogSearchHelper = null
    ) {
        $this->_customerSession = $customerSession;

        parent::__construct(
            $context,
            $catalogSearchAdvanced,
            $currencyFactory,
            $data,
            $catalogSearchHelper
        );
    }

    /**
     * Retrieve and clear the error message from the session
     *
     * @return string|null
     */
    public function getErrorMessage()
    {
        $errorMessage = $this->_customerSession->getErrorMessage();
        $this->_customerSession->unsErrorMessage();
        return $errorMessage;
    }
}