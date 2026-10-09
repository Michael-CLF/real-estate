// All mapped free text is audited at its actual appearance size, not by character count.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const project=path.resolve(process.argv[2]||'.');
const {createCompletedContractFixture}=require('./fixtures/completed-contracts.cjs');
const registry=require(path.join(project,'functions/lib/offers/state-contracts/state-contract-registry.js'));
const {PDFDocument,StandardFonts,decodePDFRawStream}=require(require.resolve('pdf-lib',{paths:[path.join(project,'functions')]}));
const out=path.join(project,'tmp/navstreet-pdf-capacity');fs.mkdirSync(out,{recursive:true});
function set(data,field,value){const keys=field.split('.'),last=keys.pop();let t=data.version.terms;for(const key of keys)t=t[key]??= {};t[last]=value;}
function text(pdf,start){return pdf.getPages().slice(start).flatMap(p=>p.node.Contents().asArray().flatMap(ref=>{
 const s=Buffer.from(decodePDFRawStream(pdf.context.lookup(ref)).decode()).toString('latin1');
 return [...s.matchAll(/<([0-9A-F]+)>\s*Tj/gi)].map(m=>Buffer.from(m[1],'hex').toString('latin1'));
})).join('\n');}
function checkFields(pdf,font,label){for(const f of pdf.getForm().getFields())if(typeof f.getText==='function'){
 const value=f.getText()||'';if(!value)continue;
 const size=Number((f.acroField.getDefaultAppearance()||'').match(/([0-9.]+)\s+Tf/)?.[1])||9;
 const width=Math.min(...f.acroField.getWidgets().map(w=>w.getRectangle().width-4));
 assert(!/[\r\n]/.test(value),label+': newline in '+f.getName());
 assert(font.widthOfTextAtSize(value,size)<=width+.01,label+': clipped '+f.getName());
}}
const cases=[];
for(const field of ['propertyIdentification.lot','propertyIdentification.block','propertyIdentification.addition','property.city','property.county','property.addressLine1',
 'earnestMoneyAndOption.escrowAgentName','titlePolicy.titleCompanyName','survey.prohibitedUseOrActivity'])cases.push({code:'TX',id:field,field});
for(const role of ['buyer','seller','buyerAgent','sellerAgent'])cases.push({code:'TX',id:'notices.'+role+'.phone',field:'notices.'+role+'.phone'});
for(const role of ['buyerAttorney','sellerAttorney'])for(const key of ['phone','fax'])cases.push({code:'TX',id:role+'.'+key,field:'attorneys.'+role+'.'+key});
for(const field of ['property.addressLine1','property.addressLine2','property.city','property.county','property.zipCode'])cases.push({code:'OK',id:field,field});
for(const code of ['TX','OK'])for(const role of ['buyers','sellers'])cases.push({code,id:role,role});
for(const c of require('./fixtures/fixed-form-text-cases.cjs'))cases.push({code:c.code,id:c.id,field:c.fieldPath,multiline:true,width:c.width});
for(const code of ['TX','OK'])cases.push({code,id:'provisions',field:code==='TX'?'specialProvisions.partyProvidedText':'additionalProvisions.partyProvidedText',multiline:true,width:105});
(async()=>{
 let count=0,baseline={};const now=new Date();
 for(const code of ['TX','OK']){
  const pkg=registry.requireStateContractPackage(code),data=createCompletedContractFixture(project,code,now);
  const r=await pkg.generateAgreement({...data,generatedAt:now,documentStatus:'approved',documentTitle:'Capacity baseline'});
  const pdf=await PDFDocument.load(r.buffer);baseline[code]={pages:r.pageCount};
  checkFields(pdf,await pdf.embedFont(StandardFonts.Helvetica),code+' baseline');
  if(code==='OK')assert.equal(pdf.getForm().getTextField('Text Field 141').getText(),'Sample buyer');
 }
 for(const c of cases)for(const scenario of ['short','wide','multiline']){
  const value=scenario==='short'?'Short END':scenario==='wide'?'W'.repeat(c.multiline?Math.min(c.width,60):180)+' END':'First line\nSecond line COMPLETE END';
  const data=createCompletedContractFixture(project,c.code,now);
  if(c.role){data.version[c.role]=Array.from({length:4},(_,i)=>({...data.version[c.role][0],partyUid:c.role+i,userUid:c.role+i,sequence:i+1,legalName:value+' PARTY'+i}));}
  else set(data,c.field,value);
  if(c.id==='provisions'){const s=c.code==='TX'?data.version.terms.specialProvisions:data.version.terms.additionalProvisions;s.included=true;if(c.code==='TX')s.preparedBy='buyer';}
  const pkg=registry.requireStateContractPackage(c.code),before=JSON.stringify(data);
  const r=await pkg.generateAgreement({...data,generatedAt:now,documentStatus:'approved',documentTitle:c.id});assert.equal(JSON.stringify(data),before);
  const pdf=await PDFDocument.load(r.buffer),font=await pdf.embedFont(StandardFonts.Helvetica);checkFields(pdf,font,c.code+' '+c.id+' '+scenario);
  const canonical=pdf.getForm().getFields().filter(f=>typeof f.getText==='function').map(f=>f.getText()||'').join(' ');
  const rendered=text(pdf,baseline[c.code].pages),normalize=s=>s.replace(/\s+/g,'');
  assert(normalize(canonical+' '+rendered).includes(normalize(value)),c.id+': text missing');
  if(c.role)for(let i=0;i<4;i++)assert(normalize(canonical+' '+rendered).includes(normalize(value+' PARTY'+i)),c.id+': party missing');
  fs.writeFileSync(path.join(out,c.code+'-'+c.id.replace(/\./g,'-')+'-'+scenario+'.pdf'),r.buffer);count++;
 }
 console.log('PASS: '+count+' TX/OK capacity PDFs: all populated canonical fields fit actual geometry; wide letters/newlines, remaining names/property/phones, multiline groups, four-party retention and OK buyer execution names.');
})().catch(e=>{console.error(e);process.exitCode=1;});
