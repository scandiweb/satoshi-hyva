<?php

namespace Satoshi\Theme\Message;

use Magento\Framework\App\RequestInterface;
use Magento\Framework\Event;
use Magento\Framework\Message\CollectionFactory;
use Magento\Framework\Message\ExceptionMessageFactoryInterface;
use Magento\Framework\Message\Factory;
use Magento\Framework\Message\Manager as MessageManager;
use Magento\Framework\Message\ManagerInterface;
use Magento\Framework\Message\Session;
use Psr\Log\LoggerInterface;

class Manager extends MessageManager
{

    protected RequestInterface $request;

    /**
     * @param  Session  $session
     * @param  Factory  $messageFactory
     * @param  CollectionFactory  $messagesFactory
     * @param  Event\ManagerInterface  $eventManager
     * @param  LoggerInterface  $logger
     * @param  string  $defaultGroup
     * @param  ExceptionMessageFactoryInterface|null  $exceptionMessageFactory
     * @param  RequestInterface  $request
     */
    public function __construct(
        RequestInterface $request,
        Session $session,
        Factory $messageFactory,
        CollectionFactory $messagesFactory,
        Event\ManagerInterface $eventManager,
        LoggerInterface $logger,
        $defaultGroup = self::DEFAULT_GROUP,
        ExceptionMessageFactoryInterface $exceptionMessageFactory = null,
    ) {
        $this->request = $request;
        parent::__construct($session, $messageFactory, $messagesFactory, $eventManager, $logger, $defaultGroup,
            $exceptionMessageFactory);
    }

    /**
     * Adds new success message
     *
     * @param  string  $message
     * @param  string|null  $group
     * @return ManagerInterface
     */
    public function addSuccessMessage($message, $group = null)
    {
        $form_id = $this->request->getParam('satoshi_form_id'); // unique name so we don't conflict if might be an input has name 'form_id'

        if ($form_id) {
            $this->session->setFormMessage([
                $form_id => [ // key form_id for cases if we have multiple forms in same page
                    'status' => 'success',
                    'message' => $message
                ]
            ]);
            return $this;
        }

        return parent::addSuccessMessage($message, $group);
    }

    /**
     * Adds new error message
     *
     * @param  string  $message
     * @param  string|null  $group
     * @return ManagerInterface
     */
    public function addErrorMessage($message, $group = null)
    {

        $form_id = $this->request->getParam('satoshi_form_id'); // unique name so we don't conflict if might be an input has name 'form_id'

        if ($form_id) {
            $this->session->setFormMessage([
                $form_id => [ // key form_id for cases if we have multiple forms in same page
                    'status' => 'error',
                    'message' => $message
                ]
            ]);
            return $this;
        }

        return parent::addErrorMessage($message, $group);
    }
}
