const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const project=path.resolve(process.argv[2]||'.'),{CODES,createCompletedContractFixture}=require('./fixtures/completed-contracts.cjs');
const {Timestamp}=require(require.resolve('firebase-admin/firestore',{paths:[path.join(project,'functions')]}));
const {PDFDocument}=require(require.resolve('pdf-lib',{paths:[path.join(project,'functions')]}));
const registry=require(path.join(project,'functions/lib/offers/state-contracts/state-contract-registry.js'));
const out=path.join(project,'tmp/navstreet-party-pdf-layout');fs.mkdirSync(out,{recursive:true});
(async()=>{const manifest=[];let count=0;
 for(const code of CODES)for(const mode of ['pending','signed']){
  const now=new Date(),data=createCompletedContractFixture(project,code,now,'financed'),names=[];
  for(const role of ['buyers','sellers'])data.version[role]=Array.from({length:4},(_,i)=>{
   const legalName=role+i+' '+Array(25).fill('WideName').join(' ')+' END';names.push(legalName);
   return {...data.version[role][0],partyUid:role+i,userUid:role+i,sequence:i+1,legalName,email:'a'.repeat(110)+'@example.com',
    signature:mode==='signed'?{status:'signed',signedAt:Timestamp.fromDate(now)}:{status:'not_started'}};
  });
  const pkg=registry.requireStateContractPackage(code),before=JSON.stringify(data),result=await pkg.generateAgreement({...data,generatedAt:now,documentStatus:'approved',documentTitle:code+' party check'});
  const pdf=await PDFDocument.load(result.buffer);assert.equal(result.pageCount,pdf.getPageCount(),code+': page count');assert.equal(JSON.stringify(data),before);
  const file=code+'-'+mode+'.pdf';fs.writeFileSync(path.join(out,file),result.buffer);manifest.push({file,code,mode,names,pageCount:result.pageCount});count++;
 }
 fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));
 console.log('PASS: '+count+' ten-state eight-party pending/signed PDFs with long names and emails; actual page counts and immutable inputs. Printed names/signatures require rendered/text inspection.');
})().catch(e=>{console.error(e);process.exitCode=1;});
