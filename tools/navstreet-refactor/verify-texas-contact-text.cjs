const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const project=path.resolve(process.argv[2]||'.'),cases=require('./fixtures/texas-contact-text-cases.cjs');
const {createCompletedContractFixture}=require('./fixtures/completed-contracts.cjs');
const pkg=require(path.join(project,'functions/lib/offers/state-contracts/state-contract-registry.js')).requireStateContractPackage('TX');
const {PDFDocument,decodePDFRawStream}=require(require.resolve('pdf-lib',{paths:[path.join(project,'functions')]}));
const f=require(path.join(project,'functions/lib/offers/state-contracts/texas/contracts/one-to-four-family-resale/trec-20-19-template.js')).TREC_20_19_TEMPLATE.fields;
const out=path.join(project,'tmp/navstreet-texas-contact-text');fs.mkdirSync(out,{recursive:true});
const now=new Date();
function fixture(){
 const value=createCompletedContractFixture(project,'TX',now);
 value.version.terms.notices={buyer:{},seller:{},buyerAgent:{},sellerAgent:{}};
 value.version.terms.attorneys={buyerAttorney:{},sellerAttorney:{}};
 return value;
}
const input=value=>({...value,generatedAt:now,documentStatus:'approved',documentTitle:'Texas contact text check'});
function fields(pdf){return Object.fromEntries(pdf.getForm().getFields().filter(x=>typeof x.getText==='function').map(x=>[x.getName(),x.getText()||'']));}
function text(pdf,start){return pdf.getPages().slice(start).flatMap(p=>p.node.Contents().asArray().flatMap(ref=>{
 const s=Buffer.from(decodePDFRawStream(pdf.context.lookup(ref)).decode()).toString('latin1');
 return [...s.matchAll(/<([0-9A-F]+)>\s*Tj/gi)].map(m=>Buffer.from(m[1],'hex').toString('latin1'));
})).join('\n');}
(async()=>{
 assert.equal(cases.length,16);
 const base=await pkg.generateAgreement(input(fixture())),baseline=await PDFDocument.load(base.buffer),stored=fields(baseline);
 let count=0;
 for(const c of cases)for(const scenario of ['short','overflow','missing']){
  const value=scenario==='missing'?undefined:scenario==='short'?(c.parts.at(-1)==='email'?'sample@example.com':'Short sample END'):
   c.parts.at(-1)==='email'?'a'.repeat(60)+'@'+'b'.repeat(60)+'.example.com':'START '+Array(40).fill('sample').join(' ')+' END';
  const data=fixture();let section=data.version.terms;for(const key of c.parts.slice(0,-1))section=section[key];section[c.parts.at(-1)]=value;
  pkg.validateSubmission(data);const before=JSON.stringify(data),result=await pkg.generateAgreement(input(data));assert.equal(JSON.stringify(data),before);
  const pdf=await PDFDocument.load(result.buffer),actual=fields(pdf),name=f[c.fieldKey];
  assert.equal(result.pageCount,pdf.getPageCount());
  for(const [other,text]of Object.entries(stored))if(other!==name)assert.equal(actual[other],text,c.id+': unrelated field changed');
  if(scenario==='overflow'){
   assert.equal(actual[name],'See appended continuation page.');
   assert(pdf.getPageCount()>base.pageCount);
   assert(text(pdf,base.pageCount).replace(/\s+/g,'').includes(value.replace(/\s+/g,'')),c.id+': continuation text lost');
  }else{assert.equal(actual[name],value||'');assert.equal(pdf.getPageCount(),base.pageCount);}
  fs.writeFileSync(path.join(out,'TX-'+c.id+'-'+scenario+'.pdf'),result.buffer);count++;
 }
 for(const role of ['buyer','seller','buyerAgent','sellerAgent']){
  const data=fixture();data.version.terms.notices[role]={addressLine1:'100 Sample Street',addressLine2:'Suite 200',city:'Sample City',state:'TX',zipCode:'75001'};
  const result=await pkg.generateAgreement(input(data)),pdf=await PDFDocument.load(result.buffer),prefix=role.endsWith('Agent')?role:role+'Notice';
  assert.equal(pdf.getForm().getTextField(f[prefix+'AddressLine1']).getText(),'100 Sample Street');
  assert.equal(pdf.getForm().getTextField(f[prefix+'AddressLine2']).getText(),'Suite 200, Sample City TX 75001');
  assert.equal(result.pageCount,base.pageCount);
 }
 assert.equal(count,48);
 console.log('PASS: '+count+' PDFs covering sixteen TX notice/attorney fields; short/overflow/missing values, complete drawn continuation text, unrelated field retention, four address-composition cases and unchanged inputs.');
 console.log('Phone/fax formatting, other fixed fields, cached documents and live signing are not changed by this batch.');
})().catch(error=>{console.error(error);process.exitCode=1;});
