<?php

namespace Satoshi\Migration\Setup\Patch\Data;

use Magento\Cms\Model\BlockFactory;
use Magento\Framework\Component\ComponentRegistrar;
use Magento\Framework\Setup\ModuleDataSetupInterface;
use Magento\Framework\Setup\Patch\DataPatchInterface;

class AddFooterCmsBlocks implements DataPatchInterface
{
    /**
     * @var BlockFactory
     */
    private $blockFactory;

    /**
     * @var ModuleDataSetupInterface
     */
    private $moduleDataSetup;

    /**
     * @var ComponentRegistrar
     */
    private $componentRegistrar;

    /**
     * Constructor
     *
     * @param BlockFactory $blockFactory
     * @param ModuleDataSetupInterface $moduleDataSetup
     * @param ComponentRegistrar $componentRegistrar
     */
    public function __construct(
        BlockFactory $blockFactory,
        ModuleDataSetupInterface $moduleDataSetup,
        ComponentRegistrar $componentRegistrar
    ) {
        $this->blockFactory = $blockFactory;
        $this->moduleDataSetup = $moduleDataSetup;
        $this->componentRegistrar = $componentRegistrar;
    }

    /**
     * Apply Data Patch
     */
    public function apply()
    {
        $this->moduleDataSetup->getConnection()->startSetup();

        // Get the module path dynamically (works for both app/code and vendor locations)
        $modulePath = $this->componentRegistrar->getPath(ComponentRegistrar::MODULE, 'Satoshi_Migration');
        $basePath = $modulePath . '/view/data/html/cms/block/';

        // Check if the block already exists
        $existingBlock = $this->blockFactory->create()->load('footer', 'identifier');

        if (!$existingBlock->getId()) {
            $this->blockFactory->create()->setData([
                'title' => 'Footer',
                'identifier' => 'footer',
                'content' => file_get_contents($basePath . 'footer.html'),
                'is_active' => 1,
                'stores' => [0]
            ])->save();
        }

        $this->moduleDataSetup->getConnection()->endSetup();
    }

    /**
     * Get the list of dependencies
     *
     * @return array
     */
    public static function getDependencies()
    {
        return [];
    }

    /**
     * Get the list of aliases
     *
     * @return array
     */
    public function getAliases()
    {
        return [];
    }

    public function getVersion() {}
}
