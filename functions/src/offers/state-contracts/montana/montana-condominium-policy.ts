export function montanaCondominiumReceiptProblem(t: {contractType:string;disclosures:{hoaDocumentsStatus:string;sellerReportsHoa:boolean|null};documentVersions?:Readonly<Record<string,string>>;condominiumReceiptAt?:string;condominiumAcceptancePolicy?:'accept_during_review_v2'}, now = Date.now()): string | undefined {
 if (t.contractType !== 'navstreet_montana_condominium_resale_2026') return;
 if (t.disclosures.sellerReportsHoa !== true) return 'Condominium ownership requires its unit owners association records.';
 if (t.disclosures.hoaDocumentsStatus !== 'received' || !t.documentVersions?.['montana-association-documents']) return 'Review the uploaded Montana condominium packet: Unit Ownership Act, bylaws, administrative regulations and any required majority-control notice before signing or sending an offer.';
 const at = Date.parse(t.condominiumReceiptAt ?? '');
 if (!Number.isFinite(at) || at > now) return 'Save your actual condominium document receipt before submitting.';
 return undefined;
}
export function montanaCondominiumAcceptanceProblem(t: Parameters<typeof montanaCondominiumReceiptProblem>[0], now = Date.now()): string | undefined {
 const receipt = montanaCondominiumReceiptProblem(t,now); if(receipt) return receipt;
 if(t.contractType !== 'navstreet_montana_condominium_resale_2026' || t.condominiumAcceptancePolicy === 'accept_during_review_v2') return;
 const until = Date.parse(t.condominiumReceiptAt!) + 72 * 60 * 60 * 1000;
 if(now < until) return 'The Montana condominium 72-hour document-review period ends '+new Date(until).toISOString()+'. You may send offers and counteroffers now. Acceptance signing is available after that time; the buyer may withdraw without penalty during the review period.';
 return undefined;
}
