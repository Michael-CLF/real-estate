import {
  Injectable
} from '@angular/core';

import {
  EducationArticle
} from '../models/education-article.model';

import {
  EducationCategory
} from '../models/education-category.model';

@Injectable({
  providedIn: 'root'
})
export class EducationContentService {

  private readonly categories:
    readonly EducationCategory[] = [
      {
        slug: 'selling-a-home',
        title: 'Selling a Home',
        description:
          'Understand the selling process, prepare your property, set expectations, and stay in control.',
        icon: 'fa-solid fa-house-circle-check',
        audience: 'seller',
        displayOrder: 1
      },
      {
        slug: 'buying-a-home',
        title: 'Buying a Home',
        description:
          'Learn how to search for property, evaluate listings, request showings, and prepare an offer.',
        icon: 'fa-solid fa-key',
        audience: 'buyer',
        displayOrder: 2
      },
      {
        slug: 'preparing-and-marketing',
        title: 'Preparing and Marketing',
        description:
          'Create a stronger listing, present your property clearly, and reach more prospective buyers.',
        icon: 'fa-solid fa-bullhorn',
        audience: 'seller',
        displayOrder: 3
      },
      {
        slug: 'offers-and-negotiations',
        title: 'Offers and Negotiations',
        description:
          'Understand the principal terms of an offer and prepare for negotiation and counteroffers.',
        icon: 'fa-solid fa-file-signature',
        audience: 'all',
        displayOrder: 4
      },
      {
        slug: 'showings-and-inquiries',
        title: 'Showings and Inquiries',
        description:
          'Manage buyer questions, showing requests, follow-up, and property access more effectively.',
        icon: 'fa-solid fa-calendar-check',
        audience: 'all',
        displayOrder: 5
      },
      {
        slug: 'mortgage-and-financing',
        title: 'Mortgage and Financing',
        description:
          'Explore affordability, mortgage payments, financing terminology, and buyer preparation.',
        icon: 'fa-solid fa-building-columns',
        audience: 'buyer',
        displayOrder: 6
      },
      {
        slug: 'closing-and-moving',
        title: 'Closing and Moving',
        description:
          'Prepare for inspections, appraisals, closing documents, settlement, and the final move.',
        icon: 'fa-solid fa-box-open',
        audience: 'all',
        displayOrder: 7
      },
      {
        slug: 'using-navstreet',
        title: 'Using NavStreet',
        description:
          'Learn how to use listings, dashboards, marketing tools, calculators, and professional resources.',
        icon: 'fa-solid fa-compass',
        audience: 'all',
        displayOrder: 8
      }
    ];

  private readonly articles:
    readonly EducationArticle[] = [
      {
        slug:
          'how-the-navstreet-selling-process-works',

        categorySlug:
          'selling-a-home',

        title:
          'How the NavStreet Selling Process Works',

        summary:
          'Follow the complete seller process from preparing the property and creating the listing through publication, marketing, buyer activity, offers, and closing.',

        eyebrow:
          'Complete seller procedure',

        icon:
          'fa-solid fa-route',

        audience:
          'seller',

        estimatedMinutes:
          12,

        featured:
          true,

        displayOrder:
          1,

        sections: [
          {
            heading:
              'Before you create the listing',

            paragraphs: [
              (
                'Before entering information into NavStreet, ' +
                'gather the documents, property facts, ' +
                'photographs, and financial information you ' +
                'will need. Preparing these items first makes ' +
                'the listing process faster and reduces the ' +
                'chance of publishing incomplete or ' +
                'inconsistent information.'
              ),
              (
                'Review the property as a buyer would. Confirm ' +
                'the basic facts, identify unfinished repairs, ' +
                'and decide which property features should be ' +
                'emphasized.'
              )
            ],

            checklist: [
              {
                title:
                  'Confirm ownership information',

                description:
                  'Verify the legal owners of the property and confirm that everyone who must approve or sign the transaction is available.'
              },
              {
                title:
                  'Gather property facts',

                description:
                  'Collect the year built, property type, bedroom and bathroom counts, finished square footage, lot size, parking, association, and system information.'
              },
              {
                title:
                  'Review liens and mortgages',

                description:
                  'Identify existing mortgages, home-equity accounts, judgments, tax obligations, or other liens that may need to be paid at closing.'
              },
              {
                title:
                  'Prepare photographs',

                description:
                  'Clean and organize the property, select appropriate lighting, and photograph the exterior, living areas, bedrooms, bathrooms, and important features.'
              },
              {
                title:
                  'Consider the listing price',

                description:
                  'Review comparable sales, competing listings, property condition, improvements, location, and estimated selling expenses.'
              },
              {
                title:
                  'Plan property access',

                description:
                  'Decide when showings will be available, who will provide access, and how occupants, pets, valuables, and security will be handled.'
              }
            ]
          },
          {
            heading:
              'Create the six-step NavStreet listing',

            paragraphs: [
              (
                'NavStreet organizes the initial property ' +
                'listing into six steps. Your progress is ' +
                'saved to your account so that you can leave ' +
                'and return without recreating the listing.'
              )
            ],

            steps: [
              {
                title:
                  'Enter the property address',

                description:
                  'Provide the complete street address, city, state, and postal code. Review the address carefully because it identifies the property throughout NavStreet.'
              },
              {
                title:
                  'Add the property details',

                description:
                  'Enter the property type, bedrooms, bathrooms, square footage, year built, lot information, description, and applicable homeowners association information.'
              },
              {
                title:
                  'Select the principal features',

                description:
                  'Identify the most important property features included in the initial listing. Additional optional details can be added after publication.'
              },
              {
                title:
                  'Upload and organize photographs',

                description:
                  'Upload current property images, select the primary photograph, remove weak or duplicate images, and arrange the photographs in a logical order.'
              },
              {
                title:
                  'Set the listing price',

                description:
                  'Enter the price buyers will see in the marketplace. Review the price before continuing because it becomes part of the public listing.'
              },
              {
                title:
                  'Review and certify the listing',

                description:
                  'Review all entered information and accept the seller certification confirming that the information is accurate and complete to the best of your knowledge.'
              }
            ],

            callout:
              'A saved draft is not yet visible to buyers. The property becomes publicly available only after the required verification, payment, and publication steps are completed.'
          },
          {
            heading:
              'Complete identity verification and payment',

            paragraphs: [
              (
                'After the listing information is complete, ' +
                'NavStreet connects the seller to Stripe for ' +
                'identity verification and payment processing. ' +
                'These steps help protect the marketplace and ' +
                'confirm that the listing has an identifiable ' +
                'seller.'
              )
            ],

            steps: [
              {
                title:
                  'Complete Stripe Identity',

                description:
                  'Follow the secure Stripe Identity instructions. NavStreet does not directly collect or store the identification document used during Stripe verification.'
              },
              {
                title:
                  'Review the payment summary',

                description:
                  'Confirm the standard listing fee, any optional Featured Listing charge, any valid promotion discount, and the final amount due.'
              },
              {
                title:
                  'Complete the order',

                description:
                  'Finish the Stripe Checkout process. A promotion that reduces the complete purchase to zero may still require the order to be confirmed.'
              },
              {
                title:
                  'Wait for publication confirmation',

                description:
                  'NavStreet processes the Stripe result and updates the listing. The published property should then appear under Active Listings in the seller dashboard.'
              }
            ],

            callout:
              'The standard NavStreet property-listing fee is a one-time $49 charge. Featured Listing placement is an optional additional $10 purchase.'
          },
          {
            heading:
              'Review and enhance the published property',

            paragraphs: [
              (
                'Publication is not the end of the listing ' +
                'process. Open the public property page and ' +
                'review it from a buyer’s perspective before ' +
                'beginning active marketing.'
              )
            ],

            checklist: [
              {
                title:
                  'Review the public listing',

                description:
                  'Confirm the address, price, description, property details, photographs, mortgage estimate, contact options, and showing information.'
              },
              {
                title:
                  'Add optional enhancements',

                description:
                  'Add relevant construction, interior, kitchen, bedroom, bathroom, outdoor, parking, system, technology, accessibility, school, and community information.'
              },
              {
                title:
                  'Set showing availability',

                description:
                  'Provide realistic dates and times when prospective buyers may request an in-person showing.'
              },
              {
                title:
                  'Correct inaccurate information',

                description:
                  'Update permitted listing information promptly if you discover an error or if the price, condition, or availability changes.'
              }
            ]
          },
          {
            heading:
              'Market the property',

            paragraphs: [
              (
                'The NavStreet Marketing Toolkit gives the ' +
                'seller several ways to distribute the public ' +
                'property listing without manually rebuilding ' +
                'the property information for every platform.'
              )
            ],

            steps: [
              {
                title:
                  'Copy the permanent property link',

                description:
                  'Use the short NavStreet property URL in text messages, emails, advertisements, and other digital communications.'
              },
              {
                title:
                  'Prepare social posts',

                description:
                  'Review and customize the suggested short, detailed, or property-highlight caption before publishing it on a social platform.'
              },
              {
                title:
                  'Use direct sharing controls',

                description:
                  'Share through the device menu, Facebook, LinkedIn, X, email, or another supported application.'
              },
              {
                title:
                  'Download the property QR code',

                description:
                  'Use PNG for ordinary digital or printed materials and SVG for professional printing or larger signs. Test the code before distributing it.'
              },
              {
                title:
                  'Track marketing work',

                description:
                  'Use the property-specific marketing checklist to record completed promotional activities.'
              }
            ]
          },
          {
            heading:
              'Manage buyer inquiries and showing requests',

            paragraphs: [
              (
                'Responding promptly and professionally helps ' +
                'buyers obtain the information they need while ' +
                'allowing the seller to maintain control over ' +
                'property access and communications.'
              )
            ],

            checklist: [
              {
                title:
                  'Review the buyer’s question',

                description:
                  'Read the complete inquiry and identify whether the requested information is already available in the public listing.'
              },
              {
                title:
                  'Protect sensitive information',

                description:
                  'Do not disclose alarm codes, lockbox combinations, occupancy schedules, financial account information, or other unnecessary private information.'
              },
              {
                title:
                  'Confirm showing details',

                description:
                  'Verify the requested date, time, attendees, access method, and any special instructions before approving a showing.'
              },
              {
                title:
                  'Document important communication',

                description:
                  'Keep records of material property questions, showing arrangements, promises, disclosures, and transaction-related communications.'
              }
            ],

            callout:
              'Do not allow an unknown visitor to enter the property without an established appointment and a reasonable process for confirming who will attend.'
          },
          {
            heading:
              'Review and negotiate offers',

            paragraphs: [
              (
                'An offer is more than the proposed purchase ' +
                'price. Review the complete package, including ' +
                'financing, deposits, investigation periods, ' +
                'closing date, requested concessions, included ' +
                'property, and other conditions.'
              )
            ],

            examples: [
              {
                title:
                  'Higher price with substantial conditions',

                scenario:
                  'Buyer A offers $505,000 but requests a large seller-paid closing-cost contribution, a lengthy investigation period, and a financing contingency.',

                explanation:
                  'The headline price is not the seller’s expected net proceeds. Evaluate the requested contribution, timing, financing strength, and risk that the transaction may not close.'
              },
              {
                title:
                  'Lower price with stronger terms',

                scenario:
                  'Buyer B offers $495,000 with verified financing, a shorter investigation period, fewer requested concessions, and a closing date that fits the seller’s plans.',

                explanation:
                  'A lower-priced offer may still be competitive when it produces similar net proceeds or presents less timing and financing risk.'
              },
              {
                title:
                  'Counteroffer',

                scenario:
                  'The seller accepts the proposed price but changes the closing date and reduces the requested seller-paid costs.',

                explanation:
                  'Changing any material term generally creates a counteroffer that must be accepted by the buyer before the parties have an agreement.'
              }
            ],

            callout:
              'Real estate contracts create significant legal obligations. Buyers and sellers should consider having a licensed North Carolina attorney review proposed contract terms.'
          },
          {
            heading:
              'Move from contract to closing',

            paragraphs: [
              (
                'After an offer is accepted, the transaction ' +
                'typically moves through buyer investigations, ' +
                'financing, appraisal, title work, insurance, ' +
                'document preparation, final walkthrough, and ' +
                'settlement.'
              )
            ],

            timeline: [
              {
                stage:
                  'Contract acceptance',

                typicalTiming:
                  'Day 0',

                description:
                  'The fully accepted agreement establishes the transaction terms, responsibilities, deposits, and important deadlines.'
              },
              {
                stage:
                  'Buyer investigation',

                typicalTiming:
                  'Early contract period',

                description:
                  'The buyer may arrange inspections, review property information, investigate repairs, and evaluate whether to continue under the contract terms.'
              },
              {
                stage:
                  'Mortgage and appraisal',

                typicalTiming:
                  'During financing',

                description:
                  'The lender verifies the buyer’s qualification, reviews documentation, orders an appraisal when required, and evaluates the property and loan.'
              },
              {
                stage:
                  'Title and closing preparation',

                typicalTiming:
                  'Before settlement',

                description:
                  'The closing attorney researches title, coordinates payoff information, prepares documents, and calculates the funds required for settlement.'
              },
              {
                stage:
                  'Final walkthrough',

                typicalTiming:
                  'Shortly before closing',

                description:
                  'The buyer may confirm that the property remains in the expected condition and that agreed repairs or included items appear complete.'
              },
              {
                stage:
                  'Settlement and recording',

                typicalTiming:
                  'Closing day',

                description:
                  'The parties sign required documents, funds are delivered and verified, and the deed and related instruments are submitted for recording.'
              }
            ],

            callout:
              'Transaction timing varies. The purchase contract and instructions from the closing attorney, lender, and other professionals control the actual deadlines.'
          },
          {
            heading:
              'Seller responsibilities through closing',

            paragraphs: [
              (
                'The seller should maintain the property, ' +
                'respond to transaction requests, preserve ' +
                'important records, and prepare for possession ' +
                'to transfer according to the agreement.'
              )
            ],

            checklist: [
              {
                title:
                  'Maintain the property',

                description:
                  'Keep utilities active when required, maintain insurance, prevent avoidable damage, and continue ordinary property care through closing.'
              },
              {
                title:
                  'Complete agreed work',

                description:
                  'Finish agreed repairs or other obligations by the required deadline and retain invoices, receipts, permits, or supporting documentation.'
              },
              {
                title:
                  'Prepare payoff information',

                description:
                  'Respond to requests for mortgage, lien, association, tax, or other information needed to calculate closing disbursements.'
              },
              {
                title:
                  'Prepare to move',

                description:
                  'Remove personal property as required, leave agreed items, clean the property, organize keys and access devices, and follow the possession terms.'
              },
              {
                title:
                  'Verify communications',

                description:
                  'Confirm unexpected money-transfer or wiring instructions through a trusted telephone number before sending funds or sensitive information.'
              }
            ]
          }
        ],

        navStreetLinks: [
          {
            label:
              'Create or manage a listing',

            route:
              '/sell',

            description:
              'Begin a new listing or return to an existing NavStreet property.',

            icon:
              'fa-solid fa-house-circle-check'
          },
          {
            label:
              'Open My Listings',

            route:
              '/dashboard/listings',

            description:
              'Review draft, active, under-contract, and sold properties.',

            icon:
              'fa-solid fa-list'
          },
          {
            label:
              'Mortgage calculators',

            route:
              '/calculators',

            description:
              'Estimate payments, affordability, loan-to-value, and other financing figures.',

            icon:
              'fa-solid fa-calculator'
          },
          {
            label:
              'Find a professional',

            route:
              '/find-a-pro/north-carolina',

            description:
              'Browse participating real estate and transaction professionals.',

            icon:
              'fa-solid fa-user-tie'
          }
        ],

        nextSteps: [
          {
            title:
              'Prepare the property information',

            description:
              'Gather the property facts, photographs, association information, pricing research, and showing plan.'
          },
          {
            title:
              'Create the listing draft',

            description:
              'Use the six-step NavStreet listing process and review every entry before certification.'
          },
          {
            title:
              'Complete verification and publication',

            description:
              'Finish Stripe Identity and Checkout, then confirm that the property appears under Active Listings.'
          },
          {
            title:
              'Review and enhance the public page',

            description:
              'Open the buyer-facing listing, correct errors, add optional enhancements, and establish showing availability.'
          },
          {
            title:
              'Begin property marketing',

            description:
              'Use the Marketing Toolkit to share the permanent link, social captions, QR code, and other materials.'
          },
          {
            title:
              'Manage the transaction',

            description:
              'Respond to buyers, coordinate showings, review complete offer terms, and follow all contract-to-closing deadlines.'
          }
        ],

        relatedArticleSlugs: [
          'preparing-your-property-for-listing',
          'creating-an-effective-property-listing',
          'using-the-marketing-toolkit'
        ]
      },
      {
        slug:
          'preparing-your-property-for-listing',

        categorySlug:
          'selling-a-home',

        title:
          'Preparing Your Property for Listing',

        summary:
          'Use a room-by-room preparation process to organize repairs, improve presentation, protect valuables, and prepare accurate property photographs.',

        eyebrow:
          'Property preparation checklist',

        icon:
          'fa-solid fa-clipboard-check',

        audience:
          'seller',

        estimatedMinutes:
          11,

        featured:
          true,

        displayOrder:
          2,

        sections: [
          {
            heading:
              'Decide what preparation is worthwhile',

            paragraphs: [
              (
                'Property preparation should focus on ' +
                'cleanliness, maintenance, safety, accuracy, ' +
                'and presentation. The objective is not to ' +
                'remodel every room. It is to remove avoidable ' +
                'distractions and help buyers evaluate the ' +
                'property’s actual condition.'
              ),
              (
                'Before spending money, separate necessary ' +
                'repairs from optional cosmetic improvements. ' +
                'Consider the property’s price range, current ' +
                'condition, competing listings, available time, ' +
                'and whether a proposed improvement is likely ' +
                'to affect marketability.'
              )
            ],

            examples: [
              {
                title:
                  'Necessary repair',

                scenario:
                  'A bathroom faucet leaks continuously and has caused visible staining inside the vanity.',

                explanation:
                  'Repairing the active leak addresses a maintenance problem and prevents additional damage. Document any related repair work.'
              },
              {
                title:
                  'Presentation improvement',

                scenario:
                  'A bedroom is filled with excess furniture that makes the room appear significantly smaller.',

                explanation:
                  'Removing unnecessary furniture is inexpensive, improves photography, and helps buyers understand the room’s usable space.'
              },
              {
                title:
                  'Potentially unnecessary project',

                scenario:
                  'The kitchen is functional but dated, and the seller is considering a complete renovation immediately before listing.',

                explanation:
                  'A major renovation may delay the listing and may not return its full cost. Compare the property with competing homes and obtain qualified advice before committing to a large project.'
              }
            ]
          },
          {
            heading:
              'Complete the exterior preparation',

            paragraphs: [
              (
                'The exterior and entrance create the buyer’s ' +
                'first impression and frequently provide the ' +
                'primary marketplace photograph.'
              )
            ],

            checklist: [
              {
                title:
                  'Clean the exterior',

                description:
                  'Remove cobwebs, dirt, leaves, debris, overflowing containers, and unnecessary items around the entrance, driveway, porch, patio, and visible exterior areas.'
              },
              {
                title:
                  'Address landscaping',

                description:
                  'Mow the lawn, trim overgrown vegetation, remove dead plants, edge walkways when practical, and avoid allowing landscaping to conceal important exterior features.'
              },
              {
                title:
                  'Check doors and hardware',

                description:
                  'Confirm that exterior doors, locks, handles, garage doors, gates, and access devices operate properly.'
              },
              {
                title:
                  'Inspect exterior lighting',

                description:
                  'Replace burned-out bulbs and confirm that entrance, walkway, garage, patio, and security lights operate as intended.'
              },
              {
                title:
                  'Review visible maintenance issues',

                description:
                  'Look for damaged siding, loose trim, peeling paint, clogged gutters, cracked glass, damaged screens, trip hazards, and visible drainage concerns.'
              },
              {
                title:
                  'Organize parking areas',

                description:
                  'Remove unnecessary vehicles and equipment so buyers can understand the driveway, garage, carport, and available parking.'
              }
            ]
          },
          {
            heading:
              'Prepare each interior room',

            paragraphs: [
              (
                'Work through the home systematically instead ' +
                'of attempting to prepare everything at once. ' +
                'Complete one room before moving to the next.'
              )
            ],

            steps: [
              {
                title:
                  'Remove unnecessary items',

                description:
                  'Reduce clutter on floors, counters, shelves, furniture, and window areas. Store personal collections and items that distract from the room.'
              },
              {
                title:
                  'Clean visible surfaces',

                description:
                  'Clean floors, windows, mirrors, appliances, fixtures, cabinets, doors, baseboards, vents, and other surfaces likely to appear in photographs or during showings.'
              },
              {
                title:
                  'Check lighting',

                description:
                  'Replace burned-out bulbs, use consistent bulb colors when practical, open window coverings, and verify that switches and fixtures operate.'
              },
              {
                title:
                  'Identify minor repairs',

                description:
                  'Look for loose handles, damaged outlet covers, sticking doors, dripping faucets, damaged caulk, wall marks, and other visible maintenance issues.'
              },
              {
                title:
                  'Arrange furniture',

                description:
                  'Create clear walking paths and arrange furniture to show the room’s purpose and usable space without making it appear artificially empty.'
              },
              {
                title:
                  'Review the room from the doorway',

                description:
                  'Stand where a buyer or photographer will first enter and remove anything that blocks the room’s strongest feature or makes the space difficult to understand.'
              }
            ]
          },
          {
            heading:
              'Use a room-by-room checklist',

            paragraphs: [
              (
                'Different areas require different preparation. ' +
                'Use the following checklist as a final review.'
              )
            ],

            checklist: [
              {
                title:
                  'Kitchen',

                description:
                  'Clear most counter space, clean appliances, remove items from the refrigerator exterior, organize visible pantry areas, empty the sink, and hide trash containers.'
              },
              {
                title:
                  'Living areas',

                description:
                  'Arrange seating, remove excess cords and electronics, clean fireplace areas, straighten window coverings, and show the intended use of each room.'
              },
              {
                title:
                  'Bedrooms',

                description:
                  'Make beds, reduce furniture and personal items, organize visible closets, remove laundry, and create clear space around windows and doors.'
              },
              {
                title:
                  'Bathrooms',

                description:
                  'Clean mirrors and fixtures, close toilet lids, remove medications and personal hygiene items, replace damaged towels, and clear counters and shower edges.'
              },
              {
                title:
                  'Basement and storage',

                description:
                  'Create safe walking paths, organize stored property, provide access to major systems, and avoid concealing walls, floors, panels, or equipment buyers may need to inspect.'
              },
              {
                title:
                  'Garage',

                description:
                  'Organize tools and stored items, remove hazardous materials when appropriate, provide access to electrical panels and equipment, and show the available parking and storage space.'
              },
              {
                title:
                  'Outdoor living areas',

                description:
                  'Clean furniture, remove damaged accessories, organize grills and equipment, clear leaves and debris, and show patios, decks, porches, pools, and yards safely.'
              },
              {
                title:
                  'Utility and mechanical areas',

                description:
                  'Remove obstructions around the electrical panel, HVAC equipment, water heater, utility shutoffs, crawl-space access, attic access, and other major systems.'
              }
            ]
          },
          {
            heading:
              'Protect privacy, valuables, and safety',

            paragraphs: [
              (
                'Listing photographs and showings expose parts ' +
                'of the property to people the seller does not ' +
                'know. Remove or secure items that should not ' +
                'be visible or accessible.'
              )
            ],

            checklist: [
              {
                title:
                  'Remove financial information',

                description:
                  'Secure bills, bank statements, tax documents, account numbers, identification documents, checkbooks, and other financial records.'
              },
              {
                title:
                  'Secure valuables',

                description:
                  'Remove or lock away jewelry, cash, medications, firearms, collectibles, keys, electronic devices, and other valuable or sensitive property.'
              },
              {
                title:
                  'Protect personal information',

                description:
                  'Remove family schedules, school information, children’s names, security-system details, travel plans, and other information that could create a privacy or security concern.'
              },
              {
                title:
                  'Protect access information',

                description:
                  'Do not display alarm codes, gate codes, spare keys, lockbox combinations, garage-door codes, or instructions that reveal when the property is vacant.'
              },
              {
                title:
                  'Plan for pets',

                description:
                  'Decide where pets will be during photography and showings. Secure food, medication, crates, litter areas, and access points as appropriate.'
              },
              {
                title:
                  'Address hazards',

                description:
                  'Remove trip hazards, secure loose rugs, provide adequate lighting, restrict unsafe areas, and clearly communicate any access limitation.'
              }
            ],

            callout:
              'Never include alarm codes, lockbox combinations, personal documents, family schedules, or other security-sensitive information in listing photographs or public descriptions.'
          },
          {
            heading:
              'Prepare the property for photography',

            paragraphs: [
              (
                'Photographs should help buyers understand the ' +
                'property accurately. Complete cleaning and room ' +
                'preparation before the photography session so ' +
                'the images remain consistent with the condition ' +
                'buyers will see during a showing.'
              )
            ],

            steps: [
              {
                title:
                  'Choose an appropriate time',

                description:
                  'Select a time when the property has useful natural light and when vehicles, occupants, pets, contractors, and avoidable outdoor distractions can be removed.'
              },
              {
                title:
                  'Turn on appropriate lighting',

                description:
                  'Open window coverings and turn on interior lights. Avoid creating extreme differences between very bright windows and dark rooms.'
              },
              {
                title:
                  'Prepare the primary exterior view',

                description:
                  'Remove vehicles, trash containers, hoses, toys, equipment, and temporary items from the principal exterior photograph whenever practical.'
              },
              {
                title:
                  'Photograph rooms logically',

                description:
                  'Use angles that explain the room’s size, entrances, windows, and relationship to adjoining spaces without using misleading distortion.'
              },
              {
                title:
                  'Capture important features',

                description:
                  'Include meaningful improvements, storage, outdoor areas, parking, systems, accessibility features, and other items described in the listing.'
              },
              {
                title:
                  'Review every image',

                description:
                  'Check focus, lighting, reflections, personal information, visible occupants, duplicate views, misleading angles, and items that should have been removed.'
              }
            ]
          },
          {
            heading:
              'Select and organize listing photographs',

            paragraphs: [
              (
                'The photograph sequence should take the buyer ' +
                'through the property in a logical order. More ' +
                'photographs are not automatically better if ' +
                'they repeat the same view or make the listing ' +
                'difficult to follow.'
              )
            ],

            checklist: [
              {
                title:
                  'Choose the primary photograph',

                description:
                  'Select a clear, well-lit image that immediately identifies the property. The exterior is common, but another truthful and compelling image may be appropriate.'
              },
              {
                title:
                  'Create a natural sequence',

                description:
                  'Move from the exterior and entrance through the principal living areas, kitchen, bedrooms, bathrooms, outdoor areas, parking, storage, and notable improvements.'
              },
              {
                title:
                  'Remove weak images',

                description:
                  'Delete blurry, dark, duplicate, badly framed, misleading, outdated, or irrelevant photographs.'
              },
              {
                title:
                  'Confirm current condition',

                description:
                  'Do not use photographs that materially differ from the property’s present condition without clearly addressing the change.'
              },
              {
                title:
                  'Avoid misleading edits',

                description:
                  'Normal corrections for brightness and framing may be useful, but edits should not remove defects, add nonexistent features, or materially misrepresent rooms or views.'
              }
            ]
          },
          {
            heading:
              'Complete the final pre-listing review',

            paragraphs: [
              (
                'Before beginning the NavStreet listing, conduct ' +
                'one final walkthrough with the information and ' +
                'photographs you plan to publish.'
              )
            ],

            checklist: [
              {
                title:
                  'Compare facts with the property',

                description:
                  'Confirm the bedroom and bathroom counts, square footage source, lot measurement, year built, parking, association information, systems, and selected features.'
              },
              {
                title:
                  'Confirm the description',

                description:
                  'Make sure the description matches the property and does not contain unsupported statements, omitted changes, or inaccurate improvement claims.'
              },
              {
                title:
                  'Confirm photograph order',

                description:
                  'Verify the primary image and review the full sequence on both a desktop and a mobile-sized screen.'
              },
              {
                title:
                  'Prepare showing instructions',

                description:
                  'Document permitted showing times, required notice, access procedures, pet instructions, restricted areas, and the seller’s preferred communication method.'
              },
              {
                title:
                  'Save supporting records',

                description:
                  'Retain invoices, permits, warranties, association documents, surveys, repair records, and other information that may be useful during the transaction.'
              }
            ]
          }
          
        ],

        navStreetLinks: [
          {
            label:
              'Create a property listing',

            route:
              '/sell/new',

            description:
              'Begin the six-step NavStreet property-listing process.',

            icon:
              'fa-solid fa-plus'
          },
          {
            label:
              'Open My Listings',

            route:
              '/dashboard/listings',

            description:
              'Resume a draft or manage an existing property listing.',

            icon:
              'fa-solid fa-list'
          },
          {
            label:
              'Photography guide',

            route:
              '/education/preparing-and-marketing/understanding-property-photographs',

            description:
              'Review detailed guidance for selecting and organizing property images.',

            icon:
              'fa-solid fa-camera'
          },
          {
            label:
              'Pricing guide',

            route:
              '/education/preparing-and-marketing/creating-an-effective-property-listing',

            description:
              'Continue preparing the price, description, and public presentation.',

            icon:
              'fa-solid fa-tags'
          }
        ],

        nextSteps: [
          {
            title:
              'Complete the repair and preparation list',

            description:
              'Separate necessary repairs, cleaning, organization, safety work, and optional cosmetic improvements.'
          },
          {
            title:
              'Gather accurate property information',

            description:
              'Collect the facts, documents, association information, system details, and improvement records needed for the listing.'
          },
          {
            title:
              'Photograph the prepared property',

            description:
              'Capture current, well-lit images that show the property logically and accurately.'
          },
          {
            title:
              'Select the price and description',

            description:
              'Review comparable properties and prepare a factual description emphasizing the property’s strongest relevant features.'
          },
          {
            title:
              'Create the NavStreet listing',

            description:
              'Enter the prepared information into the six-step listing process and review the final result before certification.'
          }
        ],

        relatedArticleSlugs: [
          'how-the-navstreet-selling-process-works',
          'creating-an-effective-property-listing',
          'understanding-property-photographs'
        ]
      },
      {
        slug:
          'creating-an-effective-property-listing',

        categorySlug:
          'preparing-and-marketing',

        title:
          'Creating an Effective Property Listing',

        summary:
          'Build an accurate and persuasive listing with verified property facts, useful descriptions, strong photographs, transparent pricing, and a complete final review.',

        eyebrow:
          'Listing creation guide',

        icon:
          'fa-solid fa-pen-to-square',

        audience:
          'seller',

        estimatedMinutes:
          12,

        featured:
          true,

        displayOrder:
          3,

        sections: [
          {
            heading:
              'Verify every material property fact',

            paragraphs: [
              'Begin with information buyers can trust. Confirm the address, property type, bedroom and bathroom counts, finished square footage, lot size, year built, parking, utilities, association details, and major systems before publication.',
              'Use reliable records when available. If tax records, surveys, permits, appraisals, or prior listings conflict, investigate the difference instead of selecting the most favorable number.'
            ],

            checklist: [
              {
                title:
                  'Confirm finished square footage',

                description:
                  'Separate finished living area from garages, unfinished basements, porches, attics, and storage spaces.'
              },
              {
                title:
                  'Verify room counts',

                description:
                  'Do not represent unfinished or nonconforming spaces as completed bedrooms or bathrooms.'
              },
              {
                title:
                  'Review HOA information',

                description:
                  'Confirm the association name, current fee, payment frequency, and known requirements.'
              }
            ]
          },
          {
            heading:
              'Write a description buyers can use',

            paragraphs: [
              'Describe the property rather than repeating facts already shown elsewhere. Explain the layout, important updates, outdoor areas, parking, storage, and nearby conveniences using specific and objective language.',
              'Avoid guarantees, exaggeration, unsupported claims, and language that could violate fair-housing requirements. Replace vague claims with observable details.'
            ],

            bulletPoints: [
              'Lead with the strongest objective features.',
              'Explain how the principal rooms and living areas connect.',
              'Identify significant improvements and approximate dates when verified.',
              'Disclose known limitations through the appropriate documents and process.',
              'Proofread for inconsistent facts, spelling, and punctuation.'
            ],

            callout:
              'A strong listing creates interest without creating expectations the property cannot support.'
          },
          {
            heading:
              'Complete the publication review',

            paragraphs: [
              'Preview the buyer-facing listing on desktop and mobile. Confirm the primary photograph, price, description, features, showing information, and contact options.',
              'After publication, correct errors promptly and update the listing whenever its price, status, availability, or other material information changes.'
            ],

            checklist: [
              {
                title:
                  'Compare the final page with your records',

                description:
                  'Verify every material fact before accepting the seller certification.'
              },
              {
                title:
                  'Check photograph order',

                description:
                  'Confirm the strongest image appears first and the remaining images follow a logical sequence.'
              },
              {
                title:
                  'Review buyer contact options',

                description:
                  'Make sure inquiries, showing requests, and offer tools are ready for buyer activity.'
              }
            ]
          }
        ],

        navStreetLinks: [
          {
            label:
              'Create a property listing',

            route:
              '/sell',

            description:
              'Start the guided NavStreet listing process.',

            icon:
              'fa-solid fa-house-circle-check'
          },
          {
            label:
              'Open My Listings',

            route:
              '/dashboard/listings',

            description:
              'Resume a draft or manage a published listing.',

            icon:
              'fa-solid fa-list'
          }
        ],

        nextSteps: [
          {
            title:
              'Verify the property facts',

            description:
              'Resolve conflicting information before entering it into the listing.'
          },
          {
            title:
              'Prepare the description and photographs',

            description:
              'Present the property clearly, accurately, and in a logical order.'
          },
          {
            title:
              'Preview and publish',

            description:
              'Review the buyer-facing page before beginning marketing.'
          }
        ],

        relatedArticleSlugs: [
          'preparing-your-property-for-listing',
          'understanding-property-photographs',
          'pricing-your-property-and-using-comparable-sales'
        ]
      },
      {
        slug:
          'understanding-property-photographs',

        categorySlug:
          'preparing-and-marketing',

        title:
          'Property Photography and Presentation Checklist',

        summary:
          'Prepare every room, protect private information, create useful photographs, and organize images so buyers can understand the property.',

        eyebrow:
          'Photography procedure',

        icon:
          'fa-solid fa-camera',

        audience:
          'seller',

        estimatedMinutes:
          9,

        featured:
          false,

        displayOrder:
          4,

        sections: [
          {
            heading:
              'Prepare the property before photographing it',

            paragraphs: [
              'Complete cleaning, decluttering, minor repairs, landscaping, and lighting adjustments before taking listing photographs. The photographs should represent the condition buyers will see during a showing.',
              'Remove documents, prescription medication, valuables, family schedules, security information, access codes, and other private items from view.'
            ],

            checklist: [
              {
                title:
                  'Clean and reduce clutter',

                description:
                  'Clear counters, floors, tables, vanities, and unnecessary furniture without making rooms appear misleadingly empty.'
              },
              {
                title:
                  'Prepare lighting',

                description:
                  'Replace failed bulbs, use consistent color temperatures, open appropriate window coverings, and avoid harsh backlighting.'
              },
              {
                title:
                  'Protect privacy and security',

                description:
                  'Remove photographs, mail, computer screens, alarm panels, keys, identifying documents, and valuable collections.'
              }
            ]
          },
          {
            heading:
              'Capture a complete and honest visual tour',

            paragraphs: [
              'Use level, well-lit photographs showing the exterior, principal living areas, kitchen, bedrooms, bathrooms, outdoor areas, parking, storage, and meaningful improvements.',
              'Avoid extreme wide-angle distortion, heavy filters, inaccurate virtual alterations, duplicated images, and photographs that conceal material conditions.'
            ],

            bulletPoints: [
              'Use the strongest exterior or principal living-area image as the primary photograph.',
              'Photograph rooms from positions that explain their size and layout.',
              'Include important features buyers may not notice during a quick showing.',
              'Retake blurry, tilted, dark, overexposed, or obstructed images.',
              'Arrange images in the same general order a visitor would tour the property.'
            ]
          },
          {
            heading:
              'Review the photographs after publication',

            paragraphs: [
              'Open the public listing on both a computer and a mobile device. Confirm that images load, crop properly, remain sharp, and appear in the intended order.',
              'Replace photographs when the property changes materially or when an image no longer represents its current condition.'
            ],

            callout:
              'Listing photographs should improve understanding of the property without materially changing its appearance.'
          }
        ],

        navStreetLinks: [
          {
            label:
              'Open My Listings',

            route:
              '/dashboard/listings',

            description:
              'Manage listing photographs and review the published property.',

            icon:
              'fa-solid fa-images'
          },
          {
            label:
              'Find a professional',

            route:
              '/find-a-pro/north-carolina',

            description:
              'Browse participating property photographers and other professionals.',

            icon:
              'fa-solid fa-user-tie'
          }
        ],

        nextSteps: [
          {
            title:
              'Prepare each room',

            description:
              'Finish cleaning, organization, repairs, lighting, and privacy checks.'
          },
          {
            title:
              'Create the photo sequence',

            description:
              'Select the primary image and organize a logical property tour.'
          },
          {
            title:
              'Review the public result',

            description:
              'Confirm image quality and ordering after publication.'
          }
        ],

        relatedArticleSlugs: [
          'preparing-your-property-for-listing',
          'creating-an-effective-property-listing',
          'using-the-marketing-toolkit'
        ]
      },
      {
        slug:
          'pricing-your-property-and-using-comparable-sales',

        categorySlug:
          'selling-a-home',

        title:
          'Pricing Your Property and Using Comparable Sales',

        summary:
          'Evaluate comparable sales, active competition, market conditions, property differences, and appraisal risk before selecting a listing price.',

        eyebrow:
          'Pricing considerations',

        icon:
          'fa-solid fa-chart-line',

        audience:
          'seller',

        estimatedMinutes:
          12,

        featured:
          true,

        displayOrder:
          5,

        sections: [
          {
            heading:
              'Understand what makes a sale comparable',

            paragraphs: [
              'A comparable sale is a recently closed property that competes with the subject property in location, type, size, age, condition, features, lot characteristics, and buyer appeal. No sale is identical, so differences must be considered rather than ignored.',
              'Closed sales show what buyers actually paid. Active listings show current competition but not the price buyers will ultimately accept. Pending sales may indicate current demand, although their contract prices are usually unavailable.'
            ],

            checklist: [
              {
                title:
                  'Prioritize nearby recent sales',

                description:
                  'Begin with the same neighborhood or competitive area and expand only when necessary.'
              },
              {
                title:
                  'Compare similar property types',

                description:
                  'Avoid treating detached homes, townhomes, condominiums, manufactured homes, and significantly different designs as interchangeable.'
              },
              {
                title:
                  'Account for condition and improvements',

                description:
                  'Consider renovations, deferred maintenance, age of systems, functional limitations, and overall presentation.'
              }
            ]
          },
          {
            heading:
              'Separate evidence from asking prices',

            paragraphs: [
              'A nearby seller’s asking price does not prove market value. Compare active competition with closed sales, price reductions, time on market, and properties that failed to sell.',
              'Pricing substantially above supportable market evidence can reduce showing activity and create appraisal problems. Pricing too low may generate attention but can sacrifice negotiating position or proceeds.'
            ],

            callout:
              'The best-supported price is not automatically the highest number found in the neighborhood.'
          },
          {
            heading:
              'Reevaluate the price after publication',

            paragraphs: [
              'Monitor views, saves, inquiries, showings, buyer feedback, competing listings, and new comparable sales. Limited activity may reflect price, presentation, condition, access, or market demand.',
              'A price change should be based on evidence rather than frustration. Review what has changed since publication and document the reasoning behind the adjustment.'
            ],

            bulletPoints: [
              'Strong views with few inquiries may indicate presentation or pricing concerns.',
              'Inquiries without showings may indicate incomplete information or access limitations.',
              'Showings without offers may point to price, condition, or buyer objections.',
              'An accepted offer remains subject to lender appraisal when financing is involved.'
            ]
          }
        ],

        navStreetLinks: [
          {
            label:
              'Open My Listings',

            route:
              '/dashboard/listings',

            description:
              'Review and manage the pricing of your property.',

            icon:
              'fa-solid fa-list'
          },
          {
            label:
              'Browse homes',

            route:
              '/homes',

            description:
              'Review properties currently competing for buyer attention.',

            icon:
              'fa-solid fa-house'
          }
        ],

        nextSteps: [
          {
            title:
              'Build a comparable group',

            description:
              'Collect recent nearby sales and identify meaningful property differences.'
          },
          {
            title:
              'Review active competition',

            description:
              'Compare condition, presentation, features, and asking prices.'
          },
          {
            title:
              'Select and monitor the price',

            description:
              'Publish a supportable price and reassess it using actual market response.'
          }
        ],

        relatedArticleSlugs: [
          'creating-an-effective-property-listing',
          'how-the-navstreet-selling-process-works',
          'understanding-offer-terms-and-negotiations'
        ]
      },
      {
        slug:
          'how-the-navstreet-buying-process-works',

        categorySlug:
          'buying-a-home',

        title:
          'How the NavStreet Buying Process Works',

        summary:
          'Follow the buyer process from financial preparation and property research through showings, offers, inspections, financing, and closing.',

        eyebrow:
          'Complete buyer procedure',

        icon:
          'fa-solid fa-key',

        audience:
          'buyer',

        estimatedMinutes:
          13,

        featured:
          true,

        displayOrder:
          6,

        sections: [
          {
            heading:
              'Prepare before searching seriously',

            paragraphs: [
              'Review income, debts, credit, available funds, expected housing costs, and financial reserves before deciding on a price range. A lender prequalification or preapproval can help identify documentation needs and possible loan limitations.',
              'Budget for more than the down payment. Buyers may also need funds for inspections, appraisal, lender charges, title and settlement expenses, insurance, taxes, association items, moving, repairs, and reserves.'
            ],

            checklist: [
              {
                title:
                  'Establish a comfortable payment range',

                description:
                  'Consider principal, interest, taxes, insurance, association fees, utilities, maintenance, and other obligations.'
              },
              {
                title:
                  'Organize lender documents',

                description:
                  'Prepare income, employment, asset, debt, identification, and housing-history records.'
              },
              {
                title:
                  'Identify property requirements',

                description:
                  'Separate essential needs from preferences that can be changed later.'
              }
            ]
          },
          {
            heading:
              'Evaluate properties and request showings',

            paragraphs: [
              'Review the complete listing, photographs, price, property facts, disclosures, association information, taxes, location, and estimated payment before requesting a showing.',
              'During the showing, evaluate condition, layout, noise, access, drainage, visible maintenance, storage, systems, and surrounding properties. Do not rely solely on listing photographs.'
            ],

            bulletPoints: [
              'Save promising listings for comparison.',
              'Submit questions through the listing inquiry tools.',
              'Request available showing dates and times.',
              'Respect the seller’s property and showing instructions.',
              'Record questions requiring documents or professional evaluation.'
            ]
          },
          {
            heading:
              'Make an offer and complete the transaction',

            paragraphs: [
              'An offer involves more than price. Review deposits, financing, inspections, appraisal, personal property, seller concessions, settlement, possession, expiration, and other contingencies before signing.',
              'After acceptance, track every deadline. Coordinate inspections, lender requests, appraisal, insurance, title work, settlement documents, final verification, and funds required for closing.'
            ],

            callout:
              'Do not send money or rely on changed wiring instructions without independently verifying them through a trusted telephone number.'
          }
        ],

        navStreetLinks: [
          {
            label:
              'Browse homes',

            route:
              '/homes',

            description:
              'Search current NavStreet property listings.',

            icon:
              'fa-solid fa-house'
          },
          {
            label:
              'Mortgage calculators',

            route:
              '/calculators',

            description:
              'Estimate payments and other financing figures.',

            icon:
              'fa-solid fa-calculator'
          },
          {
            label:
              'Find a professional',

            route:
              '/find-a-pro/north-carolina',

            description:
              'Browse participating mortgage, inspection, legal, insurance, and closing professionals.',

            icon:
              'fa-solid fa-user-tie'
          }
        ],

        nextSteps: [
          {
            title:
              'Prepare the budget and financing',

            description:
              'Determine an affordable range and organize lender documentation.'
          },
          {
            title:
              'Research and tour properties',

            description:
              'Compare complete property information and investigate unresolved concerns.'
          },
          {
            title:
              'Review the complete offer',

            description:
              'Understand every financial term, contingency, date, and obligation before signing.'
          }
        ],

        relatedArticleSlugs: [
          'mortgage-qualification-and-documentation',
          'showing-preparation-and-safety',
          'understanding-offer-terms-and-negotiations'
        ]
      },
      {
        slug:
          'showing-preparation-and-safety',

        categorySlug:
          'showings-and-inquiries',

        title:
          'Showing Preparation and Safety Procedures',

        summary:
          'Prepare the property, protect people and valuables, coordinate access, and follow a consistent process before and after every showing.',

        eyebrow:
          'Showing procedure',

        icon:
          'fa-solid fa-calendar-check',

        audience:
          'all',

        estimatedMinutes:
          10,

        featured:
          false,

        displayOrder:
          7,

        sections: [
          {
            heading:
              'Seller preparation before each showing',

            paragraphs: [
              'Confirm the appointment and access instructions before allowing entry. Clean and secure the property, provide safe lighting and walking paths, control pets, and remove valuables, medication, documents, keys, weapons, and sensitive information.',
              'Decide whether the seller will leave during the appointment. Buyers generally evaluate a property more comfortably when the seller is not following them through the home.'
            ],

            checklist: [
              {
                title:
                  'Confirm the visitor and appointment',

                description:
                  'Use the NavStreet showing request and response record rather than relying on an unexpected arrival.'
              },
              {
                title:
                  'Secure private and valuable items',

                description:
                  'Remove medication, jewelry, financial documents, mail, electronics, spare keys, firearms, and identifying information.'
              },
              {
                title:
                  'Prepare safe access',

                description:
                  'Address loose rugs, dark stairs, slippery surfaces, exterior hazards, pets, alarms, and locked areas.'
              }
            ]
          },
          {
            heading:
              'Buyer conduct during the showing',

            paragraphs: [
              'Arrive at the confirmed time, follow access instructions, supervise children, avoid opening private containers, and do not photograph personal property without permission.',
              'Observe the property carefully while recognizing that a showing is not a professional inspection. Record concerns that should be investigated through documents, specialists, or a formal inspection.'
            ],

            bulletPoints: [
              'Do not arrive without a confirmed appointment.',
              'Do not bring unapproved additional visitors.',
              'Do not test equipment or operate systems without permission.',
              'Do not discuss private financial information within range of recording devices.',
              'Leave the property in the condition in which it was found.'
            ]
          },
          {
            heading:
              'Follow up and preserve the record',

            paragraphs: [
              'After the showing, the seller should confirm the property is secure and document any damage, missing item, access problem, or unusual event immediately.',
              'Buyers can submit follow-up questions through NavStreet. Sellers should answer factual questions accurately and provide documents through appropriate secure channels.'
            ],

            callout:
              'If anyone feels unsafe or an unverified person attempts to enter, do not proceed with the showing.'
          }
        ],

        navStreetLinks: [
          {
            label:
              'Open My Listings',

            route:
              '/dashboard/listings',

            description:
              'Manage seller showing activity and property access.',

            icon:
              'fa-solid fa-calendar-check'
          },
          {
            label:
              'Browse homes',

            route:
              '/homes',

            description:
              'Open a property listing to request an available showing.',

            icon:
              'fa-solid fa-house'
          }
        ],

        nextSteps: [
          {
            title:
              'Confirm the appointment',

            description:
              'Make sure the date, time, attendees, and access procedure are understood.'
          },
          {
            title:
              'Prepare and secure the property',

            description:
              'Remove hazards, valuables, private information, and access problems.'
          },
          {
            title:
              'Document the follow-up',

            description:
              'Use NavStreet inquiries and responses to keep communications organized.'
          }
        ],

        relatedArticleSlugs: [
          'how-the-navstreet-buying-process-works',
          'how-the-navstreet-selling-process-works',
          'understanding-offer-terms-and-negotiations'
        ]
      },
      {
        slug:
          'understanding-offer-terms-and-negotiations',

        categorySlug:
          'offers-and-negotiations',

        title:
          'Understanding Offer Terms and Negotiations',

        summary:
          'Evaluate price, deposits, financing, contingencies, concessions, settlement dates, possession, personal property, and counteroffer strategies as one complete proposal.',

        eyebrow:
          'Offer and counteroffer guide',

        icon:
          'fa-solid fa-file-signature',

        audience:
          'all',

        estimatedMinutes:
          14,

        featured:
          true,

        displayOrder:
          8,

        sections: [
          {
            heading:
              'Evaluate the complete offer, not only the price',

            paragraphs: [
              'Two offers with the same price can create very different financial results and risks. Review deposits, financing, appraisal, inspections, seller-paid costs, repairs, personal property, settlement, possession, expiration, and every contingency together.',
              'Buyers should understand the money at risk and the deadlines required to preserve contractual rights. Sellers should compare expected net proceeds, likelihood of closing, requested concessions, timing, and uncertainty.'
            ],

            checklist: [
              {
                title:
                  'Price and expected proceeds',

                description:
                  'Consider credits, repairs, included property, payoff obligations, and transaction expenses rather than relying on price alone.'
              },
              {
                title:
                  'Deposits and termination rights',

                description:
                  'Understand when funds are due, who holds them, whether they are refundable, and what happens after termination or default.'
              },
              {
                title:
                  'Financing and appraisal',

                description:
                  'Review loan type, lender timing, appraisal requirements, and what happens if financing or value is insufficient.'
              },
              {
                title:
                  'Settlement and possession',

                description:
                  'Confirm the intended closing date, transfer of possession, keys, occupancy, and any post-closing arrangement.'
              }
            ]
          },
          {
            heading:
              'Compare common negotiation scenarios',

            paragraphs: [
              'A higher-priced offer with substantial concessions and uncertain financing may produce less value than a lower-priced offer with stronger terms. A fast closing may help one seller but create moving or payoff problems for another.',
              'A counteroffer changes the proposal and may end the ability to accept the original offer. Keep the complete written terms organized and do not assume a verbal discussion creates an agreement.'
            ],

            checklist: [
              {
                title:
                  'Scenario: high price with concessions',

                description:
                  'Calculate the expected proceeds after seller-paid costs and consider whether the property is likely to appraise.'
              },
              {
                title:
                  'Scenario: lower price with stronger financing',

                description:
                  'Compare certainty, lender readiness, deposits, contingencies, and closing timetable.'
              },
              {
                title:
                  'Scenario: repair request after inspection',

                description:
                  'Compare completing repairs, providing a credit, changing the price, declining the request, or negotiating another solution.'
              },
              {
                title:
                  'Scenario: appraisal below the contract price',

                description:
                  'Possible outcomes may include a price change, additional buyer funds, reconsideration evidence, a negotiated split, or termination when permitted.'
              }
            ]
          },
          {
            heading:
              'Respond carefully and preserve deadlines',

            paragraphs: [
              'Read the entire offer and supporting documents before accepting, rejecting, or countering. Clarify incomplete terms and use qualified legal, tax, lending, inspection, or other professional assistance when needed.',
              'Record expiration times and transaction deadlines. A favorable term can lose value when another provision creates an unacceptable obligation or risk.'
            ],

            callout:
              'NavStreet organizes offers and communications but does not replace legal advice about contract rights or obligations.'
          }
        ],

        navStreetLinks: [
          {
            label:
              'Open your dashboard',

            route:
              '/dashboard',

            description:
              'Review property activity, offers, and transaction information.',

            icon:
              'fa-solid fa-table-columns'
          },
          {
            label:
              'Find a professional',

            route:
              '/find-a-pro/north-carolina',

            description:
              'Browse participating attorneys, lenders, inspectors, and other professionals.',

            icon:
              'fa-solid fa-user-tie'
          }
        ],

        nextSteps: [
          {
            title:
              'List every material term',

            description:
              'Review price, money, dates, contingencies, concessions, property, and possession.'
          },
          {
            title:
              'Compare financial result and risk',

            description:
              'Evaluate expected proceeds or cost together with the likelihood of closing.'
          },
          {
            title:
              'Respond before expiration',

            description:
              'Accept, reject, counter, or request clarification using complete written terms.'
          }
        ],

        relatedArticleSlugs: [
          'how-the-navstreet-buying-process-works',
          'mortgage-qualification-and-documentation',
          'inspection-appraisal-title-insurance-and-closing'
        ]
      },
      {
        slug:
          'mortgage-qualification-and-documentation',

        categorySlug:
          'mortgage-and-financing',

        title:
          'Mortgage Qualification and Documentation Requirements',

        summary:
          'Understand affordability, prequalification, preapproval, income, assets, credit, debts, property requirements, and the documents lenders commonly request.',

        eyebrow:
          'Buyer financing preparation',

        icon:
          'fa-solid fa-building-columns',

        audience:
          'buyer',

        estimatedMinutes:
          13,

        featured:
          true,

        displayOrder:
          9,

        sections: [
          {
            heading:
              'Understand qualification beyond the interest rate',

            paragraphs: [
              'Mortgage qualification commonly considers income, employment, assets, credit history, monthly obligations, property type, occupancy, down payment, reserves, and loan-program requirements.',
              'A calculator provides an estimate, not loan approval. A lender must verify the borrower and property information under the applicable program before issuing final approval.'
            ],

            checklist: [
              {
                title:
                  'Income and employment',

                description:
                  'Prepare recent pay statements, W-2 forms, tax returns when required, employment history, and documentation for other qualifying income.'
              },
              {
                title:
                  'Assets and funds to close',

                description:
                  'Prepare bank, investment, retirement, gift, sale-proceeds, and other statements needed to document eligible funds.'
              },
              {
                title:
                  'Credit and monthly obligations',

                description:
                  'Review debts, payment history, disputes, recent inquiries, co-signed obligations, and any credit events requiring explanation.'
              },
              {
                title:
                  'Identity and housing history',

                description:
                  'Prepare identification, current housing expense, landlord or mortgage information, and prior addresses when requested.'
              }
            ]
          },
          {
            heading:
              'Protect qualification during the transaction',

            paragraphs: [
              'Loan approval can change before closing. Avoid opening credit, increasing balances, changing employment, moving money without records, making large purchases, or changing the intended occupancy without discussing the change with the lender.',
              'Respond promptly to lender requests and provide complete, readable documents. Updated statements, income records, credit information, insurance, title, appraisal, and property documents may be required before closing.'
            ],

            bulletPoints: [
              'Do not assume a preapproval guarantees final approval.',
              'Do not omit debts, properties, businesses, obligations, or sources of funds.',
              'Keep records supporting large deposits and transfers.',
              'Review the Loan Estimate and later Closing Disclosure carefully.',
              'Ask questions when figures or loan terms differ from expectations.'
            ]
          },
          {
            heading:
              'Prepare for property-related underwriting',

            paragraphs: [
              'The property must also satisfy lender and loan-program requirements. Appraisal, title, insurance, association, flood, condition, occupancy, and property-type issues can affect approval.',
              'Condominiums, manufactured homes, investment properties, multi-unit properties, and properties with condition or legal-use concerns may require additional review.'
            ],

            callout:
              'Verify current requirements directly with the lender because documentation and program rules can change.'
          }
        ],

        navStreetLinks: [
          {
            label:
              'Mortgage calculators',

            route:
              '/calculators',

            description:
              'Estimate payments, affordability, and other financing figures.',

            icon:
              'fa-solid fa-calculator'
          },
          {
            label:
              'Find a mortgage professional',

            route:
              '/find-a-pro/north-carolina',

            description:
              'Browse participating mortgage professionals.',

            icon:
              'fa-solid fa-user-tie'
          }
        ],

        nextSteps: [
          {
            title:
              'Estimate a complete housing budget',

            description:
              'Include the payment, taxes, insurance, association fees, maintenance, and reserves.'
          },
          {
            title:
              'Organize the documentation',

            description:
              'Prepare complete income, asset, credit, identity, and housing records.'
          },
          {
            title:
              'Maintain financial stability',

            description:
              'Discuss material employment, credit, asset, occupancy, or property changes with the lender.'
          }
        ],

        relatedArticleSlugs: [
          'how-the-navstreet-buying-process-works',
          'understanding-offer-terms-and-negotiations',
          'inspection-appraisal-title-insurance-and-closing'
        ]
      },
      {
        slug:
          'inspection-appraisal-title-insurance-and-closing',

        categorySlug:
          'closing-and-moving',

        title:
          'Inspection, Appraisal, Title, Insurance, and Closing',

        summary:
          'Understand the principal contract-to-closing milestones, responsible parties, common documents, timing risks, and final steps before settlement.',

        eyebrow:
          'Contract-to-closing timeline',

        icon:
          'fa-solid fa-flag-checkered',

        audience:
          'all',

        estimatedMinutes:
          15,

        featured:
          true,

        displayOrder:
          10,

        sections: [
          {
            heading:
              'Begin immediately after contract acceptance',

            paragraphs: [
              'The contract controls the actual deadlines. Common early tasks include delivering deposits, applying for financing, ordering inspections, providing seller documents, beginning title work, arranging insurance, and resolving association requirements.',
              'Create one deadline list showing the responsible person, required action, due date, completion status, and supporting document. Do not assume another participant is tracking a deadline for you.'
            ],

            checklist: [
              {
                title:
                  'Deposits and contract delivery',

                description:
                  'Confirm required funds and signed documents reach the correct authorized recipient on time.'
              },
              {
                title:
                  'Inspections and investigations',

                description:
                  'Schedule general and specialized evaluations early enough to review findings and exercise contractual rights.'
              },
              {
                title:
                  'Financing and appraisal',

                description:
                  'Complete lender requests, monitor appraisal status, and address property or valuation issues promptly.'
              }
            ]
          },
          {
            heading:
              'Understand the purpose of each review',

            paragraphs: [
              'An inspection evaluates property condition for the client. An appraisal develops an opinion of value for the lender or other client. Title work examines ownership and recorded interests. Insurance evaluates eligible coverage and risk. None automatically replaces the others.',
              'Association records, surveys, permits, flood information, repair documentation, utility information, and legal-use questions may require separate investigation.'
            ],

            checklist: [
              {
                title:
                  'Inspection',

                description:
                  'Review the complete report, ask questions, obtain specialist evaluations when appropriate, and follow contractual procedures for requests or termination.'
              },
              {
                title:
                  'Appraisal',

                description:
                  'Understand the value conclusion, lender review, required repairs, reconsideration process, and contract options after a low appraisal.'
              },
              {
                title:
                  'Title and settlement',

                description:
                  'Confirm ownership, liens, judgments, taxes, legal description, payoff requirements, settlement figures, and documents needed to transfer title.'
              },
              {
                title:
                  'Insurance',

                description:
                  'Arrange acceptable coverage early and disclose relevant property information accurately to the insurer.'
              }
            ]
          },
          {
            heading:
              'Prepare for the final days and closing',

            paragraphs: [
              'Review settlement figures and required documents before closing. Buyers should complete the final verification of property condition and confirm agreed repairs and included property. Sellers should prepare keys, access devices, possession, payoff information, and required documents.',
              'Closing practices and the moment ownership transfers vary by jurisdiction. Follow instructions from the closing professional and independently verify all money-transfer directions.'
            ],

            bulletPoints: [
              'Confirm funds required for closing and the approved delivery method.',
              'Review the Closing Disclosure or settlement statement for unexpected figures.',
              'Complete the final property verification before settlement.',
              'Confirm possession, keys, utilities, personal property, and move timing.',
              'Retain signed documents, reports, warranties, receipts, and settlement records.'
            ],

            callout:
              'Wire fraud is a serious risk. Verify instructions through a trusted number before sending any funds.'
          }
        ],

        navStreetLinks: [
          {
            label:
              'Open your dashboard',

            route:
              '/dashboard',

            description:
              'Review property and transaction activity.',

            icon:
              'fa-solid fa-table-columns'
          },
          {
            label:
              'Find a professional',

            route:
              '/find-a-pro/north-carolina',

            description:
              'Browse participating inspectors, attorneys, lenders, insurance professionals, and other providers.',

            icon:
              'fa-solid fa-user-tie'
          }
        ],

        nextSteps: [
          {
            title:
              'Build the deadline calendar',

            description:
              'Record every contract, inspection, financing, title, insurance, and closing date.'
          },
          {
            title:
              'Complete each investigation',

            description:
              'Review reports and resolve questions before applicable rights or deadlines expire.'
          },
          {
            title:
              'Verify the closing package',

            description:
              'Confirm documents, figures, condition, possession, and funds before settlement.'
          }
        ],

        relatedArticleSlugs: [
          'understanding-offer-terms-and-negotiations',
          'mortgage-qualification-and-documentation',
          'how-the-navstreet-buying-process-works'
        ]
      },
      {
        slug:
          'using-the-marketing-toolkit',

        categorySlug:
          'using-navstreet',

        title:
          'Using the NavStreet Marketing Toolkit',

        summary:
          'Use the permanent property link, social captions, sharing controls, downloadable QR code, and marketing checklist to promote a published listing.',

        eyebrow:
          'NavStreet tool guide',

        icon:
          'fa-solid fa-bullhorn',

        audience:
          'seller',

        estimatedMinutes:
          8,

        featured:
          false,

        displayOrder:
          11,

        sections: [
          {
            heading:
              'Open the toolkit for the correct property',

            paragraphs: [
              'The Marketing Toolkit belongs to a specific published listing. Open My Listings, locate the active property, and select its marketing option. Confirm the address and public listing before sharing anything.',
              'Review the public page first. Marketing will increase exposure to any incomplete photographs, incorrect facts, outdated price, or unavailable showing information.'
            ],

            checklist: [
              {
                title:
                  'Test the permanent property link',

                description:
                  'Open the short link in a private browser window and confirm it reaches the intended public listing.'
              },
              {
                title:
                  'Review the public listing',

                description:
                  'Confirm the price, status, photographs, description, property details, and contact tools.'
              },
              {
                title:
                  'Confirm showing availability',

                description:
                  'Make sure buyers can request appropriate dates and times before increasing exposure.'
              }
            ]
          },
          {
            heading:
              'Choose the appropriate sharing method',

            paragraphs: [
              'Copy the listing link for messages, advertisements, and websites. Copy the email link when composing an email. Customize a suggested social caption before posting it through a supported network or device sharing menu.',
              'The permanent short link should remain the destination even when the caption or advertisement changes. This keeps the public property page consistent across channels.'
            ],

            bulletPoints: [
              'Use the short caption for quick posts.',
              'Use the detailed caption when buyers need principal facts immediately.',
              'Use the property highlight format for visual social posts.',
              'Add accurate context instead of making unsupported claims.',
              'Update or remove posts when the listing status changes.'
            ]
          },
          {
            heading:
              'Download and test the QR code',

            paragraphs: [
              'Use PNG for ordinary documents, email graphics, postcards, and basic printing. Use SVG when a printer or designer needs a scalable file for signs, banners, or other large-format materials.',
              'Preserve the white space around the code, maintain strong contrast, avoid stretching or recoloring it, and test the final printed size with multiple phones before distribution.'
            ],

            callout:
              'Always scan the final printed material—not only the downloaded file—to verify that it opens the correct listing.'
          },
          {
            heading:
              'Use the marketing checklist as a record',

            paragraphs: [
              'Mark tasks complete as they are performed for the specific listing. The checklist helps distinguish planned marketing from actions already completed.',
              'Continue monitoring views, saves, inquiries, showing requests, feedback, and offers. Marketing activity should lead to informed decisions about presentation, access, price, and follow-up.'
            ]
          }
        ],

        navStreetLinks: [
          {
            label:
              'Open My Listings',

            route:
              '/dashboard/listings',

            description:
              'Choose an active property and open its Marketing Toolkit.',

            icon:
              'fa-solid fa-list'
          },
          {
            label:
              'Browse public homes',

            route:
              '/homes',

            description:
              'Review how published listings appear to prospective buyers.',

            icon:
              'fa-solid fa-house'
          }
        ],

        nextSteps: [
          {
            title:
              'Review and test the public listing',

            description:
              'Correct any problem before distributing the permanent link.'
          },
          {
            title:
              'Select the marketing channels',

            description:
              'Choose appropriate captions, social networks, email contacts, and printed materials.'
          },
          {
            title:
              'Track completed actions and results',

            description:
              'Update the checklist and monitor buyer response from the dashboard.'
          }
        ],

        relatedArticleSlugs: [
          'creating-an-effective-property-listing',
          'understanding-property-photographs',
          'pricing-your-property-and-using-comparable-sales'
        ]
      },
    ]

  getCategories():
    readonly EducationCategory[] {
    return [...this.categories]
      .sort(
        (firstCategory, secondCategory) =>
          firstCategory.displayOrder -
          secondCategory.displayOrder
      );
  }

  getCategoryBySlug(
    categorySlug: string
  ): EducationCategory | null {
    const normalizedCategorySlug =
      categorySlug
        .trim()
        .toLowerCase();

    return this.categories.find(
      category =>
        category.slug ===
        normalizedCategorySlug
    ) ?? null;
  }

  getArticles():
    readonly EducationArticle[] {
    return [...this.articles]
      .sort(
        (firstArticle, secondArticle) =>
          firstArticle.displayOrder -
          secondArticle.displayOrder
      );
  }

  getFeaturedArticles():
    readonly EducationArticle[] {
    return this.articles
      .filter(
        article => article.featured
      )
      .sort(
        (firstArticle, secondArticle) =>
          firstArticle.displayOrder -
          secondArticle.displayOrder
      );
  }

  getArticlesByCategory(
    categorySlug: string
  ): readonly EducationArticle[] {
    const normalizedCategorySlug =
      categorySlug
        .trim()
        .toLowerCase();

    return this.articles
      .filter(
        article =>
          article.categorySlug ===
          normalizedCategorySlug
      )
      .sort(
        (firstArticle, secondArticle) =>
          firstArticle.displayOrder -
          secondArticle.displayOrder
      );
  }

  getArticleBySlug(
    articleSlug: string
  ): EducationArticle | null {
    const normalizedArticleSlug =
      articleSlug
        .trim()
        .toLowerCase();

    return this.articles.find(
      article =>
        article.slug ===
        normalizedArticleSlug
    ) ?? null;
  }

  getRelatedArticles(
    article: EducationArticle
  ): readonly EducationArticle[] {
    return article.relatedArticleSlugs
      .map(
        relatedArticleSlug =>
          this.getArticleBySlug(
            relatedArticleSlug
          )
      )
      .filter(
        (
          relatedArticle
        ): relatedArticle is EducationArticle =>
          relatedArticle !== null
      );
  }

  searchArticles(
    searchTerm: string
  ): readonly EducationArticle[] {
    const normalizedSearchTerm =
      searchTerm
        .trim()
        .toLowerCase();

    if (!normalizedSearchTerm) {
      return this.getArticles();
    }

    return this.articles
      .filter(article => {
        const searchableContent = [
          article.title,
          article.summary,
          article.eyebrow,
          ...article.sections.flatMap(
            section => [
              section.heading,
              ...section.paragraphs,
              ...(section.bulletPoints ?? []),
              section.callout ?? ''
            ]
          )
        ]
          .join(' ')
          .toLowerCase();

        return searchableContent.includes(
          normalizedSearchTerm
        );
      })
      .sort(
        (firstArticle, secondArticle) =>
          firstArticle.displayOrder -
          secondArticle.displayOrder
      );
  }
}

