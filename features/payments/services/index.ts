/**
 * @module features/payments/services
 */
export { applySuccessfulFunding } from "@/features/payments/services/funding";
export {
  createDomainPaymentIntent,
  handlePaymentWebhook,
  verifyAndCompletePayment,
} from "@/features/payments/services/payment-platform";
