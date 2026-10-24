const path=require('node:path');
async function stubReviewedNotice(project,code){
 const {PDFDocument,StandardFonts}=require(require.resolve('pdf-lib',{paths:[path.join(project,'functions')]}));
 const slug=code==='NV'?'nevada':'north-dakota',mod=require(path.join(project,'functions/lib/offers/state-contracts',slug,slug+'-signed-notice-copy.js'));
 mod.reviewedNoticeReader.read=async(listingUid,type,versionId)=>{
  if(!listingUid||type!==slug+'-statutory-packet'||!versionId)throw new Error('Unexpected notice identity.');
  const pdf=await PDFDocument.create(),page=pdf.addPage();page.drawText('SYNTHETIC '+code+' SELLER NOTICE COPY - '+versionId,{x:40,y:700,size:12,font:await pdf.embedFont(StandardFonts.Helvetica)});page.drawText('TEST FIXTURE ONLY - NOT A LEGAL DISCLOSURE',{x:40,y:670,size:12});return Buffer.from(await pdf.save());
 };
}
module.exports={stubReviewedNotice};
