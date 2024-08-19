<?php

namespace Satoshi\Theme\Block;

use Magento\Cms\Block\Page as CorePage;
use Magento\Cms\Model\Page;
use Magento\Framework\Exception\NoSuchEntityException;
use Magento\Framework\View\Element\Template\Context;
use Magento\Cms\Model\Template\FilterProvider;
use Magento\Cms\Model\PageFactory;
use Magento\Store\Model\StoreManagerInterface;
use Magento\Framework\View\Page\Config;

class CustomCmsPage extends CorePage
{
    public function __construct(
        Context $context,
        FilterProvider $filterProvider,
        StoreManagerInterface $storeManager,
        PageFactory $pageFactory,
        Config $pageConfig,
        array $data = []
    ) {
        parent::__construct(
            $context,
            $pageFactory->create(),
            $filterProvider,
            $storeManager,
            $pageFactory,
            $pageConfig,
            $data
        );
    }

    public function getPageId()
    {
        return $this->getRequest()->getParam('page_id', $this->_scopeConfig->getValue('web/default/cms_home_page', \Magento\Store\Model\ScopeInterface::SCOPE_STORE));
    }

    /**
     * Retrieve the CMS Page instance.
     *
     * @return Page
     * @throws NoSuchEntityException
     */
    public function getPage()
    {
        if (!$this->hasData('page')) {
            $pageId = $this->getPageId();
            $page = $this->_pageFactory->create();
            $page->setStoreId($this->_storeManager->getStore()->getId())->load($pageId);
            $this->setData('page', $page);
        }

        return $this->getData('page');
    }
}
