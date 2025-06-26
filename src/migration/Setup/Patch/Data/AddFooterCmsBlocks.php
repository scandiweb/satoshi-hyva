<?php

namespace Satoshi\Migration\Setup\Patch\Data;

use Magento\Cms\Model\BlockFactory;
use Magento\Framework\Filesystem\DirectoryList;
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
     * @var DirectoryList
     */
    private $directoryList;

    /**
     * Constructor
     *
     * @param BlockFactory $blockFactory
     * @param ModuleDataSetupInterface $moduleDataSetup
     * @param DirectoryList $directoryList
     */
    public function __construct(
        BlockFactory $blockFactory,
        ModuleDataSetupInterface $moduleDataSetup,
        DirectoryList $directoryList
    ) {
        $this->blockFactory = $blockFactory;
        $this->moduleDataSetup = $moduleDataSetup;
        $this->directoryList = $directoryList;
    }

    /**
     * Apply Data Patch
     */
    public function apply()
    {
        $this->moduleDataSetup->getConnection()->startSetup();

        $basePath = $this->directoryList->getRoot() . '/app/code/Satoshi/Migration/view/data/html/cms/block/';

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

    public function getVersion()
    {

    }
}
