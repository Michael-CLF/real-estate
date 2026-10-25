'use strict';
const path = require('node:path');
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
function run(args, label) {
  console.log('\n' + label);
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' });
  if (result.error || result.signal || result.status !== 0) {
    console.error(label + ' failed.', result.error?.message || result.signal || '');
    process.exit(result.status || 1);
  }
}
// Resolve the installed CLI; this also works from Windows PowerShell.
const angular = require.resolve('@angular/cli/bin/ng.js', { paths: [root] });
for (const file of ['functions/assets/navstreet-transparent.svg', 'functions/assets/navstreet-logo.png']) {
  if (!fs.existsSync(path.join(root, file))) throw new Error('Missing tracked PDF asset: ' + file + '. Restore functions/assets before running checks.');
}
run([path.join(__dirname, 'verify-section-legal-content.cjs'), root], 'Versioned state section content and historical assembly checks');
run([path.join(__dirname, 'verify-state-policy-mappings.cjs'), root], 'Generated state mappings and parity checks');
run([path.join(__dirname, 'verify-field-paths.cjs'), root], 'State field-path audit');
run([path.join(__dirname, 'verify-field-paths-self-test.cjs'), root], 'Field-path negative controls');
run([angular, 'build', '--configuration', 'production'], 'Production frontend build');
// The existing checkpoint builds Functions from source before running its
// offline package-hook, behavior and generated-PDF verification scripts.
run([path.join(__dirname, 'verify-refactor.cjs'), root], 'Functions build and complete verification checkpoint');
