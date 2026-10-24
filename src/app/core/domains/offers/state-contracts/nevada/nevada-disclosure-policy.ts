export interface NevadaDisclosureTerms {readonly disclosures:{readonly conditionDisclosureRequired:boolean;readonly propertyConditionStatus:string;readonly requiredKnownFacts:boolean;readonly statutoryPacketStatus:string;readonly radonNoticeAcknowledged:boolean|null;};readonly documentVersions?:Readonly<Record<string,string>>;}
export function nevadaConditionRequired(t:NevadaDisclosureTerms):boolean{return t.disclosures.conditionDisclosureRequired;}
export function nevadaSubmissionReceiptProblem(t:NevadaDisclosureTerms):string|undefined{
 if(t.disclosures.conditionDisclosureRequired&&(t.disclosures.propertyConditionStatus!=='received'||!t.documentVersions?.['nevada-seller-disclosure']))return 'Review the applicable Nevada seller disclosure and record the exact uploaded version before submitting.';
 if(t.disclosures.requiredKnownFacts&&(t.disclosures.statutoryPacketStatus!=='received'||!t.documentVersions?.['nevada-statutory-packet']))return 'Review the applicable Nevada pre-signing notice and record its exact uploaded version before submitting.';
 return undefined;
}
