export interface NorthDakotaDisclosureTerms {readonly disclosures:{readonly conditionDisclosureRequired:boolean;readonly propertyConditionStatus:string;readonly requiredKnownFacts:boolean;readonly statutoryPacketStatus:string;readonly radonNoticeAcknowledged:boolean|null;};readonly documentVersions?:Readonly<Record<string,string>>;}
export function northDakotaConditionRequired(t:NorthDakotaDisclosureTerms):boolean{return t.disclosures.conditionDisclosureRequired;}
export function northDakotaSubmissionReceiptProblem(t:NorthDakotaDisclosureTerms):string|undefined{
 if(t.disclosures.requiredKnownFacts&&(t.disclosures.statutoryPacketStatus!=='received'||!t.documentVersions?.['north-dakota-statutory-packet']))return "Review the applicable North Dakota pre-signing notice and record its exact uploaded version before submitting.";
 return undefined;
}
