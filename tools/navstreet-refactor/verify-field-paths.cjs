'use strict';
// Build-time audit only. State schemas and runtime contracts are not rewritten.
const fs = require('node:fs');
const path = require('node:path');
function audit(project, overrides = new Map()) {
  project = path.resolve(project);
  const ts = require(require.resolve('typescript', { paths: [project] }));
  const errors = [], records = [], schemas = new Map(), excluded = [], cleanups = [];
  // These legacy schemas never declared reviewed-version metadata. Their existing
  // federal policy deletes only this obsolete key; it does not create a value.
  const cleanupOnlyStates = new Set(['alabama','colorado','delaware','florida','idaho','kansas','louisiana','michigan','nebraska','new-hampshire','ohio','oregon','utah','wisconsin']);
  const absoluteOverrides = new Map([...overrides].map(([p, text]) => [path.resolve(project, p), text]));
  const read = file => absoluteOverrides.get(path.resolve(file)) ?? fs.readFileSync(file,'utf8');
  const walk = dir => fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]) : [];
  const frontRoot = path.join(project, 'src/app/features/offers/states');
  const backRoot = path.join(project, 'functions/src/offers/state-contracts');
  const modelsRoot = path.join(project, 'src/app/core/domains/offers/state-contracts');
  const slugs = fs.readdirSync(backRoot, { withFileTypes: true }).filter(e => e.isDirectory() && fs.existsSync(path.join(backRoot, e.name, e.name + '-state-contract.package.ts'))).map(e => e.name).sort();
  let scans = slugs.flatMap(slug => [
    ...walk(path.join(frontRoot, slug)).filter(f => (/(?:\.sections|offer-package)\.ts$/.test(f) || (f.split(path.sep).includes('questions') && f.endsWith('.ts')))),
    path.join(backRoot, slug, slug + '-state-contract.package.ts'),
  ]);
  // Texas' five dormant templates have no implemented terms model. Fail if any
  // becomes enabled without removing this explicit exclusion and adding a schema.
  const texasPackage = read(path.join(backRoot, 'texas/texas-state-contract.package.ts'));
  const texasAst = ts.createSourceFile('texas.ts', texasPackage, ts.ScriptTarget.Latest, true);
  let texasContracts;
  const findTexas = node => {
    if (ts.isPropertyAssignment(node) && node.name.getText(texasAst) === 'contractTypes') texasContracts = node.initializer;
    ts.forEachChild(node, findTexas);
  };
  findTexas(texasAst);
  if (!texasContracts || !ts.isArrayLiteralExpression(texasContracts) || texasContracts.elements.length !== 1 || texasContracts.elements[0].getText(texasAst) !== 'TREC_20_19_TEMPLATE.contractType') throw new Error('Texas coverage changed: bind newly enabled templates to their actual schema.');
  scans = scans.filter(f => {
    if (f.startsWith(path.join(frontRoot, 'texas/contracts/')) && f.endsWith('.sections.ts') && !f.split(path.sep).includes('one-to-four-family-resale')) {
      excluded.push({file:path.relative(project,f),reason:'Dormant Texas template; server enables only one_to_four_family_resale.'}); return false;
    }
    return true;
  });
  const activeTexas = read(path.join(frontRoot,'texas/contracts/one-to-four-family-resale/one-to-four-family-resale.sections.ts'));
  if (activeTexas.includes('createTexasConstructionSection')) throw new Error('Texas active contract now uses dormant construction fields: supply its schema before proceeding.');
  excluded.push({file:'src/app/features/offers/states/texas/questions/texas-shared-question-definitions.ts#createTexasConstructionSection',reason:'Helper used only by dormant new-home templates; active resale file must not reference it.'});
  function dormant(node) {
    if (!node.getSourceFile().fileName.endsWith('texas-shared-question-definitions.ts')) return false;
    for (let p = node; p; p = p.parent) if (ts.isFunctionDeclaration(p) && p.name?.text === 'createTexasConstructionSection') return true;
    return false;
  }
  const modelFiles = walk(modelsRoot).filter(f => /offer-terms\.model\.ts$/.test(f));
  const roots = [...scans, ...modelFiles];
  const host = ts.createCompilerHost({});
  const originalRead = host.readFile;
  host.readFile = f => absoluteOverrides.has(path.resolve(f)) ? absoluteOverrides.get(path.resolve(f)) : originalRead(f);
  const program = ts.createProgram(roots, { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext, strict: true, skipLibCheck: true, noEmit: true }, host);
  const checker = program.getTypeChecker();
  const visit = (node, fn) => { fn(node); ts.forEachChild(node, n => visit(n, fn)); };
  const location = node => { const sf = node.getSourceFile(), pos = sf.getLineAndCharacterOfPosition(node.getStart()); return path.relative(project, sf.fileName).replaceAll('\\', '/') + ':' + (pos.line + 1); };
  const fail = (node, message) => errors.push(location(node) + ' ' + message);
  const unbox = n => ts.isParenthesizedExpression(n) || ts.isAsExpression(n) || ts.isSatisfiesExpression(n) || ts.isNonNullExpression(n) ? unbox(n.expression) : n;
  function literals(node, stack = new Set()) {
    node = unbox(node);
    if (stack.has(node)) throw new Error('cyclic path expression');
    stack = new Set(stack).add(node);
    if (ts.isStringLiteralLike(node)) return [node.text];
    if (node.kind === ts.SyntaxKind.UndefinedKeyword || node.getText() === 'undefined') return [];
    if (ts.isArrayLiteralExpression(node)) return node.elements.flatMap(e => literals(e, stack));
    if (ts.isConditionalExpression(node)) return [...literals(node.whenTrue, stack), ...literals(node.whenFalse, stack)];
    if (ts.isTemplateExpression(node)) {
      let values = [node.head.text];
      for (const span of node.templateSpans) values = values.flatMap(v => literals(span.expression, stack).map(s => v + s + span.literal.text));
      return values;
    }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) return literals(node.left, stack).flatMap(a => literals(node.right, stack).map(b => a + b));
    const type = checker.getTypeAtLocation(node);
    const types = type.isUnion() ? type.types : [type];
    if (types.every(t => t.flags & ts.TypeFlags.StringLiteral)) return types.map(t => t.value);
    if (ts.isIdentifier(node)) {
      const symbol = ts.isShorthandPropertyAssignment(node.parent) ? checker.getShorthandAssignmentValueSymbol(node.parent) : checker.getSymbolAtLocation(node), decl = symbol?.valueDeclaration || symbol?.declarations?.[0];
      if (decl && ts.isBindingElement(decl) && ts.isArrayBindingPattern(decl.parent)) {
        const param = decl.parent.parent, fn = param.parent, call = fn.parent;
        if (ts.isParameter(param) && ts.isArrowFunction(fn) && ts.isCallExpression(call) && ts.isPropertyAccessExpression(call.expression) && call.expression.name.text === 'map') {
          const rows = unbox(call.expression.expression), index = decl.parent.elements.indexOf(decl);
          if (ts.isArrayLiteralExpression(rows)) return rows.elements.flatMap(row => {
            row = unbox(row);
            if (!ts.isArrayLiteralExpression(row) || !row.elements[index]) throw new Error('Unsupported mapped path tuple');
            return literals(row.elements[index], stack);
          });
        }
      }
      if (decl && ts.isVariableDeclaration(decl) && decl.initializer) return literals(decl.initializer, stack);
      if (decl && ts.isParameter(decl)) {
        const fn = decl.parent, index = fn.parameters.indexOf(decl), values = [];
        visit(fn.getSourceFile(), call => {
          if (!dormant(call) && ts.isCallExpression(call) && checker.getResolvedSignature(call)?.declaration === fn && call.arguments[index]) values.push(...literals(call.arguments[index], stack));
        });
        if (values.length) return values;
      }
    }
    throw new Error('Unresolved path expression: ' + node.getText().slice(0, 100));
  }
  function variants(type) {
    type = checker.getNonNullableType(type);
    return type.isUnion() ? type.types.flatMap(variants) : [type];
  }
  function pathType(root, value) {
    if (!value || value.split('.').some(k => !k || ['__proto__', 'prototype', 'constructor'].includes(k))) throw new Error('invalid path syntax');
    let current = [root];
    for (const key of value.split('.')) {
      const next = [];
      for (const type of current.flatMap(variants)) {
        if (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) throw new Error('untyped schema boundary at ' + key);
        if (type.flags & (ts.TypeFlags.StringLike | ts.TypeFlags.NumberLike | ts.TypeFlags.BooleanLike | ts.TypeFlags.BigIntLike)) throw new Error('cannot traverse primitive field at ' + key);
        const prop = checker.getPropertyOfType(type, key);
        if (prop) next.push(checker.getTypeOfSymbolAtLocation(prop, prop.valueDeclaration || prop.declarations[0]));
        else {
          const index = checker.getIndexTypeOfType(type, /^\d+$/.test(key) ? ts.IndexKind.Number : ts.IndexKind.String);
          if (index) next.push(index);
        }
      }
      if (!next.length) throw new Error('unknown field ' + key);
      current = next;
    }
    return current;
  }
  function check(node, value, schema, kind) {
    try { pathType(schema, value); records.push({ file: location(node), path: value, kind }); }
    catch (e) { fail(node, kind + ' "' + value + '": ' + e.message); }
  }
  function resolveSchema(slug, side) {
    if (side === 'frontend') {
      const file = program.getSourceFile(path.join(modelsRoot, slug, 'models', slug + '-offer-terms.model.ts'));
      if (file) {
        const module = checker.getSymbolAtLocation(file);
        const candidate = checker.getExportsOfModule(module).find(s => new RegExp('^' + slug.split('-').map(s => s[0].toUpperCase() + s.slice(1)).join('') + 'OfferTerms$').test(s.name));
        if (candidate) return checker.getDeclaredTypeOfSymbol(candidate);
      }
    } else {
      const file = program.getSourceFile(path.join(backRoot, slug, slug + '-state-contract.package.ts'));
      let result;
      visit(file, n => { if (ts.isVariableDeclaration(n) && n.type && ts.isTypeReferenceNode(n.type) && n.type.typeName.getText() === 'StateContractPackage') {
        const packageType = checker.getTypeAtLocation(n.name), factory = checker.getPropertyOfType(packageType,'createInitialOfferTerms');
        if (factory) result = checker.getTypeOfSymbolAtLocation(factory,n).getCallSignatures()[0]?.getReturnType();
      } });
      if (result) return result;
    }
    throw new Error('No explicit ' + side + ' schema binding for ' + slug);
  }
  for (const slug of slugs) for (const side of ['frontend', 'backend']) {
    try { const t = resolveSchema(slug, side); if (t.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) throw new Error('unresolved schema'); schemas.set(side + '/' + slug, t); }
    catch (e) { errors.push(e.message); }
  }
  for (const file of scans) {
    const sf = program.getSourceFile(file), side = file.startsWith(backRoot) ? 'backend' : 'frontend';
    const slug = path.relative(side === 'backend' ? backRoot : frontRoot, file).split(path.sep)[0], schema = schemas.get(side + '/' + slug);
    if (!schema) continue;
    const checkExpr = (node, kind) => { try { for (const value of literals(node)) check(node, value, schema, kind); } catch (e) { fail(node, e.message); } };
    visit(sf, node => {
      if (ts.isPropertyAssignment(node) && node.name.getText().replaceAll(/["']/g, '') === 'fieldPath') checkExpr(node.initializer, 'question/visibility');
      if (ts.isShorthandPropertyAssignment(node) && node.name.text === 'fieldPath') checkExpr(node.name, 'question/helper');
      if (ts.isPropertyAssignment(node) && node.name.getText() === 'objectSelection') {
        try {
          const question = node.parent;
          const field = question.properties.find(p => (ts.isPropertyAssignment(p) || ts.isShorthandPropertyAssignment(p)) && p.name.getText() === 'fieldPath');
          if (!field) throw new Error('Object selection must declare its fieldPath in the same question');
          const selection = unbox(node.initializer);
          if (!ts.isObjectLiteralExpression(selection)) throw new Error('Unsupported object-selection mapping');
          for (const value of literals(ts.isPropertyAssignment(field) ? field.initializer : field.name)) for (const array of pathType(schema,value).flatMap(variants)) {
            const element = checker.getIndexTypeOfType(array,ts.IndexKind.Number);
            if (!element) throw new Error('Object-selection field is not an array');
            for (const key of selection.properties) {
              if (!ts.isPropertyAssignment(key)) throw new Error('Unsupported object-selection key');
              for (const name of literals(key.initializer)) check(key,name,element,'question/objectSelection');
            }
          }
        } catch (e) { fail(node,e.message); }
      }
      if (!ts.isCallExpression(node) || !/^with(?:Hoa|FederalLead)(?:Offer|Contract)Policy$/.test(node.expression.getText())) return;
      const policy = unbox(node.arguments[1]);
      if (!ts.isObjectLiteralExpression(policy)) { fail(policy, 'Policy must be statically auditable'); return; }
      for (const prop of policy.properties) {
        if (!ts.isPropertyAssignment(prop)) { fail(prop, 'Unsupported policy spread or shorthand'); continue; }
        const name = prop.name.getText().replaceAll(/["']/g, '');
        if (['sellerFactPath', 'documentStatusPath', 'evidencePaths', 'hiddenFields'].includes(name)) checkExpr(prop.initializer, 'policy/' + name);
        if (['values', 'nonHousingValues'].includes(name)) {
          const values = unbox(prop.initializer);
          if (!ts.isObjectLiteralExpression(values)) { fail(values, 'Policy values must be statically auditable'); continue; }
          for (const value of values.properties) {
            if (ts.isPropertyAssignment(value)) {
              const key = value.name.getText().replaceAll(/["']/g, '');
              if (cleanupOnlyStates.has(slug) && key === 'documentVersions.lead-based-paint' && value.initializer.getText() === 'undefined' && !checker.getPropertyOfType(schema,'documentVersions')) {
                cleanups.push({file:location(value),path:key,reason:'Delete-only legacy metadata cleanup; absent from this state schema.'});
              } else checkExpr(value.name, 'policy/' + name);
            } else fail(value, 'Unsupported policy values');
          }
        }
        if (name === 'addendum') {
          const addendum = unbox(prop.initializer);
          if (!ts.isObjectLiteralExpression(addendum)) { fail(addendum, 'Unsupported addendum mapping'); continue; }
          const properties = Object.fromEntries(addendum.properties.filter(ts.isPropertyAssignment).map(p => [p.name.getText().replaceAll(/["']/g, ''), p.initializer]));
          checkExpr(properties.path, 'policy/addendum');
          try {
            for (const p of literals(properties.path)) for (const array of pathType(schema, p).flatMap(variants)) {
              const element = checker.getIndexTypeOfType(array, ts.IndexKind.Number);
              if (!element) throw new Error('Addendum path is not an array');
              for (const key of ['idKey', 'selectedKey']) for (const name of literals(properties[key])) check(properties[key], name, element, 'policy/addendum/' + key);
            }
          } catch (e) { fail(addendum, e.message); }
        }
      }
    });
  }
  return { errors: [...new Set(errors)], records, excluded, cleanups, schemas: schemas.size, states: slugs.length };
}
if (require.main === module) {
  const project = path.resolve(process.argv[2] || '.');
  const result = audit(project);
  const directory = path.join(project, 'tmp/navstreet-field-paths'); fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'audit.json'), JSON.stringify(result, null, 2));
  if (result.errors.length) { console.error(result.errors.join('\n')); process.exitCode = 1; }
  else console.log(`PASS: ${result.records.length} question/visibility and policy path references across ${result.states} states / ${result.schemas} independent frontend/backend schemas.`);
}
module.exports = { audit };
