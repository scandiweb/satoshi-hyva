<?php

namespace Satoshi\Migration\Setup\Patch\Data;

use Magento\Framework\Setup\Patch\DataPatchInterface;
use Magento\Cms\Model\BlockFactory;
use Magento\Framework\Filesystem\DirectoryList;
use Magento\Framework\File\Csv as FileCsv;
use Magento\Framework\App\ResourceConnection;
use Magento\Framework\Setup\ModuleDataSetupInterface;

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

        $cmsBlocks = [
            [
                'title' => 'Apparel',
                'identifier' => 'footer-content-1',
                'content' => file_get_contents($basePath . 'footer-content-1.html'),
                'is_active' => 1,
                'stores' => [0]
            ],
            [
                'title' => 'Cosmetics',
                'identifier' => 'footer-content-2',
                'content' => file_get_contents($basePath . 'footer-content-2.html'),
                'is_active' => 1,
                'stores' => [0]
            ],
            [
                'title' => 'Follow us',
                'identifier' => 'footer-content-3',
                'content' => file_get_contents($basePath . 'footer-content-3.html'),
                'is_active' => 1,
                'stores' => [0]
            ]
        ];

        foreach ($cmsBlocks as $data) {
            $this->blockFactory->create()->setData($data)->save();
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
}
