<?php

declare(strict_types=1);

namespace Satoshi\SatoshiUi\Model\Filter;

use Magento\PageBuilder\Model\Filter\Template as SourceTemplate;
use Satoshi\Core\Helper\IsThemeActive;
use Satoshi\SatoshiUi\Model\Filter\TemplateCustom;
use Magento\Framework\ObjectManagerInterface;
use Psr\Log\LoggerInterface;
use Magento\Framework\View\ConfigInterface;
use Magento\Framework\Math\Random;
use Magento\Framework\Serialize\Serializer\Json;

class Template extends SourceTemplate
{
    /**
     * @var IsThemeActive
     */
    private IsThemeActive $isThemeActive;

    /**
     * @var ObjectManagerInterface
     */
    private ObjectManagerInterface $objectManager;

    /**
     * @var TemplateCustom|null
     */
    private ?TemplateCustom $customTemplate = null;

    /**
     * @var SourceTemplate|null
     */
    private ?SourceTemplate $defaultTemplate = null;

    /**
     * @param LoggerInterface $logger
     * @param ConfigInterface $viewConfig
     * @param Random $mathRandom
     * @param Json $json
     * @param IsThemeActive $isThemeActive
     * @param ObjectManagerInterface $objectManager
     */
    public function __construct(
        LoggerInterface $logger,
        ConfigInterface $viewConfig,
        Random $mathRandom,
        Json $json,
        IsThemeActive $isThemeActive,
        ObjectManagerInterface $objectManager
    ) {
        $this->isThemeActive = $isThemeActive;
        $this->objectManager = $objectManager;

        // Pass required arguments to parent constructor
        parent::__construct($logger, $viewConfig, $mathRandom, $json);
    }

    /**
     * Filter method that conditionally delegates to custom or default implementation
     */
    public function filter(string $result): string
    {
        // If Satoshi theme is active, use custom implementation
        if ($this->isThemeActive->isSatoshiTheme()) {
            return $this->getCustomTemplate()->filter($result);
        }

        // Otherwise, use default Magento implementation
        return $this->getDefaultTemplate()->filter($result);
    }

    /**
     * Get custom template instance
     */
    private function getCustomTemplate(): TemplateCustom
    {
        if ($this->customTemplate === null) {
            $this->customTemplate = $this->objectManager->create(TemplateCustom::class);
        }
        return $this->customTemplate;
    }

    /**
     * Get default template instance
     */
    private function getDefaultTemplate(): SourceTemplate
    {
        if ($this->defaultTemplate === null) {
            $this->defaultTemplate = $this->objectManager->create(SourceTemplate::class);
        }
        return $this->defaultTemplate;
    }
}
