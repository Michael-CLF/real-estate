NAVSTREET TEXAS COMPLETE CHANGE BATCH
=====================================

Where this ZIP belongs
----------------------
Extract the ZIP into the root of your existing real-estate project: the folder that already contains package.json, firebase.json, src, and functions.

Windows PowerShell (run from the parent folder of your real-estate project):

  Expand-Archive -Path .\navstreet-texas-complete-change-batch.zip -DestinationPath .\real-estate -Force

This preserves the existing folder names and overwrites only the files listed below. It does not rename the Texas folder, the offer-wizard folder, or any North Carolina file.

Files replaced or added
-----------------------
firebase.json
firestore.rules
storage.rules

src/app/core/configuration/state-disclosures.config.ts
src/app/core/domains/disclosures/state-disclosure-requirement.model.ts
src/app/core/domains/listings/models/listing.model.ts
src/app/core/domains/listings/services/listing.service.ts
src/app/core/domains/offers/repositories/firestore-offer.repository.ts

src/app/features/offers/engine/offer-wizard-shell/offer-wizard-shell.component.ts
src/app/features/offers/engine/offer-wizard-shell/offer-wizard-shell.component.html
src/app/features/offers/engine/offer-wizard-shell/offer-wizard-shell.component.scss

src/app/features/offers/states/texas/contract-selection/texas-contract-selection.component.ts
src/app/features/offers/states/texas/contract-selection/texas-contract-selection.component.html
src/app/features/offers/states/texas/contracts/one-to-four-family-resale/one-to-four-family-resale.sections.ts
src/app/features/offers/states/texas/offer-wizard/offer-wizard.component.ts
src/app/features/offers/states/texas/offer-wizard/offer-wizard.component.html
src/app/features/offers/states/texas/questions/texas-shared-question-definitions.ts
src/app/features/offers/states/texas/texas-offer-entry/texas-offer-entry.component.ts
src/app/features/offers/states/texas/validators/texas-offer.validator.ts

src/app/features/sell/listing-wizard/listing-wizard.component.ts
src/app/features/sell/listing-wizard/listing-wizard.component.html
src/app/features/sell/listing-wizard/components/property-details-step/property-details-step.component.ts
src/app/features/sell/listing-wizard/components/property-details-step/property-details-step.component.html

functions/src/offers/create-offer-draft.ts
functions/src/offers/save-offer-draft.ts
functions/src/offers/state-contracts/texas/texas-initial-terms.ts
functions/src/offers/state-contracts/texas/validators/texas-shared-submission.validator.ts
functions/src/payments/stripe-payment-webhook.ts

What this batch changes
-----------------------
1. Replaces the old 14-step Texas order with the agreed 11-step order.
2. Adds delayed validation: untouched sections remain neutral; errors appear only after Continue is attempted.
3. Completed sections use a green circle and white check mark.
4. Uses a two-column desktop layout and one-column mobile layout.
5. Saves the entire page when Continue is clicked instead of saving every field.
6. Makes escrow-agent and title-company name/address fields optional in both frontend and backend validation.
7. Fixes the shared backend save function so Texas terms are sanitized by the Texas package instead of the North Carolina deposit structure.
8. Fixes dashboard offer summaries so both NC purchase prices and TX sales prices load safely.
9. Allows one optional co-buyer on the first buyer offer.
10. Adds an optional co-seller to the seller listing flow and carries that signer into new offers.
11. Adds Texas legal-description fields to the seller listing flow and carries them into new offers.
12. Adds the Texas Seller's Disclosure Notice to the existing seller disclosure manager.
13. Removes duplicate buyer uploads of seller disclosure documents; the buyer records received/not-received status.
14. Updates Firestore and Storage rules for the Texas disclosure and Texas offer attachment types.

Build and deployment
--------------------
From the real-estate project root:

  npm run build
  npm --prefix functions run build
  firebase deploy --only functions
  firebase deploy --only firestore:rules,storage

Then deploy the Angular output from:

  dist/template/browser

Testing notes
-------------
1. Hard-refresh the browser after deploying.
2. The existing Sugar Land listing can be used to retest the buyer offer flow.
3. Seller-entered lot, block, subdivision, legal description, and co-seller fields apply to listings saved after this batch. Existing published listings do not acquire information that was never stored.
4. An existing Texas offer draft can be resumed, but create a fresh draft if you need to verify newly added listing or co-seller data.
5. Verify dashboard offers load without the purchasePriceInCents console error.
6. Verify Continue performs one save request per completed page, not one request per field.

Verification performed before packaging
---------------------------------------
Angular production build: PASSED
Functions TypeScript compile: PASSED
