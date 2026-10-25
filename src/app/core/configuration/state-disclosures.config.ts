import { isFederalLeadExcluded } from '../domains/offers/federal-lead-policy';
import { getListingUploadGateDocumentTypes, type ListingDisclosureGateFacts } from './listing-disclosure-gates';
import {
  StateDisclosureRequirement
} from '../domains/disclosures/models/state-disclosure-requirement.model';
import { STATES } from './states.config';

export const STATE_DISCLOSURE_REQUIREMENTS:
  Readonly<
    Record<
      string,
      readonly StateDisclosureRequirement[]
    >
  > = {
  KY: [
  {
    "formCode": "KY-SELLER-DISCLOSURE",
    "sortOrder": 1,
    "documentType": "kentucky-seller-disclosure",
    "title": "Kentucky seller condition disclosure / supported exception",
    "shortTitle": "Kentucky seller condition disclosure / supported exception",
    "description": "KRS 324.360 applies where a licensee receives compensation; it is not a universal private-owner FSBO condition-form requirement. Disclose known latent material defects truthfully and provide available records. A voluntary seller statement is not a warranty. This owner-direct workflow does not supply brokerage services.",
    "sourceInstructions": "KRS 324.360 applies where a licensee receives compensation; it is not a universal private-owner FSBO condition-form requirement. Disclose known latent material defects truthfully and provide available records. A voluntary seller statement is not a warranty. This owner-direct workflow does not supply brokerage services.",
    "required": false,
    "officialFormUrl": "https://apps.legislature.ky.gov/law/statutes/statute.aspx?id=40017"
  },
  {
    "formCode": "KY-STATUTORY-PACKET",
    "sortOrder": 2,
    "documentType": "kentucky-statutory-packet",
    "title": "Kentucky applicable property-specific notices",
    "shortTitle": "Kentucky applicable property-specific notices",
    "description": "Investigate radon, flood and mine-subsidence risks, private water and sewage, permits, access and title during the negotiated inspection period. Seller must not conceal known material defects. No universal radon test or generic statutory packet is imposed on this ordinary private-owner resale.",
    "sourceInstructions": "Investigate radon, flood and mine-subsidence risks, private water and sewage, permits, access and title during the negotiated inspection period. Seller must not conceal known material defects. No universal radon test or generic statutory packet is imposed on this ordinary private-owner resale.",
    "required": false,
    "officialFormUrl": "https://apps.legislature.ky.gov/law/statutes/statute.aspx?id=40017"
  },
  {
    "formCode": "KY-ASSOCIATION-DOCUMENTS",
    "sortOrder": 3,
    "documentType": "kentucky-association-documents",
    "title": "Kentucky association resale records / supported exception",
    "shortTitle": "Kentucky association resale records / supported exception",
    "description": "For a condominium subject to KRS 381.9203, seller must provide the declaration, bylaws/rules and current association-signed resale certificate with assessments, fees, finances, reserves, insurance, litigation and other required particulars. The association has ten days after written request. The purchaser may void the contract until certificate delivery and for five days thereafter or conveyance, whichever first occurs. Applicability and KRS 381.9201 exceptions must be established from the actual regime/transfer; upload supported exception evidence in place of an inapplicable certificate. NavStreet collects the applicable packet or evidence before offers without changing the statutory rights. An ordinary noncondominium HOA is not automatically governed by this condominium statute.",
    "sourceInstructions": "For a condominium subject to KRS 381.9203, seller must provide the declaration, bylaws/rules and current association-signed resale certificate with assessments, fees, finances, reserves, insurance, litigation and other required particulars. The association has ten days after written request. The purchaser may void the contract until certificate delivery and for five days thereafter or conveyance, whichever first occurs. Applicability and KRS 381.9201 exceptions must be established from the actual regime/transfer; upload supported exception evidence in place of an inapplicable certificate. NavStreet collects the applicable packet or evidence before offers without changing the statutory rights. An ordinary noncondominium HOA is not automatically governed by this condominium statute.",
    "required": false,
    "officialFormUrl": "https://apps.legislature.ky.gov/law/statutes/statute.aspx?id=40017"
  },
  {
    "formCode": "FEDERAL-LEAD",
    "sortOrder": 4,
    "documentType": "lead-based-paint",
    "title": "Federal lead disclosure packet",
    "shortTitle": "Federal lead disclosure packet",
    "description": "Covered pre-1978 housing: provide the signed federal statement, known reports and EPA pamphlet before buyer is bound. Year built controls applicability; no seller override.",
    "sourceInstructions": "Upload the completed applicable federal disclosure packet. Buyer actual review and inspection election remain separate.",
    "required": false,
    "officialFormUrl": "https://www.epa.gov/lead/real-estate-disclosures-about-potential-lead-hazards"
  }
],
  RI: [
  {
    "formCode": "RI-SELLER-DISCLOSURE",
    "sortOrder": 1,
    "documentType": "rhode-island-seller-disclosure",
    "title": "Rhode Island seller condition disclosure / supported exception",
    "shortTitle": "Rhode Island seller condition disclosure / supported exception",
    "description": "R.I. Gen. Laws 5-20.8-2 requires the seller disclosure before the buyer signs an agreement, unless a specific 5-20.8-3 transfer exception applies. Upload the completed current disclosure and available required supporting records, or a written statement identifying the actual statutory exception. The form addresses systems, radon, lead records, water/sewage, surveys, easements, wetlands and shoreline/public-access records; do not substitute a generic placeholder. Exception evidence does not itself waive independent federal lead duties.",
    "sourceInstructions": "R.I. Gen. Laws 5-20.8-2 requires the seller disclosure before the buyer signs an agreement, unless a specific 5-20.8-3 transfer exception applies. Upload the completed current disclosure and available required supporting records, or a written statement identifying the actual statutory exception. The form addresses systems, radon, lead records, water/sewage, surveys, easements, wetlands and shoreline/public-access records; do not substitute a generic placeholder. Exception evidence does not itself waive independent federal lead duties.",
    "required": false,
    "officialFormUrl": "https://webserver.rilegislature.gov/Statutes/TITLE5/5-20.8/5-20.8-2.htm"
  },
  {
    "formCode": "RI-STATUTORY-PACKET",
    "sortOrder": 2,
    "documentType": "rhode-island-statutory-packet",
    "title": "Rhode Island applicable property-specific notices",
    "shortTitle": "Rhode Island applicable property-specific notices",
    "description": "If the property is or may be served by a private cesspool, 5-20.8-13 provides a ten-day sewage-system inspection opportunity before the purchaser becomes obligated, unless the parties mutually agree on a different period. This agreement preserves ten days independently of the negotiated general inspection period. Seller must provide available required prior results and private-well, survey, restriction and coastal permit/access records with the disclosure. No acknowledgement certifies that an unknown condition is absent.",
    "sourceInstructions": "If the property is or may be served by a private cesspool, 5-20.8-13 provides a ten-day sewage-system inspection opportunity before the purchaser becomes obligated, unless the parties mutually agree on a different period. This agreement preserves ten days independently of the negotiated general inspection period. Seller must provide available required prior results and private-well, survey, restriction and coastal permit/access records with the disclosure. No acknowledgement certifies that an unknown condition is absent.",
    "required": false,
    "officialFormUrl": "https://webserver.rilegislature.gov/Statutes/TITLE5/5-20.8/5-20.8-2.htm"
  },
  {
    "formCode": "RI-ASSOCIATION-DOCUMENTS",
    "sortOrder": 3,
    "documentType": "rhode-island-association-documents",
    "title": "Rhode Island association resale records / supported exception",
    "shortTitle": "Rhode Island association resale records / supported exception",
    "description": "For covered condominium resales, 34-36.1-4.09 requires the declaration, bylaws/rules and association certificate with the prescribed assessment, financial, insurance, litigation, code-violation and leasehold information. The association must furnish it within ten days of request. The purchase contract remains voidable until delivery and for five days thereafter or conveyance, whichever occurs first; the purchaser is protected against undisclosed excess assessments/fees. Scope and 4.01 transfer exceptions require actual support. Upload the complete applicable packet or documented exception before offers under NavStreet's collection policy; no automatic waiver or statutory waiting-period replacement results.",
    "sourceInstructions": "For covered condominium resales, 34-36.1-4.09 requires the declaration, bylaws/rules and association certificate with the prescribed assessment, financial, insurance, litigation, code-violation and leasehold information. The association must furnish it within ten days of request. The purchase contract remains voidable until delivery and for five days thereafter or conveyance, whichever occurs first; the purchaser is protected against undisclosed excess assessments/fees. Scope and 4.01 transfer exceptions require actual support. Upload the complete applicable packet or documented exception before offers under NavStreet's collection policy; no automatic waiver or statutory waiting-period replacement results.",
    "required": false,
    "officialFormUrl": "https://webserver.rilegislature.gov/Statutes/TITLE5/5-20.8/5-20.8-2.htm"
  },
  {
    "formCode": "FEDERAL-LEAD",
    "sortOrder": 4,
    "documentType": "lead-based-paint",
    "title": "Federal lead disclosure packet",
    "shortTitle": "Federal lead disclosure packet",
    "description": "Covered pre-1978 housing: provide the signed federal statement, known reports and EPA pamphlet before buyer is bound. Year built controls applicability; no seller override.",
    "sourceInstructions": "Upload the completed applicable federal disclosure packet. Buyer actual review and inspection election remain separate.",
    "required": false,
    "officialFormUrl": "https://www.epa.gov/lead/real-estate-disclosures-about-potential-lead-hazards"
  }
],
  TN: [
  {
    "formCode": "TN-SELLER-DISCLOSURE",
    "sortOrder": 1,
    "documentType": "tennessee-seller-disclosure",
    "title": "Tennessee seller condition disclosure / supported exception",
    "shortTitle": "Tennessee seller condition disclosure / supported exception",
    "description": "For a covered residential transfer, Tenn. Code Ann. 66-5-202 and 66-5-203 require the condition disclosure before contract acceptance. Upload that disclosure, or evidence of a specific 66-5-209 exception. A disclaimer is allowed only with the purchaser's genuine waiver; the seller cannot choose that waiver for a buyer. This workflow uses the disclosure route unless an independent buyer waiver has already been executed and included in the uploaded packet. NavStreet gathers the applicable document before offers. Material changes must be disclosed or condition recertified at closing.",
    "sourceInstructions": "For a covered residential transfer, Tenn. Code Ann. 66-5-202 and 66-5-203 require the condition disclosure before contract acceptance. Upload that disclosure, or evidence of a specific 66-5-209 exception. A disclaimer is allowed only with the purchaser's genuine waiver; the seller cannot choose that waiver for a buyer. This workflow uses the disclosure route unless an independent buyer waiver has already been executed and included in the uploaded packet. NavStreet gathers the applicable document before offers. Material changes must be disclosed or condition recertified at closing.",
    "required": false,
    "officialFormUrl": "https://www.tn.gov/commerce/regboards/trec/rules-and-laws/laws.html"
  },
  {
    "formCode": "TN-STATUTORY-PACKET",
    "sortOrder": 2,
    "documentType": "tennessee-statutory-packet",
    "title": "Tennessee applicable property-specific notices",
    "shortTitle": "Tennessee applicable property-specific notices",
    "description": "Separately disclose applicable known exterior injection wells and percolation/soil-absorption tests, a moved foundation and known sinkholes under 66-5-212; a sinkhole requires written disclosure and acknowledgement before contract. Other applicable written notices include 66-5-211 impact fees/adequate-facilities taxes 66-5-213 planned-unit-development obligations, and applicable 68-221-409 future public-sewer connection obligations. A condition-form exception does not erase an independent notice duty. Upload one complete property-notice packet when these facts apply, without duplicating records already in the condition packet. Statutory condominium association information is available on request under 66-27-502 and 503; it is not a universal initial-offer upload requirement.",
    "sourceInstructions": "Separately disclose applicable known exterior injection wells and percolation/soil-absorption tests, a moved foundation and known sinkholes under 66-5-212; a sinkhole requires written disclosure and acknowledgement before contract. Other applicable written notices include 66-5-211 impact fees/adequate-facilities taxes 66-5-213 planned-unit-development obligations, and applicable 68-221-409 future public-sewer connection obligations. A condition-form exception does not erase an independent notice duty. Upload one complete property-notice packet when these facts apply, without duplicating records already in the condition packet. Statutory condominium association information is available on request under 66-27-502 and 503; it is not a universal initial-offer upload requirement.",
    "required": false,
    "officialFormUrl": "https://www.tn.gov/commerce/regboards/trec/rules-and-laws/laws.html"
  },
  {
    "formCode": "TN-ASSOCIATION-DOCUMENTS",
    "sortOrder": 3,
    "documentType": "tennessee-association-documents",
    "title": "Tennessee association resale records / supported exception",
    "shortTitle": "Tennessee association resale records / supported exception",
    "description": "For residential condominium ownership, buyer is entitled on request to association information under 66-27-502 and 503, including administration, governing documents, assessments, budget, insurance, litigation and other prescribed records. The association generally responds within ten business days. Seller must explain how to contact it when requested. This ordinary resale agreement does not invent a universal five-day condominium cancellation rule or make request-based records an unconditional offer gate. Review records under the negotiated inspection period; statutory duties and remedies remain. PUD disclosures under 66-5-213 are separate from condominium classification.",
    "sourceInstructions": "For residential condominium ownership, buyer is entitled on request to association information under 66-27-502 and 503, including administration, governing documents, assessments, budget, insurance, litigation and other prescribed records. The association generally responds within ten business days. Seller must explain how to contact it when requested. This ordinary resale agreement does not invent a universal five-day condominium cancellation rule or make request-based records an unconditional offer gate. Review records under the negotiated inspection period; statutory duties and remedies remain. PUD disclosures under 66-5-213 are separate from condominium classification.",
    "required": false,
    "officialFormUrl": "https://www.tn.gov/commerce/regboards/trec/rules-and-laws/laws.html"
  },
  {
    "formCode": "FEDERAL-LEAD",
    "sortOrder": 4,
    "documentType": "lead-based-paint",
    "title": "Federal lead disclosure packet",
    "shortTitle": "Federal lead disclosure packet",
    "description": "Covered pre-1978 housing: provide the signed federal statement, known reports and EPA pamphlet before buyer is bound. Year built controls applicability; no seller override.",
    "sourceInstructions": "Upload the completed applicable federal disclosure packet. Buyer actual review and inspection election remain separate.",
    "required": false,
    "officialFormUrl": "https://www.epa.gov/lead/real-estate-disclosures-about-potential-lead-hazards"
  }
],
  WV: [
  {
    "formCode": "WV-SELLER-DISCLOSURE",
    "sortOrder": 1,
    "documentType": "west-virginia-seller-disclosure",
    "title": "West Virginia seller condition disclosure / supported exception",
    "shortTitle": "West Virginia seller condition disclosure / supported exception",
    "description": "No universal West Virginia private-owner residential condition form is imposed by this package. Seller must truthfully disclose known latent material defects and avoid concealment or misrepresentation. Buyer should investigate structural, flood, environmental, radon, mining/subsidence, mineral/title, water and sewage risks; inspection rights do not excuse fraud.",
    "sourceInstructions": "No universal West Virginia private-owner residential condition form is imposed by this package. Seller must truthfully disclose known latent material defects and avoid concealment or misrepresentation. Buyer should investigate structural, flood, environmental, radon, mining/subsidence, mineral/title, water and sewage risks; inspection rights do not excuse fraud.",
    "required": false,
    "officialFormUrl": "https://code.wvlegislature.gov/36B-4-109/"
  },
  {
    "formCode": "WV-STATUTORY-PACKET",
    "sortOrder": 2,
    "documentType": "west-virginia-statutory-packet",
    "title": "West Virginia applicable property-specific notices",
    "shortTitle": "West Virginia applicable property-specific notices",
    "description": "Review severed mineral interests, support rights, access, private water/sewage, flood and title records as applicable. Known material defects must not be concealed. This ordinary existing-resale agreement does not cover developer offerings, cooperatives, leasehold or installment land contracts. No universal radon testing packet is imposed.",
    "sourceInstructions": "Review severed mineral interests, support rights, access, private water/sewage, flood and title records as applicable. Known material defects must not be concealed. This ordinary existing-resale agreement does not cover developer offerings, cooperatives, leasehold or installment land contracts. No universal radon testing packet is imposed.",
    "required": false,
    "officialFormUrl": "https://code.wvlegislature.gov/36B-4-109/"
  },
  {
    "formCode": "WV-ASSOCIATION-DOCUMENTS",
    "sortOrder": 3,
    "documentType": "west-virginia-association-documents",
    "title": "West Virginia association resale records / supported exception",
    "shortTitle": "West Virginia association resale records / supported exception",
    "description": "For a common-interest community within chapter 36B's applicable scope, 36B-4-109 requires governing documents and a resale certificate with assessments, fees, finances, reserves, insurance, litigation, violations and other prescribed information. The association generally has ten days after request. The contract is voidable until certificate delivery and for five days thereafter or conveyance, whichever first occurs; undisclosed excess fees/assessments are protected. Apply 36B-1-203 through 205 and 4-101 scope/transfer exceptions to the actual community. NavStreet collects the applicable packet or specific supported scope/exception evidence before offers. A PUD or single-family lot may be in a covered community; a physical condo label is not the only trigger. This does not remove cancellation rights.",
    "sourceInstructions": "For a common-interest community within chapter 36B's applicable scope, 36B-4-109 requires governing documents and a resale certificate with assessments, fees, finances, reserves, insurance, litigation, violations and other prescribed information. The association generally has ten days after request. The contract is voidable until certificate delivery and for five days thereafter or conveyance, whichever first occurs; undisclosed excess fees/assessments are protected. Apply 36B-1-203 through 205 and 4-101 scope/transfer exceptions to the actual community. NavStreet collects the applicable packet or specific supported scope/exception evidence before offers. A PUD or single-family lot may be in a covered community; a physical condo label is not the only trigger. This does not remove cancellation rights.",
    "required": false,
    "officialFormUrl": "https://code.wvlegislature.gov/36B-4-109/"
  },
  {
    "formCode": "FEDERAL-LEAD",
    "sortOrder": 4,
    "documentType": "lead-based-paint",
    "title": "Federal lead disclosure packet",
    "shortTitle": "Federal lead disclosure packet",
    "description": "Covered pre-1978 housing: provide the signed federal statement, known reports and EPA pamphlet before buyer is bound. Year built controls applicability; no seller override.",
    "sourceInstructions": "Upload the completed applicable federal disclosure packet. Buyer actual review and inspection election remain separate.",
    "required": false,
    "officialFormUrl": "https://www.epa.gov/lead/real-estate-disclosures-about-potential-lead-hazards"
  }
],
  GA: [
  {
    "formCode": "State statute / seller-supplied record",
    "sortOrder": 1,
    "documentType": "georgia-seller-disclosure",
    "title": "Georgia seller condition disclosure",
    "shortTitle": "Georgia seller condition disclosure",
    "description": "For this ordinary private owner resale, no universal Georgia seller condition form or general radon testing upload is required. Seller must disclose known hidden material defects and answer inquiries truthfully; an as-is clause does not authorize fraud or concealment. Any voluntary condition statement is separate evidence, not a warranty.",
    "required": false,
    "officialFormUrl": "https://www.legis.ga.gov/georgia-code",
    "sourceInstructions": "Use the actual applicable state disclosure or supported lawful exception; a generic placeholder is not a legal disclosure. For this ordinary private owner resale, no universal Georgia seller condition form or general radon testing upload is required. Seller must disclose known hidden material defects and answer inquiries truthfully; an as-is clause does not authorize fraud or concealment. Any voluntary condition statement is separate evidence, not a warranty."
  },
  {
    "formCode": "State statute / seller-supplied record",
    "sortOrder": 1,
    "documentType": "georgia-statutory-packet",
    "title": "Georgia property-specific statutory notices",
    "shortTitle": "Georgia property-specific statutory notices",
    "description": "Buyer may investigate structure, flood and insurance history, access, utilities, private well/septic systems, permits and title under the negotiated inspection period. Seller shall cooperate in providing available records. Use a Georgia attorney for legal closing work as required; choosing a closing professional is optional at the offer stage. No broker/license questionnaire is imposed.",
    "required": false,
    "officialFormUrl": "https://www.legis.ga.gov/georgia-code",
    "sourceInstructions": "Use the actual applicable state disclosure or supported lawful exception; a generic placeholder is not a legal disclosure. Buyer may investigate structure, flood and insurance history, access, utilities, private well/septic systems, permits and title under the negotiated inspection period. Seller shall cooperate in providing available records. Use a Georgia attorney for legal closing work as required; choosing a closing professional is optional at the offer stage. No broker/license questionnaire is imposed."
  },
  {
    "formCode": "State statute / seller-supplied record",
    "sortOrder": 1,
    "documentType": "georgia-association-documents",
    "title": "Georgia association resale documents",
    "shortTitle": "Georgia association resale documents",
    "description": "This agreement is for a subsequent bona fide residential condominium resale, with the unit and its appurtenant common interests governed by the recorded declaration and bylaws. Review restrictions, assessments, insurance, litigation, reserves and parking/storage rights during the agreed inspection/document period. Seller shall request an association account statement and applicable consents or waivers of rights of first refusal and clear seller liens as agreed. O.C.G.A. 44-3-111 first-bona-fide-sale disclosure and voidability provisions are distinct and are not represented as a universal subsequent-resale certificate or seven-day offer gate. First residential-occupancy sales, developer offerings, new construction and leasehold transfers require a different agreement.",
    "required": false,
    "officialFormUrl": "https://www.legis.ga.gov/georgia-code",
    "sourceInstructions": "Use the actual applicable state disclosure or supported lawful exception; a generic placeholder is not a legal disclosure. This agreement is for a subsequent bona fide residential condominium resale, with the unit and its appurtenant common interests governed by the recorded declaration and bylaws. Review restrictions, assessments, insurance, litigation, reserves and parking/storage rights during the agreed inspection/document period. Seller shall request an association account statement and applicable consents or waivers of rights of first refusal and clear seller liens as agreed. O.C.G.A. 44-3-111 first-bona-fide-sale disclosure and voidability provisions are distinct and are not represented as a universal subsequent-resale certificate or seven-day offer gate. First residential-occupancy sales, developer offerings, new construction and leasehold transfers require a different agreement."
  }
,
{
    "documentType": "lead-based-paint",
    "title": "Federal lead disclosure packet",
    "shortTitle": "Federal lead disclosure packet",
    "description": "For covered pre-1978 housing, provide the signed statement, available reports and EPA pamphlet before buyer is bound. Do not request this for known 1978-or-later construction.",
    "sourceInstructions": "For covered pre-1978 housing, provide the signed statement, available reports and EPA pamphlet before buyer is bound. Do not request this for known 1978-or-later construction.",
    "officialFormUrl": "https://www.epa.gov/lead/real-estate-disclosures-about-potential-lead-hazards",
    "required": false,
    "formCode": "MS-LEAD-BASED-PAINT",
    "sortOrder": 4
  }
],
  NV: [
  {
    "formCode": "State statute / seller-supplied record",
    "sortOrder": 1,
    "documentType": "nevada-seller-disclosure",
    "title": "Nevada seller condition disclosure",
    "shortTitle": "Nevada seller condition disclosure",
    "description": "For a covered one-to-four-unit residential transfer, seller shall complete and serve the Nevada condition disclosure at least ten days before conveyance under NRS 113.130. Specific statutory exceptions apply; the required subsection (1) duty cannot be waived by a generic as-is or receipt answer. Promptly disclose a newly discovered or worsening defect in writing before conveyance. Preserve purchaser remedies under NRS 113.150. The ordinary resale condition form is not universally due before an initial offer.",
    "required": false,
    "officialFormUrl": "https://www.leg.state.nv.us/NRS/NRS-113.html",
    "sourceInstructions": "Use the actual applicable state disclosure or supported lawful exception; a generic placeholder is not a legal disclosure. For a covered one-to-four-unit residential transfer, seller shall complete and serve the Nevada condition disclosure at least ten days before conveyance under NRS 113.130. Specific statutory exceptions apply; the required subsection (1) duty cannot be waived by a generic as-is or receipt answer. Promptly disclose a newly discovered or worsening defect in writing before conveyance. Preserve purchaser remedies under NRS 113.150. The ordinary resale condition form is not universally due before an initial offer."
  },
  {
    "formCode": "State statute / seller-supplied record",
    "sortOrder": 1,
    "documentType": "nevada-statutory-packet",
    "formDownloadUrl": "https://red.nv.gov/uploadedFiles/rednvgov/Content/Forms/551.pdf",
    "formDownloadLabel": "Download Nevada Form 551 open-range disclosure",
    "title": "Nevada property-specific statutory notices",
    "shortTitle": "Nevada property-specific statutory notices",
    "description": "If adjacent to open range, NRS 113.065 requires a separate grazing and rights-of-way disclosure before the purchaser signs a sales agreement, with the purchaser dated acknowledgement, seller retention/copy delivery and county recording duties. Upload that complete notice before offers. First-sale subdivision, zoning, utility-rate, gaming-district and soil-report rules have separate scope outside this ordinary existing-resale agreement. Applicable private-transfer-fee written disclosure under NRS 113.085, including a description and statutory warning, remains required without inventing a universal initial-offer fee packet.",
    "required": false,
    "officialFormUrl": "https://www.leg.state.nv.us/NRS/NRS-113.html",
    "sourceInstructions": "Use the actual applicable state disclosure or supported lawful exception; a generic placeholder is not a legal disclosure. If adjacent to open range, NRS 113.065 requires a separate grazing and rights-of-way disclosure before the purchaser signs a sales agreement, with the purchaser dated acknowledgement, seller retention/copy delivery and county recording duties. Upload that complete notice before offers. First-sale subdivision, zoning, utility-rate, gaming-district and soil-report rules have separate scope outside this ordinary existing-resale agreement. Applicable private-transfer-fee written disclosure under NRS 113.085, including a description and statutory warning, remains required without inventing a universal initial-offer fee packet."
  },
  {
    "formCode": "State statute / seller-supplied record",
    "sortOrder": 1,
    "documentType": "nevada-association-documents",
    "title": "Nevada association resale documents",
    "shortTitle": "Nevada association resale documents",
    "description": "Where NRS chapter 116 applies to this condominium or planned-community resale, seller shall provide the NRS 116.4109 resale package, including declaration, bylaws/rules, 116.41095 information statement, budget, assessment/fee and capital-expenditure information, and required insurance evidence. The package remains effective for ninety calendar days as prescribed. Purchaser may cancel by written notice until midnight of the fifth calendar day following receipt of the complete resale package. Hand delivery, prepaid United States mail or electronic transmission to seller or authorized agent are the statutory methods. Cancellation is without penalty and payments are promptly refunded. Acceptance of conveyance ends this statutory cancellation entitlement and the specified nondelivery-only relief. No signature or negotiated inspection deadline waives these protections. The contract permits acceptance while the packet is pending; no universal pre-offer packet upload or waiting period is imposed. Developer/public-offering, cooperative and condominium-hotel transactions require separate scope review.",
    "required": false,
    "officialFormUrl": "https://www.leg.state.nv.us/NRS/NRS-113.html",
    "sourceInstructions": "Use the actual applicable state disclosure or supported lawful exception; a generic placeholder is not a legal disclosure. Where NRS chapter 116 applies to this condominium or planned-community resale, seller shall provide the NRS 116.4109 resale package, including declaration, bylaws/rules, 116.41095 information statement, budget, assessment/fee and capital-expenditure information, and required insurance evidence. The package remains effective for ninety calendar days as prescribed. Purchaser may cancel by written notice until midnight of the fifth calendar day following receipt of the complete resale package. Hand delivery, prepaid United States mail or electronic transmission to seller or authorized agent are the statutory methods. Cancellation is without penalty and payments are promptly refunded. Acceptance of conveyance ends this statutory cancellation entitlement and the specified nondelivery-only relief. No signature or negotiated inspection deadline waives these protections. The contract permits acceptance while the packet is pending; no universal pre-offer packet upload or waiting period is imposed. Developer/public-offering, cooperative and condominium-hotel transactions require separate scope review."
  }
,
{
    "documentType": "lead-based-paint",
    "title": "Federal lead disclosure packet",
    "shortTitle": "Federal lead disclosure packet",
    "description": "For covered pre-1978 housing, provide the signed statement, available reports and EPA pamphlet before buyer is bound. Do not request this for known 1978-or-later construction.",
    "sourceInstructions": "For covered pre-1978 housing, provide the signed statement, available reports and EPA pamphlet before buyer is bound. Do not request this for known 1978-or-later construction.",
    "officialFormUrl": "https://www.epa.gov/lead/real-estate-disclosures-about-potential-lead-hazards",
    "required": false,
    "formCode": "MS-LEAD-BASED-PAINT",
    "sortOrder": 4
  }
],
  ND: [
  {
    "formCode": "State statute / seller-supplied record",
    "sortOrder": 1,
    "documentType": "north-dakota-seller-disclosure",
    "title": "Optional separate North Dakota condition records",
    "shortTitle": "Optional separate condition records",
    "description": "For covered private owner sales of residential dwellings with no more than four units, N.D.C.C. 47-10-02.1(6) requires written disclosure of known material adverse facts before final acceptance unless the purchase agreement expressly provides otherwise. A commission condition form is permitted, not universally mandated for a private no-broker seller. Use only the listed subsection (7) transfer exceptions. This agreement uses delivery before the buyer signs; provide the written statement before offers to avoid a later acceptance interruption. No broker/licensing questions are required for the supported private sale.",
    "required": false,
    "officialFormUrl": "https://ndlegis.gov/cencode/t47c10.pdf",
    "sourceInstructions": "Use the actual applicable state disclosure or supported lawful exception; a generic placeholder is not a legal disclosure. For covered private owner sales of residential dwellings with no more than four units, N.D.C.C. 47-10-02.1(6) requires written disclosure of known material adverse facts before final acceptance unless the purchase agreement expressly provides otherwise. A commission condition form is permitted, not universally mandated for a private no-broker seller. Use only the listed subsection (7) transfer exceptions. This agreement uses delivery before the buyer signs; provide the written statement before offers to avoid a later acceptance interruption. No broker/licensing questions are required for the supported private sale."
  },
  {
    "formCode": "State statute / seller-supplied record",
    "sortOrder": 1,
    "documentType": "north-dakota-statutory-packet",
    "formDownloadUrl": "https://realestatend.org/image/cache/Seller_s_Property_Disclosure_Form-Revised_08-2025.pdf",
    "formDownloadLabel": "Download the official combined condition-and-radon form",
    "title": "North Dakota combined seller disclosure and radon notice",
    "shortTitle": "North Dakota combined seller disclosure and radon notice",
    "description": "Upload one combined PDF containing the applicable written known material facts unless exempt, plus the exact statutory radon statement and available known test/mitigation records. A separate condition upload is optional if already included. N.D.C.C. 47-10-02.2 independently requires written known radon information and the statutory warning, with the buyer signed receipt, before executing an agreement except a lawful expressly agreed alternative. Furnish reasonably available known prior test results and mitigation evidence before execution. No new radon test or mitigation is universally required. This packet is independent of condition-disclosure exceptions and records actual receipt of its immutable version. The dated buyer signature acknowledges receipt of the separate statutory notice; it does not certify test accuracy, mitigation effectiveness or create a statutory testing contingency.",
    "required": false,
    "officialFormUrl": "https://ndlegis.gov/cencode/t47c10.pdf",
    "sourceInstructions": "Use the actual applicable state disclosure or supported lawful exception; a generic placeholder is not a legal disclosure. Upload one combined PDF containing the applicable written known material facts unless exempt, plus the exact statutory radon statement and available known test/mitigation records. A separate condition upload is optional if already included. N.D.C.C. 47-10-02.2 independently requires written known radon information and the statutory warning, with the buyer signed receipt, before executing an agreement except a lawful expressly agreed alternative. Furnish reasonably available known prior test results and mitigation evidence before execution. No new radon test or mitigation is universally required. This packet is independent of condition-disclosure exceptions and records actual receipt of its immutable version. The dated buyer signature acknowledges receipt of the separate statutory notice; it does not certify test accuracy, mitigation effectiveness or create a statutory testing contingency."
  },
  {
    "formCode": "State statute / seller-supplied record",
    "sortOrder": 1,
    "documentType": "north-dakota-association-documents",
    "title": "North Dakota association resale documents",
    "shortTitle": "North Dakota association resale documents",
    "description": "Under N.D.C.C. 47-10-02.3, seller shall disclose the HOA/condominium assessments, approved special assessments, declaration/bylaws/rules, last two meeting minutes, reserves, budgets/financials, insurance, litigation, violations, transfer charges, remedies, collection policy, leasing restrictions, amenities and contact information by the mutually agreed date or within ten days after executing the agreement. Required information must cover at least the preceding ninety days. Association document-retrieval fees must be disclosed before final acceptance. The purchase contract remains voidable by buyer until the documents are provided and for five days thereafter or until conveyance, whichever first occurs. Known material changes before closing or possession must be disclosed in a written amendment. A pending packet does not prevent an offer or acceptance, or eliminate this protected cancellation right. No universal condominium review waiting period is imposed before accepting the offer.",
    "required": false,
    "officialFormUrl": "https://ndlegis.gov/cencode/t47c10.pdf",
    "sourceInstructions": "Use the actual applicable state disclosure or supported lawful exception; a generic placeholder is not a legal disclosure. Under N.D.C.C. 47-10-02.3, seller shall disclose the HOA/condominium assessments, approved special assessments, declaration/bylaws/rules, last two meeting minutes, reserves, budgets/financials, insurance, litigation, violations, transfer charges, remedies, collection policy, leasing restrictions, amenities and contact information by the mutually agreed date or within ten days after executing the agreement. Required information must cover at least the preceding ninety days. Association document-retrieval fees must be disclosed before final acceptance. The purchase contract remains voidable by buyer until the documents are provided and for five days thereafter or until conveyance, whichever first occurs. Known material changes before closing or possession must be disclosed in a written amendment. A pending packet does not prevent an offer or acceptance, or eliminate this protected cancellation right. No universal condominium review waiting period is imposed before accepting the offer."
  }
,
{
    "documentType": "lead-based-paint",
    "title": "Federal lead disclosure packet",
    "shortTitle": "Federal lead disclosure packet",
    "description": "For covered pre-1978 housing, provide the signed statement, available reports and EPA pamphlet before buyer is bound. Do not request this for known 1978-or-later construction.",
    "sourceInstructions": "For covered pre-1978 housing, provide the signed statement, available reports and EPA pamphlet before buyer is bound. Do not request this for known 1978-or-later construction.",
    "officialFormUrl": "https://www.epa.gov/lead/real-estate-disclosures-about-potential-lead-hazards",
    "required": false,
    "formCode": "MS-LEAD-BASED-PAINT",
    "sortOrder": 4
  }
],
  PA: [
  {
    "formCode": "State statute / seller-supplied record",
    "sortOrder": 1,
    "documentType": "pennsylvania-seller-disclosure",
    "formDownloadUrl": "https://www.pa.gov/content/dam/copapwp-pagov/en/dos/department-and-offices/bpoa/real-estate/Sellers%20Property%20Disclosure%20Statement.pdf",
    "formDownloadLabel": "Download the state-published seller disclosure form",
    "title": "Pennsylvania seller condition disclosure",
    "shortTitle": "Pennsylvania seller condition disclosure",
    "description": "For a covered residential transfer, 68 Pa.C.S. 7303 requires a signed and dated disclosure of known material defects before seller and buyer sign an agreement of transfer. Use the statutory statement or a compliant form covering the required subjects; assess chapter 71 scope and 7302 exceptions accurately. Condominium sellers disclose their own unit under this chapter, not common elements; association resale duties apply separately. No new independent investigation is universally required to complete the condition statement. Upload the applicable signed statement before offers.",
    "required": false,
    "officialFormUrl": "https://www.palegis.us/statutes/consolidated/view-statute?chpt=73&div=0&iFrame=true&ttl=68&txtType=HTM",
    "sourceInstructions": "Use the actual applicable state disclosure or supported lawful exception; a generic placeholder is not a legal disclosure. For a covered residential transfer, 68 Pa.C.S. 7303 requires a signed and dated disclosure of known material defects before seller and buyer sign an agreement of transfer. Use the statutory statement or a compliant form covering the required subjects; assess chapter 71 scope and 7302 exceptions accurately. Condominium sellers disclose their own unit under this chapter, not common elements; association resale duties apply separately. No new independent investigation is universally required to complete the condition statement. Upload the applicable signed statement before offers."
  },
  {
    "formCode": "State statute / seller-supplied record",
    "sortOrder": 1,
    "documentType": "pennsylvania-statutory-packet",
    "title": "Pennsylvania property-specific statutory notices",
    "shortTitle": "Pennsylvania property-specific statutory notices",
    "description": "Known radon, water intrusion, environmental, structural, utility and other material defects belong in the condition disclosure and available records; no universal independent radon, termite, septic or inspection certificate upload is imposed merely to make an offer. Qualified inspections and local point-of-sale requirements remain property-specific. Seller shall provide applicable updates; a receipt does not warrant condition or waive fraud, disclosure remedies or protected cancellation rights.",
    "required": false,
    "officialFormUrl": "https://www.palegis.us/statutes/consolidated/view-statute?chpt=73&div=0&iFrame=true&ttl=68&txtType=HTM",
    "sourceInstructions": "Use the actual applicable state disclosure or supported lawful exception; a generic placeholder is not a legal disclosure. Known radon, water intrusion, environmental, structural, utility and other material defects belong in the condition disclosure and available records; no universal independent radon, termite, septic or inspection certificate upload is imposed merely to make an offer. Qualified inspections and local point-of-sale requirements remain property-specific. Seller shall provide applicable updates; a receipt does not warrant condition or waive fraud, disclosure remedies or protected cancellation rights."
  },
  {
    "formCode": "State statute / seller-supplied record",
    "sortOrder": 1,
    "documentType": "pennsylvania-association-documents",
    "title": "Pennsylvania association resale documents",
    "shortTitle": "Pennsylvania association resale documents",
    "description": "For an applicable nondeclarant condominium resale under 68 Pa.C.S. 3407 or planned-community resale under 5407, seller shall furnish the governing declaration, bylaws/rules and the association resale certificate before conveyance, subject to statutory scope and exceptions. The certificate addresses assessments/fees, capital expenses, reserves/budgets, litigation, insurance and other required matters. Buyer is not liable for undisclosed assessments/fees beyond statutory limits. The purchase contract is voidable until the certificate is provided and for five days thereafter or until conveyance, whichever occurs first. A negotiated inspection deadline or signature does not shorten the statutory right. Pending association records do not universally block making or accepting an offer. Public-offering/declarant, cooperative, new-construction and leasehold transactions require separate agreements.",
    "required": false,
    "officialFormUrl": "https://www.palegis.us/statutes/consolidated/view-statute?chpt=73&div=0&iFrame=true&ttl=68&txtType=HTM",
    "sourceInstructions": "Use the actual applicable state disclosure or supported lawful exception; a generic placeholder is not a legal disclosure. For an applicable nondeclarant condominium resale under 68 Pa.C.S. 3407 or planned-community resale under 5407, seller shall furnish the governing declaration, bylaws/rules and the association resale certificate before conveyance, subject to statutory scope and exceptions. The certificate addresses assessments/fees, capital expenses, reserves/budgets, litigation, insurance and other required matters. Buyer is not liable for undisclosed assessments/fees beyond statutory limits. The purchase contract is voidable until the certificate is provided and for five days thereafter or until conveyance, whichever occurs first. A negotiated inspection deadline or signature does not shorten the statutory right. Pending association records do not universally block making or accepting an offer. Public-offering/declarant, cooperative, new-construction and leasehold transactions require separate agreements."
  }
,
{
    "documentType": "lead-based-paint",
    "title": "Federal lead disclosure packet",
    "shortTitle": "Federal lead disclosure packet",
    "description": "For covered pre-1978 housing, provide the signed statement, available reports and EPA pamphlet before buyer is bound. Do not request this for known 1978-or-later construction.",
    "sourceInstructions": "For covered pre-1978 housing, provide the signed statement, available reports and EPA pamphlet before buyer is bound. Do not request this for known 1978-or-later construction.",
    "officialFormUrl": "https://www.epa.gov/lead/real-estate-disclosures-about-potential-lead-hazards",
    "required": false,
    "formCode": "MS-LEAD-BASED-PAINT",
    "sortOrder": 4
  }
],
  ME: [
  {
    "documentType": "maine-seller-disclosure",
    "title": "Maine seller condition disclosure",
    "shortTitle": "Maine seller condition disclosure",
    "description": "For nonexempt residential transfers, 33 M.R.S. 173-174 requires the seller condition statement no later than the buyer makes an offer. Include water supply and known tests/PFAS problems, heating and service history, waste disposal/shoreland septic information, known hazards and defects, access and road maintenance, flood-zone information and the relevant FEMA map panel, flood/insurance/aid history, and shoreland enforcement matters. A true section 172 exception removes this statutory statement duty; it does not excuse misrepresentation. Late delivery preserves the statutory 72-hour withdrawal/termination remedy before settlement or occupancy as applicable, with prompt deposit return.",
    "sourceInstructions": "For nonexempt residential transfers, 33 M.R.S. 173-174 requires the seller condition statement no later than the buyer makes an offer. Include water supply and known tests/PFAS problems, heating and service history, waste disposal/shoreland septic information, known hazards and defects, access and road maintenance, flood-zone information and the relevant FEMA map panel, flood/insurance/aid history, and shoreland enforcement matters. A true section 172 exception removes this statutory statement duty; it does not excuse misrepresentation. Late delivery preserves the statutory 72-hour withdrawal/termination remedy before settlement or occupancy as applicable, with prompt deposit return.",
    "officialFormUrl": "https://legislature.maine.gov/statutes/33/title33sec174.html",
    "required": false,
    "formCode": "ME-SELLER-DISCLOSURE",
    "sortOrder": 1
  },
  {
    "documentType": "maine-statutory-packet",
    "title": "Maine property-specific supporting records",
    "shortTitle": "Maine property-specific supporting records",
    "description": "Seller shall provide available supporting records and correct known inaccuracies. No new universal water, radon or septic test is imposed merely by this agreement. Investigate title, access, systems and insurance during the negotiated inspection period. Property-specific shoreland septic inspection/transfer duties under 30-A M.R.S. 4216 remain applicable and are not replaced by a checkbox.",
    "sourceInstructions": "Seller shall provide available supporting records and correct known inaccuracies. No new universal water, radon or septic test is imposed merely by this agreement. Investigate title, access, systems and insurance during the negotiated inspection period. Property-specific shoreland septic inspection/transfer duties under 30-A M.R.S. 4216 remain applicable and are not replaced by a checkbox.",
    "officialFormUrl": "https://legislature.maine.gov/statutes/33/title33sec174.html",
    "required": false,
    "formCode": "ME-STATUTORY-PACKET",
    "sortOrder": 2
  },
  {
    "documentType": "maine-association-documents",
    "title": "Maine association resale records",
    "shortTitle": "Maine association resale records",
    "description": "For an ordinary condominium resale subject to 33 M.R.S. 1604-108, seller shall furnish the declaration (excluding plats/plans), bylaws, rules and reasonably current resale certificate before contract execution, or otherwise before conveyance. The certificate addresses transfer restraints, assessments/fees, anticipated capital expenses, reserves, financials/budget, litigation, insurance and known violations. The purchase contract is voidable until certificate delivery and for five days thereafter or until conveyance, whichever occurs first. This right is not waived by a pending receipt answer or signature. Section 1601-102 extends the resale provision to older condominiums; section 1604-101(b) exceptions and developer public-offering rules remain distinct. No universal initial-offer packet gate is imposed.",
    "sourceInstructions": "For an ordinary condominium resale subject to 33 M.R.S. 1604-108, seller shall furnish the declaration (excluding plats/plans), bylaws, rules and reasonably current resale certificate before contract execution, or otherwise before conveyance. The certificate addresses transfer restraints, assessments/fees, anticipated capital expenses, reserves, financials/budget, litigation, insurance and known violations. The purchase contract is voidable until certificate delivery and for five days thereafter or until conveyance, whichever occurs first. This right is not waived by a pending receipt answer or signature. Section 1601-102 extends the resale provision to older condominiums; section 1604-101(b) exceptions and developer public-offering rules remain distinct. No universal initial-offer packet gate is imposed.",
    "officialFormUrl": "https://legislature.maine.gov/statutes/33/title33sec1604-108.html",
    "required": false,
    "formCode": "ME-ASSOCIATION-DOCUMENTS",
    "sortOrder": 3
  },
  {
    "documentType": "lead-based-paint",
    "title": "Federal lead disclosure packet",
    "shortTitle": "Federal lead disclosure packet",
    "description": "For covered pre-1978 housing, provide the signed statement, available reports and EPA pamphlet before buyer is bound. Do not request this for known 1978-or-later construction.",
    "sourceInstructions": "For covered pre-1978 housing, provide the signed statement, available reports and EPA pamphlet before buyer is bound. Do not request this for known 1978-or-later construction.",
    "officialFormUrl": "https://www.epa.gov/lead/real-estate-disclosures-about-potential-lead-hazards",
    "required": false,
    "formCode": "ME-LEAD-BASED-PAINT",
    "sortOrder": 4
  }
],
  MS: [
  {
    "documentType": "mississippi-seller-disclosure",
    "title": "Mississippi seller condition disclosure",
    "shortTitle": "Mississippi seller condition disclosure",
    "description": "This NavStreet agreement supports a private for-sale-by-owner resale without real estate brokers or salespersons. No universal Mississippi seller condition-form upload is required for this supported transaction. Any voluntarily provided condition statement may be reviewed and pinned to its exact uploaded version. Seller must not conceal or misrepresent known material conditions; optional records do not block an offer.",
    "sourceInstructions": "This NavStreet agreement supports a private for-sale-by-owner resale without real estate brokers or salespersons. No universal Mississippi seller condition-form upload is required for this supported transaction. Any voluntarily provided condition statement may be reviewed and pinned to its exact uploaded version. Seller must not conceal or misrepresent known material conditions; optional records do not block an offer.",
    "officialFormUrl": "https://www.mrec.ms.gov/wp-content/uploads/2025/08/MREC_LICENSE_LAW_2025_REVISED-8-15-2025.pdf",
    "required": false,
    "formCode": "MS-SELLER-DISCLOSURE",
    "sortOrder": 1
  },
  {
    "documentType": "mississippi-statutory-packet",
    "title": "Mississippi property-specific supporting records",
    "shortTitle": "Mississippi property-specific supporting records",
    "description": "Seller shall disclose applicable known material conditions and answer inquiries truthfully; lack of a mandated form does not authorize deceit. Buyer may independently investigate flooding and coastal insurance, title and access, systems and property condition under the negotiated inspection period. No universal radon, water, termite or septic inspection/upload requirement is invented for this ordinary resale.",
    "sourceInstructions": "Seller shall disclose applicable known material conditions and answer inquiries truthfully; lack of a mandated form does not authorize deceit. Buyer may independently investigate flooding and coastal insurance, title and access, systems and property condition under the negotiated inspection period. No universal radon, water, termite or septic inspection/upload requirement is invented for this ordinary resale.",
    "officialFormUrl": "https://www.mrec.ms.gov/wp-content/uploads/2025/08/MREC_LICENSE_LAW_2025_REVISED-8-15-2025.pdf",
    "required": false,
    "formCode": "MS-STATUTORY-PACKET",
    "sortOrder": 2
  },
  {
    "documentType": "mississippi-association-documents",
    "title": "Mississippi association resale records",
    "shortTitle": "Mississippi association resale records",
    "description": "The recorded declaration and restrictions under Miss. Code 89-9 govern the condominium unit, common interests, assessments and use. Seller shall supply available governing, dues, insurance and assessment records on request for buyer investigation and clear seller liens as agreed. This ordinary existing-unit resale package does not invent a universal statutory condominium resale-certificate upload or cooling-off period. Any negotiated inspection/document condition remains enforceable. Developer offerings, new construction and leasehold sales require different agreements.",
    "sourceInstructions": "The recorded declaration and restrictions under Miss. Code 89-9 govern the condominium unit, common interests, assessments and use. Seller shall supply available governing, dues, insurance and assessment records on request for buyer investigation and clear seller liens as agreed. This ordinary existing-unit resale package does not invent a universal statutory condominium resale-certificate upload or cooling-off period. Any negotiated inspection/document condition remains enforceable. Developer offerings, new construction and leasehold sales require different agreements.",
    "officialFormUrl": "https://www.legislature.ms.gov/legislation/mississippi-code/",
    "required": false,
    "formCode": "MS-ASSOCIATION-DOCUMENTS",
    "sortOrder": 3
  },
  {
    "documentType": "lead-based-paint",
    "title": "Federal lead disclosure packet",
    "shortTitle": "Federal lead disclosure packet",
    "description": "For covered pre-1978 housing, provide the signed statement, available reports and EPA pamphlet before buyer is bound. Do not request this for known 1978-or-later construction.",
    "sourceInstructions": "For covered pre-1978 housing, provide the signed statement, available reports and EPA pamphlet before buyer is bound. Do not request this for known 1978-or-later construction.",
    "officialFormUrl": "https://www.epa.gov/lead/real-estate-disclosures-about-potential-lead-hazards",
    "required": false,
    "formCode": "MS-LEAD-BASED-PAINT",
    "sortOrder": 4
  }
],
  AR: [
  {
    "documentType": "arkansas-seller-disclosure",
    "title": "Arkansas seller condition disclosure",
    "shortTitle": "Arkansas seller condition disclosure",
    "description": "Arkansas does not impose a universal seller property-condition disclosure form on an ordinary FSBO resale. Seller must not conceal or misrepresent material conditions and shall answer inquiries truthfully. Any voluntarily supplied statement is separate from this agreement and is not an independent inspection or warranty. Broker/licensee disclosure and agency duties apply when such professionals participate; this platform agreement does not substitute for them. Optional condition records cannot prevent the parties from making an offer.",
    "sourceInstructions": "Arkansas does not impose a universal seller property-condition disclosure form on an ordinary FSBO resale. Seller must not conceal or misrepresent material conditions and shall answer inquiries truthfully. Any voluntarily supplied statement is separate from this agreement and is not an independent inspection or warranty. Broker/licensee disclosure and agency duties apply when such professionals participate; this platform agreement does not substitute for them. Optional condition records cannot prevent the parties from making an offer.",
    "officialFormUrl": "https://arec.arkansas.gov/news_post/is-property-condition-disclosure-required-by-law/",
    "required": false,
    "formCode": "AR-SELLER-DISCLOSURE",
    "sortOrder": 1
  },
  {
    "documentType": "arkansas-statutory-packet",
    "title": "Arkansas property-specific supporting records",
    "shortTitle": "Arkansas property-specific supporting records",
    "description": "Buyer may investigate structure, title, access, flood and insurance risk, utilities, private well/septic systems, permits and known hazards during the negotiated inspection period. Seller shall provide available requested records. This agreement imposes no universal new inspection, tax-estimate, radon certificate or septic upload. Required federal lead disclosures apply separately to covered pre-1978 housing.",
    "sourceInstructions": "Buyer may investigate structure, title, access, flood and insurance risk, utilities, private well/septic systems, permits and known hazards during the negotiated inspection period. Seller shall provide available requested records. This agreement imposes no universal new inspection, tax-estimate, radon certificate or septic upload. Required federal lead disclosures apply separately to covered pre-1978 housing.",
    "officialFormUrl": "https://arec.arkansas.gov/news_post/is-property-condition-disclosure-required-by-law/",
    "required": false,
    "formCode": "AR-STATUTORY-PACKET",
    "sortOrder": 2
  },
  {
    "documentType": "arkansas-association-documents",
    "title": "Arkansas association resale records",
    "shortTitle": "Arkansas association resale records",
    "description": "Under the Arkansas Horizontal Property Act, Ark. Code 18-13, the unit and its appurtenant common interests convey under the recorded master deed and bylaws. Review restrictions, insurance, budgets, reserves, assessments, litigation and parking/storage allocations during the agreed inspection period. Seller shall cooperate in obtaining an association account statement and clear assessments chargeable to seller. Section 18-13-116 addresses unpaid assessments at sale; the contract does not authorize avoiding those charges by transfer. This ordinary nondeveloper resale creates no universal statutory initial-offer condo packet or cooling-off period. Developer construction/deposit arrangements are excluded.",
    "sourceInstructions": "Under the Arkansas Horizontal Property Act, Ark. Code 18-13, the unit and its appurtenant common interests convey under the recorded master deed and bylaws. Review restrictions, insurance, budgets, reserves, assessments, litigation and parking/storage allocations during the agreed inspection period. Seller shall cooperate in obtaining an association account statement and clear assessments chargeable to seller. Section 18-13-116 addresses unpaid assessments at sale; the contract does not authorize avoiding those charges by transfer. This ordinary nondeveloper resale creates no universal statutory initial-offer condo packet or cooling-off period. Developer construction/deposit arrangements are excluded.",
    "officialFormUrl": "https://www.arkleg.state.ar.us/Acts/CodeSection?ddBienniumSession=2025/2025R&section=18",
    "required": false,
    "formCode": "AR-ASSOCIATION-DOCUMENTS",
    "sortOrder": 3
  },
  {
    "documentType": "lead-based-paint",
    "title": "Federal lead disclosure packet",
    "shortTitle": "Federal lead disclosure packet",
    "description": "For covered pre-1978 housing, provide the signed statement, available reports and EPA pamphlet before buyer is bound. Do not request this for known 1978-or-later construction.",
    "sourceInstructions": "For covered pre-1978 housing, provide the signed statement, available reports and EPA pamphlet before buyer is bound. Do not request this for known 1978-or-later construction.",
    "officialFormUrl": "https://www.epa.gov/lead/real-estate-disclosures-about-potential-lead-hazards",
    "required": false,
    "formCode": "AR-LEAD-BASED-PAINT",
    "sortOrder": 4
  }
],
  IL: [
  {
    "documentType": "illinois-seller-disclosure",
    "title": "Illinois seller condition disclosure",
    "shortTitle": "Illinois seller condition disclosure",
    "description": "765 ILCS 77 requires the seller Residential Real Property Disclosure Report before the signing of a contract, unless a specific seller/transfer exclusion applies. It covers condominium units and their allocated limited common elements as specified by the Act. Seller must complete the statutory report and supplement a known error or omission before closing. The buyer acknowledges only actual receipt of the identified version; a receipt does not warrant condition or waive remedies. The Act preserves specified five-business-day termination rights for qualifying late material-defect reports/supplements and other statutory remedies. Federal lead and the independent Illinois radon duty are not waived by a condition-report exception.",
    "sourceInstructions": "765 ILCS 77 requires the seller Residential Real Property Disclosure Report before the signing of a contract, unless a specific seller/transfer exclusion applies. It covers condominium units and their allocated limited common elements as specified by the Act. Seller must complete the statutory report and supplement a known error or omission before closing. The buyer acknowledges only actual receipt of the identified version; a receipt does not warrant condition or waive remedies. The Act preserves specified five-business-day termination rights for qualifying late material-defect reports/supplements and other statutory remedies. Federal lead and the independent Illinois radon duty are not waived by a condition-report exception.",
    "officialFormUrl": "https://www.ilga.gov/legislation/ILCS/details?ActID=2152",
    "required": false,
    "formCode": "IL-SELLER-DISCLOSURE",
    "sortOrder": 1
  },
  {
    "documentType": "illinois-statutory-packet",
    "title": "Illinois radon disclosure packet",
    "shortTitle": "Illinois radon disclosure packet",
    "description": "Unless excluded by 420 ILCS 46/20, seller shall give the Illinois Disclosure of Information on Radon Hazards, known hazard records and the approved IEMA-OHS Radon Testing Guidelines for Real Estate Transactions pamphlet before buyer is obligated. Section 10(c) permits disclosure after an offer, but requires completion before seller acceptance and an opportunity for buyer review and possible amendment. NavStreet collects this required pre-acceptance disclosure earlier: seller uploads the applicable packet before Make Offer opens, and buyer reviews it and the supplied pamphlet before submitting. No radon test or mitigation is universally required merely to make an offer.",
    "sourceInstructions": "Unless excluded by 420 ILCS 46/20, seller shall give the Illinois Disclosure of Information on Radon Hazards, known hazard records and the approved IEMA-OHS Radon Testing Guidelines for Real Estate Transactions pamphlet before buyer is obligated. Section 10(c) permits disclosure after an offer, but requires completion before seller acceptance and an opportunity for buyer review and possible amendment. NavStreet collects this required pre-acceptance disclosure earlier: seller uploads the applicable packet before Make Offer opens, and buyer reviews it and the supplied pamphlet before submitting. No radon test or mitigation is universally required merely to make an offer.",
    "officialFormUrl": "https://iemaohs.illinois.gov/nrs/radon/availpub.html",
    "required": false,
    "formCode": "IL-STATUTORY-PACKET",
    "sortOrder": 2
  },
  {
    "documentType": "illinois-association-documents",
    "title": "Illinois association resale records",
    "shortTitle": "Illinois association resale records",
    "description": "For condominium resale by a nondeveloper, 765 ILCS 605/22.1 requires seller to obtain and make available upon demand the declaration/bylaws/rules, assessment/lien statement, anticipated capital expenses, reserves, financials, litigation, insurance, alteration-compliance information and designated notice contact. Common-interest community resales have separate duties under 765 ILCS 160/1-35. Request records promptly; these are not universal initial-offer upload or statutory cooling-off gates. The agreed inspection/document condition protects buyer review without inventing a mandatory waiting period. From January 1, 2027, comply also with the collection-policy addition of P.A. 104-0734. Developer/new-construction and leasehold sales are excluded.",
    "sourceInstructions": "For condominium resale by a nondeveloper, 765 ILCS 605/22.1 requires seller to obtain and make available upon demand the declaration/bylaws/rules, assessment/lien statement, anticipated capital expenses, reserves, financials, litigation, insurance, alteration-compliance information and designated notice contact. Common-interest community resales have separate duties under 765 ILCS 160/1-35. Request records promptly; these are not universal initial-offer upload or statutory cooling-off gates. The agreed inspection/document condition protects buyer review without inventing a mandatory waiting period. From January 1, 2027, comply also with the collection-policy addition of P.A. 104-0734. Developer/new-construction and leasehold sales are excluded.",
    "officialFormUrl": "https://www.ilga.gov/legislation/ilcs/fulltext?DocName=076506050K22.1",
    "required": false,
    "formCode": "IL-ASSOCIATION-DOCUMENTS",
    "sortOrder": 3
  },
  {
    "documentType": "lead-based-paint",
    "title": "Federal lead disclosure packet",
    "shortTitle": "Federal lead disclosure packet",
    "description": "For covered pre-1978 housing, provide the signed statement, available reports and EPA pamphlet before buyer is bound. Do not request this for known 1978-or-later construction.",
    "sourceInstructions": "For covered pre-1978 housing, provide the signed statement, available reports and EPA pamphlet before buyer is bound. Do not request this for known 1978-or-later construction.",
    "officialFormUrl": "https://www.epa.gov/lead/real-estate-disclosures-about-potential-lead-hazards",
    "required": false,
    "formCode": "IL-LEAD-BASED-PAINT",
    "sortOrder": 4
  }
],
  AL: [
  {
    "documentType": "alabama-seller-disclosure",
    "title": "Alabama seller condition disclosure or supported exception",
    "shortTitle": "Alabama seller condition disclosure or supported exception",
    "description": "Alabama generally applies caveat emptor to used residential homes. Buyer should obtain independent inspections and make specific written inquiries during the negotiated inspection period. Applicable exceptions include fiduciary relationships, responses to specific inquiries and known material health or safety defects not known to or readily observable by buyer. This agreement requires truthful written answers and disclosure of applicable known hidden health/safety conditions; it does not impose a universal state seller-disclosure form or seller duty to inspect. No general statutory cooling-off period is created. The parties should obtain advice before adding an as-is or nonreliance provision, which can materially affect remedies under Alabama case law. This agreement does not add a blanket as-is/nonreliance waiver.",
    "sourceInstructions": "Use current official requirements and separately sign required forms and acknowledgments. A dropdown does not execute a separate form.",
    "officialFormUrl": "https://arec.alabama.gov/pages/consumer/information/consumerinformation.aspx",
    "required": false,
    "formCode": "AL-RECORDS",
    "sortOrder": 1
  },
  {
    "documentType": "alabama-statutory-packet",
    "title": "Alabama applicable property-specific records",
    "shortTitle": "Alabama applicable property-specific records",
    "description": "Seller shall provide applicable written health/safety information and truthful responses to buyer inquiries, available reports, leases and association records. Seller must update statements known to be inaccurate. Coastal wind/flood insurance, termite/wood-infestation conditions, septic/well systems, access, surveys and local occupancy requirements should be investigated. Applicable federal lead disclosures remain separate. Alabama homestead conveyances may require voluntary spouse signature and assent under Alabama Code 6-10-3; title shall evaluate actual interests. Contract deadline time is the expressly selected zone shown in this agreement, including any agreed Eastern-time convention in a border community.",
    "sourceInstructions": "Use current official requirements and separately sign required forms and acknowledgments. A dropdown does not execute a separate form.",
    "officialFormUrl": "https://arec.alabama.gov/pages/consumer/information/consumerinformation.aspx",
    "required": false,
    "formCode": "AL-RECORDS",
    "sortOrder": 2
  },
  {
    "documentType": "alabama-association-documents",
    "title": "Alabama association records",
    "shortTitle": "Alabama association records",
    "description": "For a Montana condominium resale, upload a complete packet containing the Unit Ownership Act, association bylaws and administrative regulations. Include the seller or other person’s majority-control notice under MCA 70-23-613(1) whenever any person or entity constitutes a majority of the unit owners. Deliver requested documents before any buy-sell signing. The agreement preserves the 72-hour review and penalty-free withdrawal period. These condominium documents are not a universal upload requirement for non-condominium properties. Dues, assessments and other helpful records may accompany the packet; unknown information is not assigned to the buyer.",
    "sourceInstructions": "Use current official requirements and separately sign required forms and acknowledgments. A dropdown does not execute a separate form.",
    "officialFormUrl": "https://arec.alabama.gov/pages/consumer/information/consumerinformation.aspx",
    "required": false,
    "formCode": "AL-RECORDS",
    "sortOrder": 3
  },
  {
    "documentType": "lead-based-paint",
    "title": "Federal lead disclosure packet or supported exemption",
    "shortTitle": "Federal lead disclosure",
    "description": "For covered pre-1978 housing, provide signed disclosures, available records and the EPA pamphlet before buyer is bound. Inspection waiver does not waive disclosure.",
    "sourceInstructions": "Complete the separate federal packet.",
    "officialFormUrl": "https://www.epa.gov/lead/real-estate-disclosures-about-potential-lead-hazards",
    "required": false,
    "formCode": "AL-LEAD",
    "sortOrder": 4
  }
],
  IN: [
  {
    "documentType": "indiana-seller-disclosure",
    "title": "Indiana seller condition disclosure or supported exception",
    "shortTitle": "Indiana seller condition disclosure or supported exception",
    "description": "For covered transactions under IC 32-21-5, seller shall complete and sign the required residential real estate sales disclosure form and provide it before accepting an offer. Use the current prescribed form or a compliant equivalent containing the required information. Document any specific IC 32-21-5-1 exception; an as-is sale is not an exception. The form addresses known physical conditions, defects and applicable association information under section 8.5, including required contacts and unpaid assessments. Unknown information may be identified as unknown. The statement is not a warranty or inspection substitute. The separate seller form is not made part of this agreement merely by an upload or receipt status.",
    "sourceInstructions": "Use current official requirements and separately sign required forms and acknowledgments. A dropdown does not execute a separate form.",
    "officialFormUrl": "https://www.in.gov/dA/cdbd3760ae/46234-fill-in.pdf?language_id=1",
    "required": true,
    "formCode": "IN-RECORDS",
    "sortOrder": 1
  },
  {
    "documentType": "indiana-statutory-packet",
    "title": "Indiana applicable property-specific records",
    "shortTitle": "Indiana applicable property-specific records",
    "description": "IC 32-21-5-12 governs condition at closing and matters arising after delivery. Under IC 32-21-5-13, when a disclosure form or amendment delivered after acceptance discloses a defect, buyer may nullify by delivering written rescission to owner or owner\u2019s agent within two business days after receipt, without liability, and is entitled to return of deposits. This is a defect-disclosure protection, not an automatic cooling-off period for every sale. Receipt selection, early upload and electronic signing do not waive that right. NavStreet requires the seller to upload the condition disclosure or supported exception evidence before a buyer can start an offer. This earlier upload requirement is NavStreet workflow policy; statutory delivery is required before seller acceptance. The buyer must review the uploaded document before submitting. Upload alone does not establish buyer receipt.",
    "sourceInstructions": "Use current official requirements and separately sign required forms and acknowledgments. A dropdown does not execute a separate form.",
    "officialFormUrl": "https://www.in.gov/dA/cdbd3760ae/46234-fill-in.pdf?language_id=1",
    "required": false,
    "formCode": "IN-RECORDS",
    "sortOrder": 2
  },
  {
    "documentType": "indiana-association-documents",
    "title": "Indiana association records",
    "shortTitle": "Indiana association records",
    "description": "For a Montana condominium resale, upload a complete packet containing the Unit Ownership Act, association bylaws and administrative regulations. Include the seller or other person’s majority-control notice under MCA 70-23-613(1) whenever any person or entity constitutes a majority of the unit owners. Deliver requested documents before any buy-sell signing. The agreement preserves the 72-hour review and penalty-free withdrawal period. These condominium documents are not a universal upload requirement for non-condominium properties. Dues, assessments and other helpful records may accompany the packet; unknown information is not assigned to the buyer.",
    "sourceInstructions": "Use current official requirements and separately sign required forms and acknowledgments. A dropdown does not execute a separate form.",
    "officialFormUrl": "https://www.in.gov/dA/cdbd3760ae/46234-fill-in.pdf?language_id=1",
    "required": false,
    "formCode": "IN-RECORDS",
    "sortOrder": 3
  },
  {
    "documentType": "lead-based-paint",
    "title": "Federal lead disclosure packet or supported exemption",
    "shortTitle": "Federal lead disclosure",
    "description": "For covered pre-1978 housing, provide signed disclosures, available records and the EPA pamphlet before buyer is bound. Inspection waiver does not waive disclosure.",
    "sourceInstructions": "Complete the separate federal packet.",
    "officialFormUrl": "https://www.epa.gov/lead/real-estate-disclosures-about-potential-lead-hazards",
    "required": false,
    "formCode": "IN-LEAD",
    "sortOrder": 4
  }
],
  KS: [
  {
    "documentType": "kansas-seller-disclosure",
    "title": "Kansas seller condition disclosure or supported exception",
    "shortTitle": "Kansas seller condition disclosure or supported exception",
    "description": "This FSBO resale agreement does not require a proprietary association seller form as a universal statutory prerequisite. Seller shall provide truthful written known material-condition information and applicable known elevated-radon information and available reports. Buyer may investigate radon, structure, pests, water/septic systems, environmental hazards, access, insurability and title during the negotiated inspection period. The required radon warning recommends testing; it does not itself require a new test for every sale. Any actual licensed broker has separate brokerage relationship and adverse material-fact disclosure duties; NavStreet does not represent either party as a broker.",
    "sourceInstructions": "Use current official requirements and separately sign required forms and acknowledgments. A dropdown does not execute a separate form.",
    "officialFormUrl": "https://www.kslegislature.gov/b2025_26/laws/058_000_0000_chapter/058_030_0000_article/058_030_0078a_section/058_030_0078a_k/",
    "required": false,
    "formCode": "KS-RECORDS",
    "sortOrder": 1
  },
  {
    "documentType": "kansas-statutory-packet",
    "title": "Kansas applicable property-specific records",
    "shortTitle": "Kansas applicable property-specific records",
    "description": "This original NavStreet agreement supports ordinary existing fee-simple single-family, townhome and PUD resales with cash or conventional financing. Condominiums, manufactured homes, vacant land, new construction/developer offerings, ground leases, installment seller financing and wholesale assignments require separate review and are outside this initial product. The narrower product scope does not change statutory coverage. Title shall verify the recorded legal description, owners, necessary spouse signatures, liens, deed execution, recording, taxes, association obligations and local transfer requirements. Seller tax bills do not guarantee buyer taxes. The Kansas Constitution Article 15 section 9 requires applicable joint consent of husband and wife to homestead alienation; title shall determine necessary execution and spouse interests. Obtain current association records, payoff/release evidence, applicable permit and local transfer records. No generic statewide cancellation period is created. Confirm Central/Mountain time for the physical property.",
    "sourceInstructions": "Use current official requirements and separately sign required forms and acknowledgments. A dropdown does not execute a separate form.",
    "officialFormUrl": "https://www.kslegislature.gov/b2025_26/laws/058_000_0000_chapter/058_030_0000_article/058_030_0078a_section/058_030_0078a_k/",
    "required": false,
    "formCode": "KS-RECORDS",
    "sortOrder": 2
  },
  {
    "documentType": "kansas-association-documents",
    "title": "Kansas association records",
    "shortTitle": "Kansas association records",
    "description": "For a Montana condominium resale, upload a complete packet containing the Unit Ownership Act, association bylaws and administrative regulations. Include the seller or other person’s majority-control notice under MCA 70-23-613(1) whenever any person or entity constitutes a majority of the unit owners. Deliver requested documents before any buy-sell signing. The agreement preserves the 72-hour review and penalty-free withdrawal period. These condominium documents are not a universal upload requirement for non-condominium properties. Dues, assessments and other helpful records may accompany the packet; unknown information is not assigned to the buyer.",
    "sourceInstructions": "Use current official requirements and separately sign required forms and acknowledgments. A dropdown does not execute a separate form.",
    "officialFormUrl": "https://www.kslegislature.gov/b2025_26/laws/058_000_0000_chapter/058_030_0000_article/058_030_0078a_section/058_030_0078a_k/",
    "required": false,
    "formCode": "KS-RECORDS",
    "sortOrder": 3
  },
  {
    "documentType": "lead-based-paint",
    "title": "Federal lead disclosure packet or supported exemption",
    "shortTitle": "Federal lead disclosure",
    "description": "For covered pre-1978 housing, provide signed disclosures, available records and the EPA pamphlet before buyer is bound. Inspection waiver does not waive disclosure.",
    "sourceInstructions": "Complete the separate federal packet.",
    "officialFormUrl": "https://www.epa.gov/lead/real-estate-disclosures-about-potential-lead-hazards",
    "required": false,
    "formCode": "KS-LEAD",
    "sortOrder": 4
  }
],
  OH: [
  {
    "documentType": "ohio-seller-disclosure",
    "title": "Ohio seller condition disclosure or supported exception",
    "shortTitle": "Ohio seller condition disclosure or supported exception",
    "description": "For a covered R.C. 5302.30 transfer, seller shall complete applicable items in the current prescribed Residential Property Disclosure Form and deliver a signed, dated copy as soon as practicable. State actual knowledge in good faith; the form is not a warranty or substitute for inspection. Buyer shall sign/date a copy acknowledging receipt and return it to seller or seller\u2019s agent by a legally permitted method. A NavStreet received dropdown does not sign or return that separate form. Document the specific subsection (B)(2) exception when claimed. Amendments and independent fraud/common-law disclosure duties remain. Optional association records do not universally block an offer.",
    "sourceInstructions": "Use current official requirements and separately sign required forms and acknowledgments. A dropdown does not execute a separate form.",
    "officialFormUrl": "https://codes.ohio.gov/ohio-revised-code/section-5302.30",
    "required": false,
    "formCode": "OH-RECORDS",
    "sortOrder": 1
  },
  {
    "documentType": "ohio-statutory-packet",
    "title": "Ohio applicable property-specific records",
    "shortTitle": "Ohio applicable property-specific records",
    "description": "Under R.C. 5302.30(K), when the form or amendment is received after entering the transfer agreement, buyer may rescind in a written, signed, dated notice delivered to seller or seller\u2019s agent within three business days after receipt, and no later than the earlier of thirty days after seller acceptance or closing, subject to statutory conditions. If no form is received, the missing-form rescission deadline is the earlier of thirty days after acceptance or closing. Applicable deposits must be returned. Receipt before submission of the offer and entry into the agreement affects the statutory rescission entitlement. No automatic waiver is created by selecting received, signing this agreement or entering an inspection period. Other remedies remain. Statutory delivery methods and legally valid electronic-consent requirements must be observed.",
    "sourceInstructions": "Use current official requirements and separately sign required forms and acknowledgments. A dropdown does not execute a separate form.",
    "officialFormUrl": "https://codes.ohio.gov/ohio-revised-code/section-5302.30",
    "required": false,
    "formCode": "OH-RECORDS",
    "sortOrder": 2
  },
  {
    "documentType": "ohio-association-documents",
    "title": "Ohio association records",
    "shortTitle": "Ohio association records",
    "description": "For a Montana condominium resale, upload a complete packet containing the Unit Ownership Act, association bylaws and administrative regulations. Include the seller or other person’s majority-control notice under MCA 70-23-613(1) whenever any person or entity constitutes a majority of the unit owners. Deliver requested documents before any buy-sell signing. The agreement preserves the 72-hour review and penalty-free withdrawal period. These condominium documents are not a universal upload requirement for non-condominium properties. Dues, assessments and other helpful records may accompany the packet; unknown information is not assigned to the buyer.",
    "sourceInstructions": "Use current official requirements and separately sign required forms and acknowledgments. A dropdown does not execute a separate form.",
    "officialFormUrl": "https://codes.ohio.gov/ohio-revised-code/section-5302.30",
    "required": false,
    "formCode": "OH-RECORDS",
    "sortOrder": 3
  },
  {
    "documentType": "lead-based-paint",
    "title": "Federal lead disclosure packet or supported exemption",
    "shortTitle": "Federal lead disclosure",
    "description": "For covered pre-1978 housing, provide signed disclosures, available records and the EPA pamphlet before buyer is bound. Inspection waiver does not waive disclosure.",
    "sourceInstructions": "Complete the separate federal packet.",
    "officialFormUrl": "https://www.epa.gov/lead/real-estate-disclosures-about-potential-lead-hazards",
    "required": false,
    "formCode": "OH-LEAD",
    "sortOrder": 4
  }
],
  DE: [
  {
    "documentType": "delaware-seller-disclosure",
    "title": "Delaware seller condition disclosure or supported exception",
    "shortTitle": "Delaware seller condition disclosure or supported exception",
    "description": "For covered transfers, 6 Del. C. 2572 requires written disclosure of known material defects when offered for sale and updates for material changes through final settlement. Under section 2573, seller, agent or subagent shall give the current Commission Seller\u2019s Disclosure of Real Property Condition Report to prospective buyer or buyer\u2019s agent before buyer makes an offer. The report signed by buyer and seller becomes part of this purchase agreement. Seller shall provide the current report and obtain both parties\u2019 required signatures separately; a receipt dropdown or signature on this agreement does not sign that separate form. Claimed section 2577 exceptions require signed supporting certification. Heirs selling inherited property are not automatically exempt. The report is not a warranty or substitute for inspection.",
    "sourceInstructions": "Use current official requirements and separately sign required forms and acknowledgments. A dropdown does not execute a separate form.",
    "officialFormUrl": "https://dpr.delaware.gov/boards/realestate/forms/",
    "required": false,
    "formCode": "DE-RECORDS",
    "sortOrder": 1
  },
  {
    "documentType": "delaware-statutory-packet",
    "title": "Delaware applicable property-specific records",
    "shortTitle": "Delaware applicable property-specific records",
    "description": "For covered transfers, section 2572A requires notice of radon exposure potential, possessed testing/inspection information, known radon hazards, health-department information, and the Commission radon form with buyer and seller acknowledgments, dates and signatures. Buyer has an option to test; selecting received is not execution of the separate form and the statute does not require a new test in every sale. The statutory packet shall include the current radon form, informational notices and possessed reports, or signed evidence of an applicable exception. Review the condition form\u2019s allocation of street repair/repaving costs. Applicable septic, well, coastal, flood and insurance records shall be investigated during the agreed inspection period.",
    "sourceInstructions": "Use current official requirements and separately sign required forms and acknowledgments. A dropdown does not execute a separate form.",
    "officialFormUrl": "https://dpr.delaware.gov/boards/realestate/forms/",
    "required": false,
    "formCode": "DE-RECORDS",
    "sortOrder": 2
  },
  {
    "documentType": "delaware-association-documents",
    "title": "Delaware association records",
    "shortTitle": "Delaware association records",
    "description": "For a Montana condominium resale, upload a complete packet containing the Unit Ownership Act, association bylaws and administrative regulations. Include the seller or other person’s majority-control notice under MCA 70-23-613(1) whenever any person or entity constitutes a majority of the unit owners. Deliver requested documents before any buy-sell signing. The agreement preserves the 72-hour review and penalty-free withdrawal period. These condominium documents are not a universal upload requirement for non-condominium properties. Dues, assessments and other helpful records may accompany the packet; unknown information is not assigned to the buyer.",
    "sourceInstructions": "Use current official requirements and separately sign required forms and acknowledgments. A dropdown does not execute a separate form.",
    "officialFormUrl": "https://dpr.delaware.gov/boards/realestate/forms/",
    "required": false,
    "formCode": "DE-RECORDS",
    "sortOrder": 3
  },
  {
    "documentType": "lead-based-paint",
    "title": "Federal lead disclosure packet or supported exemption",
    "shortTitle": "Federal lead disclosure",
    "description": "For covered pre-1978 housing, provide signed disclosures, available records and the EPA pamphlet before buyer is bound. Inspection waiver does not waive disclosure.",
    "sourceInstructions": "Complete the separate federal packet.",
    "officialFormUrl": "https://www.epa.gov/lead/real-estate-disclosures-about-potential-lead-hazards",
    "required": false,
    "formCode": "DE-LEAD",
    "sortOrder": 4
  }
],
  WA: [
  {
    "documentType": "washington-seller-disclosure",
    "title": "Washington seller condition disclosure or supported exception",
    "shortTitle": "Washington seller condition disclosure or supported exception",
    "description": "For covered improved residential transfers under chapter 64.06 RCW, seller shall provide the completed, signed and dated statutory disclosure statement, ordinarily within five business days after mutual acceptance unless otherwise agreed. Buyer ordinarily has three business days after receipt to deliver written rescission under RCW 64.06.030, with immediate return of deposits and other consideration less agreed disbursements. This agreement does not waive receipt or shorten that statutory period. Missing-form and later-inaccuracy rights, corrective-action provisions and required closing extensions under RCW 64.06.040 remain. A Pending selection permits the offer but does not certify delivery or waive rights. A Received selection is not acceptance of the disclosure or execution of the separate buyer acknowledgment. This workflow permits only supported statutory transfer exceptions, not a buyer waiver. If any Environmental answer would be Yes, receipt of that section cannot be waived under RCW 64.06.010(7).",
    "sourceInstructions": "Use current official requirements and separately sign required forms and acknowledgments. A dropdown does not execute a separate form.",
    "officialFormUrl": "https://app.leg.wa.gov/rcw/default.aspx?cite=64.06.020",
    "required": false,
    "formCode": "WA-RECORDS",
    "sortOrder": 1
  },
  {
    "documentType": "washington-statutory-packet",
    "title": "Washington applicable property-specific records",
    "shortTitle": "Washington applicable property-specific records",
    "description": "Use the prescribed RCW 64.06.020 form, including title, water, sewage, structure, systems, association and environmental information and attachments. Provide applicable locally required notices under RCW 64.06.080 and known tank/leak, well, septic and environmental records. For a community governed by RCW 64.90.640, obtain the resale certificate and records, and preserve its five-business-day cancellation protections and conveyance limits, including when supplied shortly before contract execution. Determine the actual declaration, creation date, governing statute and exceptions; older community regimes may differ and January 2028 changes are not applied early. Seller shall comply with applicable smoke and carbon-monoxide alarm requirements before occupancy. This agreement creates no automatic earnest-money forfeiture or exclusive liquidated-damages election; RCW 64.04.005 has a five-percent statutory safe harbor for qualifying separate provisions.",
    "sourceInstructions": "Use current official requirements and separately sign required forms and acknowledgments. A dropdown does not execute a separate form.",
    "officialFormUrl": "https://app.leg.wa.gov/rcw/default.aspx?cite=64.06.020",
    "required": false,
    "formCode": "WA-RECORDS",
    "sortOrder": 2
  },
  {
    "documentType": "washington-association-documents",
    "title": "Washington association records",
    "shortTitle": "Washington association records",
    "description": "For condominium resales, upload the applicable association resale certificate and governing records here. Seller delivery and buyer cancellation protections under RCW 64.34.425 or RCW 64.90.640 remain applicable even when no upload is required before an initial offer. No required uploads means no outstanding pre-offer upload gate; it does not mean that no later disclosure is legally required. Receipt and statutory exceptions or waivers are not established by an upload. For an ordinary condominium resale, seller shall furnish the applicable association resale certificate and governing records before execution of the sale contract or otherwise before conveyance. Under RCW 64.34.425, buyer may void the contract until the certificate is provided and for five days thereafter or until conveyance, whichever occurs first. Under RCW 64.90.640, buyer generally has five business days after first receipt to cancel; receipt more than five business days before execution eliminates that statutory cancellation right. If received five business days or less before signing, cancellation notice is due no later than the fifth business day after first receipt and before conveyance. Receipt less than five business days before closing permits buyer, before conveyance, to extend closing to no more than five business days after first receipt. Preserve statutory notice methods, assessment protections and deposit remedies. Chapter 64.90 generally governs communities created on or after July 1, 2018 or earlier communities electing it, subject to statutory exceptions; RCW 64.34.010 extends resale provisions to older condominiums subject to its limits. Do not apply the January 2028 transition early. Developer/public-offering sales and statutory transfer exceptions require separate review. This agreement does not elect a statutory exemption or waive receipt, cancellation or closing-extension rights. A pending entry permits an offer and is not proof of delivery. A buyer need not supply project, unit, common-element, parking or storage information absent from the seller records.",
    "sourceInstructions": "Use current official requirements and separately sign required forms and acknowledgments. A dropdown does not execute a separate form.",
    "officialFormUrl": "https://app.leg.wa.gov/rcw/default.aspx?cite=64.06.020",
    "required": false,
    "formCode": "WA-RECORDS",
    "sortOrder": 3
  },
  {
    "documentType": "lead-based-paint",
    "title": "Federal lead disclosure packet or supported exemption",
    "shortTitle": "Federal lead disclosure",
    "description": "For covered pre-1978 housing, provide signed disclosures, available records and the EPA pamphlet before buyer is bound. Inspection waiver does not waive disclosure.",
    "sourceInstructions": "Complete the separate federal packet.",
    "officialFormUrl": "https://www.epa.gov/lead/real-estate-disclosures-about-potential-lead-hazards",
    "required": false,
    "formCode": "WA-LEAD",
    "sortOrder": 4
  }
],
  IA: [
  {
    "documentType": "iowa-seller-disclosure",
    "requiredBeforeAcceptance": false,
    "requiredBeforeOffers": true,
    "title": "Iowa seller condition disclosure or supported exception",
    "shortTitle": "Iowa seller condition disclosure or supported exception",
    "description": "A typical sale of an Iowa home with one to four dwelling units to an unrelated buyer is covered. Chapter 558A.1 lists specific transfer exceptions, including certain court-ordered, foreclosure, fiduciary, co-owner, family and governmental transfers; an estate or trust label alone is not sufficient. For covered transfers, deliver the completed signed condition disclosure before the seller makes or accepts a written offer under Iowa Code 558A.2. Identify and support an actual statutory transfer exception when one applies; an as-is sale is not an exception. NavStreet requires this upload before opening online offers, while still allowing the listing to be advertised. That earlier upload gate is platform policy. Electronic delivery requires actual written buyer acknowledgement; new offers record it with the buyer signatures and exact uploaded version. Existing signed offers keep their original answers and use the separate later-delivery receipt on the offer page. Statutory withdrawal rights remain: three days after personal delivery or five days after electronic or mail delivery when delivery is untimely. Required amendments remain governed by 558A.3.",
    "sourceInstructions": "Upload the completed seller-signed full condition statement, or signed evidence identifying a supported Chapter 558A transfer exception. The linked current rule includes a sample statement on pages 2-3. Include known radon test dates/results and current lead water-service-line information. NavStreet supplies the official radon fact sheet automatically; no duplicate pamphlet upload is needed. Buyers acknowledge actual receipt in the offer flow.",
    "officialFormUrl": "https://www.legis.iowa.gov/docs/iac/rule/481.2014.1.pdf",
    "required": false,
    "formCode": "IA-RECORDS",
    "sortOrder": 1
  },
  {
    "documentType": "iowa-statutory-packet",
    "requiredBeforeAcceptance": false,
    "title": "Iowa additional known radon and property records",
    "shortTitle": "Iowa additional property records",
    "description": "Known radon test dates/results and material property information must be disclosed in the completed seller condition statement when required. Upload available supporting test reports, mitigation records and other relevant existing records here when applicable. This is not a universally required second disclosure packet and does not require a new radon test. The official radon fact sheet is supplied automatically. The full current seller condition form must also address lead water-service-line information, independently of the federal lead paint construction-year cutoff.",
    "sourceInstructions": "Use this optional upload for available supporting radon reports, mitigation records and other relevant existing property records. Required known facts must still be in the full seller condition statement. Do not upload a duplicate automatic radon pamphlet or order a new test merely to open offers. Applicable sewage inspection and groundwater recording records retain their separate transfer deadlines.",
    "officialFormUrl": "https://www.legis.iowa.gov/docs/ico/chapter/558A.pdf",
    "required": false,
    "formCode": "IA-RECORDS",
    "sortOrder": 2
  },
  {
    "documentType": "iowa-association-documents",
    "title": "Iowa association records",
    "shortTitle": "Iowa association records",
    "description": "For an Iowa property with an owners association, obtain applicable governing documents, dues, assessments, restrictions and transfer information. These do not create a universal Iowa pre-offer upload requirement.",
    "sourceInstructions": "Obtain available governing documents, dues, assessments, restrictions and transfer information when an owners association actually applies. For an ordinary non-condominium home where the seller reports no owners association, no association document upload is required. Zero fees alone do not establish that no association exists.",
    "officialFormUrl": "https://www.legis.iowa.gov/docs/ico/chapter/558A.pdf",
    "required": false,
    "formCode": "IA-RECORDS",
    "sortOrder": 3
  },
  {
    "documentType": "lead-based-paint",
    "title": "Federal lead disclosure packet or supported exemption",
    "shortTitle": "Federal lead disclosure",
    "description": "For covered pre-1978 housing, provide signed disclosures, available records and the EPA pamphlet before buyer is bound. Inspection waiver does not waive disclosure.",
    "sourceInstructions": "Complete the separate federal packet.",
    "officialFormUrl": "https://www.epa.gov/lead/real-estate-disclosures-about-potential-lead-hazards",
    "required": false,
    "formCode": "IA-LEAD",
    "sortOrder": 4
  }
],
  MT: [
  {
    "documentType": "montana-seller-disclosure",
    "title": "Montana seller condition disclosure or supported exception",
    "shortTitle": "Montana seller condition disclosure or supported exception",
    "description": "For covered residential transfers under MCA 70-20-502, seller shall disclose actual knowledge of adverse material facts before or contemporaneously with contract execution, including title, water source/service, wastewater, utilities, structure/water intrusion, systems and known physical problems. No duty to inspect is imposed solely by this statement. Identify any actual 70-20-503 exception in signed evidence. NavStreet requires the statement or exception evidence before buyer offer creation as an earlier platform safeguard. Under 70-20-504, unless otherwise agreed in writing, late delivery gives buyer three days from delivery to deliver a separately signed written rescission statement. This agreement does not waive that right. The separate statement is not a warranty under 70-20-505; a receipt selection does not sign a separate statement.",
    "sourceInstructions": "Use Montana-specific seller, radon, contamination and water-right records as applicable. Complete separately required forms and acknowledgments; a receipt dropdown does not execute a separate document.",
    "officialFormUrl": "https://mca.legmt.gov/bills/mca/title_0700/chapter_0200/part_0050/section_0020/0700-0200-0050-0020.html",
    "required": false,
    "formCode": "MT-RECORDS",
    "sortOrder": 1
  },
  {
    "documentType": "montana-statutory-packet",
    "title": "Montana applicable property-specific records",
    "shortTitle": "Montana applicable property-specific records",
    "description": "MCA 75-3-606 requires the radon warning with or before the offer and buyer signature acknowledging a copy. Buyer\u2019s signature on this agreement acknowledges receipt of the radon statement printed below, after reviewing it in the offer questions. Known prior tests and subsequent mitigation/treatment evidence shall be provided before or upon contract entry. That statute does not independently require a new test or create a cancellation contingency; the negotiated inspection contingency remains. Under current MCA 75-10-1305, known methamphetamine or fentanyl lab use/contamination requires written notice before agreement to sale when not remediated to certified standards; provide certified compliance/remediation evidence and appropriate notice when applicable. A seller-statement exception does not waive these separate requirements.",
    "sourceInstructions": "Use Montana-specific seller, radon, contamination and water-right records as applicable. Complete separately required forms and acknowledgments; a receipt dropdown does not execute a separate document.",
    "officialFormUrl": "https://mca.legmt.gov/bills/mca/title_0700/chapter_0200/part_0050/section_0020/0700-0200-0050-0020.html",
    "required": false,
    "formCode": "MT-RECORDS",
    "sortOrder": 2
  },
  {
    "documentType": "montana-association-documents",
    "title": "Montana condominium packet / association records",
    "shortTitle": "Montana condominium packet",
    "description": "Required before online offers for condominium ownership. NavStreet requires this earlier upload to prevent missing-document interruptions for buyers. For a Montana condominium resale, upload a complete packet containing the Unit Ownership Act, association bylaws and administrative regulations. Include the seller or other person’s majority-control notice under MCA 70-23-613(1) whenever any person or entity constitutes a majority of the unit owners. Deliver requested documents before any buy-sell signing. The agreement preserves the 72-hour review and penalty-free withdrawal period. These condominium documents are not a universal upload requirement for non-condominium properties. Dues, assessments and other helpful records may accompany the packet; unknown information is not assigned to the buyer.",
    "sourceInstructions": "For condominium resales, combine the Unit Ownership Act, bylaws, administrative regulations and any applicable majority-control notice in this packet. Deliver requested documents before signing; preserve the statutory 72-hour review and withdrawal rights. The buyer acknowledges actual receipt of the exact uploaded version. Non-condominium association information is not a universal offer prerequisite.",
    "officialFormUrl": "https://mca.legmt.gov/bills/mca/title_0700/chapter_0230/part_0060/section_0130/0700-0230-0060-0130.html",
    "required": false,
    "requiredBeforeOffers": true,
    "formCode": "MT-RECORDS",
    "sortOrder": 3
  },
  {
    "documentType": "lead-based-paint",
    "title": "Federal lead disclosure packet or supported exemption",
    "shortTitle": "Federal lead disclosure",
    "description": "For covered pre-1978 housing, provide signed disclosures, available records and the EPA pamphlet before buyer is bound. Inspection waiver does not waive disclosure.",
    "sourceInstructions": "Complete the separate federal packet.",
    "officialFormUrl": "https://www.epa.gov/lead/real-estate-disclosures-about-potential-lead-hazards",
    "required": false,
    "formCode": "MT-LEAD",
    "sortOrder": 4
  }
],
  MD: [
  {
    "documentType": "maryland-seller-disclosure",
    "requiredBeforeAcceptance": false,
    "title": "Maryland seller condition disclosure or supported exception",
    "shortTitle": "Maryland seller condition disclosure or supported exception",
    "description": "For covered resales, upload the current seller-signed Maryland disclosure OR disclaimer before online offers open. A disclaimer still discloses actually known latent health or safety defects. For an actual Real Property 10-702(b)(2) exemption, upload signed evidence identifying it. The legal delivery deadline is on or before contract formation; NavStreet collects it earlier to avoid interrupting acceptance. Buyers must acknowledge the actual uploaded version.",
    "sourceInstructions": "Use current official requirements and separately sign required forms and acknowledgments. A dropdown does not execute a separate form.",
    "officialFormUrl": "https://www.labor.maryland.gov/forms/propertydanddform.pdf",
    "required": false,
    "formCode": "MD-RECORDS",
    "sortOrder": 1,
    "requiredBeforeOffers": true
  },
  {
    "documentType": "maryland-statutory-packet",
    "title": "Maryland applicable property-specific records",
    "shortTitle": "Maryland applicable property-specific records",
    "description": "Any applicable completed and separately executed deferred water/sewer notice, NPL Superfund addendum, rental lead risk-reduction notice, local enforcement/impact-fee notice or agricultural-transfer-tax notice selected as Received in the statutory packet is expressly attached to and incorporated in this agreement. Seller must identify property-specific applicability and provide the complete facts and statutory text before contract formation. A generic receipt answer does not complete or sign a separate addendum. For recorded deferred charges, include the annual amount, payment month, ending date and collector name/address, prepayment information, and the statutory explanation that these are contractual private charges rather than county charges. Preserve the specific 14-117(b)(3) rescission, deposit-return and undisclosed-charge remedies. For property within one mile of an NPL site, separately identify the site and EPA search/dashboard URLs, obtain both dated signatures, and preserve the five-day cancellation and full-refund right under 10-714. The seller condition statement does not replace these contract addenda.",
    "sourceInstructions": "Use current official requirements and separately sign required forms and acknowledgments. A dropdown does not execute a separate form.",
    "officialFormUrl": "https://www.labor.maryland.gov/forms/propertydanddform.pdf",
    "required": false,
    "formCode": "MD-RECORDS",
    "sortOrder": 2
  },
  {
    "documentType": "maryland-association-documents",
    "title": "Maryland condominium resale packet or HOA records",
    "shortTitle": "Condominium resale packet / HOA records",
    "description": "For condominium ownership, required under Real Property 11-135 no later than 15 days before closing, not universally before the initial offer. Upload declaration (excluding plats), bylaws and rules. For fewer than seven units, include the seller prior-12-month common-element expenses and deductible responsibility/amount notice. For seven or more units, include the complete council certificate, current budget and reserve study or summary/reserve status, financials, assessments/fees, planned capital expenses, judgments/litigation, insurance, applicable warranty-claim settlements, owner statements about alterations/code/extended leases/asbestos, and deductible notice. Buyer retains seven days to cancel after ALL required information arrives, until closing; no waiver. Ordinary HOA lots use 11B-106 documents and its distinct timing/cancellation rights. Optional at initial offer entry; upload does not acknowledge buyer receipt.",
    "sourceInstructions": "Use current official requirements and separately sign required forms and acknowledgments. A dropdown does not execute a separate form.",
    "officialFormUrl": "https://mgaleg.maryland.gov/mgawebsite/Laws/StatuteText?article=grp&section=11-135",
    "required": false,
    "formCode": "MD-RECORDS",
    "sortOrder": 3
  },
  {
    "documentType": "lead-based-paint",
    "title": "Federal lead disclosure packet or supported exemption",
    "shortTitle": "Federal lead disclosure",
    "description": "For covered pre-1978 housing, provide signed disclosures, available records and the EPA pamphlet before buyer is bound. Inspection waiver does not waive disclosure.",
    "sourceInstructions": "Complete the separate federal packet.",
    "officialFormUrl": "https://www.epa.gov/lead/real-estate-disclosures-about-potential-lead-hazards",
    "required": false,
    "formCode": "MD-LEAD",
    "sortOrder": 4
  }
],
  NM: [
  {
    "documentType": "new-mexico-seller-disclosure",
    "title": "New Mexico optional seller condition information",
    "shortTitle": "New Mexico optional seller condition information",
    "description": "This ordinary resale package does not impose a universal state-prescribed seller condition form as a prerequisite to an offer. Seller shall disclose known adverse material facts and shall not misrepresent or actively conceal conditions. A voluntarily supplied condition statement is not a warranty or substitute for inspection. Professional broker duties under 16.61.19 NMAC apply to licensed brokers; they do not make NavStreet a broker or create a statewide FSBO form requirement. A receipt answer records actual delivery, not a completed or signed separate statement.",
    "sourceInstructions": "Use current official requirements and separately sign required forms and acknowledgments. A dropdown does not execute a separate form.",
    "officialFormUrl": "https://www.santafecountynm.gov/assessor/tools/tax-levy-certificate",
    "required": false,
    "formCode": "NM-RECORDS",
    "sortOrder": 1
  },
  {
    "documentType": "new-mexico-statutory-packet",
    "requiredBeforeAcceptanceLabel": "Required before seller acceptance",
    "requiredBeforeAcceptance": false,
    "title": "New Mexico assessor tax estimate and applicable notices",
    "shortTitle": "New Mexico assessor tax estimate and applicable notices",
    "description": "Before online offers open, upload the county assessor written tax-levy estimate at the listed price under NMSA 47-13-4. A current seller tax bill is insufficient. If the estimate is not readily available, answer Yes on the listing and upload written supporting evidence; each buyer must expressly sign the statutory waiver before making an offer. Also include any applicable known drug-contamination notices; the tax waiver does not waive hazard disclosures. The legal estimate delivery deadline is before seller acceptance; NavStreet collects the evidence earlier to avoid replacement offers.",
    "sourceInstructions": "Use current official requirements and separately sign required forms and acknowledgments. A dropdown does not execute a separate form.",
    "officialFormUrl": "https://www.santafecountynm.gov/assessor/tools/tax-levy-certificate",
    "required": false,
    "formCode": "NM-RECORDS",
    "sortOrder": 2,
    "requiredBeforeOffers": true
  },
  {
    "documentType": "new-mexico-association-documents",
    "title": "New Mexico condominium resale packet or HOA records",
    "shortTitle": "Condominium resale packet / HOA records",
    "description": "For condominiums subject to NMSA 47-7D-9, furnish declaration (other than plats/plans), bylaws, rules and association resale certificate before conveyance. Certificate includes transfer restraints, assessments/unpaid amounts, other fees, capital expenditures for current and next two fiscal years, reserves, recent financials, current budget, judgments, insurance and any leasehold term. Buyer may void until the certificate is supplied and for seven days after receipt or conveyance, whichever first. Verify 47-7A-2 applicability to older condominiums and 47-7D-1(B) exceptions. This agreement also gives equivalent contractual document-review protection without inventing a universal pre-offer upload deadline. Non-condominium HOA records use 47-16-11 through -13. Do not substitute HOA fees for condominium ownership.",
    "sourceInstructions": "Use current official requirements and separately sign required forms and acknowledgments. A dropdown does not execute a separate form.",
    "officialFormUrl": "https://nmonesource.com/",
    "required": false,
    "formCode": "NM-RECORDS",
    "sortOrder": 3
  },
  {
    "documentType": "lead-based-paint",
    "title": "Federal lead disclosure packet or supported exemption",
    "shortTitle": "Federal lead disclosure",
    "description": "For covered pre-1978 housing, provide signed disclosures, available records and the EPA pamphlet before buyer is bound. Inspection waiver does not waive disclosure.",
    "sourceInstructions": "Complete the separate federal packet.",
    "officialFormUrl": "https://www.epa.gov/lead/real-estate-disclosures-about-potential-lead-hazards",
    "required": false,
    "formCode": "NM-LEAD",
    "sortOrder": 4
  }
],
  SD: [
  {
    "documentType": "south-dakota-seller-disclosure",
    "title": "South Dakota seller condition disclosure or supported exception",
    "shortTitle": "South Dakota seller condition disclosure or supported exception",
    "description": "For covered residential transfers, SDCL 43-4-38 requires the current 43-4-44 condition statement before buyer makes a written offer. The statement covers the property and known conditions, including applicable water, radon, hazardous materials and private transfer fees; it is not a warranty or substitute for independent inspection. Identify an actual 43-4-43 exception in signed evidence. Each buyer and seller must complete the separate required signature/initial spaces; an agreement signature does not fill or initial the seven-page statement. Seller must deliver written material amendments before closing or possession, whichever comes first. If a statement or material amendment arrives after the written offer, 43-4-39 permits written termination within three days after in-person delivery or six days after deposit in mail. Do not silently substitute business days or assume electronic delivery changes these statutory periods.",
    "sourceInstructions": "Use current official requirements and separately sign required forms and acknowledgments. A dropdown does not execute a separate form.",
    "officialFormUrl": "https://dlr.sd.gov/realestate/forms/sellers_property_condition_disclosure_statement.pdf",
    "required": false,
    "formCode": "SD-RECORDS",
    "sortOrder": 1,
    "requiredBeforeOffers": true
  },
  {
    "documentType": "south-dakota-statutory-packet",
    "title": "South Dakota applicable property-specific records",
    "shortTitle": "South Dakota applicable property-specific records",
    "description": "SDCL 43-4-44.1 independently requires, before buyer makes a written offer, notice that the property is governed by an HOA, its governing documents, assessment amount/frequency/purpose and special one-time assessments from the most recent three years. This applies to all residential transfers after July 1, 2024. A condition-statement exception does not remove this separate HOA duty. Supply written amendments for material changes before closing or possession, whichever comes first. The ordinary condition statement alone is not the complete HOA packet.",
    "sourceInstructions": "Use current official requirements and separately sign required forms and acknowledgments. A dropdown does not execute a separate form.",
    "officialFormUrl": "https://dlr.sd.gov/realestate/forms/sellers_property_condition_disclosure_statement.pdf",
    "required": false,
    "formCode": "SD-RECORDS",
    "sortOrder": 2
  },
  {
    "documentType": "south-dakota-association-documents",
    "title": "South Dakota condominium / association packet — required before offers when applicable",
    "shortTitle": "Condominium / association packet",
    "description": "Required for condominium or other property governed by an association meeting SDCL 43-4-44.1: before buyer makes a written offer, provide association notice, governing documents, assessment amount/frequency/purpose and special one-time assessments for the most recent three years. For a condominium include its master deed/declaration, bylaws/rules and available final/substitute Commission report and supplements. A condition-statement exception does not remove the independent association duty. Developer offerings and their 43-15A-19 ten-day report-review process are outside this ordinary resale package. No HOA or zero dues cannot exclude condominium ownership.",
    "sourceInstructions": "Use current official requirements and separately sign required forms and acknowledgments. A dropdown does not execute a separate form.",
    "officialFormUrl": "https://sdlegislature.gov/api/Statutes/43-4-44.1.html?all=true",
    "required": false,
    "formCode": "SD-RECORDS",
    "sortOrder": 3,
    "requiredBeforeOffers": true
  ,
  },
  {
    "documentType": "lead-based-paint",
    "title": "Federal lead disclosure packet or supported exemption",
    "shortTitle": "Federal lead disclosure",
    "description": "For covered pre-1978 housing, provide signed disclosures, available records and the EPA pamphlet before buyer is bound. Inspection waiver does not waive disclosure.",
    "sourceInstructions": "Complete the separate federal packet.",
    "officialFormUrl": "https://www.epa.gov/lead/real-estate-disclosures-about-potential-lead-hazards",
    "required": false,
    "formCode": "SD-LEAD",
    "sortOrder": 4
  }
],
  WY: [
  {
    "documentType": "wyoming-seller-disclosure",
    "title": "Wyoming seller condition disclosure or supported exception",
    "shortTitle": "Wyoming seller condition disclosure or supported exception",
    "description": "This ordinary resale package does not require a universal Wyoming statutory seller condition form before an offer. Seller shall truthfully disclose known material conditions, answer specific inquiries and avoid misrepresentation or active concealment. Any voluntarily supplied condition statement remains separate from this agreement and is not a warranty or independent inspection. Licensed agent adverse-material-fact and relationship duties under W.S. 33-28-303 and 33-28-306 apply when such professionals participate; they do not make this FSBO platform a broker. This agreement does not add a broad as-is waiver of fraud or other available remedies.",
    "sourceInstructions": "Use current official requirements and separately sign required forms and acknowledgments. A dropdown does not execute a separate form.",
    "officialFormUrl": "https://www.wyoleg.gov/statutes/compress/title33.pdf",
    "required": false,
    "formCode": "WY-RECORDS",
    "sortOrder": 1
  },
  {
    "documentType": "wyoming-statutory-packet",
    "title": "Wyoming applicable property-specific records",
    "shortTitle": "Wyoming applicable property-specific records",
    "description": "Verify water and irrigation rights with the State Engineer, including permits, adjudication, well access and any deed reservations or severance. Under applicable Wyoming water law, identify seller-owned appurtenant rights intended to convey rather than infer ownership from a visible well or ditch. Seller shall provide existing records; title and closing professionals shall complete required transfers and ownership updates. Review mineral/surface estates, easements, physical/legal access, shared wells and development restrictions during inspection. No new water test or radon test is universally required solely by this agreement.",
    "sourceInstructions": "Use current official requirements and separately sign required forms and acknowledgments. A dropdown does not execute a separate form.",
    "officialFormUrl": "https://www.wyoleg.gov/statutes/compress/title33.pdf",
    "required": false,
    "formCode": "WY-RECORDS",
    "sortOrder": 2
  },
  {
    "documentType": "wyoming-association-documents",
    "title": "Wyoming condominium / association records",
    "shortTitle": "Condominium / association records",
    "description": "For condominium ownership, obtain the recorded declaration, bylaws/rules and common-element interests, assessments and unpaid balances, insurance and deductible information, reserves and any parking/storage restrictions. Wyoming does not impose a universal ordinary-condominium-resale packet or review-period prerequisite to the initial offer. These recommended records remain optional for offer entry; negotiated inspection and contract rights apply. Developer, new-construction and leasehold sales require a separate agreement.",
    "sourceInstructions": "Use current official requirements and separately sign required forms and acknowledgments. A dropdown does not execute a separate form.",
    "officialFormUrl": "https://wyoleg.gov/statutes/compress/title34.pdf",
    "required": false,
    "formCode": "WY-RECORDS",
    "sortOrder": 3
  },
  {
    "documentType": "lead-based-paint",
    "title": "Federal lead disclosure packet or supported exemption",
    "shortTitle": "Federal lead disclosure",
    "description": "For covered pre-1978 housing, provide signed disclosures, available records and the EPA pamphlet before buyer is bound. Inspection waiver does not waive disclosure.",
    "sourceInstructions": "Complete the separate federal packet.",
    "officialFormUrl": "https://www.epa.gov/lead/real-estate-disclosures-about-potential-lead-hazards",
    "required": false,
    "formCode": "WY-LEAD",
    "sortOrder": 4
  }
],
  MN: [
  {
    "documentType": "minnesota-seller-disclosure",
    "title": "Minnesota seller disclosure or lawful exception evidence",
    "shortTitle": "Minnesota seller disclosure or lawful exception evidence",
    "formCode": "MN-RECORDS",
    "description": "Seller-signed known material facts statement under Minn. Stat. 513.55, or signed evidence of a specific 513.54 exception or lawful written mutual 513.60 waiver. Independent radon, well, sewage and other disclosure duties remain.",
    "sourceInstructions": "Complete and sign the applicable statement; identify and support any statutory exception or lawful waiver separately.",
    "required": true,
    "sortOrder": 1,
    "officialFormUrl": "https://www.revisor.mn.gov/statutes/cite/513.55"
  },
  {
    "documentType": "minnesota-statutory-packet",
    "title": "Minnesota property-specific statutory and local records",
    "shortTitle": "Minnesota property-specific statutory and local records",
    "formCode": "MN-RECORDS",
    "description": "Provide the applicable radon disclosure, current known reports and mitigation records, exact warning and MDH Radon in Real Estate Transactions publication; wells location/status/map or no-known-well statement; permitted-sewer or onsite-sewage statement/map and available reports. Include Washington County special-well-construction-area information when applicable, known meth production and CWD premises notices, and local records such as Minneapolis Truth in Sale of Housing. Identify any independent statutory exception in signed evidence. New uninhabited construction is not a blanket radon exception.",
    "sourceInstructions": "Combine the applicable signed statements, maps, notices, publications and available reports into the uploaded packet. NavStreet requires this packet before offer creation.",
    "required": true,
    "sortOrder": 1,
    "officialFormUrl": "https://www.revisor.mn.gov/statutes/cite/144.496",
    "additionalDownloads": [
      {
        "label": "MDH radon publication and disclosure guidance",
        "url": "https://www.health.mn.gov/communities/environment/air/radon/radonre.html"
      }
    ]
  },
  {
    "documentType": "minnesota-association-documents",
    "title": "Minnesota association resale packet",
    "shortTitle": "Minnesota association resale packet",
    "formCode": "MN-RECORDS",
    "description": "For a covered Chapter 515B resale provide governing documents, required financial/association information and a resale certificate not more than 90 days old, including the current preventative maintenance plan, schedule and budget or their electronic availability as specified by the certificate. Effective January 1, 2027 include required fine/remedy and collection policies, any reserve study obtained within the preceding three years and updated certificate information. This upload does not waive the buyer’s cancellation rights.",
    "sourceInstructions": "Request current property-specific records from the association or manager.",
    "required": false,
    "sortOrder": 1,
    "officialFormUrl": "https://www.revisor.mn.gov/statutes/cite/515B.4-107"
  },
  {
    "documentType": "lead-based-paint",
    "title": "Federal lead disclosure packet or exemption evidence",
    "shortTitle": "Federal lead disclosure packet or exemption evidence",
    "formCode": "MN-RECORDS",
    "description": "For covered housing provide the signed seller disclosure, available records and EPA pamphlet before the buyer is bound. A written waiver of the inspection opportunity does not waive disclosure. A claimed federal exemption requires signed evidence.",
    "sourceInstructions": "Complete the federal disclosure and provide all applicable materials.",
    "required": false,
    "sortOrder": 1,
    "officialFormUrl": "https://www.epa.gov/lead/real-estate-disclosures-about-potential-lead-hazards",
    "additionalDownloads": [
      {
        "label": "EPA lead pamphlet",
        "url": "https://www.epa.gov/lead/protect-your-family-lead-your-home"
      }
    ]
  }
],
  AZ: [
  {
    "documentType": "arizona-seller-disclosure",
    "title": "Arizona seller disclosure or exemption evidence",
    "shortTitle": "Arizona seller disclosure or exemption evidence",
    "description": "Seller shall disclose known material facts affecting value or desirability. This original agreement does not require a proprietary association SPDS form. Under A.R.S. 33-422, covered sales of five or fewer parcels other than subdivided land in an unincorporated county area, and subsequent sales of those parcels, require the current notarized statutory affidavit in at least twelve-point type at least seven days before transfer. Buyer shall acknowledge receipt, has five days after furnishing to rescind, and the affidavit is recorded with the deed. Omission/misrepresentation liability cannot be released or waived. Early upload does not waive rescission or later corrections.",
    "sourceInstructions": "Use the current official requirements; upload the applicable signed records or documented exception/nonapplicability evidence.",
    "officialFormUrl": "https://www.azleg.gov/ars/33/00422.htm",
    "required": true,
    "formCode": "AZ-RECORDS",
    "sortOrder": 1
  },
  {
    "documentType": "arizona-statutory-packet",
    "title": "Arizona property-specific records and scope review",
    "shortTitle": "Arizona property-specific records and scope review",
    "description": "Provide a seller-signed applicability review and applicable documents for rural-parcel affidavit (A.R.S. 33-422), pool safety notice (36-1681(E)), military-airport vicinity (28-8484(E)), septic transfer inspection and water/well rights, flood, access, solar/battery leases and local transfer rules. Explain each nonapplicable item. The notarized rural affidavit must use the current statutory form and at least 12-point type; this packet does not replace it. Pool notice must be provided on entering the sale agreement. Septic inspection must be within six months before transfer, report delivered to buyer, and buyer files the Notice of Transfer within 15 calendar days after transfer. Wholesale assignments, tribal trust/leasehold interests, subdivision/developer and new-construction sales are outside this agreement.",
    "sourceInstructions": "Use the current official requirements; upload the applicable signed records or documented exception/nonapplicability evidence.",
    "officialFormUrl": "https://azre.gov/consumers",
    "required": true,
    "formCode": "AZ-RECORDS",
    "sortOrder": 1,
    "additionalDownloads": [
      {
        "label": "Arizona approved pool safety notice",
        "url": "https://www.azdhs.gov/documents/preparedness/epidemiology-disease-control/environmental-health/residential-pool-safety-notice.pdf"
      },
      {
        "label": "Arizona septic transfer guidance",
        "url": "https://azdeq.gov/wqd-onsite-wastewater-notice-transfer-and-inspection"
      }
    ]
  },
  {
    "documentType": "arizona-association-documents",
    "title": "Arizona association records",
    "shortTitle": "Arizona association records",
    "description": "For condominium units use A.R.S. 33-1260; for planned communities use A.R.S. 33-1806. When either applies, communities with fewer than fifty properties require seller delivery within ten days after offer acceptance. For fifty or more properties seller gives written notice to the association, which delivers within ten days after receipt of the notice. Include all current statutory records, including the previous three open board-meeting minutes, financial and reserve information, violations, lawsuits and applicable fees. Obtain the separately signed statutory close-of-escrow acknowledgement. Early copies do not excuse updated statutory delivery. No general HOA cancellation period is created by this agreement. Condominium packets must cover all associations and include the current plat, declaration, bylaws/rules, three open board-meeting minutes, assessment/lien and fee information, operating and reserve financial records, budget, applicable audit/review/compilation and reserve study, litigation, insurance certificates, violations, declarant-control/ownership information, rights to request full reports and the separately signed close-of-escrow acknowledgement.",
    "sourceInstructions": "Use the current official requirements; upload the applicable signed records or documented exception/nonapplicability evidence.",
    "officialFormUrl": "https://www.azleg.gov/ars/33/01806.htm",
    "required": false,
    "formCode": "AZ-RECORDS",
    "sortOrder": 1
  },
  {
    "documentType": "lead-based-paint",
    "title": "Federal lead disclosure packet or exemption evidence",
    "shortTitle": "Federal lead disclosure packet or exemption evidence",
    "description": "For covered pre-1978 housing provide the signed lead statement, available reports and EPA pamphlet before buyer is bound. Inspection waiver does not waive disclosure.",
    "sourceInstructions": "Use the current official requirements; upload the applicable signed records or documented exception/nonapplicability evidence.",
    "officialFormUrl": "https://www.epa.gov/lead/real-estate-disclosures-about-potential-lead-hazards",
    "required": false,
    "formCode": "AZ-RECORDS",
    "sortOrder": 1
  }
],
  OR: [
  {
    "documentType": "oregon-seller-disclosure",
    "title": "Oregon seller disclosure or supported exemption evidence",
    "shortTitle": "Oregon seller disclosure or supported exemption evidence",
    "description": "For a transaction covered by ORS 105.465, seller shall complete, sign and deliver the disclosure substantially in the ORS 105.464 statutory form to each buyer making a written offer. Document any ORS 105.470 exclusion; an as-is clause does not create an exclusion. Under ORS 105.475, absent a separate written waiver, buyer has five business days after delivery to deliver a separate signed written revocation disapproving the disclosure. Failure or refusal to provide the required disclosure preserves revocation until closing. Timely revocation voids the offer and requires immediate return of deposits and other consideration as provided by law. Closing terminates this statutory revocation right. The seller disclosure is incorporated into offer and acceptance by statute. Review/receipt selections and signing this agreement do not waive this right. No waiver is generated by NavStreet.",
    "sourceInstructions": "Use current official requirements and separately execute required seller and buyer acknowledgments. Upload complete applicable records; a status selection does not sign separate forms.",
    "officialFormUrl": "https://www.oregonlegislature.gov/bills_laws/ors/ors105.html",
    "required": false,
    "formCode": "OR-RECORDS",
    "sortOrder": 1
  },
  {
    "documentType": "oregon-statutory-packet",
    "title": "Oregon applicable statutory records",
    "shortTitle": "Oregon applicable statutory records",
    "description": "If the property includes a domestic groundwater well covered by ORS 448.271 and OAR 333-061-0305 through 0335, seller shall arrange accredited-laboratory arsenic, nitrate and total-coliform testing upon accepting the offer and provide the results to buyer and required RET report/results to Oregon Health Authority within the applicable ninety-day reporting periods. Test results associated with a sale are valid for one year. Verify exemptions and any location-specific additional testing. This agreement does not falsely require completed well testing before an offer can be made; buyer may negotiate inspection and closing conditions. Unless a statutory/rule exemption applies, seller shall remove, destroy and dispose of uncertified solid-fuel devices and notify Oregon DEQ before closing. Any agreement transferring that duty to buyer must be separately explicit and signed by both parties; buyer then completes the duty within thirty days after closing. No such transfer is implied by this agreement, included-fixtures wording or an as-is clause. Seller shall comply with applicable smoke-alarm installation rules and required functioning carbon-monoxide alarms for a dwelling with a CO source before transfer. Verify local energy-assessment and other transfer requirements with the applicable city; this statewide agreement does not establish local compliance. Title shall confirm legal description, necessary owners and signature authority, liens, easements, water/access rights and appropriate deed/recording. This initial agreement is for ordinary existing fee-simple single-family, townhome and PUD resales with cash or conventional funding. Condominium, manufactured-home, new-construction, land, leasehold, subdivision/developer and residential wholesale transactions require separately reviewed agreements. Oregon wholesaling registration/disclosure/cancellation duties under ORS 696.653 to 696.665 are not implemented here; no assignment/wholesale workflow is authorized. Seller must disclose actual material facts and provide updated applicable information; seller tax bills do not guarantee buyer taxes.",
    "sourceInstructions": "Use current official requirements and separately execute required seller and buyer acknowledgments. Upload complete applicable records; a status selection does not sign separate forms.",
    "officialFormUrl": "https://www.oregonlegislature.gov/bills_laws/ors/ors105.html",
    "required": false,
    "formCode": "OR-RECORDS",
    "sortOrder": 2
  },
  {
    "documentType": "oregon-association-documents",
    "title": "Oregon association records",
    "shortTitle": "Oregon association records",
    "description": "Provide applicable recorded restrictions, assessments, fees, contact information and resale records. Not a universal pre-offer upload requirement.",
    "sourceInstructions": "Use current official requirements and separately execute required seller and buyer acknowledgments. Upload complete applicable records; a status selection does not sign separate forms.",
    "officialFormUrl": "https://www.oregonlegislature.gov/bills_laws/ors/ors105.html",
    "required": false,
    "formCode": "OR-RECORDS",
    "sortOrder": 3
  },
  {
    "documentType": "lead-based-paint",
    "title": "Federal lead disclosure packet",
    "shortTitle": "Federal lead disclosure packet",
    "formCode": "FED-LEAD",
    "description": "For covered pre-1978 housing, supply signed federal statements, known information and reports and EPA pamphlet before buyer is bound; preserve inspection opportunity or express written waiver.",
    "sourceInstructions": "Use the current EPA requirements.",
    "officialFormUrl": "https://www.epa.gov/lead/real-estate-disclosures-about-potential-lead-hazards",
    "required": false,
    "sortOrder": 4
  }
],
  MO: [
{
  appliesToListing: listing => listing.propertyType === 'condo' || listing.sellerStatements?.contractFacts?.isCondominium === true,
  requiredBeforeClosing:true, requiredBeforeClosingLabel:'Required before conveyance',
  "documentType": "missouri-condominium-resale-certificate",
  "title": "Missouri condominium resale certificate and governing documents",
  "shortTitle": "Condominium resale certificate",
  "description": "For condominium ownership, obtain the complete association resale certificate, declaration, bylaws, rules, assessments and fees, budgets/financials, reserves and anticipated expenditures, litigation, insurance and other applicable information. Confirm declaration date and statutory applicability under RSMo 448.1-102, 448.4-101 and 448.4-109. Pending receipt does not universally block an offer. Actual provision triggers applicable buyer protections; an upload is not proof of buyer receipt.",
  "sourceInstructions": "Request the complete packet from the association. Include all applicable statutory information and amendments; preserve delivery evidence. Covered Missouri resale contracts remain voidable until provision and for five days afterward or until conveyance, whichever occurs first.",
  "officialFormUrl": "https://revisor.mo.gov/main/OneSection.aspx?section=448.4-109",
  "required": false,
  "formCode": "MO-CONDO-RESALE",
  "sortOrder": 4
},
{
  appliesToListing: listing => listing.propertyType === 'multi_family' && listing.sellerStatements?.leasesExist === true,
  requiredBeforeClosing:true, requiredBeforeClosingLabel:'Required before closing',
  "documentType": "missouri-tenant-records",
  "title": "Missouri leases, rent roll and security deposit records",
  "shortTitle": "Tenant and lease records",
  "description": "For occupied small multifamily property, supply complete leases and amendments, rent roll, deposits and prepaid rents, concessions, notices and known disputes. Lawful tenant rights continue through sale; reconcile and transfer rents/deposits at closing.",
  "sourceInstructions": "Combine the complete records into a PDF. Redact Social Security numbers, bank details and unnecessary personal identifiers while preserving tenancy, rent and deposit information. Confirm security deposit, assignment and closing requirements with the closing agent. A received selection records actual buyer receipt and review.",
  "officialFormUrl": "https://revisor.mo.gov/main/OneSection.aspx?section=535.300",
  "required": false,
  "formCode": "MO-TENANCIES",
  "sortOrder": 5
},

  {
    "documentType": "missouri-seller-disclosure",
    "title": "Missouri seller disclosure or supported exemption evidence",
    "shortTitle": "Missouri seller disclosure or supported exemption evidence",
    "description": "Under RSMo 442.606(1), seller shall disclose in writing known prior methamphetamine production on the premises regardless of whether anyone was convicted. Under subsection (2), seller shall also disclose covered residence, storage-site or laboratory history involving the specified methamphetamine-related convictions when seller knew or should have known of those convictions. These are distinct tests. The written disclosure must describe the known history and available remediation records; a claim of cleanup does not automatically erase disclosure duties. Required history must be reviewed before either party signs this agreement.",
    "sourceInstructions": "Use current official requirements and separately execute required seller and buyer acknowledgments. Upload complete applicable records; a status selection does not sign separate forms.",
    "officialFormUrl": "https://www.revisor.mo.gov/main/OneSection.aspx?section=442.606",
    "required": false,
    "formCode": "MO-RECORDS",
    "sortOrder": 1
  },
  {
    "documentType": "missouri-statutory-packet",
    "title": "Missouri applicable statutory records",
    "shortTitle": "Missouri applicable statutory records",
    "description": "This agreement does not represent a proprietary association seller form as universally mandated by Missouri statute. A general seller condition report may remain pending, but that does not excuse truthful disclosure, known material defects, fraud/concealment rules, applicable federal lead requirements or the specific statutory duties above. Buyer shall investigate structure, environmental conditions, water/septic systems, easements and insurability during the negotiated inspection period. RSMo 442.600 addresses psychologically impacted property; it does not authorize false statements or override RSMo 442.606. RSMo 432.010 requires the applicable signed writing and written agent authority for land sale contracts. Title shall verify all necessary owners, marital/homestead interests, legal description, deed execution, liens, recorded restrictions and recording. Seller shall provide known leases and association records when applicable; no universal pre-offer HOA upload or generic state cooling-off period is created. Seller property tax history does not guarantee buyer assessments or charges. Applicable local permit, occupancy, sewer/septic and transfer obligations remain. Select the Missouri agreement matching actual ownership and transaction type. Residential, condominium resale, vacant land and qualifying two-to-four-unit resales have distinct agreement paths. Manufactured/mobile, developer, installment seller financing, leasehold and wholesale assignment transactions require separate review. The parties must disclose any unsupported transaction structure to title/closing professionals and must not rely on a dropdown to establish legal eligibility.",
    "sourceInstructions": "Use current official requirements and separately execute required seller and buyer acknowledgments. Upload complete applicable records; a status selection does not sign separate forms.",
    "officialFormUrl": "https://www.revisor.mo.gov/main/OneSection.aspx?section=442.606",
    "required": false,
    "formCode": "MO-RECORDS",
    "sortOrder": 2
  },
  {
    "documentType": "missouri-association-documents",
    "title": "Missouri association records",
    "shortTitle": "Missouri association records",
    "description": "Provide applicable recorded restrictions, assessments, fees, contact information and resale records. Not a universal pre-offer upload requirement.",
    "sourceInstructions": "Use current official requirements and separately execute required seller and buyer acknowledgments. Upload complete applicable records; a status selection does not sign separate forms.",
    "officialFormUrl": "https://www.revisor.mo.gov/main/OneSection.aspx?section=442.606",
    "required": false,
    "formCode": "MO-RECORDS",
    "sortOrder": 3
  },
  {
    "documentType": "lead-based-paint",
    "title": "Federal lead disclosure packet",
    "shortTitle": "Federal lead disclosure packet",
    "formCode": "FED-LEAD",
    "description": "For covered pre-1978 housing, supply signed federal statements, known information and reports and EPA pamphlet before buyer is bound; preserve inspection opportunity or express written waiver.",
    "sourceInstructions": "Use the current EPA requirements.",
    "officialFormUrl": "https://www.epa.gov/lead/real-estate-disclosures-about-potential-lead-hazards",
    "required": false,
    "sortOrder": 4
  }
],
  NE: [
  {
    "documentType": "nebraska-seller-disclosure",
    "title": "Nebraska seller disclosure or supported exemption evidence",
    "shortTitle": "Nebraska seller disclosure or supported exemption evidence",
    "description": "For a covered residential transaction under Neb. Rev. Stat. 76-2,120, seller shall complete and execute the current State Real Estate Commission Seller Property Condition Disclosure Statement, identify the address and legal description, disclose the required condition/title/hazard/utility/private-transfer-fee and carbon-monoxide-alarm information, and update inaccurate information known to seller on or before the effective date binding buyer. Deliver the statement and updates by that effective date, with buyer written receipt acknowledgment. Unknown answers are permitted when information is unknown. The statement is not a warranty or inspection substitute and is legally separate from the purchase contract. Document a specific subsection (6) exemption; an as-is clause is not an exemption. Receipt selection in NavStreet does not execute the separate statutory acknowledgment.",
    "sourceInstructions": "Use current official requirements and separately execute required seller and buyer acknowledgments. Upload complete applicable records; a status selection does not sign separate forms.",
    "officialFormUrl": "https://nrec.nebraska.gov/sites/default/files/doc/Forms/SPCD.pdf",
    "required": true,
    "formCode": "NE-RECORDS",
    "sortOrder": 1
  },
  {
    "documentType": "nebraska-statutory-packet",
    "title": "Nebraska applicable statutory records",
    "shortTitle": "Nebraska applicable statutory records",
    "description": "Failure to comply with 76-2,120 does not alone invalidate a transfer. Preserve applicable actual-damage, court-cost and attorney-fee rights and the statutory one-year limitation measured from possession or conveyance, whichever is first; this agreement does not create a generic rescission period. Under 40-104, title shall confirm necessary spouse signatures for homestead property. A purchase agreement signed by both spouses does not require acknowledgment merely to be enforceable, while the homestead conveyance has separate execution/acknowledgment requirements. Buyer shall investigate the property, water rights and quality, wells/septic systems, access, zoning, hazards and insurance within the negotiated inspection period. Verify applicable carbon-monoxide requirements and local occupancy, sewer/septic and transfer obligations. Title shall verify legal description, owners, marital interests, liens, easements and deed/recording. Association records and leases must be obtained when applicable but this agreement does not invent a universal pre-offer HOA packet. Seller tax bills do not guarantee buyer taxes. This original agreement covers ordinary existing fee-simple single-family, townhome and PUD resales with cash or conventional financing. Although 76-2,120 covers additional transaction categories, ground leases, leases with purchase options, condominiums, manufactured homes, vacant land, new construction/developer sales, installment seller financing and wholesale assignments are outside this initial product. Those categories need separately reviewed contracts; the narrower product scope is not a statement that the statute excludes them.",
    "sourceInstructions": "Use current official requirements and separately execute required seller and buyer acknowledgments. Upload complete applicable records; a status selection does not sign separate forms.",
    "officialFormUrl": "https://nrec.nebraska.gov/sites/default/files/doc/Forms/SPCD.pdf",
    "required": false,
    "formCode": "NE-RECORDS",
    "sortOrder": 2
  },
  {
    "documentType": "nebraska-association-documents",
    "title": "Nebraska association records",
    "shortTitle": "Nebraska association records",
    "description": "Provide applicable recorded restrictions, assessments, fees, contact information and resale records. Not a universal pre-offer upload requirement.",
    "sourceInstructions": "Use current official requirements and separately execute required seller and buyer acknowledgments. Upload complete applicable records; a status selection does not sign separate forms.",
    "officialFormUrl": "https://nrec.nebraska.gov/sites/default/files/doc/Forms/SPCD.pdf",
    "required": false,
    "formCode": "NE-RECORDS",
    "sortOrder": 3
  },
  {
    "documentType": "lead-based-paint",
    "title": "Federal lead disclosure packet",
    "shortTitle": "Federal lead disclosure packet",
    "formCode": "FED-LEAD",
    "description": "For covered pre-1978 housing, supply signed federal statements, known information and reports and EPA pamphlet before buyer is bound; preserve inspection opportunity or express written waiver.",
    "sourceInstructions": "Use the current EPA requirements.",
    "officialFormUrl": "https://www.epa.gov/lead/real-estate-disclosures-about-potential-lead-hazards",
    "required": false,
    "sortOrder": 4
  }
],
  NH: [
  {
    "documentType": "new-hampshire-seller-disclosure",
    "title": "New Hampshire seller disclosure or supported exemption evidence",
    "shortTitle": "New Hampshire seller disclosure or supported exemption evidence",
    "description": "Under RSA 477:4-d, seller shall provide the required written information before or during offer preparation: private water supply type/location/malfunctions/install date/latest test and known test problems; private sewage location/malfunctions/latest service and contractor; insulation type/location; federally designated flood-zone status; and presence of a residential heating-oil underground storage tank. The tank requirement effective August 4, 2026 is included. State in writing when required water, sewage or insulation information is unavailable. Buyer shall acknowledge receipt by signing a copy of the disclosure; a NavStreet received selection alone does not sign that copy.",
    "sourceInstructions": "Use current official requirements and separately execute required seller and buyer acknowledgments. Upload complete applicable records; a status selection does not sign separate forms.",
    "officialFormUrl": "https://gc.nh.gov/rsa/html/XLVIII/477/477-mrg.htm",
    "required": true,
    "formCode": "NH-RECORDS",
    "sortOrder": 1
  },
  {
    "documentType": "new-hampshire-statutory-packet",
    "title": "New Hampshire applicable statutory records",
    "shortTitle": "New Hampshire applicable statutory records",
    "description": "Before execution, RSA 477:4-a requires the exact current notification concerning radon, arsenic, lead, PFAS and flood, and buyer acknowledgment by signing a copy. Provide the complete prescribed notice as a separate signed attachment. General discussion in this contract, a federal lead attachment, a checkbox or a hazard report does not replace that notification. The statute does not itself mandate a universal new radon/arsenic/PFAS test; buyer may negotiate investigations. All statutory rights and limitations remain. RSA 477:4-g requires applicable known production disclosure before signing during the statutory period preceding an authoritative remediation determination; verify records with DES or the authorized specialist. RSA 477:4-h requires applicable metered utility tariff financing disclosures before or during offer preparation and before signing, including known remaining term/charges and available savings records, or written unavailable information, with buyer signed acknowledgment. Include both applicability statements and applicable records in the required packet. No automatic cleanup or tariff exemption is created by this agreement. RSA 506:1 requires the applicable signed writing and written agent authority. Title shall confirm necessary owners/spouses, legal description, liens, deed execution and registry recording. Current RSA 477:22-b through 22-f restrict covered foreign principals; closing professionals must evaluate actual statutory definitions and current legal status. This package does not impose a proposed ten-mile purchaser-affidavit rule as if enacted. This original agreement supports existing fee-simple single-family, townhome and PUD resales with cash or conventional funding; condominiums, manufactured homes, land, new construction/developer, leasehold, seller installment financing and wholesale assignments require separate reviewed agreements.",
    "sourceInstructions": "Use current official requirements and separately execute required seller and buyer acknowledgments. Upload complete applicable records; a status selection does not sign separate forms.",
    "officialFormUrl": "https://gc.nh.gov/rsa/html/XLVIII/477/477-mrg.htm",
    "required": true,
    "formCode": "NH-RECORDS",
    "sortOrder": 2
  },
  {
    "documentType": "new-hampshire-association-documents",
    "title": "New Hampshire association records",
    "shortTitle": "New Hampshire association records",
    "description": "Provide applicable recorded restrictions, assessments, fees, contact information and resale records. Not a universal pre-offer upload requirement.",
    "sourceInstructions": "Use current official requirements and separately execute required seller and buyer acknowledgments. Upload complete applicable records; a status selection does not sign separate forms.",
    "officialFormUrl": "https://gc.nh.gov/rsa/html/XLVIII/477/477-mrg.htm",
    "required": false,
    "formCode": "NH-RECORDS",
    "sortOrder": 3
  },
  {
    "documentType": "lead-based-paint",
    "title": "Federal lead disclosure packet",
    "shortTitle": "Federal lead disclosure packet",
    "formCode": "FED-LEAD",
    "description": "For covered pre-1978 housing, supply signed federal statements, known information and reports and EPA pamphlet before buyer is bound; preserve inspection opportunity or express written waiver.",
    "sourceInstructions": "Use the current EPA requirements.",
    "officialFormUrl": "https://www.epa.gov/lead/real-estate-disclosures-about-potential-lead-hazards",
    "required": false,
    "sortOrder": 4
  }
],
  ID: [
  {
    "documentType": "idaho-seller-disclosure",
    "title": "Idaho seller disclosure or exemption evidence",
    "shortTitle": "Idaho seller disclosure or exemption evidence",
    "description": "For covered residential transfers under Idaho Code 55-2504, including non-owner-occupied rental property, seller shall deliver a signed and dated completed 55-2508 form, or a compliant alternative with all 55-2506 information and 55-2507 mandatory statements, within ten days after acceptance of buyer\u2019s offer. Buyer acknowledges by signing and dating a copy and delivering it back. Unknown/not-available answers remain available. The form is a knowledge disclosure, not a warranty or substitute for inspections. A specific 55-2505 exemption must be identified and documented; an as-is provision alone is not an exemption. The NavStreet receipt selection does not sign the separate statutory form.",
    "sourceInstructions": "Use the current official requirements; upload the applicable signed records or documented exception/nonapplicability evidence.",
    "officialFormUrl": "https://legislature.idaho.gov/wp-content/uploads/statutesrules/idstat/Title55/T55CH25.pdf",
    "required": false,
    "formCode": "ID-RECORDS",
    "sortOrder": 1
  },
  {
    "documentType": "idaho-statutory-packet",
    "title": "Idaho property-specific records and scope review",
    "shortTitle": "Idaho property-specific records and scope review",
    "description": "Provide a seller-signed scope and property-record review covering water/well and irrigation rights, septic permits and known problems, annexation/city-service notices, environmental hazards, access, existing leases and local transfer requirements. Identify applicable records or signed nonapplicability explanations. This is a NavStreet preparation packet, not a state-mandated omnibus form. NavStreet collects the applicable statutory condition disclosure or supported exemption before offers; the legal delivery deadline under Idaho Code 55-2509 is unchanged. New construction, subdivisions/developer sales, tribal trust/leasehold interests and assignment/wholesale transactions are outside this agreement.",
    "sourceInstructions": "Use the current official requirements; upload the applicable signed records or documented exception/nonapplicability evidence.",
    "officialFormUrl": "https://dopl.idaho.gov/rec/rec-enforcement/",
    "required": false,
    "formCode": "ID-RECORDS",
    "sortOrder": 1
  },
  {
    "documentType": "idaho-association-documents",
    "title": "Idaho association records",
    "shortTitle": "Idaho association records",
    "description": "Provide a seller-signed scope and property-record review covering water/well and irrigation rights, septic permits and known problems, annexation/city-service notices, environmental hazards, access, existing leases and local transfer requirements. Identify applicable records or signed nonapplicability explanations. This is a NavStreet preparation packet, not a state-mandated omnibus form. NavStreet collects the applicable statutory condition disclosure or supported exemption before offers; the legal delivery deadline under Idaho Code 55-2509 is unchanged. New construction, subdivisions/developer sales, tribal trust/leasehold interests and assignment/wholesale transactions are outside this agreement. Association governing documents, dues, transfer fees, special assessments and restrictions shall be provided by the negotiated document date or sufficiently before closing for review. No statewide association rescission period is created here. Condominium/developer sales require a separate workflow.",
    "sourceInstructions": "Use the current official requirements; upload the applicable signed records or documented exception/nonapplicability evidence.",
    "officialFormUrl": "https://dopl.idaho.gov/rec/",
    "required": false,
    "formCode": "ID-RECORDS",
    "sortOrder": 1
  },
  {
    "documentType": "lead-based-paint",
    "title": "Federal lead disclosure packet or exemption evidence",
    "shortTitle": "Federal lead disclosure packet or exemption evidence",
    "description": "For covered pre-1978 housing provide the signed lead statement, available reports and EPA pamphlet before buyer is bound. Inspection waiver does not waive disclosure.",
    "sourceInstructions": "Use the current official requirements; upload the applicable signed records or documented exception/nonapplicability evidence.",
    "officialFormUrl": "https://www.epa.gov/lead/real-estate-disclosures-about-potential-lead-hazards",
    "required": false,
    "formCode": "ID-RECORDS",
    "sortOrder": 1
  }
],
  MI: [
  {
    "documentType": "michigan-seller-disclosure",
    "title": "Michigan seller disclosure or lawful exception evidence",
    "shortTitle": "Michigan seller disclosure or lawful exception evidence",
    "formCode": "MI-RECORDS",
    "description": "Use the complete prescribed MCL 565.957 Seller Disclosure Statement for covered residential sales. Unknown and not-available answers remain available. A specific 565.953 exception requires signed supporting evidence; nonoccupancy alone is not an exception.",
    "sourceInstructions": "Complete and sign the applicable statement; identify and support any statutory exception or lawful waiver separately.",
    "required": true,
    "sortOrder": 1,
    "officialFormUrl": "https://www.michigan.gov/leo/-/media/Project/Websites/leo/Documents/MIOSHA/Asbestos-Program/mcl-Act-92-of-1993.pdf"
  },
  {
    "documentType": "michigan-statutory-packet",
    "title": "Michigan property-specific statutory and local records",
    "shortTitle": "Michigan property-specific statutory and local records",
    "formCode": "MI-RECORDS",
    "description": "Provide applicable local transfer records, including Washtenaw water/septic time-of-sale approval when applicable, or a signed explanation of nonapplicability. Identify the property county and confirm this is an ordinary resale rather than a developer condominium, new-construction or installment-land-contract transaction.",
    "sourceInstructions": "Combine the applicable signed statements, maps, notices, publications and available reports into the uploaded packet. NavStreet requires this packet before offer creation.",
    "required": true,
    "sortOrder": 1,
    "officialFormUrl": "https://www.washtenaw.org/1364/Time-of-Sale-Program",
    "additionalDownloads": [
      {
        "label": "Property Transfer Affidavit (Form 2766)",
        "url": "https://www.michigan.gov/taxes/-/media/Project/Websites/treasury/Forms/Local-Government/2766.pdf"
      }
    ]
  },
  {
    "documentType": "michigan-association-documents",
    "title": "Michigan association resale packet",
    "shortTitle": "Michigan association resale packet",
    "formCode": "MI-RECORDS",
    "description": "Provide governing documents, fees, assessments, restrictions and property-specific association records. Developer condominium sales require a separate workflow and are not supported by this agreement.",
    "sourceInstructions": "Request current property-specific records from the association or manager.",
    "required": false,
    "sortOrder": 1,
    "officialFormUrl": "https://www.michigan.gov/lara"
  },
  {
    "documentType": "lead-based-paint",
    "title": "Federal lead disclosure packet or exemption evidence",
    "shortTitle": "Federal lead disclosure packet or exemption evidence",
    "formCode": "MI-RECORDS",
    "description": "For covered housing provide the signed seller disclosure, available records and EPA pamphlet before the buyer is bound. A written waiver of the inspection opportunity does not waive disclosure. A claimed federal exemption requires signed evidence.",
    "sourceInstructions": "Complete the federal disclosure and provide all applicable materials.",
    "required": false,
    "sortOrder": 1,
    "officialFormUrl": "https://www.epa.gov/lead/real-estate-disclosures-about-potential-lead-hazards",
    "additionalDownloads": [
      {
        "label": "EPA lead pamphlet",
        "url": "https://www.epa.gov/lead/protect-your-family-lead-your-home"
      }
    ]
  }
],
  SC: [
    { documentType:'south-carolina-property-condition',title:'South Carolina Residential Property Condition Disclosure Statement',shortTitle:'Property condition',formCode:'SC REC — updated June 2025',required:false,sortOrder:1,
      description:'For covered residential transfers, seller completes and signs the official statement. Deliver before signing or by the different deadline expressly agreed in the purchase contract. Statutory exemptions and a mutual written waiver are separate options; upload is not required to advertise the property.',
      officialFormUrl:'https://llr.sc.gov/re/resources.aspx',formDownloadUrl:'https://llr.sc.gov/re/recpdf/Property-Condition-Disclosure-Statement-06.2025.pdf',additionalDownloads:[{label:'Statutory disclosure exemptions',url:'https://llr.sc.gov/re/recpdf/Doc370.pdf'}]},
    { documentType:'lead-based-paint',title:'Federal Lead-Based Paint Disclosure and Buyer Materials',shortTitle:'Lead paint',formCode:'FED-LEAD',required:false,sortOrder:2,
      description:'For most pre-1978 housing, deliver the lead disclosure, available reports and EPA pamphlet before the buyer signs. The buyer may waive the inspection opportunity, which does not waive the disclosure requirement.',
      formDownloadUrl:'https://www.epa.gov/sites/default/files/documents/selr_eng.pdf',officialFormUrl:'https://www.epa.gov/lead/real-estate-disclosures-about-potential-lead-hazards',additionalDownloads:[{label:'EPA lead safety pamphlet',url:'https://www.epa.gov/system/files/documents/2026-02/protectyourfamily_pamphlet_2026_3.pdf'}]},
    { documentType:'south-carolina-association-documents',title:'Association or Condominium Documents',shortTitle:'Association documents',formCode:'SC-ASSOCIATION',required:false,sortOrder:3,
      description:'When applicable, provide recorded covenants, restrictions, association fees, assessments and property-specific condominium records. HOA information is included in the official condition disclosure.',sourceInstructions:'Request property-specific records from the association, manager or county register of deeds.'},
    { documentType:'south-carolina-coastal-disclosure',title:'Applicable Beachfront Disclosure and Survey',shortTitle:'Beachfront disclosure',formCode:'SC 48-39-330',required:false,sortOrder:4,
      description:'Only for property in whole or part seaward of a beachfront setback or jurisdictional line. The purchase contract must contain the required baseline, setback, NAD-1983 seaward structure-corner coordinates and latest local erosion rate.',officialFormUrl:'https://www.scstatehouse.gov/code/t48c039.php',sourceInstructions:'Obtain the seller’s survey and current departmental coastal records. Upload supporting documents and include the required information in the contract.'},
    { documentType:'south-carolina-vacation-rentals',title:'Existing Vacation Rental Bookings and Management Agreements',shortTitle:'Vacation rentals',formCode:'SC 27-50-250',required:false,sortOrder:5,
      description:'If vacation rentals apply, disclose all future rental periods in writing before ratification. Certain bookings and management agreements continue after transfer; observe statutory notices to the rental manager.',officialFormUrl:'https://www.scstatehouse.gov/code/t27c050.php',sourceInstructions:'Provide all future booking periods and copies of existing rental and management agreements. Ordinary residential leases should also be disclosed.'},
  ],
  CA: [
    {
      documentType: 'california-transfer-disclosure',
      title: 'Transfer Disclosure Statement (TDS)',
      shortTitle: 'Transfer Disclosure Statement (TDS)',
      formCode: 'CC 1102.6',
      sourceInstructions:
        'The official statute contains the TDS. Save or print its complete form, complete the seller sections, sign it and upload the PDF. Preserve all applicable statutory text and required signatures.',
      description:
        'Complete the statutory TDS for a covered transfer, or identify a valid exemption. Disclose known material facts even if exempt.',
      required: false,
      sortOrder: 1,
      officialFormUrl:
        'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1102.6.',
    },
    {
      documentType: 'california-natural-hazard-disclosure',
      title: 'Natural Hazard Disclosure (NHD)',
      shortTitle: 'Natural Hazard Disclosure (NHD)',
      formCode: 'CC 1103.2',
      sourceInstructions:
        'Obtain current property-specific hazard information from an appropriate source or NHD provider. Complete and sign the statutory statement and upload the statement with the supporting report.',
      description:
        'Obtain property-specific current hazard information and a completed signed NHD statement where required. A purchased report is one method; NavStreet does not infer hazards from ZIP code.',
      required: false,
      sortOrder: 2,
      officialFormUrl:
        'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1103.2.',
    },
    {
      documentType: 'california-fire-hardening',
      title: 'Fire-hardening disclosure and retrofit information',
      shortTitle: 'Fire-hardening disclosure and retrofit information',
      formCode: 'CC 1102.6f',
      description:
        'For covered pre-2010 homes in high or very high fire zones, provide the statutory notice, known vulnerable features, applicable low-cost retrofit information and any required inspection information.',
      required: false,
      sortOrder: 3,
      officialFormUrl:
        'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1102.6f.',
    },
    {
      documentType: 'california-defensible-space',
      title: 'Defensible-space documentation or buyer agreement',
      shortTitle: 'Defensible-space documentation or buyer agreement',
      formCode: 'CC 1102.19',
      description:
        'Provide applicable current compliance documentation. If absent, use the statutory written buyer agreement route; follow the local ordinance or applicable one-year documentation rule.',
      required: false,
      sortOrder: 4,
      officialFormUrl:
        'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1102.19.',
    },
    {
      documentType: 'california-recent-renovations',
      title: 'Recent-resale renovations, contractors and permits',
      shortTitle: 'Recent-resale renovations, contractors and permits',
      formCode: 'CC 1102.6h',
      description:
        'For an applicable single-family sale accepted within 18 months after acquisition, disclose covered contractor work, required contractor contacts and permits or permitted third-party contact information. Confirm applicability at acceptance.',
      required: false,
      sortOrder: 5,
      officialFormUrl:
        'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1102.6h.',
    },
    {
      documentType: 'california-assisted-water-tank',
      title: 'Assisted domestic water storage tank statement',
      shortTitle: 'Assisted domestic water storage tank statement',
      formCode: 'CC 1102.156',
      description:
        'Disclose a known existing domestic water tank provided through Water Code 13194 assistance using the statutory information.',
      required: false,
      sortOrder: 6,
      officialFormUrl:
        'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1102.156.',
    },
    {
      documentType: 'california-association-documents',
      title: 'HOA or condominium resale document package',
      shortTitle: 'HOA or condominium resale document package',
      formCode: 'CC 4525',
      description:
        'Request current governing and financial records, assessments, applicable inspection information, rental restrictions and other required resale documents from the association.',
      required: false,
      sortOrder: 7,
      officialFormUrl:
        'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=4525.',
    },
    {
      documentType: 'california-local-disclosures',
      title: 'Property-specific and local disclosures',
      shortTitle: 'Property-specific and local disclosures',
      formCode: 'LOCAL / CC 1102',
      description:
        'Confirm city and county point-of-sale rules, special tax districts and Mello-Roos notices, private transfer fees, known contamination, industrial or nuisance conditions, death disclosures when required, and existing leases or solar agreements.',
      required: false,
      sortOrder: 8,
      officialFormUrl:
        'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1102.',
    },
    {
      documentType: 'california-safety-compliance',
      title: 'Safety, plumbing and point-of-sale compliance records',
      shortTitle: 'Safety, plumbing and point-of-sale compliance records',
      formCode: 'CA SAFETY',
      description:
        'Confirm applicable smoke and carbon monoxide requirements, water heater bracing, water-conserving plumbing disclosures and local inspection or retrofit rules before closing. A universal new inspection is not required simply to create a listing.',
      required: false,
      sortOrder: 9,
      officialFormUrl:
        'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1102.155.',
    },
    {
      documentType: 'lead-based-paint',
      title: 'Federal lead disclosure and EPA pamphlet',
      shortTitle: 'Lead packet',
      formCode: 'FED-LEAD',
      description:
        'For most pre-1978 housing, provide the signed seller disclosure, available records and EPA pamphlet before the buyer signs, plus the inspection opportunity unless changed or waived in writing. A new test is not required.',
      required: false,
      sortOrder: 10,
      additionalDownloads: [
        {
          label: 'EPA lead safety pamphlet for the buyer',
          url:
            'https://www.epa.gov/system/files/documents/2026-02/protectyourfamily_pamphlet_2026_3.pdf',
        },
      ],
      formDownloadUrl:
        'https://www.epa.gov/sites/default/files/documents/selr_eng.pdf',
      officialFormUrl:
        'https://www.epa.gov/lead/real-estate-disclosures-about-potential-lead-hazards',
    },
    {
      documentType: 'california-earthquake-environmental-guides',
      title: 'Applicable earthquake and environmental hazard guides',
      shortTitle: 'Consumer guides',
      formCode: 'CA GUIDES',
      description:
        'Provide the applicable Homeowner’s Guide to Earthquake Safety, including the residential earthquake risk disclosure for covered pre-1960 construction. The environmental hazard booklet supplies general information and does not replace disclosure of known property-specific conditions.',
      required: false,
      sortOrder: 11,
      officialFormUrl:
        'https://www.dre.ca.gov/Publications/Disclosures.html',
    },
  ],
  CO: [
    {
      documentType: 'colorado-property-disclosure',
      formCode: 'CO SPD19 2026',
      required: true,
      shortTitle: 'Seller property disclosure',
      sortOrder: 1,
      title: 'Colorado Seller’s Property Disclosure',
      description:
        'Download, complete, sign, and upload the Colorado Seller’s Property Disclosure.',
      formDownloadUrl:
        'https://dre.colorado.gov/sites/dre/files/documents/Seller%27s%20Property%20Disclosure%20%28Residential%29%20%28fillable%29_for%20use%20on%20or%20after%20January%201%2C%202026_0.pdf',
      formDownloadLabel: 'Download the Colorado residential disclosure',
      officialFormUrl:
        'https://dre.colorado.gov/sites/dre/files/documents/Seller%27s%20Property%20Disclosure%20%28Residential%29%20%28fillable%29_for%20use%20on%20or%20after%20January%201%2C%202026.pdf',
    },
    {
      documentType: 'colorado-radon-brochure',
      formCode: 'CO RADON',
      required: true,
      shortTitle: 'Radon brochure',
      sortOrder: 2,
      title: 'Colorado Radon Brochure',
      description:
        'Download the Colorado radon brochure, then upload the PDF here so buyers can receive it with this listing.',
      formDownloadUrl:
        'https://eforms.com/images/2015/10/Colordao-Brochure-Radon-in-Real-Estate-Rental-Transactions.pdf',
      formDownloadLabel: 'Download the Colorado radon brochure (PDF)',
      officialFormUrl:
        'https://cdphe.colorado.gov/hm/radon-and-real-estate',
    },
    {
      documentType: 'colorado-association-documents',
      formCode: 'CO CIC',
      required: false,
      shortTitle: 'Association records',
      sortOrder: 3,
      title: 'Common-interest community documents',
      description:
        'If applicable, upload governing and financial documents for buyer review.',
      sourceInstructions:
        'Obtain governing and financial documents from the association or its management company.',
    },
    {
      documentType: 'lead-based-paint',
      formCode: 'FED-LEAD',
      required: false,
      shortTitle: 'Lead packet',
      sortOrder: 4,
      title: 'Federal lead disclosure',
      description:
        'For most housing built before 1978, provide the signed disclosure, available records and EPA pamphlet.',
      formDownloadUrl:
        'https://www.epa.gov/sites/default/files/documents/selr_eng.pdf',
      officialFormUrl:
        'https://www.epa.gov/sites/default/files/documents/selr_eng.pdf',
      additionalDownloads: [
        {
          label: 'Download the EPA lead safety pamphlet',
          url: 'https://www.epa.gov/system/files/documents/2026-02/protectyourfamily_pamphlet_2026_3.pdf',
        },
      ],
    },
  ],
  FL: [
    {
      description: 'Complete the Florida statutory flood disclosure before the buyer signs. Download the printable form below.',
      documentType: 'florida-flood-disclosure', formCode: 'FLA. STAT. 689.302',
      formDownloadUrl: '/forms/navstreet-florida-flood-disclosure.pdf',
      officialFormUrl: 'https://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0600-0699/0689/Sections/0689.302.html',
      required: true, shortTitle: 'Flood disclosure', sortOrder: 1, title: 'Florida seller flood disclosure',
    },
    {
      description: 'Upload the seller-signed statement of known material property defects, including any known sanitary sewer lateral defects. Florida law does not mandate one universal seller condition form.',
      documentType: 'florida-seller-property-disclosure', formCode: 'FL-SELLER-CONDITION',
      formDownloadUrl: '/forms/navstreet-florida-seller-condition-statement.pdf',
      officialFormUrl: 'https://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0600-0699/0689/Sections/0689.301.html',
      required: false, shortTitle: 'Property condition', sortOrder: 2, title: 'Seller property condition statement',
    },
    {
      description: 'If mandatory association membership applies, provide the seller-completed statutory disclosure summary before the buyer signs.',
      documentType: 'florida-hoa-disclosure-summary', formCode: 'FLA. STAT. 720.401',
      formDownloadUrl: '/forms/navstreet-florida-hoa-disclosure-summary.pdf',
      officialFormUrl: 'https://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0700-0799/0720/Sections/0720.401.html',
      required: false, shortTitle: 'HOA summary', sortOrder: 3, title: 'Florida homeowners association disclosure summary',
    },
    {
      description: 'For most homes built before 1978, provide the signed seller lead disclosure, available records and EPA pamphlet before the buyer signs.',
      documentType: 'lead-based-paint', formCode: 'FED-LEAD',
      formDownloadUrl: 'https://www.epa.gov/sites/default/files/documents/selr_eng.pdf',
      additionalDownloads: [{ label: 'Download the 2026 EPA lead safety pamphlet for the buyer', url: 'https://www.epa.gov/system/files/documents/2026-02/protectyourfamily_pamphlet_2026_3.pdf' }],
      officialFormUrl: 'https://www.epa.gov/sites/default/files/documents/selr_eng.pdf',
      required: false, shortTitle: 'Lead paint', sortOrder: 4, title: 'Lead-based paint disclosure',
    },
  ],
  LA: [
    {
      description: 'Download the LREC 2026 Property Disclosure Document, complete the applicable pages (including its exemption section when legally applicable), sign it, and upload it here. NavStreet will not accept an offer until the buyer can access this upload.',
      documentType: 'louisiana-property-disclosure',
      formCode: 'LREC PROPERTY DISCLOSURE 01/2026',
      formDownloadUrl: '/forms/lrec-louisiana-property-disclosure-2026.pdf',
      officialFormUrl: 'https://lrec.gov/form-categories/mandatory',
      required: true,
      shortTitle: 'Louisiana property disclosure',
      sortOrder: 1,
      title: 'Louisiana Property Disclosure Document (seller signed)',
    },
    {
      description: 'For most pre-1978 homes, provide the signed federal lead seller disclosure, available records and EPA pamphlet before the buyer signs.',
      documentType: 'lead-based-paint',
      formCode: 'FED-LEAD',
      formDownloadUrl: 'https://www.epa.gov/sites/default/files/documents/selr_eng.pdf',
      officialFormUrl: 'https://www.epa.gov/sites/default/files/documents/selr_eng.pdf',
      additionalDownloads: [{ label: 'Download the 2026 EPA lead safety pamphlet', url: 'https://www.epa.gov/system/files/documents/2026-02/protectyourfamily_pamphlet_2026_3.pdf' }],
      required: false,
      shortTitle: 'Lead-based paint',
      sortOrder: 2,
      title: 'Lead-based paint packet',
    },
  ],
  NC: [
    {
      description:
        'Upload the completed and signed North Carolina Residential Property and Owners’ Association Disclosure Statement.',
      documentType:
        'residential-property-owners-association',
      formCode: 'REC 4.22',
      officialFormUrl:
        'https://www.ncrec.gov/Forms/Consumer/rec422.pdf',
      formDownloadUrl: 'https://www.ncrec.gov/Forms/Consumer/rec422.pdf',
      required: true,
      shortTitle: 'Property Disclosure',
      sortOrder: 1,
      title:
        'Residential Property and Owners’ Association Disclosure'
    },
    {
      description:
        'Upload the completed and signed North Carolina Mineral and Oil and Gas Rights Mandatory Disclosure Statement.',
      documentType:
        'mineral-oil-gas-rights',
      formCode: 'REC 4.25',
      officialFormUrl:
        'https://www.ncrec.gov/Forms/Consumer/rec425.pdf',
      formDownloadUrl: 'https://www.ncrec.gov/Forms/Consumer/rec425.pdf',
      required: true,
      shortTitle:
        'Mineral, Oil and Gas Disclosure',
      sortOrder: 2,
      title:
        'Mineral and Oil and Gas Rights Mandatory Disclosure Statement'
    },
    {
      description: 'For most pre-1978 homes, provide the signed lead disclosure, available reports and the EPA pamphlet.',
      documentType: 'lead-based-paint',
      formCode: 'FED-LEAD',
      officialFormUrl: 'https://www.epa.gov/sites/default/files/documents/selr_eng.pdf',
      formDownloadUrl: 'https://www.epa.gov/sites/default/files/documents/selr_eng.pdf',
      additionalDownloads: [{ label: 'Download the 2026 EPA lead safety pamphlet for the buyer', url: 'https://www.epa.gov/system/files/documents/2026-02/protectyourfamily_pamphlet_2026_3.pdf' }],
      required: false,
      shortTitle: 'Lead paint',
      sortOrder: 3,
      title: 'Lead-Based Paint Seller Disclosure',
    }
  ],
  OK: [
    {
      description: 'Before offers are available, upload ONE lawful route: a completed seller-signed condition disclosure, a legally eligible disclaimer, or signed evidence of a statutory exemption. Do not upload all three. The statutory deadline is before seller acceptance; NavStreet collects it earlier.',
      documentType: 'oklahoma-property-condition-disclosure',
      formCode: 'OREC Appendix A (2026)',
      officialFormUrl: 'https://oklahoma.gov/content/dam/ok/en/orec/documents/contracts-and-forms-page/2026-contract-forms/2026%20Appendix%20A%20Residential%20Property%20Condition.pdf',
      formDownloadUrl: 'https://oklahoma.gov/content/dam/ok/en/orec/documents/contracts-and-forms-page/2026-contract-forms/2026%20Appendix%20A%20Residential%20Property%20Condition.pdf',
      required: false,
      shortTitle: 'Condition disclosure',
      sortOrder: 1,
      title: 'Oklahoma Property Condition Disclosure Statement',
    },
    {
      description: 'Use the disclaimer instead of Appendix A only when permitted by Oklahoma law.',
      documentType: 'oklahoma-property-condition-disclaimer',
      formCode: 'OREC Appendix B (2026)',
      officialFormUrl: 'https://oklahoma.gov/content/dam/ok/en/orec/documents/contracts-and-forms-page/2026-contract-forms/2026%20Appendix%20B%20RPC%20Disclaimer.pdf',
      formDownloadUrl: 'https://oklahoma.gov/content/dam/ok/en/orec/documents/contracts-and-forms-page/2026-contract-forms/2026%20Appendix%20B%20RPC%20Disclaimer.pdf',
      required: false,
      shortTitle: 'Condition disclaimer',
      sortOrder: 2,
      title: 'Oklahoma Property Condition Disclaimer Statement',
    },
    {
      description: 'Use this form only when the property transfer qualifies for an exemption.',
      documentType: 'oklahoma-property-condition-exemption',
      formCode: 'OREC RPCD Exemption (2026)',
      officialFormUrl: 'https://oklahoma.gov/content/dam/ok/en/orec/documents/contracts-and-forms-page/2026-contract-forms/2026%20RPCD%20Exemption%20Form.pdf',
      formDownloadUrl: 'https://oklahoma.gov/content/dam/ok/en/orec/documents/contracts-and-forms-page/2026-contract-forms/2026%20RPCD%20Exemption%20Form.pdf',
      required: false,
      shortTitle: 'Exemption',
      sortOrder: 3,
      title: 'Oklahoma Property Condition Exemption',
    },
    {
      description: 'For most homes built before 1978, provide the signed lead disclosure, available reports, and EPA pamphlet.',
      documentType: 'lead-based-paint',
      formCode: 'FED-LEAD',
      officialFormUrl: 'https://oklahoma.gov/orec/contract-forms-and-related-addenda.html',
      formDownloadUrl: 'https://oklahoma.gov/content/dam/ok/en/orec/documents/contracts-and-forms-page/2026-contract-forms/2026%20Lead-Based%20Paint%20Seller%20Disclosure.pdf',
      additionalDownloads: [{ label: 'Download the 2026 EPA lead safety pamphlet for the buyer', url: 'https://www.epa.gov/system/files/documents/2026-02/protectyourfamily_pamphlet_2026_3.pdf' }],
      required: false,
      shortTitle: 'Lead paint',
      sortOrder: 4,
      title: 'Lead-Based Paint Seller Disclosure',
    },
  ],
  UT: [
    {
      description: 'Upload a seller-completed property condition statement if agreed in the contract. This is a contractual choice, not a universal Utah statutory form.',
      documentType: 'utah-seller-property-condition',
      formCode: 'UT-SELLER-CONDITION',
      formDownloadUrl: '/forms/navstreet-utah-seller-condition-statement.pdf',
      required: false,
      shortTitle: 'Property condition',
      sortOrder: 1,
      title: 'Utah seller property condition statement',
    },
    {
      description: 'For most homes built before 1978, upload the signed lead disclosure and deliver available reports and the EPA pamphlet before the contract is signed.',
      documentType: 'lead-based-paint',
      formCode: 'FED-LEAD',
      officialFormUrl: 'https://www.epa.gov/sites/default/files/documents/selr_eng.pdf',
      formDownloadUrl: 'https://www.epa.gov/sites/default/files/documents/selr_eng.pdf',
      additionalDownloads: [{ label: 'Download the 2026 EPA lead safety pamphlet for the buyer', url: 'https://www.epa.gov/system/files/documents/2026-02/protectyourfamily_pamphlet_2026_3.pdf' }],
      required: false,
      shortTitle: 'Lead paint',
      sortOrder: 2,
      title: 'Lead-based paint disclosure',
    },
    {
      description: 'For property in an owners association, upload its recorded governing documents and provide the required homeowner education materials before closing.',
      documentType: 'utah-hoa-governing-documents',
      formCode: 'UT-HOA-DOCS',
      sourceInstructions: 'Request the governing documents from the association or county recorder; they are specific to this property.',
      required: false,
      shortTitle: 'Association documents',
      sortOrder: 3,
      title: 'Utah association governing documents',
    },
    {
      description: 'When you know the property is currently contaminated from methamphetamine use, storage, or manufacture, disclose that condition to the buyer.',
      documentType: 'utah-methamphetamine-contamination',
      formCode: 'UT-METH-DISCLOSURE',
      formDownloadUrl: '/forms/navstreet-utah-methamphetamine-disclosure.pdf',
      officialFormUrl: 'https://le.utah.gov/xcode/Title57/Chapter27/57-27-S201.html',
      required: false,
      shortTitle: 'Contamination',
      sortOrder: 4,
      title: 'Current methamphetamine contamination disclosure',
    },
  ],
  WI: [
    {
      description: 'Upload the completed and seller-signed Wisconsin real estate condition report. The report must contain all information required by current Wis. Stat. § 709.03; upload changes as new versions.',
      documentType: 'wisconsin-real-estate-condition-report',
      formCode: 'WIS. STAT. 709.03',
      officialFormUrl: 'https://docs.legis.wisconsin.gov/document/statutes/709.03',
      sourceInstructions: 'The current statute contains the full report. Open it, use Print → Save as PDF for a copy, complete every applicable item, and upload the signed report. Do not substitute a short condition checklist.',
      required: true,
      shortTitle: 'Condition report',
      sortOrder: 1,
      title: 'Wisconsin Real Estate Condition Report',
    },
    {
      description: 'For most pre-1978 housing, upload the signed lead disclosure, provide available records, and deliver the EPA pamphlet before the buyer is bound.',
      documentType: 'lead-based-paint',
      formCode: 'FED-LEAD',
      officialFormUrl: 'https://www.epa.gov/sites/default/files/documents/selr_eng.pdf',
      formDownloadUrl: 'https://www.epa.gov/sites/default/files/documents/selr_eng.pdf',
      additionalDownloads: [{ label: 'Download the 2026 EPA lead safety pamphlet for the buyer', url: 'https://www.epa.gov/system/files/documents/2026-02/protectyourfamily_pamphlet_2026_3.pdf' }],
      required: false,
      shortTitle: 'Lead disclosure',
      sortOrder: 2,
      title: 'Lead-Based Paint Disclosure',
    },
    {
      description: 'If the property is in an owners association, provide any applicable recorded covenants and association documents.',
      documentType: 'wisconsin-association-documents',
      formCode: 'WI-ASSOCIATION-DOCS',
      sourceInstructions: 'Request the recorded covenants and governing documents from the association or county register of deeds; these are property-specific.',
      required: false,
      shortTitle: 'Association documents',
      sortOrder: 3,
      title: 'Wisconsin Association Documents',
    },
  ],
  TX: [
    {
      description:
        'Upload the completed Texas Seller’s Disclosure Notice when the property is not exempt from the statutory disclosure requirement.',
      documentType:
        'texas-seller-disclosure-notice',
      formCode: 'TREC 55-1 (2026)',
      officialFormUrl:
        'https://www.trec.texas.gov/forms/sellers-disclosure-notice',
      formDownloadUrl: 'https://www.trec.texas.gov/sites/default/files/pdf-forms/55-1.pdf',
      required: true,
      shortTitle: 'Seller Disclosure',
      sortOrder: 1,
      title: 'Texas Seller’s Disclosure Notice'
    },
    {
      description: 'For most pre-1978 homes, provide the signed lead disclosure, available reports and the EPA pamphlet.',
      documentType: 'lead-based-paint',
      formCode: 'FED-LEAD',
      officialFormUrl: 'https://www.epa.gov/sites/default/files/documents/selr_eng.pdf',
      formDownloadUrl: 'https://www.epa.gov/sites/default/files/documents/selr_eng.pdf',
      additionalDownloads: [{ label: 'Download the 2026 EPA lead safety pamphlet for the buyer', url: 'https://www.epa.gov/system/files/documents/2026-02/protectyourfamily_pamphlet_2026_3.pdf' }],
      required: false,
      shortTitle: 'Lead paint',
      sortOrder: 2,
      title: 'Lead-Based Paint Seller Disclosure',
    }
  ]
};

export function getStateDisclosureRequirements(
  stateAbbreviation: string
): readonly StateDisclosureRequirement[] {
  return STATE_DISCLOSURE_REQUIREMENTS[
    normalizeDisclosureStateCode(stateAbbreviation)
  ] ?? [];
}

export function isDisclosureVisibleForListing(requirement:StateDisclosureRequirement,listing:ListingDisclosureGateFacts):boolean {
  return (requirement.documentType !== 'lead-based-paint' || !isFederalLeadExcluded(listing));
}

/** Use listing answers when a form is conditional; keep other states' rules unchanged. */
export function isDisclosureRequiredForListing(
  state: string,
  requirement: StateDisclosureRequirement,
  listing: ListingDisclosureGateFacts
): boolean {
  if (requirement.documentType === 'lead-based-paint') return !isFederalLeadExcluded(listing);
  if (requirement.required || isDisclosureRequiredBeforeAcceptanceForListing(state, requirement, listing)) return true;

  const stateCode = normalizeDisclosureStateCode(state);
  if (getListingUploadGateDocumentTypes(stateCode, listing, Date.now()).includes(requirement.documentType)) return true;

  return ((stateCode === 'MN' || stateCode === 'MI') && requirement.documentType === (stateCode === 'MN' ? 'minnesota-association-documents' : 'michigan-association-documents') && listing.ownersAssociationApplies === true) ||
    (stateCode === 'FL' && requirement.documentType === 'florida-hoa-disclosure-summary' && listing.ownersAssociationApplies === true);
}

/** Legal timing metadata; applicable pre-acceptance uploads are collected earlier by the offer gate. */
export function isDisclosureRequiredBeforeAcceptanceForListing(
  state: string, requirement: StateDisclosureRequirement, listing: ListingDisclosureGateFacts,
): boolean {
  if (!requirement.requiredBeforeAcceptance) return false;
  return !(normalizeDisclosureStateCode(state) === 'IA' &&
    requirement.documentType === 'iowa-statutory-packet' && listing.iowa?.disclosureExemptionClaimed === true);
}

/** Accept both the two-letter code and the full name stored on older listings. */
export function normalizeDisclosureStateCode(state: string): string {
  const normalized = state.trim().toLowerCase();
  const stateConfiguration = STATES.find(
    candidate =>
      candidate.abbreviation.toLowerCase() === normalized ||
      candidate.name.toLowerCase() === normalized
  );

  return stateConfiguration?.abbreviation ?? state.trim().toUpperCase();
}
