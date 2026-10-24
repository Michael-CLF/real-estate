export interface PennsylvaniaDisclosureTerms {readonly disclosures:{readonly conditionDisclosureRequired:boolean;readonly propertyConditionStatus:string;readonly requiredKnownFacts:boolean;readonly statutoryPacketStatus:string;readonly radonNoticeAcknowledged:boolean|null;};readonly documentVersions?:Readonly<Record<string,string>>;}
export function pennsylvaniaConditionRequired(t:PennsylvaniaDisclosureTerms):boolean{return t.disclosures.conditionDisclosureRequired;}
export function pennsylvaniaSubmissionReceiptProblem(t:PennsylvaniaDisclosureTerms):string|undefined{
 if(t.disclosures.conditionDisclosureRequired&&(t.disclosures.propertyConditionStatus!=='received'||!t.documentVersions?.['pennsylvania-seller-disclosure']))return 'Review the applicable Pennsylvania seller disclosure and record the exact uploaded version before submitting.';
 return undefined;
}
