'use strict';
const fs = require('node:fs');
const path = require('node:path');
const UNSET = '$unset';
const normalize = text => text.replace(/\r\n/g, '\n');
function ownKeys(value, allowed, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(label + ' must be an object');
  for (const key of Object.keys(value)) if (!allowed.includes(key)) throw new Error(label + ': unsupported key ' + key);
}
function strings(value, label) { if (!Array.isArray(value) || value.some(v => typeof v !== 'string' || !v)) throw new Error(label + ' must be a string array'); }
function field(value, label) {
  if (typeof value !== 'string' || !value || value.split('.').some(k => !k || ['__proto__','prototype','constructor'].includes(k))) throw new Error(label + ': invalid field path');
}
function validatePolicy(policy) {
  ownKeys(policy,['hoa','federalLead'],'policies');
  const hoa=policy.hoa, lead=policy.federalLead;
  ownKeys(hoa,['sellerFactPath','documentStatusPath','documentTypes','evidencePaths','snapshotSellerFact','auditedNoReceiptQuestion'],'hoa');
  strings(hoa.documentTypes,'hoa.documentTypes');
  for (const k of ['sellerFactPath','documentStatusPath']) if (k in hoa) field(hoa[k],'hoa.'+k);
  if ('evidencePaths' in hoa) { strings(hoa.evidencePaths,'hoa.evidencePaths'); hoa.evidencePaths.forEach(v=>field(v,'hoa.evidencePaths')); }
  for (const k of ['snapshotSellerFact','auditedNoReceiptQuestion']) if (k in hoa && typeof hoa[k]!=='boolean') throw new Error('hoa.'+k+' must be boolean');
  ownKeys(lead,['listingStatementRequired','values','nonHousingValues','hiddenFields','addendum'],'federalLead');
  if ('listingStatementRequired' in lead && typeof lead.listingStatementRequired!=='boolean') throw new Error('listingStatementRequired must be boolean');
  strings(lead.hiddenFields,'federalLead.hiddenFields'); lead.hiddenFields.forEach(v=>field(v,'hiddenFields'));
  for (const name of ['values','nonHousingValues']) if (name==='values'||name in lead) {
    const values=lead[name];
    if (!values||typeof values!=='object'||Array.isArray(values)) throw new Error(name+' must be a path/value object');
    for (const [key,value] of Object.entries(values)) {
      field(key,name);
      if (value && typeof value==='object') { ownKeys(value,[UNSET],name+'.'+key); if (value[UNSET]!==true) throw new Error('Only {$unset:true} is allowed for undefined'); }
      else if (value!==null&&!['string','boolean','number'].includes(typeof value)) throw new Error('Invalid policy value');
    }
  }
  if ('addendum' in lead) {
    ownKeys(lead.addendum,['path','idKey','id','selectedKey'],'federalLead.addendum');
    field(lead.addendum.path,'addendum.path');
    for (const k of ['idKey','id','selectedKey']) if (typeof lead.addendum[k]!=='string'||!lead.addendum[k]) throw new Error('addendum.'+k+' must be a string');
  }
}
function renderValue(value, depth=0) {
  if (value && typeof value==='object' && !Array.isArray(value) && Object.keys(value).length===1 && value[UNSET]===true) return 'undefined';
  if (Array.isArray(value)) return '['+value.map(v=>renderValue(v,depth+1)).join(', ')+']';
  if (value && typeof value==='object') return '{\n'+Object.entries(value).map(([k,v])=>'  '.repeat(depth+1)+JSON.stringify(k)+': '+renderValue(v,depth+1)+',').join('\n')+'\n'+'  '.repeat(depth)+'}';
  return JSON.stringify(value);
}
function outputFile(root,slug,side) {
  return path.join(root,side==='frontend'?'src/app/core/domains/offers/state-contracts':'functions/src/offers/state-contracts',slug,slug+'-policy-mappings.generated.ts');
}
function render(slug,side,policy) {
  const prefix=side==='frontend'?'../..':'..';
  return '// Generated from state-contracts/'+slug+'/offer-policy-mappings.json. Do not edit.\n'+
    "import type { HoaApplicabilityPolicy } from '"+prefix+"/hoa-applicability-policy';\n"+
    "import type { FederalLeadTermPolicy } from '"+prefix+"/federal-lead-policy';\n\n"+
    'export const HOA_POLICY = '+renderValue(policy.hoa)+' as const satisfies HoaApplicabilityPolicy;\n\n'+
    'export const FEDERAL_LEAD_POLICY = '+renderValue(policy.federalLead)+' as const satisfies FederalLeadTermPolicy;\n';
}
function generate(root, {write=false}={}) {
  root=path.resolve(root); const manifests=path.join(root,'state-contracts');
  const backend=path.join(root,'functions/src/offers/state-contracts');
  const slugs=fs.readdirSync(backend,{withFileTypes:true}).filter(d=>d.isDirectory()&&fs.existsSync(path.join(backend,d.name,d.name+'-state-contract.package.ts'))).map(d=>d.name).sort();
  const states=fs.readdirSync(manifests,{withFileTypes:true}).filter(d=>d.isDirectory()).map(d=>d.name).sort();
  if (JSON.stringify(states)!==JSON.stringify(slugs)) throw new Error('Canonical mapping states must exactly match implemented backend packages.');
  const expected=new Set(), results=[];
  for (const slug of slugs) {
    const file=path.join(manifests,slug,'offer-policy-mappings.json'), doc=JSON.parse(fs.readFileSync(file,'utf8'));
    ownKeys(doc,['schemaVersion','stateSlug','targets','policies'],slug);
    if (doc.schemaVersion!==1||doc.stateSlug!==slug) throw new Error(slug+': invalid manifest identity');
    const front=path.join(root,'src/app/features/offers/states',slug,slug+'-offer-package.ts');
    const targets=fs.existsSync(front)?['frontend','backend']:['backend'];
    if (JSON.stringify(doc.targets)!==JSON.stringify(targets)) throw new Error(slug+': targets must match the actual package build roots');
    validatePolicy(doc.policies);
    for (const side of targets) {
      const out=outputFile(root,slug,side), text=render(slug,side,doc.policies);expected.add(out);
      const actual=fs.existsSync(out)?normalize(fs.readFileSync(out,'utf8')):null;
      if (actual!==text) {
        if (!write) throw new Error(path.relative(root,out)+' is missing/stale. Run npm run generate:state-mappings and commit both generated outputs.');
        fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,text);
      }
      results.push({slug,side,file:out,policy:doc.policies});
    }
  }
  // Orphan generated modules must be deliberately removed after a package deletion.
  for (const dir of [path.join(root,'src/app/core/domains/offers/state-contracts'),backend]) for (const entry of fs.readdirSync(dir,{withFileTypes:true}).filter(d=>d.isDirectory())) {
    for (const file of fs.readdirSync(path.join(dir,entry.name)).filter(f=>f.endsWith('-policy-mappings.generated.ts'))) {
      const out=path.join(dir,entry.name,file);if(!expected.has(out)) throw new Error('Orphan generated mapping: '+path.relative(root,out));
    }
  }
  return results;
}
if (require.main===module) {
  try {
    const args=process.argv.slice(2);if(args.some(a=>a.startsWith('--')&&!['--write','--check'].includes(a))||args.includes('--write')&&args.includes('--check'))throw new Error('Use --check (default) or --write, never both.');
    const root=path.resolve(args.find(a=>!a.startsWith('--'))||'.');const results=generate(root,{write:args.includes('--write')});
    console.log(`PASS: ${new Set(results.map(r=>r.slug)).size} state-owned manifests / ${results.length} typed outputs ${args.includes('--write')?'generated':'current'}.`);
  } catch(e) {console.error(e.message);process.exitCode=1;}
}
module.exports={generate,render,renderValue,validatePolicy,outputFile};
