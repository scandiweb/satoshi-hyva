<?php

namespace Satoshi\Contact\Controller\Index;

use Magento\Contact\Controller\Index\Post as SourcePost;
use Magento\Contact\Model\ConfigInterface;
use Magento\Contact\Model\MailInterface;
use Magento\Framework\App\Action\Context;
use Magento\Framework\App\Request\DataPersistorInterface;
use Magento\Framework\Controller\Result\Redirect;
use Magento\Framework\Exception\LocalizedException;
use Psr\Log\LoggerInterface;
use Magento\Framework\App\ObjectManager;
use Magento\Framework\DataObject;
use Magento\Framework\Session\SessionManagerInterface;

class Post extends SourcePost
{
    /**
     * @var DataPersistorInterface
     */
    private $dataPersistor;

    /**
     * @var MailInterface
     */
    private $mail;

    /**
     * @var LoggerInterface
     */
    private $logger;

    /**
     * @var SessionManagerInterface
     */
    private $session;

    /**
     * @param Context $context
     * @param ConfigInterface $contactsConfig
     * @param MailInterface $mail
     * @param DataPersistorInterface $dataPersistor
     * @param SessionManagerInterface $session
     * @param LoggerInterface $logger
     */
    public function __construct(
        Context $context,
        ConfigInterface $contactsConfig,
        MailInterface $mail,
        DataPersistorInterface $dataPersistor,
        SessionManagerInterface $session,
        LoggerInterface $logger = null
    ) {
        parent::__construct($context, $contactsConfig, $mail, $dataPersistor, $logger);
        $this->dataPersistor = $dataPersistor;
        $this->mail = $mail;
        $this->logger = $logger ?: ObjectManager::getInstance()->get(LoggerInterface::class);
        $this->session = $session;
    }

    /**
     * Post user question
     *
     * @return Redirect
     */
    public function execute()
    {
        if (!$this->getRequest()->isPost()) {
            return $this->resultRedirectFactory->create()->setPath('*/*/');
        }
        try {
            $this->sendEmail($this->validatedParams());
            $this->session->setContactSuccessMessage(
                __('Thanks for contacting us with your comments and questions. We\'ll respond to you very soon.')
            );
            $this->dataPersistor->clear('contact_us');
        } catch (LocalizedException $e) {
            $message = $e->getMessage();
            if ($message) {
                $this->session->setContactErrorMessage($message);
            }
            $this->dataPersistor->set('contact_us', $this->getRequest()->getParams());
        } catch (\Exception $e) {
            $this->logger->critical($e);
            $this->session->setContactErrorMessage(
                __('An error occurred while processing your form. Please try again later.')
            );
            $this->dataPersistor->set('contact_us', $this->getRequest()->getParams());
        }
        return $this->resultRedirectFactory->create()->setPath('contact/index');
    }

    /**
     * Method to send email.
     *
     * @param array $post Post data from contact form
     *
     * @return void
     */
    private function sendEmail($post)
    {
        $this->mail->send(
            $post['email'],
            ['data' => new DataObject($post)]
        );
    }

    /**
     * Method to validated params.
     *
     * @return array
     * @throws \Exception
     */
    private function validatedParams()
    {
        $request = $this->getRequest();
        $hasInvalidField = false;

        if (trim($request->getParam('name', '')) === '') {
            $this->session->setContactNameErrorMessage(
                __('Enter the Name and try again.')
            );
            $hasInvalidField = true;
        }
        if (trim($request->getParam('comment', '')) === '') {
            $this->session->setContactCommentErrorMessage(
                __('Enter the comment and try again.')
            );
            $hasInvalidField = true;
        }
        if (\strpos($request->getParam('email', ''), '@') === false) {
            $this->session->setContactEmailErrorMessage(
                __('The email address is invalid. Verify the email address and try again.')
            );
            $hasInvalidField = true;
        }

        if($hasInvalidField) {
            throw new LocalizedException(__(''));
        }

        if (trim($request->getParam('hideit', '')) !== '') {
            // phpcs:ignore Magento2.Exceptions.DirectThrow
            throw new \Exception();
        }

        return $request->getParams();
    }
}
