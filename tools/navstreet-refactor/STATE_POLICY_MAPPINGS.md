# State-owned offer-policy mappings

Each implemented state owns `state-contracts/<slug>/offer-policy-mappings.json`. This is the authoritative declaration for its HOA and federal-lead applicability mappings. Every state retains its actual field schema and legal/document decisions. The manifests do not define a universal contract model.

Run:

```text
npm run generate:state-mappings
npm run verify:state-mappings
npm run verify:ci
```

The generator emits checked-in typed TypeScript modules for each actual build-root target:

- Frontend: `src/app/core/domains/offers/state-contracts/<slug>/<slug>-policy-mappings.generated.ts`
- Backend: `functions/src/offers/state-contracts/<slug>/<slug>-policy-mappings.generated.ts`

There are currently 42 manifests and 83 modules: 41 frontend/backend pairs plus North Carolina's backend-only declaration. NC retains its native typed frontend forms. Generated modules contain ordinary object literals and type-only imports, with `satisfies` checks against existing policy interfaces. There is no runtime JSON loading, tool-directory import, new state registry or all-state aggregate module. Each package imports only its own generated constants. Both the frontend and backend remain independently buildable with their checked-in modules.

## Editing a mapping

1. Edit only the appropriate state's manifest, preserving the actual field paths, document IDs, Boolean meanings and applicability decisions.
2. `values` / `nonHousingValues` use `{"$unset": true}` for an explicit JavaScript `undefined`. This is an instruction to remove a stale field, not null and not a fabricated buyer receipt. The generator writes an own-key whose value is undefined, exactly matching the original declaration.
3. Run generation, then the mapping check, field-path audit and full CI command. Commit the manifest, every generated output affected by it, and any deliberately reviewed fixture update together.
4. `verify:ci` checks generation freshness before builds and behavior/PDF tests. It does not silently regenerate files. A stale/missing output, wrong build-root target, orphan module, absent/extra state manifest, invalid shape or wrong package import fails.
5. Existing path checking follows imported generated declarations and independently checks each state/build-root schema. Do not replace a real schema with another state's type or weaken path checking to make generation pass.

`fixtures/state-policy-mappings-before.json` is a frozen test-only snapshot of the pre-consolidation 42-state declarations. It verifies exact historical values, arrays and undefined keys. It is not another runtime authority or a generator input. If a future authorized policy change legitimately changes those values, review and update the relevant regression expectation with the state's behavior/legal tests. Do not automatically refresh this snapshot in the generator.

## Adding a state

Create its actual package and terms model first. Add its own manifest with schemaVersion 1, matching stateSlug and targets matching the package files that actually exist. Define both existing policy objects, then generate the appropriate modules and import HOA_POLICY and FEDERAL_LEAD_POLICY from that state's generated module in its package. Retain all existing registration, disclosure, legal-timing, review-pin and activation acceptance requirements. Generation does not implement or activate a new state agreement.

## Compatibility limits

Only declaration ownership changes. Shared policy algorithms, legal text, field schemas, signed contracts, template/version identities, disclosure timing and document-review pins are untouched. Backend module imports are different and must be built/deployed through the existing Functions workflow when adopting this patch. Commit/push also publishes the frontend through the existing IONOS process. No Firebase rules, indexes, secrets or backfill are introduced.

The path audit's explicit dormant-Texas and exact legacy delete-only boundaries still apply. Typed `satisfies` checks validate policy object shape; the compiler-backed path audit validates actual state field paths. Existing behavior/PDF and live acceptance checks remain necessary.
