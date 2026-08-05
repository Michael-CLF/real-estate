export const LISTING_WORKFLOW_CONFIG = {
  /*
   * TEMPORARY DEVELOPMENT BYPASS
   *
   * Allows completed listings to become active before
   * Stripe Identity and Stripe Payments are implemented.
   *
   * IMPORTANT:
   * This does not mark identity as verified or payment
   * as completed. It only allows publication during
   * development.
   *
   * Set this to false when the real Stripe workflow
   * is implemented.
   */
  bypassIdentityAndPayment: true
} as const;