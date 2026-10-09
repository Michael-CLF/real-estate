# NavStreet refactoring checkpoint

From the project root:

```powershell
node .\tools\navstreet-refactor\verify-refactor.cjs .
```

The command checks for all 27 verification scripts, compiles Functions from current source, and runs the checks sequentially. It stops on the first failure. It generates intentionally incomplete sample agreements under `tmp/navstreet-pdf-audit` and completed cash/financed fixture agreements under `tmp/navstreet-completed-contracts`; those samples may be deleted. Keep the verification scripts for future changes. Downloaded patches are not runtime dependencies and may be archived or deleted after installation.

The checks cover offer loading and draft saving, North Carolina mapping, listing package factories and validators, disclosure rules, backend document reads, contract integration, marketplace status queries, display and route registration, and PDF generation/page counts. Their mock and fixture comparisons preserve tested behavior; they do not replace browser or live Firebase testing. The command does not deploy.

## Current architectural limits

The overall refactoring is incomplete. Existing states have distinct contracts and rules; a shared look and feel does not make their contracts interchangeable.

- Offer entry and wizard orchestration still has state-specific wrappers and duplication. Review `src/app/features/offers/states` before expanding the workflow.
- Listing questions, form factories and selected validators use packages, but shared listing components still contain state-specific controls, visibility and restore/save handling. Review `src/app/features/sell/listing-wizard` and `src/app/features/dashboard/listing-edit`.
- Marketplace searches narrow public statuses but still fetch every listing in those statuses before substring filtering, sorting and pagination. Full bounded search needs a design that preserves results and total counts in `src/app/core/domains/marketplace/repositories/firestore-marketplace-listing.repository.ts`.
- The original PDF smoke checks use incomplete initial terms and pending signatures. Completed cash/financed initial/counteroffer fixtures now pass submission validators and render across all ten states. Additional contract types, long content, signed versions and attached disclosure records still need end-to-end verification.
- Photo rendering, upload concurrency, and production timing measurements remain to be reviewed. No general performance improvement is certified by this checkpoint.
- A final state-expansion checklist must cover existing drafts, counteroffers, signing, disclosure decisions and deployment. Passing these scripts alone does not establish readiness for the remaining forty states.

Frontend patches require the usual frontend deployment to affect the website. Backend disclosure-reader and PDF-footer patches also require Functions deployment. Local test success does not establish that either deployment occurred.

## Remaining implementation work after the shared draft queue and listing package hooks

The installed batches now share the nine-state pending-save queue, save boundaries, property snapshot mapping, listing seller-statement validation/mapping, CA/SC draft extensions, Colorado loan conversion, and legal-description field visibility. These checks preserve fixture behavior, not live workflow certification.

| Remaining area | Files to review | Required outcome |
| --- | --- | --- |
| State offer orchestration | `src/app/features/offers/states/*/*-offer-entry/*.ts` and `src/app/features/offers/engine/services/offer-workflow.service.ts` | Review initial session creation, attachments and state-specific mapping; consolidate only proven common behavior. |
| Listing UI and editing | `src/app/features/sell/listing-wizard/components/property-details-step/property-details-step.component.ts` and `src/app/features/dashboard/listing-edit/listing-edit.component.ts` | Review remaining state controls and edit/create differences; preserve intentional differences and stored drafts. |
| Backend package duplication | `functions/src/offers/state-contracts/*/*-draft-terms-sanitizer.ts`, `*-submission-validator.ts`, `*-document-rules.ts` and package registrations | Audit first; retain distinct contracts, legal rules, messages and versions. |
| Expansion verification | `tools/navstreet-refactor/verify-state-contract-integration.cjs` and `verify-state-pdf-generation.cjs` | Add completed-contract and counteroffer fixtures; verify signed versions and attached disclosures in real workflows. |
| Deployment and browser compatibility | Existing frontend build/deployment and Functions deployment processes | Confirm installed fixes are live; test existing drafts, section jumping, saving, submission, counteroffers and signing. |

Bounded marketplace search and photo/performance work remain separate unresolved items. The overall plan is still incomplete; this checkpoint does not establish readiness for forty more states.

The backend scalar utility extraction covers CA, FL, SC, UT, WI, CO, LA and OK. Each sanitizer retains its state fields, string limits, protected values and buyer/seller rules. Colorado and Louisiana retain local 4,000-character text defaults; decimal conversion remains distinct from safe-integer money conversion. `verify-backend-draft-values.cjs` checks scalar parity and actual compiled package sanitizers. Functions deployment is required for this extraction to affect live draft saves.

Oklahoma shares object, money, integer, nullable-boolean and choice conversions. Its strict-true boolean conversion, explicit text limits, string-array deduplication and approved-document filter remain local.

NC and TX sanitizers intentionally retain different strategies. The backend draft checks now also cover their trusted snapshots, role-specific protections, malformed inputs, NC unsafe-key rejection and Texas fallback behavior. These are compatibility checks; they do not certify every contract field or live counteroffer/signature workflows.

UT, WI, FL and LA share identical submission utility predicates and failed-precondition error handling. Their ordered requirements/messages remain local. `verify-backend-submission-values.cjs` compares the original utilities and source/compiled package behavior. Existing date parsing is preserved; these checks do not establish legal sufficiency or completed-offer eligibility.

UT, WI and FL share party submission checks with identical messages and first-matching-initiator identity behavior. Louisiana retains its distinct messages and any-verified-matching-party rule. The submission verification script covers missing contacts, both initiating sides and duplicate initiating user IDs.

Seven state packages use a shared exact-received-status document selector. Mappings and order remain in the state package; Colorado property/radon and Louisiana property documents remain unconditional. `verify-backend-disclosure-selection.cjs` compares original selection expressions with the compiled packages. This verifies selection, not live attachment retrieval or signing.

FL, CA, SC and LA share local-calendar arithmetic for milestone dates, retaining their time zones and Louisiana’s additional starting-day offset. The calendar check compares the original milestone implementations around DST, midnight and month/year/leap boundaries. It does not certify the agreement’s legal deadline rules.

Nine offer entries share elapsed-hour default-expiration arithmetic. Their existing 48-hour defaults remain unchanged; this is separate from state-local contract calendar deadlines. Offer regression checks cover DST and calendar boundaries.

Nine offer entries share their existing attachment-routing catalog. Water-rights disclosure routing remains available only in the existing TX/OK/UT entries; per-state unsupported-field messages and the addenda prefix rule are preserved. This does not change which documents each contract requires.

Draft creation, draft saving and counteroffer creation share the same undefined-field cleanup. `verify-backend-draft-cleanup.cjs` preserves Firestore Timestamp/FieldValue identity, array entries and false/null/zero values. This does not change transaction guards or exercise live Firestore writes.

Counteroffer term cloning and party signature/consent reset are isolated in `functions/src/offers/counteroffer-draft-data.ts`. The ten-state check preserves source terms, contract identity, trusted property data and Firestore values while clearing expiration and resetting signatures/consent. Transaction guards, revision-document handling and delivery still require live workflow verification.

Nine state entries share attachment upload/apply/save sequencing. The attachment lifecycle check compares original entry handlers for guards, missing wizard instances, upload/apply/save failures and state-specific messages. Storage writes and live upload recovery still require browser verification.

Nine offer entries share initial draft creation followed by session loading, with the same state-selected contract passed to both. The initial-draft comparisons preserve guards, state-specific failure messages and loading failures. Existing-draft identity repair and state session initialization remain separate work.

California and South Carolina share acknowledged disclosure-version retrieval and ordered merging. California retains its saved version map; South Carolina retains its additional available-version defaults. The resume check preserves missing-document errors, concurrent reads and source values; live Storage/Firestore access still needs browser verification.

Seven offer entries share their existing editable-draft assertion for listing identity, current version, offer/version draft status and initiating user. TX/OK retain different session-loading behavior. The guard extraction does not add an immutability restriction or alter backend authorization.

The active Texas draft sanitizer imports fourteen identical helpers from its existing Texas utility module. Its required text helper, field mapping and public export remain local. The Texas utility check compares the original full sanitizer against the compiled package for both initiating sides and individual stored-field edits; this does not consolidate the separate shared-sections sanitizer.

Colorado property-facts restoration is registered with the Colorado listing package and used by both creation and published editing. It retains the existing defaults-then-saved spread behavior, including explicit undefined/empty values. Listing-question checks cover restoration, actual form parity and hook ownership; validation and save mapping are unchanged.

Colorado published-edit field labels/order now belong to its listing package and resolve through an ownership-checked edit-field registry. The creation question catalog remains distinct. Listing-question checks compare all fifteen original edit labels/keys and actual controls, including missing/duplicate metadata ownership.

Texas/Colorado repair paths reuse concurrent offer/version reads through the workflow service. Their different repair predicates, reload checks and messages remain local. Repair comparisons cover eligibility, changed identifiers, read failures and state-specific immutability behavior; no backend authorization change is made.

WI/CA/FL/SC initial terms share their exact sellerLeases mapping; CA/FL/SC also share sellerHoa, preserving statement-first precedence and HOA fallback. The initial-facts check compares whole compiled initial-term outputs with pre-extraction source under a fixed clock, including malformed/absent/boolean listing facts. It does not change the separate general-lease mapping or contract content.

North Carolina draft sanitization now also uses the existing shared Firestore-aware undefined-field cleanup. Cleanup comparisons include the original NC helper; NC draft boundary checks continue to verify trusted values, role protections and unsafe-key rejection. No state term mapping or authorization rule changes.

Completed cash fixtures live in tools/navstreet-refactor/fixtures/completed-contracts.cjs. The new completed-contract checker validates ten initial offers and ten seller counteroffers, rejects incomplete consent/expiration/price/identity cases and writes twenty PDFs. Counteroffers use the installed preparation/reset helpers, then explicitly complete a new price, expiration and electronic consent. Fixtures use fictional parties and receipt elections; they do not retrieve real uploaded disclosures or verify signature delivery. No application change or deployment is included in this verification batch.

The completed-contract checker now covers cash and financed initial offers and seller counteroffers: forty valid submissions/PDFs across ten states plus invalid-financing controls. Explicit scenarios use NC loan intent, TX third-party financing, OK conventional-loan supplement selection, CO conventional new loan and the remaining states’ conventional/financed fields. NC/OK base contracts do not provide a numeric loan amount. This does not validate supplement contents or real uploaded financing documents; signed and long-content PDF checks remain pending.

Signed-contract PDF checks generate pending, buyer-signed and fully-signed synthetic snapshots across ten states, plus long legal-description/additional-text examples for eight generated-text contracts. They preserve input snapshots and check PDF page counts. Run node tools/navstreet-refactor/verify-signed-contract-pdfs.cjs .; outputs are in tmp/navstreet-signed-contracts. These checks do not exercise live signing, maximum field lengths, TX/OK signature overlays or fixed-field capacity or uploaded continuation/disclosure documents. Rendered text and layout require independent review.

Run node tools/navstreet-refactor/audit-fixed-form-pdfs.cjs . for the separate Texas/Oklahoma fixed-form diagnostic. It checks canonical PDF text fields for excluded, short and boundary-sized provisions, reports lost overflow text and compares pending/signed field values. GAP output is an unresolved finding, not a compatibility pass. The JSON report is tmp/navstreet-fixed-form-audit.json. This diagnostic is deliberately outside verify-refactor.cjs so the existing suite's PASS cannot imply overflow/signature-form completeness.

TX special provisions and OK additional provisions now move in full to appended continuation pages when they exceed their fixed fields; the original fields reference the continuation. Short, boundary and excluded mappings remain unchanged. The same generated PDF contains every continuation before hashing. verify-fixed-form-continuations.cjs checks helper parity and preservation, long tokens, actual form references, page counts and input retention; ten PDFs are in tmp/navstreet-fixed-form-continuations. Other field capacities and visible signature rendering are not changed. Deploy Functions after applying and verifying this batch.

TX/OK PDF generators append a visible electronic signature record when a stored party snapshot is signed. It uses legal names and stored timestamps in America/Chicago, labels unsigned parties Pending and paginates long names/multiple parties. Missing signed timestamps fail rendering. Existing unsigned forms stay unchanged. The accepted-agreement generation path uses this record; original signing documents and previously generated accepted PDFs remain permanently cached. This does not change signature authorization, hash calculation, storage or routes. verify-fixed-form-signatures.cjs checks actual drawn text, DST, pagination and input preservation in ten PDFs under tmp/navstreet-fixed-form-signatures. Deploy Functions after verifying.

All existing TX/OK multiline form groups now use shared field-writing and continuation orchestration. This adds preservation for TX exclusions, escrow address, repairs/treatments, exempt water supplier and broker disclosure; OK trust-account holder, inclusions and exclusions. State-owned section descriptors retain field names, widths and titles. Short/empty mappings and the required trust-holder validation stay unchanged. verify-remaining-fixed-form-text.cjs checks splitter parity, all unrelated canonical text fields and complete drawn continuation text in 32 PDFs. These changes do not establish single-field appearance capacity or live signing. Deploy Functions after checking.

Oklahoma legal description, possession terms and additional investigations now use measured single-line capacity at the existing form font size. Width overflow or explicit line breaks move the whole value to an appended continuation with a fitting reference in the original field. Short/empty values and required legal-description validation are unchanged. verify-ok-single-field-text.cjs checks exact wide-character fit boundaries, rendered continuation text, unrelated fields and 21 PDFs under tmp/navstreet-ok-single-text, including missing stored fields. Existing cached PDFs are not replaced; other single fields and live signing still need review. Deploy Functions after verification.

Texas notice addresses/emails for buyers, sellers and their agents, plus buyer/seller attorney names/emails, now use measured printed capacity. This reads the existing sixteen mapped form values, retaining current address composition and trimming, and moves clipping text to named continuations. Missing optional contacts stay blank; phone/fax mappings are unchanged. verify-texas-contact-text.cjs checks 48 PDFs, complete drawn text, unrelated fields and four address compositions. Existing cached PDFs stay unchanged. Other fixed fields and live signing remain outstanding. Deploy Functions after verifying.

Final PDF and architecture review: the suite now runs 38 checks. verify-pdf-capacity.cjs generates 108 TX/OK PDFs and checks measured canonical-field fit plus complete continuation content. verify-party-pdf-layout.cjs generates 20 ten-state, eight-party pending/signed PDFs. verify-contract-summaries.cjs generates 30 cash/financed/large-party summaries, preserving original form fields. The architecture-boundary checker compares 256 listing-document selections and package hooks; the shared-term-update checker compares 2,592 pre-extraction updater results and 25 timestamp cases. Printed extraction and selected-page visual review are separate evidence, not live acceptance.

This checkpoint adds package-owned listing/disclosure hooks, the Texas listing-document policy, six shared term-path updaters and three shared timestamp uses. It retains NC's dedicated wizard, CA/CO bespoke listing controls, typed listing form-group compatibility keys and TX/CO initial-draft repair seams. Existing cached PDFs remain unchanged. Apply after navstreet-texas-contact-continuations.patch, compile Functions and frontend, then deploy using the project's existing process before running the controlled buyer/seller live checklist.
