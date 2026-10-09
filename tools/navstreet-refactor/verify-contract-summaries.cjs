const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const project=path.resolve(process.argv[2]||'.'),{CODES,createCompletedContractFixture}=require('./fixtures/completed-contracts.cjs');
const registry=require(path.join(project,'functions/lib/offers/state-contracts/state-contract-registry.js'));
const {prependNavStreetContractSummary}=require(path.join(project,'functions/lib/offers/state-contracts/navstreet-pdf-layout.js'));
const {PDFDocument}=require(require.resolve('pdf-lib',{paths:[path.join(project,'functions')]}));
const out=path.join(project,'tmp/navstreet-contract-summaries');fs.mkdirSync(out,{recursive:true});
function fields(d){return d.getForm().getFields().map(f=>[f.getName(),typeof f.getText==='function'?f.getText():typeof f.isChecked==='function'?f.isChecked():null]);}
(async()=>{
 const manifest=[];let count=0;
 for(const code of CODES)for(const mode of ['cash','financed','many-parties']){
  const now=new Date(),data=createCompletedContractFixture(project,code,now,mode==='financed'?'financed':'cash'),pkg=registry.requireStateContractPackage(code);
  const names=[];
  if(mode==='many-parties')data.version.buyers=Array.from({length:180},(_,index)=>{
   const name='SUMMARYPARTY'+String(index).padStart(3,'0')+' '+Array(8).fill('Extended sample legal name').join(' ');names.push(name);
   return {...data.version.buyers[0],partyUid:'buyer'+index,userUid:'buyer'+index,sequence:index+1,legalName:name};
  });
  const input={...data,generatedAt:now,documentStatus:'approved',documentTitle:code+' summary check'},before=JSON.stringify(data),rows=pkg.getAgreementSummary(input);
  assert(rows.some(r=>/purchase price/i.test(r.label)),code+': price missing');assert(rows.some(r=>/(loan|financing) amount/i.test(r.label)),code+': loan missing');
  assert(rows.some(r=>/down payment/i.test(r.label)),code+': down payment missing');
  if(mode==='financed'&&['NC','OK'].includes(code))assert(rows.find(r=>/(loan|financing) amount/i.test(r.label)).value.includes('Not specified'));
  const base=await pkg.generateAgreement(input),result=await prependNavStreetContractSummary(input,rows,base);
  assert.equal(JSON.stringify(data),before);const old=await PDFDocument.load(base.buffer),pdf=await PDFDocument.load(result.buffer);
  assert.deepEqual(fields(pdf),fields(old),code+': summary changed original AcroForm');
  assert.equal(result.pageCount,pdf.getPageCount());const summaryPages=pdf.getPageCount()-old.getPageCount();assert(summaryPages>0);
  if(mode==='many-parties')assert(summaryPages>1,code+': oversized row not paginated');
  const file=code+'-'+mode+'.pdf';fs.writeFileSync(path.join(out,file),result.buffer);
  manifest.push({file,code,mode,summaryPages,rows,names});count++;
 }
 fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));
 console.log('PASS: '+count+' ten-state cash/financed/large-party summaries; funding labels, NC/OK unspecified loan values, summary pagination, original form retention and unchanged inputs.');
 console.log('Printed summary values still require rendered/text inspection; generation alone is not visual acceptance.');
})().catch(e=>{console.error(e);process.exitCode=1;});
