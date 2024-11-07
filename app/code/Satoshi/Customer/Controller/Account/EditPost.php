<?php

declare(strict_types=1);

namespace Satoshi\Customer\Controller\Account;

use Magento\Customer\Controller\Account\EditPost as SourceEditPost;
use Magento\Customer\Api\Data\CustomerInterface;
use Magento\Customer\Api\SessionCleanerInterface;
use Magento\Customer\Model\AccountConfirmation;
use Magento\Customer\Model\AddressRegistry;
use Magento\Customer\Model\Url;
use Magento\Customer\Model\AuthenticationInterface;
use Magento\Customer\Model\Customer\Mapper;
use Magento\Customer\Model\EmailNotificationInterface;
use Magento\Framework\App\ObjectManager;
use Magento\Framework\App\RequestInterface;
use Magento\Framework\Controller\Result\Redirect;
use Magento\Framework\Data\Form\FormKey\Validator;
use Magento\Customer\Api\AccountManagementInterface;
use Magento\Customer\Api\CustomerRepositoryInterface;
use Magento\Customer\Model\CustomerExtractor;
use Magento\Customer\Model\Session;
use Magento\Framework\App\Action\Context;
use Magento\Framework\Escaper;
use Magento\Framework\Exception\FileSystemException;
use Magento\Framework\Exception\InputException;
use Magento\Framework\Exception\InvalidEmailOrPasswordException;
use Magento\Framework\Exception\LocalizedException;
use Magento\Framework\Exception\NoSuchEntityException;
use Magento\Framework\Exception\SessionException;
use Magento\Framework\Exception\State\UserLockedException;
use Magento\Framework\Filesystem;
use Magento\Framework\App\Filesystem\DirectoryList;

class EditPost extends SourceEditPost
{

    /**
     * @var EmailNotificationInterface
     */
    private $emailNotification;

    /**
     * @var AuthenticationInterface
     */
    private $authentication;

    /**
     * @var Mapper
     */
    private $customerMapper;

    /**
     * @var Escaper
     */
    private $escaper;

    /**
     * @var AddressRegistry
     */
    private $addressRegistry;

    /**
     * @var Filesystem
     */
    private $filesystem;

    /**
     * @var SessionCleanerInterface
     */
    private $sessionCleaner;

    /**
     * @var AccountConfirmation
     */
    private $accountConfirmation;

    /**
     * @var Url
     */
    private Url $customerUrl;

    /**
     * @param Context $context
     * @param Session $customerSession
     * @param AccountManagementInterface $accountManagement
     * @param CustomerRepositoryInterface $customerRepository
     * @param Validator $formKeyValidator
     * @param CustomerExtractor $customerExtractor
     * @param Escaper|null $escaper
     * @param AddressRegistry|null $addressRegistry
     * @param Filesystem|null $filesystem
     * @param SessionCleanerInterface|null $sessionCleaner
     * @param AccountConfirmation|null $accountConfirmation
     * @param Url|null $customerUrl
     */
    public function __construct(
        Context                     $context,
        Session                     $customerSession,
        AccountManagementInterface  $accountManagement,
        CustomerRepositoryInterface $customerRepository,
        Validator                   $formKeyValidator,
        CustomerExtractor           $customerExtractor,
        ?Escaper                    $escaper = null,
        ?AddressRegistry            $addressRegistry = null,
        ?Filesystem                 $filesystem = null,
        ?SessionCleanerInterface    $sessionCleaner = null,
        ?AccountConfirmation        $accountConfirmation = null,
        ?Url                        $customerUrl = null
    )
    {
        $this->escaper = $escaper ?: ObjectManager::getInstance()->get(Escaper::class);
        $this->addressRegistry = $addressRegistry ?: ObjectManager::getInstance()->get(AddressRegistry::class);
        $this->filesystem = $filesystem ?: ObjectManager::getInstance()->get(Filesystem::class);
        $this->sessionCleaner = $sessionCleaner ?: ObjectManager::getInstance()->get(SessionCleanerInterface::class);
        $this->accountConfirmation = $accountConfirmation ?: ObjectManager::getInstance()->get(AccountConfirmation::class);
        $this->customerUrl = $customerUrl ?: ObjectManager::getInstance()->get(Url::class);

        parent::__construct(
            $context,
            $customerSession,
            $accountManagement,
            $customerRepository,
            $formKeyValidator,
            $customerExtractor,
            $escaper,
            $addressRegistry,
            $filesystem,
            $sessionCleaner,
            $accountConfirmation,
            $customerUrl
        );
    }

    /**
     * Get authentication
     *
     * @return AuthenticationInterface
     */
    private function getAuthentication()
    {

        if (!($this->authentication instanceof AuthenticationInterface)) {
            return ObjectManager::getInstance()->get(AuthenticationInterface::class);
        } else {
            return $this->authentication;
        }
    }

    /**
     * Get email notification
     *
     * @return EmailNotificationInterface
     */
    private function getEmailNotification()
    {
        if (!($this->emailNotification instanceof EmailNotificationInterface)) {
            return ObjectManager::getInstance()->get(EmailNotificationInterface::class);
        } else {
            return $this->emailNotification;
        }
    }

    /**
     * Change customer email or password action
     *
     * @return Redirect
     * @SuppressWarnings(PHPMD.CyclomaticComplexity)
     * @throws SessionException
     */
    public function execute()
    {
        $resultRedirect = $this->resultRedirectFactory->create();
        $validFormKey = $this->formKeyValidator->validate($this->getRequest());

        if ($validFormKey && $this->getRequest()->isPost()) {
            $customer = $this->getCustomerDataObject($this->session->getCustomerId());
            $customerCandidate = $this->populateNewCustomerDataObject($this->_request, $customer);

            $attributeToDelete = $this->_request->getParam('delete_attribute_value');
            if ($attributeToDelete !== null) {
                $this->deleteCustomerFileAttribute($customerCandidate, $attributeToDelete);
            }

            try {
                // whether a customer enabled change email option
                $isEmailChanged = $this->processChangeEmailRequest($customer);

                // whether a customer enabled change password option
                $isPasswordChanged = $this->changeCustomerPassword($customer->getEmail());

                // No need to validate customer address while editing customer profile
                $this->disableAddressValidation($customerCandidate);

                $this->customerRepository->save($customerCandidate);
                $updatedCustomer = $this->customerRepository->getById($customerCandidate->getId());

                $this->getEmailNotification()->credentialsChanged(
                    $updatedCustomer,
                    $customer->getEmail(),
                    $isPasswordChanged
                );

                $this->dispatchSuccessEvent($updatedCustomer);
                $this->session->setSuccessMessage($this->escaper->escapeHtml(__('You saved the account information.')));
                // logout from current session if password or email changed.
                if ($isPasswordChanged || $isEmailChanged) {
                    $this->session->logout();
                    $this->session->start();
                    $this->addComplexSuccessMessage($customer, $updatedCustomer);

                    return $resultRedirect->setPath('customer/account/login');
                }
                return $resultRedirect->setPath('customer/account');
            } catch (InvalidEmailOrPasswordException $e) {
                $key = $e->getCode() === 1 ? 'email_current_password': 'current_password';
                $this->session->setErrorMessage([
                    $key => $this->escaper->escapeHtml($e->getMessage())
                ]);
            } catch (UserLockedException $e) {
                $message = __(
                    'The account sign-in was incorrect or your account is disabled temporarily. '
                    . 'Please wait and try again later.'
                );
                $this->session->logout();
                $this->session->start();
                $this->session->setErrorMessage(['general' => $message]);

                return $resultRedirect->setPath('customer/account/login');
            } catch (InputException $e) {
                $this->session->setErrorMessage(['general' => $this->escaper->escapeHtml($e->getMessage())]);
                foreach ($e->getErrors() as $error) {
                    $this->session->setErrorMessage([
                        $error->getFieldName() => $this->escaper->escapeHtml($error->getMessage())
                    ]);
                }
            } catch (LocalizedException $e) {
                $this->session->setErrorMessage(['general' => $e->getMessage()]);
            } catch (\Exception $e) {
                $this->session->setErrorMessage([
                    'general' => __('We can\'t save the customer.')
                ]);
            }

            $this->session->setCustomerFormData($this->getRequest()->getPostValue());
        }

        $resultRedirect = $this->resultRedirectFactory->create();
        $resultRedirect->setPath('*/*/edit');

        return $resultRedirect;
    }


    /**
     * Adds a complex success message if email confirmation is required
     *
     * @param CustomerInterface $outdatedCustomer
     * @param CustomerInterface $updatedCustomer
     * @throws LocalizedException
     */
    private function addComplexSuccessMessage(
        CustomerInterface $outdatedCustomer,
        CustomerInterface $updatedCustomer
    ): void {
        if (($outdatedCustomer->getEmail() !== $updatedCustomer->getEmail()) && $this->accountConfirmation->isCustomerEmailChangedConfirmRequired($updatedCustomer)) {
            $url = $this->customerUrl->getEmailConfirmationUrl($updatedCustomer->getEmail());
            $msg = __('You must confirm your account. Please check your email for the confirmation link or <a href="%1" x-element-transition-trigger>click here</a> for a new link.', $url);
            $this->session->setSuccessMessage($this->escaper->escapeHtml($msg, ['a']));
        }
    }

    /**
     * Account editing action completed successfully event
     *
     * @param CustomerInterface $customerCandidateDataObject
     * @return void
     */
    private function dispatchSuccessEvent(CustomerInterface $customerCandidateDataObject)
    {
        $this->_eventManager->dispatch(
            'customer_account_edited',
            ['email' => $customerCandidateDataObject->getEmail()]
        );
    }

    /**
     * Get customer data object
     *
     * @param int $customerId
     *
     * @return CustomerInterface
     * @throws LocalizedException
     * @throws NoSuchEntityException
     */
    private function getCustomerDataObject($customerId)
    {
        return $this->customerRepository->getById($customerId);
    }

    /**
     * Create Data Transfer Object of customer candidate
     *
     * @param RequestInterface $inputData
     * @param CustomerInterface $currentCustomerData
     * @return CustomerInterface
     */
    private function populateNewCustomerDataObject(
        RequestInterface $inputData,
        CustomerInterface $currentCustomerData
    ) {
        $attributeValues = $this->getCustomerMapper()->toFlatArray($currentCustomerData);
        $customerDto = $this->customerExtractor->extract(
            self::FORM_DATA_EXTRACTOR_CODE,
            $inputData,
            $attributeValues
        );
        $customerDto->setId($currentCustomerData->getId());
        if (!$customerDto->getAddresses()) {
            $customerDto->setAddresses($currentCustomerData->getAddresses());
        }
        if (!$inputData->getParam('change_email')) {
            $customerDto->setEmail($currentCustomerData->getEmail());
        }

        return $customerDto;
    }

    /**
     * Process change email request
     *
     * @param CustomerInterface $currentCustomerDataObject
     * @return bool
     */
    private function processChangeEmailRequest(CustomerInterface $currentCustomerDataObject)
    {
        if ($this->getRequest()->getParam('change_email')) {
            // authenticate user for changing email
            try {
                $this->getAuthentication()->authenticate(
                    $currentCustomerDataObject->getId(),
                    $this->getRequest()->getPost('current_password')
                );
                $this->sessionCleaner->clearFor((int) $currentCustomerDataObject->getId());
                return true;
            } catch (InvalidEmailOrPasswordException $e) {
                throw new InvalidEmailOrPasswordException(
                    __("The password doesn't match this account. Verify the password and try again."),
                    null,
                    1
                );
            }
        }
        return false;
    }

    /**
     * Get Customer Mapper instance
     *
     * @return Mapper
     */
    private function getCustomerMapper()
    {
        if ($this->customerMapper === null) {
            $this->customerMapper = ObjectManager::getInstance()->get(Mapper::class);
        }
        return $this->customerMapper;
    }

    /**
     * Disable Customer Address Validation
     *
     * @param CustomerInterface $customer
     * @throws NoSuchEntityException
     */
    private function disableAddressValidation($customer)
    {
        foreach ($customer->getAddresses() as $address) {
            $addressModel = $this->addressRegistry->retrieve($address->getId());
            $addressModel->setShouldIgnoreValidation(true);
        }
    }

    /**
     * Removes file attribute from customer entity and file from filesystem
     *
     * @param CustomerInterface $customerCandidateDataObject
     * @param string $attributeToDelete
     * @return void
     * @throws FileSystemException
     */
    private function deleteCustomerFileAttribute(
        CustomerInterface $customerCandidateDataObject,
        string $attributeToDelete
    ) : void {
        if ($attributeToDelete !== '') {
            if (strpos($attributeToDelete, ',') !== false) {
                $attributes = explode(',', $attributeToDelete);
            } else {
                $attributes[] = $attributeToDelete;
            }
            foreach ($attributes as $attr) {
                $attributeValue = $customerCandidateDataObject->getCustomAttribute($attr);
                if ($attributeValue!== null) {
                    if ($attributeValue->getValue() !== '') {
                        $mediaDirectory = $this->filesystem->getDirectoryWrite(DirectoryList::MEDIA);
                        $fileName = $attributeValue->getValue();
                        $path = $mediaDirectory->getAbsolutePath('customer' . $fileName);
                        if ($fileName && $mediaDirectory->isFile($path)) {
                            $mediaDirectory->delete($path);
                        }
                        $customerCandidateDataObject->setCustomAttribute(
                            $attr,
                            ''
                        );
                    }
                }
            }
        }
    }
}
