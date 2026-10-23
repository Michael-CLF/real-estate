export interface ArkansasDisclosureTerms {
 readonly disclosures: {readonly conditionDisclosureRequired:boolean;readonly sellerBrokerInvolved:boolean;readonly buyerUsesBroker:boolean|null;readonly disclosureExemptionClaimed:boolean;readonly propertyConditionStatus:string;readonly requiredKnownFacts:boolean;readonly statutoryPacketStatus:string;};
 readonly documentVersions?:Readonly<Record<string,string>>;
}
export function arkansasConditionRequired(t:ArkansasDisclosureTerms):boolean {return t.disclosures.conditionDisclosureRequired;}
export function arkansasSubmissionReceiptProblem(t:ArkansasDisclosureTerms):string|undefined {

 if(arkansasConditionRequired(t) && (t.disclosures.propertyConditionStatus!=='received'||!t.documentVersions?.['arkansas-seller-disclosure'])) return 'Review the legally required Arkansas seller condition disclosure and record its exact uploaded version before submitting.';
 return undefined;
}
