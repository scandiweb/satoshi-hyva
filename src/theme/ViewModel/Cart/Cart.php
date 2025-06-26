<?php
declare(strict_types=1);

namespace Satoshi\Theme\ViewModel\Cart;

use Magento\Checkout\Model\Session;
use Magento\Framework\App\Config\ScopeConfigInterface;
use Magento\Framework\Exception\LocalizedException;
use Magento\Framework\Exception\NoSuchEntityException;
use Magento\Framework\Serialize\Serializer\JsonHexTag;
use Magento\Framework\View\Element\Block\ArgumentInterface;
use Magento\Quote\Api\CartRepositoryInterface;
use Magento\Quote\Api\CartTotalRepositoryInterface;
use Magento\Quote\Api\ShippingMethodManagementInterface as ShippingMethodManager;
use Magento\Tax\Model\Config;

class Cart implements ArgumentInterface
{
    /**
     * @var Session
     */
    protected $checkoutSession;

    /**
     * @var CartTotalRepositoryInterface
     */
    protected $cartTotalRepository;

    /**
     * @var ScopeConfigInterface
     */
    protected $scopeConfig;

    /**
     * @var JsonHexTag
     */
    protected $jsonHexTagSerializer;

    /**
     * @var Config
     */
    protected $taxConfig;

    /**
     * @var CartRepositoryInterface
     */
    protected $quoteRepository;

    /**
     * @var ShippingMethodManager
     */
    protected $shippingMethodManager;

    /**
     * @param Session $checkoutSession
     * @param CartTotalRepositoryInterface $cartTotalRepository
     * @param ScopeConfigInterface $scopeConfig
     * @param JsonHexTag $jsonHexTagSerializer
     * @param Config $taxConfig
     * @param CartRepositoryInterface $quoteRepository
     * @param ShippingMethodManager $shippingMethodManager
     */
    public function __construct(
        Session $checkoutSession,
        CartTotalRepositoryInterface $cartTotalRepository,
        ScopeConfigInterface $scopeConfig,
        JsonHexTag $jsonHexTagSerializer,
        Config $taxConfig,
        CartRepositoryInterface $quoteRepository,
        ShippingMethodManager $shippingMethodManager,
    ) {
        $this->checkoutSession = $checkoutSession;
        $this->cartTotalRepository = $cartTotalRepository;
        $this->scopeConfig = $scopeConfig;
        $this->jsonHexTagSerializer = $jsonHexTagSerializer;
        $this->taxConfig = $taxConfig;
        $this->quoteRepository = $quoteRepository;
        $this->shippingMethodManager = $shippingMethodManager;
    }

    /**
     * @return float|mixed|null
     * @throws LocalizedException
     * @throws NoSuchEntityException
     */
    public function getCartItemsQty() {
        return $this->checkoutSession->getQuote()->getItemsQty();
    }

    /**
     * @return array
     * @throws LocalizedException
     * @throws NoSuchEntityException
     */
    public function getCartTotals(): array
    {
        if (!$this->getCartItemsQty()) {
            return [];
        }

        $totalsSort = $this->scopeConfig->getValue('sales/totals_sort', 'store');

        /** @var \Magento\Quote\Api\Data\TotalsInterface $totals */
        $totals = $this->cartTotalRepository->get($this->checkoutSession->getQuote()->getId());
        $totalSegmentsData = [];
        /** @var \Magento\Quote\Model\Cart\TotalSegment $totalSegment */
        foreach ($totals->getTotalSegments() as $totalSegment) {
            $totalSegmentArray = $totalSegment->toArray();
            if (is_object($totalSegment->getExtensionAttributes())) {
                $totalSegmentArray['extension_attributes'] = $totalSegment->getExtensionAttributes()->__toArray();
            }
            $totalSegmentsData[] = $totalSegmentArray;
        }

        // Sort segments according Stores > Configuration > Sales > Sales > Checkout Totals Sort Order
        usort($totalSegmentsData, function($a, $b) use ($totalsSort) {
            $valueA = isset($totalsSort[$a['code']]) ? $totalsSort[$a['code']] : 0;
            $valueB = isset($totalsSort[$b['code']]) ? $totalsSort[$b['code']] : 0;
            return $valueA - $valueB;
        });

        $totals->setTotalSegments($totalSegmentsData);
        $totalsArray = $totals->toArray();
        if (is_object($totals->getExtensionAttributes())) {
            $totalsArray['extension_attributes'] = $totals->getExtensionAttributes()->__toArray();
        }

        $quote = $this->quoteRepository->get($this->checkoutSession->getQuote()->getId());
        $totalsArray['is_virtual'] = $quote->getIsVirtual();
        $totalsArray['review_totals_display_mode'] = $this->getReviewTotalsDisplayMode();
        $totalsArray['review_shipping_display_mode'] = $this->getDisplayShippingMode();
        $totalsArray['include_tax_in_grand_total'] = $this->taxConfig->displayCartTaxWithGrandTotal();
        $totalsArray['selected_shipping_method'] = $this->getSelectedShippingMethod();
        $totalsArray['is_zero_tax_displayed'] = $this->taxConfig->displayCartZeroTax();
        $totalsArray['is_full_tax_summary_displayed'] = $this->taxConfig->displayCartZeroTax();
        return $totalsArray;
    }

    /**
     * @return bool|string
     * @throws LocalizedException
     * @throws NoSuchEntityException
     */
    public function getSerializedCartTotals()
    {
        return $this->jsonHexTagSerializer->serialize($this->getCartTotals());
    }

    /**
     * Get review item price display mode
     *
     * @return string 'both', 'including', 'excluding'
     */
    public function getReviewTotalsDisplayMode()
    {
        if ($this->taxConfig->displayCartSubtotalBoth()) {
            return 'both';
        }
        if ($this->taxConfig->displayCartSubtotalExclTax()) {
            return 'excluding';
        }
        return 'including';
    }

    /**
     * Shipping mode: 'both', 'including', 'excluding'
     *
     * @return string
     */
    public function getDisplayShippingMode()
    {
        if ($this->taxConfig->displayCartShippingBoth()) {
            return 'both';
        }
        if ($this->taxConfig->displayCartShippingExclTax()) {
            return 'excluding';
        }
        return 'including';
    }

    /**
     * Retrieve selected shipping method
     *
     * @return array|null
     */
    protected function getSelectedShippingMethod()
    {
        $shippingMethodData = null;
        try {
            $quoteId = $this->checkoutSession->getQuote()->getId();
            $shippingMethod = $this->shippingMethodManager->get($quoteId);
            if ($shippingMethod) {
                $shippingMethodData = $shippingMethod->__toArray();
            }
        } catch (\Exception $exception) {
            $shippingMethodData = null;
        }
        return $shippingMethodData;
    }

}
