<?php

declare(strict_types=1);

namespace Satoshi\Theme\Controller\Language;

use Magento\Framework\App\ActionInterface;
use Magento\Framework\App\RequestInterface;
use Magento\Framework\Controller\ResultFactory;
use Magento\Store\Model\StoreManagerInterface;
use Magento\Framework\App\ResourceConnection;
use Magento\Framework\App\Cache\TypeListInterface;
use Magento\Framework\App\Cache\Frontend\Pool;

class UpdateDefaultStore implements ActionInterface
{
    protected StoreManagerInterface $storeManager;
    protected ResourceConnection $resource;
    protected RequestInterface $request;
    protected ResultFactory $resultFactory;
    protected TypeListInterface $cacheTypeList;
    protected Pool $cacheFrontendPool;

    public function __construct(
        StoreManagerInterface $storeManager,
        ResourceConnection $resource,
        RequestInterface $request,
        ResultFactory $resultFactory,
        TypeListInterface $cacheTypeList,
        Pool $cacheFrontendPool
    ) {
        $this->storeManager = $storeManager;
        $this->resource = $resource;
        $this->request = $request;
        $this->resultFactory = $resultFactory;
        $this->cacheTypeList = $cacheTypeList;
        $this->cacheFrontendPool = $cacheFrontendPool;
    }

    public function execute()
    {
        $languageCode = $this->request->getParam('language_code');
        $store = $this->storeManager->getStore($languageCode);

        if ($store) {
            // Update default store in the store_group table
            $connection = $this->resource->getConnection();
            $tableName = $connection->getTableName('store_group');

            $connection->update(
                $tableName,
                ['default_store_id' => $store->getId()],
                ['group_id = ?' => $store->getGroupId()]
            );

            // Invalidate and clean relevant cache types
            $this->cacheTypeList->invalidate(['config', 'full_page']);
            foreach ($this->cacheFrontendPool as $cacheFrontend) {
                $cacheFrontend->getBackend()->clean();
            }

            // Redirect back to the current page or another page
            return $this->resultFactory->create(ResultFactory::TYPE_REDIRECT)->setUrl($store->getBaseUrl());
        }

        return $this->resultFactory->create(ResultFactory::TYPE_REDIRECT)->setPath('/');
    }
}
