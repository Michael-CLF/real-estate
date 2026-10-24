export interface GeorgiaDisclosureTerms {readonly disclosures:{readonly conditionDisclosureRequired:boolean;readonly propertyConditionStatus:string;readonly requiredKnownFacts:boolean;readonly statutoryPacketStatus:string;readonly radonNoticeAcknowledged:boolean|null;};readonly documentVersions?:Readonly<Record<string,string>>;}
export function georgiaConditionRequired(t:GeorgiaDisclosureTerms):boolean{return t.disclosures.conditionDisclosureRequired;}
export function georgiaSubmissionReceiptProblem(t:GeorgiaDisclosureTerms):string|undefined{
 if(t.disclosures.conditionDisclosureRequired&&(t.disclosures.propertyConditionStatus!=='received'||!t.documentVersions?.['georgia-seller-disclosure']))return 'Review the applicable Georgia seller disclosure and record the exact uploaded version before submitting.';
 return undefined;
}
