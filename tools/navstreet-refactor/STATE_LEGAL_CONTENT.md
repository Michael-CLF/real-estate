# Versioned state section content

Long static legal/explanatory wording for declarative offers lives beside each state package:

`src/app/features/offers/states/<slug>/legal-content/offer-section-content.2026-10-25.v1.ts`

The initial extraction contains 832 state-owned text entries referenced 852 times from 64 section/question/package assembly files across 41 states. Exact duplicate strings may share a key within one state; states never share a legal-content catalog. Short labels, field paths, validation rules and conditional assembly remain in the original files. Dynamic interpolated wording is not converted into a universal template language. North Carolina's separate native forms and agreement PDF services are outside this UI-content extraction.

The date is an extraction/UI-baseline identity, **not** a new statutory effective date, agreement revision or legal approval. All wording is copied exactly from the prior code. Existing contract IDs, templates, versions, deadline rules and reviewed-document pins remain unchanged. The backend and historic PDF rendering code are untouched; existing documents are not regenerated.

## Why imports name a version

Each existing consumer imports a specific dated module and constant. There is no `latest` alias or shared all-state wording registry. Catalog objects are frozen and contain only literal strings. Existing consumers continue resolving the same wording. Changing a pinned catalog, reference key, import target/state/revision or assembled section unexpectedly fails CI.

The contents are not generated from a mutable shared legal-text source at runtime. These TypeScript modules are the state-owned authoring source for this UI wording. Mapping generation from improvement1 remains a separate mechanism and does not rewrite legal text.

## Future content changes

1. Determine the affected state's actual agreement/template revision and whether a change is UI explanation only or changes contractual/legal meaning. Follow the existing review and acceptance process; do not treat a new UI catalog as a contract version change by itself.
2. Preserve the old catalog and old consumers. Add a new versioned module for new wording. For a new operative agreement, add state-owned version-specific section definitions/routing according to the actual contract/template identity. Do not repoint an old agreement to a `latest` catalog. This patch does not invent a new universal historic-version routing system.
3. Add reviewed baseline/catalog/consumer records and actual old/new contract-version behavior cases. Keep the old catalog hashes and bindings. Deliberate non-wording UI refactors may require reviewed assembly-hash updates; do not refresh text hashes to conceal a wording change.
4. Run `npm run verify:section-content`, then `npm run verify:ci`. New catalog files without reviewed baseline records fail. Verify both old and new behavior/PDF output and the existing live acceptance requirements before publishing a substantive change.

## Verification design

`fixtures/section-legal-content-baseline.json` records each immutable catalog identity, exact strings/hash and consumer bindings, plus a normalized pre-extraction assembly fingerprint. It is test evidence, not a second runtime text source. The audit follows each named version import, checks its exact contents and frozen object, substitutes the literal strings back into a compiler AST, and compares the assembled code to the prior implementation. That checks question order, visibility, field paths and validation as well as text. Nine injected failure cases cover wording, revision, mutability, import/key assembly drift, new inline wording and unreviewed consumers; CRLF parity is included. The normalizer does not execute section functions or replace the existing runtime behavior tests.

The full CI command runs this audit before mapping/path/build/behavior checks. Existing package tests use actual imported text. One four-state check formerly searched raw source for Montana radon wording; it now checks assembled sections, keeping the same wording assertion. No behavior assertion is dropped.

Adoption is frontend-only for this patch: apply, run the full checkpoint, commit all new catalog/test files and publish using existing IONOS hosting. No Functions deployment, Firebase rule/index change or readiness backfill is needed. Number3 document-review hooks remain separate work.

## October 25 state expansion

Alaska, Connecticut, Vermont and Virginia add four independent versioned catalogs and eight reviewed section assemblies. The original 41-state content/version records remain unchanged. Review state-specific statutes and official forms before authorizing new text; never copy another state’s legal rules merely to match its structure.
