# State field-path verification

Run `npm run verify:field-paths` for the focused audit or `npm run verify:ci` for the complete maintenance checkpoint. Node 24 and installed dependencies in both roots are required. The CI runner builds the production frontend and uses the existing verification checkpoint to compile Functions and exercise all installed behavior/package/PDF checks. It never deploys or backfills data.

The new GitHub workflow runs on pull requests, pushes to main and manual Actions runs. It uses npm ci for both lockfiles, read-only repository permissions, no application credentials, and keeps generated synthetic PDF/report artifacts for seven days. It is separate from the existing IONOS deployment workflows. It does not automatically block that separate deployment workflow. To require checks before merging, configure a repository rule for the stable job name `Build and verify NavStreet` after its first GitHub run.

## Audit coverage

The audit reads the current TypeScript schemas using the installed compiler API. It discovers backend package directories and independently binds each state's frontend `<State>OfferTerms` export and backend `StateContractPackage` factory return type, including North Carolina's existing default generic. No universal contract model is introduced.

It checks fieldPath properties and shorthand references in state question/section definitions, visibility conditions and helper calls; finite helper parameters, template strings, concatenations and mapped tuple keys; HOA seller/document/evidence mappings; federal lead values, hidden fields and non-housing values; lead addendum array keys; and question object-selection array keys. Dynamic path expressions that cannot be resolved fail instead of being skipped. Unknown schema boundaries fail. Optional fields and state-specific unions are supported. Declared string-indexed dictionaries remain open as their models specify; this audit cannot certify a document ID's legal meaning.

The JSON coverage report is written to `tmp/navstreet-field-paths/audit.json`, with source/line, path and category for each checked reference, and explicit exclusions/cleanup entries. Current count: 3,377 checked references, 42 implemented packages and 84 independent schema bindings. North Carolina retains native typed forms rather than generic question definitions; its backend policy paths and frontend schema are covered, and its existing mapping/native-form checks and Angular build remain required.

## Deliberate legacy boundaries

- Texas enables only TREC 20-19 one-to-four-family resale. Five dormant contract-section files have no implemented terms model and are reported as excluded. The shared `createTexasConstructionSection` helper belongs only to those dormant new-home templates. The audit fails if the server enables another Texas contract or the active resale sections reference that helper. Implement the actual new schema and update coverage when enabling such a contract; do not expand the old model merely to silence the audit.
- Fourteen older state schemas do not declare `documentVersions`. Their existing federal policies delete exactly `documentVersions.lead-based-paint` with undefined. The audit reports those 28 frontend/backend cleanup declarations separately. Only that exact delete-only key for the enumerated legacy states is allowed; non-undefined writes and spelling changes fail. The optional metadata is not added to old contract types.
- Information-only questions intentionally using `fieldPath: undefined` have no bound answer. That is permitted; new unresolved expressions are not.

## Adding or changing a state

1. Keep actual frontend/backend types and state-owned mappings authoritative. New normal packages should export their canonical `<State>OfferTerms` type and explicitly bind the backend package generic to its own terms document.
2. Define question paths, conditions and policy mappings with finite, statically auditable expressions. For a new helper construction, extend the resolver and its negative controls. Do not add a broad path whitelist or cast to any to bypass checks.
3. Run the focused audit and inspect its report. Renaming an actual schema field should fail any unchanged question or policy reference.
4. Extend the existing state behavior/PDF fixtures and coverage-count expectations for newly implemented packages, then run `npm run verify:ci`. These checks do not activate states.
5. Continue the existing live buyer/seller Firebase and legal/PDF visual acceptance process. CI checks structural/behavioral properties; it does not establish legal sufficiency or live deployment success.

`verify-field-paths-self-test.cjs` supplies 13 deliberate negative controls in an in-memory compiler host. These cover direct and visibility paths, helper paths, computed Colorado paths, frontend/backend policy errors, Texas object-selection keys, actual schema renames, unresolved expressions and dormant-template guardrails. It does not edit source files.

## Generated state-owned policy declarations (2026-10-25)

Policy arguments now resolve through each state's imported generated constants. The audit follows the imported symbol to its literal initializer, reports that declaration's source/line, and validates it against the consuming state/build-root model. The 3,377 references and thirteen negative controls remain covered. Edit canonical state manifests and regenerate, rather than editing the generated copies. See STATE_POLICY_MAPPINGS.md.
