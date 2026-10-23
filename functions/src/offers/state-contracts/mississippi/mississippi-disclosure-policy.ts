export interface MississippiDisclosureTerms {readonly disclosures:{readonly conditionDisclosureRequired:boolean;readonly propertyConditionStatus:string;};readonly documentVersions?:Readonly<Record<string,string>>;}
/** Private no-broker FSBO transfers have no universal state condition-form gate. */
export function mississippiConditionRequired(_t:MississippiDisclosureTerms):boolean{return false;}
export function mississippiSubmissionReceiptProblem(_t:MississippiDisclosureTerms):string|undefined{return undefined;}
