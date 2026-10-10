const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const project = path.resolve(process.argv[2] || '.');
const checks = [
  'verify-offer-loading.cjs',
  'verify-offer-attachment-save.cjs',
  'verify-offer-initial-draft.cjs',
  'verify-offer-disclosure-resume.cjs',
  'verify-offer-editable-guard.cjs',
  'verify-offer-repair-reload.cjs',
  'verify-nc-mapping.cjs',
  'verify-listing-questions.cjs',
  'verify-disclosure-gates.cjs',
  'verify-backend-disclosures.cjs',
  'verify-backend-disclosure-selection.cjs',
  'verify-backend-calendar-milestones.cjs',
  'verify-backend-draft-values.cjs',
  'verify-texas-sanitizer-utils.cjs',
  'verify-initial-listing-facts.cjs',
  'verify-backend-draft-cleanup.cjs',
  'verify-backend-counteroffer-data.cjs',
  'verify-backend-submission-values.cjs',
  'verify-state-contract-integration.cjs',
  'verify-minnesota-michigan.cjs',
  'verify-marketplace-status-search.cjs',
  'verify-offer-display-registry.cjs',
  'verify-offer-route-registry.cjs',
  'verify-colorado-listing-validation.cjs',
  'verify-listing-lease-validation.cjs',
  'verify-listing-statement-validation.cjs',
  'verify-state-pdf-generation.cjs',
  'verify-completed-contracts.cjs',
  'verify-signed-contract-pdfs.cjs',
  'verify-fixed-form-continuations.cjs',
  'verify-fixed-form-signatures.cjs',
  'verify-remaining-fixed-form-text.cjs',
  'verify-ok-single-field-text.cjs',
  'verify-texas-contact-text.cjs',
  'verify-pdf-capacity.cjs',
  'verify-party-pdf-layout.cjs',
  'verify-contract-summaries.cjs',
  'verify-architecture-boundaries.cjs',
  'verify-shared-term-updates.cjs',
];

function run(args, label) {
  const result = spawnSync(process.execPath, args, { cwd: project, stdio: 'inherit' });
  if (result.error || result.status !== 0) {
    console.error(`STOPPED: ${label}${result.error ? ': ' + result.error.message : ''}`);
    process.exit(result.status || 1);
  }
}

for (const check of checks) {
  if (!fs.existsSync(path.join(__dirname, check))) {
    console.error(`Missing verification file: tools/navstreet-refactor/${check}. Restore its patch before continuing.`);
    process.exit(1);
  }
}

const functionsProject = path.join(project, 'functions');
let compiler;
try {
  compiler = require.resolve('typescript/bin/tsc', { paths: [functionsProject] });
} catch {
  console.error('Functions dependencies are missing. Install them in functions before running this checkpoint.');
  process.exit(1);
}
console.log('Building Functions locally so contract checks use the current source.');
run([compiler, '-p', path.join(functionsProject, 'tsconfig.json')], 'Functions compilation');

for (const [index, check] of checks.entries()) {
  console.log(`\n[${index + 1}/${checks.length}] ${check}`);
  run([path.join(__dirname, check), project], check);
}

console.log(`\nPASS: all ${checks.length} installed refactoring checks. Sample PDFs are in tmp/navstreet-pdf-audit and tmp/navstreet-completed-contracts.`);
console.log('This checkpoint does not deploy changes or verify live Firestore, browser workflows, contract legal sufficiency, or production speed.');
