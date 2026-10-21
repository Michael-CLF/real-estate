export function validateMissouriSpecialProperty(contractType:string, special:any, sellerHasLeases:boolean|null, now:Date=new Date()):readonly {fieldPath:string;message:string}[] {
 const errors:{fieldPath:string;message:string}[]=[];
 const error=(key:string,message:string)=>errors.push({fieldPath:'specialProperty.'+key,message});
 if(contractType==='navstreet_missouri_residential_sale_2026')return errors;
 // Condominium identification comes from the trusted listing, not mandatory buyer entries.
 if(!special){error('projectName','The selected property-specific agreement terms are missing.');return errors;}
 if(contractType==='navstreet_missouri_condominium_resale_2026') {
  if(special.resaleCertificateStatus==='received') {
   const value=special.certificateReceivedDate;
   const parsed=Date.parse(value+'T12:00:00Z');
   const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
   if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(parsed)||new Date(parsed).toISOString().slice(0,10)!==value||value>today)error('certificateReceivedDate','Enter the actual receipt date, not a future date.');
  }
 }
 if(contractType==='navstreet_missouri_land_sale_2026') {
  if(!special.intendedUse?.trim())error('intendedUse','Describe the intended land use.');
  if(typeof special.surveyRequired!=='boolean')error('surveyRequired','Choose whether a current survey is required.');
  if(special.landReviewAcknowledged!==true)error('landReviewAcknowledged','Acknowledge the land investigation conditions.');
 }
 if(contractType==='navstreet_missouri_small_multifamily_resale_2026') {
  if(sellerHasLeases===true?!['received','pending'].includes(special.tenantDocumentsStatus):special.tenantDocumentsStatus!=='not_applicable')error('tenantDocumentsStatus','Match the tenant-document selection to the seller’s lease statement.');
  if(special.tenancyTransferAcknowledged!==true)error('tenancyTransferAcknowledged','Acknowledge lawful tenancies and rent/deposit accounting.');
 }
 return errors;
}
