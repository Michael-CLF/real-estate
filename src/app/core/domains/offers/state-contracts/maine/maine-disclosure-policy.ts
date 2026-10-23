export interface MaineDisclosureTerms {
 readonly disclosures: {readonly conditionDisclosureRequired:boolean;readonly sellerBrokerInvolved:boolean;readonly buyerUsesBroker:boolean|null;readonly disclosureExemptionClaimed:boolean;readonly propertyConditionStatus:string;readonly requiredKnownFacts:boolean;readonly statutoryPacketStatus:string;};
 readonly documentVersions?:Readonly<Record<string,string>>;
}
export function maineConditionRequired(t:MaineDisclosureTerms):boolean {return t.disclosures.conditionDisclosureRequired;}
export function maineSubmissionReceiptProblem(t:MaineDisclosureTerms):string|undefined {

 if(maineConditionRequired(t) && (t.disclosures.propertyConditionStatus!=='received'||!t.documentVersions?.['maine-seller-disclosure'])) return 'Review the legally required Maine seller condition disclosure and record its exact uploaded version before submitting.';
 return undefined;
}
