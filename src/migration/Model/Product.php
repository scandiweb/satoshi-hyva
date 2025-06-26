<?php

namespace Satoshi\Migration\Model;

use Magento\Framework\Component\ComponentRegistrar;
use Magento\Framework\Filesystem\Directory\ReadFactory;
use Magento\ImportExport\Model\Import;
use Magento\ImportExport\Model\Import\ErrorProcessing\ProcessingErrorAggregatorInterface;

/**
 * Setup configurable product
 */
class Product
{
    /**
     * @var Import
     */
    private $importModel;

    /**
     * @var \Magento\ImportExport\Model\Import\Source\CsvFactory
     */
    private $csvSourceFactory;

    /**
     * @var \Magento\Framework\Filesystem\Directory\ReadFactory
     */
    private $readFactory;

    /**
     * @var \Magento\Indexer\Model\Indexer\CollectionFactory
     */
    private $indexerCollectionFactory;

    /**
     * @var \Magento\Framework\Component\ComponentRegistrar
     */
    private $componentRegistrar;

    /**
     * @var \Magento\Eav\Model\Config
     */
    private $eavConfig;

    /**
     * @param \Magento\Eav\Model\Config $eavConfig
     * @param Import $importModel
     * @param \Magento\ImportExport\Model\Import\Source\CsvFactory $csvSourceFactory
     * @param \Magento\Indexer\Model\Indexer\CollectionFactory $indexerCollectionFactory
     * @param \Magento\Framework\Filesystem\Directory\ReadFactory $readFactory
     * @param \Magento\Framework\Component\ComponentRegistrar $componentRegistrar
     */
    public function __construct(
        \Magento\Eav\Model\Config                            $eavConfig,
        Import                                               $importModel,
        \Magento\ImportExport\Model\Import\Source\CsvFactory $csvSourceFactory,
        \Magento\Indexer\Model\Indexer\CollectionFactory     $indexerCollectionFactory,
        \Magento\Framework\Filesystem\Directory\ReadFactory  $readFactory,
        \Magento\Framework\Component\ComponentRegistrar      $componentRegistrar,
        protected \Psr\Log\LoggerInterface                   $logger
    )
    {
        $this->eavConfig = $eavConfig;
        $this->importModel = $importModel;
        $this->csvSourceFactory = $csvSourceFactory;
        $this->indexerCollectionFactory = $indexerCollectionFactory;
        $this->readFactory = $readFactory;
        $this->componentRegistrar = $componentRegistrar;
    }

    /**
     * @inheritdoc
     */
    public function install()
    {
        $this->eavConfig->clear();
        /** @var Import $importModel */
        $importModel = $this->importModel;
        $importModel->setData(
            [
                'entity' => 'catalog_product',
                'behavior' => 'append',
                'import_images_file_dir' => '',
                Import::FIELD_NAME_VALIDATION_STRATEGY =>
                    ProcessingErrorAggregatorInterface::VALIDATION_STRATEGY_SKIP_ERRORS
            ]
        );


        $source = $this->csvSourceFactory->create(
            [
                'file' => 'fixtures/products.csv',
                'directory' => $this->readFactory->create(
                    $this->componentRegistrar->getPath(ComponentRegistrar::MODULE, 'Satoshi_Migration')
                )
            ]
        );

        $currentPath = getcwd();
        chdir(BP);
        $importModel->validateSource($source);
        $importModel->importSource();
        $this->logger->info('xxx err count' . $importModel->getErrorAggregator()->getErrorsCount());
        $this->logger->log('600', print_r($importModel->getErrorAggregator()->getAllErrors(), true));

        chdir($currentPath);

        $this->eavConfig->clear();
    }
}
