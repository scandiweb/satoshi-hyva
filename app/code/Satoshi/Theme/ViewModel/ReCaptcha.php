<?php

namespace Satoshi\Theme\ViewModel;

use Hyva\Theme\ViewModel\ReCaptcha as SourceReCaptcha;
use Magento\Framework\App\Config\ScopeConfigInterface;
use Magento\Framework\Module\ModuleListInterface;
use Magento\Framework\ObjectManagerInterface;
use Magento\Framework\View\LayoutInterface;
use Magento\ReCaptchaUi\Model\IsCaptchaEnabledInterface;
use Magento\Store\Model\ScopeInterface;

class ReCaptcha extends SourceReCaptcha
{
    public const XML_CONFIG_PATH_TYPE_RECAPTCHA_PUBLIC_KEY = 'recaptcha_frontend/type_recaptcha/public_key';
    public const XML_CONFIG_PATH_TYPE_INVISIBLE_PUBLIC_KEY = 'recaptcha_frontend/type_invisible/public_key';
    public const XML_CONFIG_PATH_TYPE_RECAPTCHA_V3_PUBLIC_KEY = 'recaptcha_frontend/type_recaptcha_v3/public_key';
    public const XML_CONFIG_PATH_RECAPTCHA_V2_INVISIBLE_BADGE_POSITION = 'recaptcha_frontend/type_invisible/position';

    /**
     * @var ScopeConfigInterface
     */
    private $scopeConfig;

    /**
     * @var ObjectManagerInterface
     */
    private $objectManager;

    /**
     * @var ModuleListInterface
     */
    private $moduleList;

    public function __construct(
        ScopeConfigInterface $scopeConfig,
        LayoutInterface $layout,
        ModuleListInterface  $moduleList,
        ObjectManagerInterface $objectManager,
        array $resultFieldNames = []
    ) {
        $this->scopeConfig = $scopeConfig;
        $this->moduleList = $moduleList;
        $this->objectManager = $objectManager;
        parent::__construct($scopeConfig, $layout, $moduleList, $objectManager, $resultFieldNames);
    }

    /**
     * Overridden to make the function public
     * @param string $formId
     * @return string|null One of 'recaptcha', 'invisible', 'recaptcha_v3', '' or null
     */
    public function getSelectedTypeForForm(string $formId): ?string
    {
        return $this->isCaptchaEnabledFor($formId)
            ? $this->scopeConfig->getValue(self::XML_CONFIG_PATH_RECAPTCHA . $formId, ScopeInterface::SCOPE_STORE)
            : null;
    }

    /**
     * Overridden to make the function public
     */
    public function isCaptchaEnabledFor(string $key): bool
    {
        if (! $this->moduleList->has('Magento_ReCaptchaUi')) {
            return false;
        }

        // At this place we know the module is installed and enabled, so we can reference the object.
        // We use the instance instead of accessing the store config directly so extensions using it
        // as a customization point work with Hyvä.
        return $this->objectManager->get(IsCaptchaEnabledInterface::class)->isCaptchaEnabledFor($key);
    }

    /**
     * Get reCAPTCHA site key (also known as public key or website key)
     * @param string $formId
     * @return string|null
     */
    public function getSiteKey(string $formId): ?string {
        $recaptchaType = $this->getSelectedTypeForForm($formId);

        switch ($recaptchaType) {
            case 'recaptcha':
                return $this->scopeConfig->getValue(self::XML_CONFIG_PATH_TYPE_RECAPTCHA_PUBLIC_KEY, ScopeInterface::SCOPE_STORE);
            case 'invisible':
                return $this->scopeConfig->getValue(self::XML_CONFIG_PATH_TYPE_INVISIBLE_PUBLIC_KEY, ScopeInterface::SCOPE_STORE);
            case 'recaptcha_v3':
                return $this->scopeConfig->getValue(self::XML_CONFIG_PATH_TYPE_RECAPTCHA_V3_PUBLIC_KEY, ScopeInterface::SCOPE_STORE);
            default:
                return null;
        }
    }

    /**
     * Get badge position of reCAPTCHA v2 invisible
     * @return string
     */
    public function getRecaptchaV2InvisibleBadgePosition()
    {
        return $this->scopeConfig->getValue(
            self::XML_CONFIG_PATH_RECAPTCHA_V2_INVISIBLE_BADGE_POSITION,
            ScopeInterface::SCOPE_STORE
        );
    }
}
