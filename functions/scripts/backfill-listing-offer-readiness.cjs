/* Run after deploying protected rules and compiling Functions. Uses your ADC identity, never an embedded key. */
const {getApps,initializeApp}=require('firebase-admin/app');
const {FieldPath}=require('firebase-admin/firestore');
const args=process.argv.slice(2),project=args[args.indexOf('--project')+1];
if(!args.includes('--project')||!project||project.startsWith('--'))throw new Error('Specify --project <Firebase project ID>.');
const apply=args.includes('--apply')&&!args.includes('--dry-run');
if(!getApps().length)initializeApp({projectId:project});
const db=require('../lib/shared/firebase-admin').adminFirestore,{refreshListingOfferReadiness}=require('../lib/listings/refresh-listing-offer-readiness');
(async()=>{let cursor,processed=0,changed=0;for(;;){let q=db.collection('listings').orderBy(FieldPath.documentId()).limit(100);if(cursor)q=q.startAfter(cursor);const page=await q.get();if(page.empty)break;for(const document of page.docs){if(apply)changed+=Number(await refreshListingOfferReadiness(db,document.id));processed++;}cursor=page.docs.at(-1);console.log(JSON.stringify({project,processed,changed,dryRun:!apply}));}console.log('Complete. No listing status, contracts or signatures were changed.');})().catch(error=>{console.error(error);process.exitCode=1;});
