const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
const project=path.resolve(process.argv[2]||'.');
const r=require(path.join(project,'functions/lib/offers/state-contracts/state-contract-registry.js'));
const {prependNavStreetContractSummary}=require(path.join(project,'functions/lib/offers/state-contracts/navstreet-pdf-layout.js'));
const {PDFDocument}=require(require.resolve('pdf-lib',{paths:[path.join(project,'functions')]}));
const out=path.resolve(process.argv[3]||path.join(project,'tmp/navstreet-pdf-audit'));fs.mkdirSync(out,{recursive:true});
(async()=>{for(const code of ['NC','TX','OK','UT','WI','FL','LA','CO','CA','SC']){try{
const p=r.requireStateContractPackage(code);
const party=role=>({partyUid:role,userUid:role,role,capacity:'individual',firstName:'Sample',lastName:role,legalName:'Sample '+role,email:role+'@example.com',phone:'9195550100',mailingAddress:{addressLine1:'100 Sample Street',city:'Sample City',state:code,zipCode:'00000',country:'US'},sequence:1,primaryParty:true,requiredSigner:true,identityVerification:{status:'not_started'},signature:{status:'pending'}});
const property={listingUid:'sample',addressLine1:'100 Sample Street',city:'Sample City',state:code,zipCode:'00000',county:'Sample County',legalDescription:'Sample lot 1',propertyType:'single_family',yearBuilt:2000,listPriceInCents:35000000};
const terms=p.createInitialOfferTerms({contractType:p.contractTypes[0],property,buyer:party('buyer'),seller:party('seller'),listingData:{sellerStatements:{ownershipStatus:"owned_at_least_one_year",fuelTankPresent:false,leadBasedPaintApplies:false,ownersAssociationApplies:false,leasesExist:false,generalLeasesExist:false},coloradoPropertyFacts:{},southCarolinaReadiness:{}}});
const version={Uid:'sample-version',stateCode:code,versionNumber:1,terms,buyers:[party('buyer')],sellers:[party('seller')],status:'draft',documents:[]};
const input={offer:{Uid:'sample',referenceNumber:'SAMPLE-'+code},version,documentTitle:'Sample '+code+' Agreement',generatedAt:new Date('2026-10-08T12:00:00Z'),documentStatus:'prototype'};
const agreement=await p.generateAgreement(input);
assert.equal((await PDFDocument.load(agreement.buffer)).getPageCount(),agreement.pageCount,code+": unexpected PDF pages, possibly footer overflow");
const pdf=await prependNavStreetContractSummary(input,p.getAgreementSummary(input),agreement);
const parsed=await PDFDocument.load(pdf.buffer);assert.equal(parsed.getPageCount(),pdf.pageCount);assert(pdf.pageCount>agreement.pageCount);assert.equal(pdf.buffer.subarray(0,5).toString(),'%PDF-');
fs.writeFileSync(path.join(out,code+'.pdf'),pdf.buffer);console.log(code,pdf.pageCount,pdf.buffer.length);
}catch(e){console.error(code,'FAIL',e.stack);process.exitCode=1}}})()

// These intentionally incomplete draft samples exercise rendering, not submission eligibility or legal sufficiency.
