<?php

namespace Satoshi\Theme\Block\Html;

use Magento\Cms\Api\BlockRepositoryInterface;
use Magento\Framework\App\Http\Context as HttpContext;
use Magento\Framework\Exception\LocalizedException;
use Magento\Framework\Exception\NoSuchEntityException;
use Magento\Framework\View\Element\Template\Context;
use Magento\Theme\Block\Html\Footer as SourceFooter;

class Footer extends SourceFooter
{
    /**
     * @var BlockRepositoryInterface
     */
    protected $blockRepository;

    /**
     * @param Context $context
     * @param HttpContext $httpContext
     * @param BlockRepositoryInterface $blockRepository
     * @param array $data
     */
    public function __construct(
        Context $context,
        HttpContext $httpContext,
        BlockRepositoryInterface $blockRepository,
        array $data = []
    ) {
        $this->blockRepository = $blockRepository;
        parent::__construct($context, $httpContext, $data);
    }

    /**
     * Check if the CMS block is available and enabled
     *
     * @param string $id
     *
     * @return bool
     * @throws LocalizedException
     */
    public function getIsCmsBlockAvailable(string $id)
    {
        try {
            $cmsBlock = $this->blockRepository->getById($id);
            return $cmsBlock->isActive();
        } catch (NoSuchEntityException $e) {
            return false;
        }
    }

    /**
     * Detect if we are on the homepage
     *
     * @return bool
     */
    public function getIsHomePage()
    {
        $fullActionName = $this->getRequest()->getFullActionName();
        return $fullActionName == 'cms_index_index';
    }
}
