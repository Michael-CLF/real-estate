import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../../../core/infrastructure/firebase/firebase';
import { AuthService } from '../../../../../core/authentication/services/auth.service';
import { ListingDisclosureService } from '../../../../../core/domains/disclosures/services/listing-disclosure.service';
import type { ListingDisclosureDocument } from '../../../../../core/domains/disclosures/models/listing-disclosure-document.model';
import type { IowaOfferTerms } from '../../../../../core/domains/offers/state-contracts/iowa/models/iowa-offer-terms.model';
import type { Offer } from '../../../../../core/domains/offers/models/offer.model';
import type { OfferVersion } from '../../../../../core/domains/offers/models/offer-version.model';
import { IOWA_LATE_RECEIPT_STATEMENT, IOWA_RADON_ASSET, IOWA_RADON_VERSION, iowaLateReceipts, iowaLateReceiptCoversBuyer, iowaLateReceiptsCover } from '../../../../../core/domains/offers/state-contracts/iowa/iowa-disclosure-policy';

@Component({selector:'app-iowa-disclosure-receipt',standalone:true,imports:[FormsModule],changeDetection:ChangeDetectionStrategy.OnPush,
 template:`@if (needsReceipt()) {
 <section class="receipt-card" aria-labelledby="iowa-receipt-heading">
  <p class="kicker">Iowa disclosure delivery</p><h2 id="iowa-receipt-heading">Later buyer receipt</h2>
  <p>The original signed offer records receipt as pending. Keep that agreement unchanged and record actual later delivery here. This does not accept the offer or waive statutory rights.</p>
  @if (complete()) { <p role="status">A buyer has recorded actual receipt. The seller may respond to the offer.</p> }
  @else { <p>Seller: upload the completed condition disclosure or supported exception under Property disclosures. Then a buyer can open this offer and acknowledge actual receipt below.</p> }
  @for (receipt of receipts(); track receipt.receiptUid) {
   <p>{{receipt.typedName}} — separate written receipt recorded.</p>
   <button type="button" (click)="download(receipt.receiptUid)" [disabled]="busy()">Download written receipt</button>
  }
  @if (buyer(); as person) {
   @if (!buyerComplete() && !complete()) {
    @if (document(); as disclosure) {
     <button type="button" (click)="openCondition(disclosure)" [disabled]="busy()">Read seller disclosure / exception</button>
     <p class="version">Disclosure version: {{disclosure.versionId}}</p>
     <p><a [href]="radonUrl" target="_blank" rel="noopener" (click)="radonOpened.set(true)">Read official Iowa radon fact sheet (PDF)</a></p>
     <p>{{statement}}</p>
     <label class="check"><input type="checkbox" [ngModel]="acknowledged()" (ngModelChange)="acknowledged.set($event)" [disabled]="!conditionOpened() || !radonOpened()" /> I received and reviewed both identified documents.</label>
     <label>Type your legal name as your electronic signature<input type="text" [ngModel]="typedName()" (ngModelChange)="typedName.set($event)" (blur)="nameTouched.set(true)" autocomplete="name" /></label>
     @if (nameTouched() && typedName().trim()!==person.legalName.trim()) { <p class="error">Use the legal name on this offer: {{person.legalName}}</p> }
     <button type="button" [disabled]="!canRecord() || busy()" (click)="recordReceipt()">Sign and record actual receipt</button>
    } @else if (!loading()) { <p>The seller disclosure or supported exception has not been uploaded yet.</p> }
   }
  }
  @if (loading()) { <p role="status">Loading disclosure…</p> }
  @if (error()) { <p class="error" role="alert">{{error()}}</p> }
 </section>
 }`,
 styles:[`.receipt-card{background:#fff;border:1px solid #dce3eb;border-radius:16px;padding:24px;margin-bottom:20px;color:#243447}.kicker{font-size:.75rem;text-transform:uppercase;letter-spacing:.1em;color:#62758a}h2{font-size:1.2rem}p,label{font-size:.9rem;line-height:1.5}label{display:block;margin:16px 0}input[type=text]{display:block;box-sizing:border-box;width:100%;padding:10px;border:1px solid #b8c5d3;border-radius:6px;margin-top:6px}.check{display:flex;gap:8px;align-items:flex-start}button{display:block;width:100%;padding:11px;border:1px solid #bac7d5;border-radius:8px;background:#f4f7fa;color:#163a5c;margin:12px 0;cursor:pointer}button:disabled{opacity:.5;cursor:default}.error{color:#a42929}.version{overflow-wrap:anywhere;font-size:.75rem}`]})
export class IowaDisclosureReceiptComponent {
 readonly offer=input.required<Offer>();readonly version=input.required<OfferVersion<IowaOfferTerms>>();
 private readonly auth=inject(AuthService);private readonly disclosures=inject(ListingDisclosureService);
 readonly document=signal<ListingDisclosureDocument|null>(null);readonly loading=signal(false);readonly busy=signal(false);readonly error=signal('');
 readonly acknowledged=signal(false);readonly typedName=signal('');readonly nameTouched=signal(false);readonly conditionOpened=signal(false);readonly radonOpened=signal(false);
 readonly radonUrl=IOWA_RADON_ASSET;readonly statement=IOWA_LATE_RECEIPT_STATEMENT;
 readonly needsReceipt=computed(()=>{const t=this.version().terms;return t.stateCode==='IA' && !t.disclosurePolicyRevision && this.version().immutable && ['delivered','signed'].includes(this.version().status) && ['submitted','viewed','countered','draft'].includes(this.offer().status) && (!['received','exempt'].includes(t.disclosures.propertyConditionStatus)||(t.disclosures.requiredKnownFacts && t.disclosures.statutoryPacketStatus!=='received'));});
 readonly buyer=computed(()=>this.version().buyers.find(p=>p.requiredSigner && p.userUid===this.auth.currentUserUid)??null);
 readonly receipts=computed(()=>iowaLateReceipts(this.offer()));
 readonly complete=computed(()=>{const t=this.version().terms;return t.stateCode==='IA' && iowaLateReceiptsCover(this.offer(),this.version().buyers,t);});
 readonly buyerComplete=computed(()=>{const t=this.version().terms;return t.stateCode==='IA' && iowaLateReceiptCoversBuyer(this.offer(),this.buyer(),t);});
 readonly canRecord=computed(()=>!!this.document() && this.acknowledged() && this.conditionOpened() && this.radonOpened() && this.typedName().trim()===this.buyer()?.legalName.trim());
 constructor(){effect(()=>{if(this.needsReceipt()) void this.load(this.offer().listingUid);});}
 private async load(listingUid:string):Promise<void>{this.loading.set(true);this.error.set('');try{this.document.set(await this.disclosures.getCurrentDisclosure(listingUid,'iowa-seller-disclosure'));}catch(e){this.error.set(e instanceof Error?e.message:'The disclosure could not be loaded.');}finally{this.loading.set(false);}}
 async openCondition(document:ListingDisclosureDocument):Promise<void>{this.error.set('');try{await this.disclosures.openDisclosure(document);this.conditionOpened.set(true);}catch(e){this.error.set(e instanceof Error?e.message:'The disclosure could not be opened.');}}
 async recordReceipt():Promise<void>{const document=this.document(),buyer=this.buyer();if(!document||!buyer||!this.canRecord()||this.busy())return;this.busy.set(true);this.error.set('');try{await httpsCallable(functions,'recordIowaDisclosureReceipt')({offerUid:this.offer().Uid,offerVersionUid:this.version().Uid,partyUid:buyer.partyUid,conditionVersionId:document.versionId,radonFactSheetVersion:IOWA_RADON_VERSION,typedName:this.typedName().trim(),acknowledged:true});window.location.reload();}catch(e){this.error.set(e instanceof Error?e.message:'Receipt could not be recorded. Refresh if the disclosure changed.');this.busy.set(false);}}
 async download(receiptUid:string):Promise<void>{if(this.busy())return;this.busy.set(true);this.error.set('');try{const result=await httpsCallable<{offerUid:string;receiptUid:string},{base64:string;fileName:string}>(functions,'getIowaDisclosureReceiptPdf')({offerUid:this.offer().Uid,receiptUid});const bytes=Uint8Array.from(atob(result.data.base64),c=>c.charCodeAt(0));const url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));const link=document.createElement('a');link.href=url;link.download=result.data.fileName;link.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}catch(e){this.error.set(e instanceof Error?e.message:'Receipt download failed.');}finally{this.busy.set(false);}}
}
