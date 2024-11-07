<?php
declare(strict_types=1);

namespace Satoshi\Theme\Block\Widget;

use Magento\Customer\Block\Widget\Name as SourceName;
use Magento\Customer\Model\Session;
use Magento\Framework\View\Element\Template\Context;
use Magento\Customer\Helper\Address as AddressHelper;
use Magento\Customer\Api\CustomerMetadataInterface;
use Magento\Customer\Model\Options;
use Magento\Customer\Api\AddressMetadataInterface;

class Name extends SourceName
{
    /**
     * @var Session
     */
    protected $_session;

    /**
     * @param Session $session
     * @param Context $context
     * @param AddressHelper $addressHelper
     * @param CustomerMetadataInterface $customerMetadata
     * @param Options $options
     * @param AddressMetadataInterface $addressMetadata
     * @param array $data
     */
    public function __construct(
        Session $session,
        Context $context,
        AddressHelper $addressHelper,
        CustomerMetadataInterface $customerMetadata,
        Options $options,
        AddressMetadataInterface $addressMetadata,
        array $data = []
    ) {
        parent::__construct(
            $context,
            $addressHelper,
            $customerMetadata,
            $options,
            $addressMetadata,
            $data
        );

        $this->_session = $session;
    }

    /**
     * Retrieve and clear the form field messages from session.
     *
     * @return array
     */
    public function getFieldMessages(): array
    {
        $messages = $this->_session->getFieldMessages();
        $this->_session->unsFieldMessages();
        return is_array($messages) ? $messages : [];
    }
}
