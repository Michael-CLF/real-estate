export interface IllinoisDisclosureTerms {
 readonly disclosures: {readonly conditionDisclosureRequired:boolean;readonly sellerBrokerInvolved:boolean;readonly buyerUsesBroker:boolean|null;readonly disclosureExemptionClaimed:boolean;readonly propertyConditionStatus:string;readonly requiredKnownFacts:boolean;readonly statutoryPacketStatus:string;readonly radonNoticeAcknowledged:boolean|null;};
 readonly documentVersions?:Readonly<Record<string,string>>;
}
export function illinoisConditionRequired(t:IllinoisDisclosureTerms):boolean {return t.disclosures.conditionDisclosureRequired;}
export function illinoisSubmissionReceiptProblem(t:IllinoisDisclosureTerms):string|undefined {

 if(illinoisConditionRequired(t) && (t.disclosures.propertyConditionStatus!=='received'||!t.documentVersions?.['illinois-seller-disclosure'])) return 'Review the legally required Illinois seller condition disclosure and record its exact uploaded version before submitting.';
 if(t.disclosures.requiredKnownFacts && (t.disclosures.statutoryPacketStatus!=='received' || !t.documentVersions?.['illinois-statutory-packet'] || t.disclosures.radonNoticeAcknowledged!==true)) return 'Review the uploaded Illinois radon disclosure and approved pamphlet and acknowledge their actual receipt before submitting.';
 return undefined;
}
