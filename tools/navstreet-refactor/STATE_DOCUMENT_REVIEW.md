# State-owned document review

The declarative offer packages expose `documentReview` through the existing `StateOfferPackage` interface. Each of the 45 declarative packages attaches its own typed implementation from `<slug>-document-review.ts` using `withStateDocumentReview`. North Carolina retains its native form workflow. Texas and Oklahoma explicitly have no extra wizard receipt checks; their validators and existing document-selection policies still apply. Their legacy wizards have no initiating-role input and pass undefined to the no-op change hook, rather than assuming a buyer or seller role.

- `validate(terms, documents)` returns the wizard's existing document-related issues. The wizard preserves their position between errors and warnings (Colorado retains its existing collector order).
- `applyChange(previous, updated, change, documents, initiatedBy)` applies the state's existing receipt-version behavior after its terms updater and buyer-owned-field guard. It never saves, uploads, fetches or fabricates a receipt.
- Optional `prepareDraft(previous, updated, documents)` preserves the existing entry-time save boundary for Arizona, Minnesota, Indiana and Missouri. Their entry components retain their original guards, previous-version tracking and autosave/submit paths.

Iowa, Montana and Washington delegate to their existing reviewed-version helpers. Montana's separate attachment-completion call remains at the same boundary. California retains its own receipt map and statuses. Do not turn these differences into a universal legal rule, add new pre-offer restrictions or rebase saved acknowledgments to the newest upload. The existing state-owned document-selection registry, exact-version restoration, upload service, immutable copies and backend transaction/signing rules remain in place.

## Verification and future changes

Run `npm run verify:document-review` or `npm run verify:ci`. The focused check loads actual composed packages, compares their hooks with test-only pre-refactor functions, checks all 45 wizard bindings, compares receipt/version scenarios and input immutability, and preserves four entry lifecycle blocks. These fixtures are historical test evidence, not runtime authoring inputs. Deliberate future behavior changes need reviewed tests and legal/version analysis as appropriate; do not automatically overwrite the baseline.

For a new declarative state, define its own typed hook, attach it through its package and dispatch from its wizard. Add the package to the focused audit with reviewed expectations. Preserve that state's actual delivery timing, document identifiers, applicable statuses and immutable reviewed-version records. Existing synthetic checks do not establish live Firebase/browser acceptance or legal sufficiency.

This is a frontend organization change. It changes no backend source, contract/schema/template identity, policy semantics, readiness revision or state activation. No Functions deployment or backfill is needed.
