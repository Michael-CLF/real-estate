const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');const assert=require('node:assert/strict');
const project=path.resolve(process.argv[2]||'.');
const ts=require(require.resolve('typescript',{paths:[project,path.join(project,'functions')]}));
const compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const registryPath=path.join(project,'src/app/features/offers/engine/display/state-offer-display.registry.ts');
function load(source,filename,override) {const module={exports:{}};vm.runInNewContext(compile(source),{module,exports:module.exports,Date,require:name=>{
 const dependency=path.resolve(path.dirname(filename),name+'.ts');
 if(override&&name.includes('california-offer-display.adapter'))return override;
 return load(fs.readFileSync(dependency,'utf8'),dependency);
}});return module.exports;}
const current=load(fs.readFileSync(registryPath,'utf8'),registryPath);
const legacy=load("import { southCarolinaOfferDisplayAdapter } from '../../states/south-carolina/display/south-carolina-offer-display.adapter';\nimport { californiaOfferDisplayAdapter } from '../../states/california/display/california-offer-display.adapter';\nimport type {\n  StateOfferTerms,\n} from '../../../../core/domains/offers/models/offer-terms.model';\n\nimport type {\n  OfferDisplayFields,\n} from './state-offer-display.adapter';\n\nimport {\n  northCarolinaOfferDisplayAdapter,\n} from '../../states/north-carolina/display/north-carolina-offer-display.adapter';\n\nimport {\n  texasOfferDisplayAdapter,\n} from '../../states/texas/display/texas-offer-display.adapter';\n\nimport {\n  oklahomaOfferDisplayAdapter,\n} from '../../states/oklahoma/display/oklahoma-offer-display.adapter';\n\nimport {\n  utahOfferDisplayAdapter,\n} from '../../states/utah/display/utah-offer-display.adapter';\n\nimport {\n  wisconsinOfferDisplayAdapter,\n} from '../../states/wisconsin/display/wisconsin-offer-display.adapter';\n\nimport {\n  floridaOfferDisplayAdapter,\n} from '../../states/florida/display/florida-offer-display.adapter';\nimport { louisianaOfferDisplayAdapter } from '../../states/louisiana/display/louisiana-offer-display.adapter';\nimport { coloradoOfferDisplayAdapter } from '../../states/colorado/display/colorado-offer-display.adapter';\n\n/**\n * The state stored on the offer version and the state stored\n * in its immutable contract terms must agree.\n */\nexport function displayOfferTerms(\n  version: {\n    readonly stateCode: string;\n    readonly terms: StateOfferTerms;\n  }\n): OfferDisplayFields {\n  const state = version.stateCode.trim().toUpperCase();\n\n  if (state !== version.terms.stateCode) {\n    throw new Error(\n      'Offer version and contract terms have different states.'\n    );\n  }\n\n  switch (version.terms.stateCode) {\n    case 'NC':\n      return northCarolinaOfferDisplayAdapter.display(version.terms);\n\n    case 'TX':\n      return texasOfferDisplayAdapter.display(version.terms);\n\n    case 'OK':\n      return oklahomaOfferDisplayAdapter.display(version.terms);\n\n    case 'UT':\n      return utahOfferDisplayAdapter.display(version.terms);\n\n    case 'WI':\n      return wisconsinOfferDisplayAdapter.display(version.terms);\n\n    case 'FL':\n      return floridaOfferDisplayAdapter.display(version.terms);\n    case 'LA':\n      return louisianaOfferDisplayAdapter.display(version.terms);\n    case 'SC':\n      return southCarolinaOfferDisplayAdapter.display(version.terms);\n    case 'CA':\n      return californiaOfferDisplayAdapter.display(version.terms);\n    case 'CO':\n      return coloradoOfferDisplayAdapter.display(version.terms);\n\n    default:\n      throw new Error(\n        `No offer display adapter is registered for ${state}.`\n      );\n  }\n}",registryPath);
const backend=require(path.join(project,'functions/lib/offers/state-contracts/state-contract-registry.js'));
let comparisons=0;
for(const code of ['NC','TX','OK','UT','WI','FL','LA','CO','CA','SC']) {
 const pkg=backend.requireStateContractPackage(code);
 const property={listingUid:'sample',addressLine1:'100 Sample Street',city:'Sample City',state:code,zipCode:'00000',county:'Sample County',legalDescription:'Sample lot 1',propertyType:'single_family',yearBuilt:2000,listPriceInCents:35000000};
 const party={email:'sample@example.com',legalName:'Sample Party',phone:'9195550100',mailingAddress:{addressLine1:'100 Sample Street',city:'Sample City',state:code,zipCode:'00000',country:'US'}};
 const initial=pkg.createInitialOfferTerms({contractType:pkg.contractTypes[0],property,buyer:party,seller:party,
  listingData:{sellerStatements:{ownershipStatus:'owned_at_least_one_year',fuelTankPresent:false,leadBasedPaintApplies:false,ownersAssociationApplies:false,leasesExist:false,generalLeasesExist:false},coloradoPropertyFacts:{}}});
 for(let variant=0;variant<4;variant++) {
  const terms=JSON.parse(JSON.stringify(initial));
  function vary(value){for(const [key,entry] of Object.entries(value)){
   if(typeof entry==='number'&&key!=='yearBuilt')value[key]=variant===1?0:entry+variant*100;
   else if(typeof entry==='boolean'&&variant===2)value[key]=!entry;
   else if(entry&&typeof entry==='object')vary(entry);
  }}vary(terms);
  if(variant===3){for(const group of ['purchase','salesPrice','financing'])if(terms[group]&&'financingType' in terms[group])terms[group].financingType='cash';}
  const version={stateCode:' '+code.toLowerCase()+' ',terms};
  assert.equal(JSON.stringify(current.displayOfferTerms(version)),JSON.stringify(legacy.displayOfferTerms(version)));comparisons++;
 }
 assert.throws(()=>current.displayOfferTerms({stateCode:'XX',terms:initial}),/different states/);
}
assert.throws(()=>current.displayOfferTerms({stateCode:'XX',terms:{stateCode:'XX'}}),/No offer display adapter/);
assert.throws(()=>load(fs.readFileSync(registryPath,'utf8'),registryPath,{californiaOfferDisplayAdapter:{stateCode:'SC',display:()=>({})}}),/More than one/);
console.log(`PASS: ${comparisons} real ten-state display comparisons against pre-extraction routing; mismatched/unknown states and duplicate registration rejected.`);
