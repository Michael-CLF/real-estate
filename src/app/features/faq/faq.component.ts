import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal
} from '@angular/core';
import {
  RouterLink
} from '@angular/router';

type FaqCategory =
  | 'Getting started'
  | 'Costs and commissions'
  | 'Creating your listing'
  | 'Buyers and offers'
  | 'Contracts and closing'
  | 'Safety and support';

interface FaqItem {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
}

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [
    RouterLink
  ],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class FaqComponent {
  protected readonly searchTerm = signal('');

  protected readonly faqItems:
    ReadonlyArray<FaqItem> = [
      {
        id: 'sell-without-agent',
        category: 'Getting started',
        question:
          'Can I really sell my home without a traditional listing agent?',
        answer:
          'Yes. Homeowners are generally allowed to sell their own property. NavStreet is designed to make that process less intimidating by guiding you through creating a professional listing, presenting your property, communicating with interested buyers and preparing for the major steps between listing and closing. You remain in control and can still hire an attorney, title company, inspector, appraiser or other professional whenever you need specialized assistance.'
      },
      {
        id: 'navstreet-purpose',
        category: 'Getting started',
        question:
          'What does NavStreet do for a home seller?',
        answer:
          'NavStreet gives you a structured, step-by-step way to prepare and publish your property listing. You can enter property information, upload and arrange photographs, establish your asking price, receive buyer inquiries and manage your listing from one place. Our goal is to provide the organization and marketplace exposure homeowners need without forcing them into a traditional percentage-based listing arrangement.'
      },
      {
        id: 'experience-required',
        category: 'Getting started',
        question:
          'Do I need real estate experience to use NavStreet?',
        answer:
          'No. NavStreet is being built for ordinary homeowners, not real estate professionals. The listing process breaks a complicated transaction into understandable sections and explains what information is needed. You should still obtain qualified legal, tax, title or property advice when a decision requires professional judgment.'
      },
      {
        id: 'professional-help',
        category: 'Getting started',
        question:
          'Does selling on my own mean I must do everything alone?',
        answer:
          'No. Selling without a traditional listing agent does not mean completing every part of the transaction without help. You can hire individual professionals for the services you need, including a real estate attorney, title or escrow company, photographer, inspector, appraiser, surveyor or contractor. This lets you remain in control while purchasing specialized help where it provides value.'
      },
      {
        id: 'navstreet-fee',
        category: 'Costs and commissions',
        question:
          'How much does it cost to list a home on NavStreet?',
        answer:
          'The standard NavStreet listing fee is $49. A seller may also choose an optional Featured Listing upgrade for an additional $10. The Featured upgrade gives the property more prominent placement within the NavStreet marketplace. Other transaction expenses, such as legal, title, inspection, repair, recording or closing costs, are separate and are not included in the NavStreet listing fee.'
      },
      {
        id: 'save-money',
        category: 'Costs and commissions',
        question:
          'How can NavStreet help me save money?',
        answer:
          'Traditional listing arrangements commonly compensate a brokerage using a percentage of the sale price. NavStreet instead charges a flat listing fee for access to its marketplace and guided listing tools. Your actual savings depend on whether you hire other professionals, work with a buyer who has an agent, offer buyer-side compensation or have another brokerage agreement.'
      },
      {
        id: 'open-listing',
        category: 'Costs and commissions',
        question:
          'If I have an open listing and find the buyer myself, do I owe an agent a commission?',
        answer:
          'Under a true open listing, a commission is generally earned by the broker who successfully produces the buyer. If you independently find the buyer and complete the sale without a broker being the procuring cause, a listing commission may not be owed. However, the title of an agreement does not control by itself. Its exact language, any protection period, the source of the buyer, prior broker involvement and state law can affect the result. Review your signed agreement and obtain legal advice before concluding that no commission is due.'
      },
      {
        id: 'existing-agent-agreement',
        category: 'Costs and commissions',
        question:
          'Can I use NavStreet if I already signed an agreement with an agent?',
        answer:
          'Possibly, but you must first review that agreement. An exclusive-right-to-sell agreement may require payment even when the owner finds the buyer. An exclusive-agency or open-listing agreement may operate differently. NavStreet does not cancel or override an existing brokerage contract. Ask the broker or a qualified real estate attorney to explain your obligations before advertising or accepting an offer independently.'
      },
      {
        id: 'buyer-agent',
        category: 'Costs and commissions',
        question:
          'What happens if the buyer has a real estate agent?',
        answer:
          'You can still consider an offer from a represented buyer. Any request for you to pay buyer-broker compensation should be clearly presented and evaluated as part of the offer. Compensation is negotiable; you may accept it, reject it or negotiate different terms. Make sure all compensation obligations are documented in writing and reviewed before you sign.'
      },
      {
        id: 'mls',
        category: 'Costs and commissions',
        question:
          'Does a NavStreet listing automatically place my home in the MLS?',
        answer:
          'No. Publishing on the NavStreet marketplace does not automatically mean that your property has been entered into a local Multiple Listing Service. MLS access generally requires a participating brokerage or a separate flat-fee MLS service. Do not advertise your property as MLS-listed unless it has actually been entered into the applicable MLS.'
      },
      {
        id: 'listing-content',
        category: 'Creating your listing',
        question:
          'What information do I need to create a listing?',
        answer:
          'You should be prepared to provide the property address, property type, bedroom and bathroom counts, square footage, year built, lot information, asking price, ownership details, a clear description and accurate photographs. Depending on the property and your state, you may also need association information, required disclosure forms and information about known material defects.'
      },
      {
        id: 'pricing',
        category: 'Creating your listing',
        question:
          'How should I determine my asking price?',
        answer:
          'Review recent comparable sales, current competing listings, property condition, improvements and local market activity. An asking price should be supported by the market rather than only by the amount you want to receive. If you are uncertain, consider ordering an appraisal or paying a qualified local professional for a pricing analysis without purchasing full-service representation.'
      },
      {
        id: 'disclosures',
        category: 'Creating your listing',
        question:
          'Am I responsible for property disclosures?',
        answer:
          'Yes. Selling without a traditional agent does not eliminate federal, state or local disclosure obligations. Required forms and deadlines vary by location and property type. Known defects and other material facts may need to be disclosed even when they are not obvious. Consult a qualified real estate attorney or the appropriate state agency if you are unsure what must be disclosed.'
      },
      {
        id: 'edit-listing',
        category: 'Creating your listing',
        question:
          'Can I update my listing after it is published?',
        answer:
          'Yes. NavStreet allows sellers to manage editable listing information, including the price, description and photographs. Certain core property facts may be protected after publication to preserve listing accuracy. If a protected fact is incorrect, contact NavStreet support so the correction can be reviewed.'
      },
      {
        id: 'featured-listing',
        category: 'Creating your listing',
        question:
          'What is a Featured Listing?',
        answer:
          'A Featured Listing is an optional promotional upgrade that gives an eligible property more prominent exposure within NavStreet. Featured placement can improve visibility, but it does not guarantee inquiries, offers, a particular sale price or a completed transaction.'
      },
      {
        id: 'buyer-contact',
        category: 'Buyers and offers',
        question:
          'How do interested buyers contact me?',
        answer:
          'Interested buyers can use NavStreet listing tools to submit an inquiry or request information. You can review listing activity from your account and decide how to respond. Keep important discussions and transaction records organized, and be cautious before sharing sensitive personal, financial or access information.'
      },
      {
        id: 'showings',
        category: 'Buyers and offers',
        question:
          'How should I handle property showings?',
        answer:
          'Confirm the visitor’s identity when practical, avoid showing the property alone if you feel unsafe, secure valuables and personal documents, and keep a record of appointments. Never provide unrestricted access to an unverified person. You may use a professional showing service if you prefer additional scheduling or access controls.'
      },
      {
        id: 'offer-received',
        category: 'Buyers and offers',
        question:
          'What should I do when I receive an offer?',
        answer:
          'Review more than the purchase price. Consider financing, earnest money, due-diligence or inspection provisions, appraisal requirements, requested repairs, seller-paid expenses, personal property, contingencies and the proposed closing date. You may accept, reject or counter an offer. A real estate attorney can help you understand the legal and financial effect before you sign.'
      },
      {
        id: 'proof-of-funds',
        category: 'Buyers and offers',
        question:
          'How do I know whether a buyer can complete the purchase?',
        answer:
          'For a financed purchase, request a current lender preapproval or other appropriate financing evidence. For a cash purchase, request reasonable proof of available funds. These documents reduce uncertainty but do not guarantee closing. Independently verify unfamiliar lenders, financial institutions and contact information before relying on a document.'
      },
      {
        id: 'contract',
        category: 'Contracts and closing',
        question:
          'Does NavStreet prepare the purchase contract?',
        answer:
          'NavStreet provides marketplace and transaction-management tools, but it is not a law firm and does not provide legal representation. Real estate contracts create significant legal obligations and differ by state. Use an appropriate state-specific agreement and strongly consider having a qualified real estate attorney prepare or review it before anyone signs.'
      },
      {
        id: 'earnest-money',
        category: 'Contracts and closing',
        question:
          'Should I personally hold the buyer’s earnest money?',
        answer:
          'Usually, using a properly authorized neutral holder is safer. Depending on state law and the contract, earnest money may be held by a closing attorney, title company, escrow company or licensed brokerage. Do not place transaction funds in a personal account without first confirming that doing so is lawful and consistent with the contract.'
      },
      {
        id: 'inspection-appraisal',
        category: 'Contracts and closing',
        question:
          'What happens during inspection and appraisal?',
        answer:
          'A buyer may inspect the property and request repairs, credits or other changes if the contract permits. A lender may also require an appraisal to evaluate the property’s value. Neither process automatically changes the contract. The parties must follow the deadlines and remedies contained in their signed agreement.'
      },
      {
        id: 'closing-professional',
        category: 'Contracts and closing',
        question:
          'Who handles the closing?',
        answer:
          'The closing may be handled by a real estate attorney, title company, escrow company or another authorized settlement professional, depending on state law and local practice. That professional coordinates documents, title work, loan funds, payoff information, recording and distribution of sale proceeds. Select the closing professional early enough to avoid unnecessary delays.'
      },
      {
        id: 'mortgage-payoff',
        category: 'Contracts and closing',
        question:
          'What happens to my current mortgage when I sell?',
        answer:
          'Your mortgage and other liens generally must be paid or otherwise resolved as part of closing. The settlement professional obtains payoff information and accounts for those obligations before distributing the remaining proceeds. Do not estimate your net proceeds using only the sale price and your approximate loan balance.'
      },
      {
        id: 'security',
        category: 'Safety and support',
        question:
          'How can I protect myself from real estate fraud?',
        answer:
          'Be suspicious of unexpected payment instructions, urgent wire requests, altered email addresses and anyone asking you to bypass normal closing procedures. Confirm wiring instructions through a trusted telephone number obtained independently. Never send money solely because of an email or text message, and do not provide passwords or one-time security codes to another person.'
      },
      {
        id: 'navstreet-guarantee',
        category: 'Safety and support',
        question:
          'Does NavStreet guarantee that my home will sell?',
        answer:
          'No marketplace, broker or advertising service can guarantee a sale, price or closing date. Results depend on pricing, condition, location, market demand, presentation, buyer qualification and contract terms. NavStreet gives you a more organized way to reach buyers and manage the process while keeping you in control.'
      },
      {
        id: 'navstreet-broker',
        category: 'Safety and support',
        question:
          'Is NavStreet my real estate broker, attorney or closing company?',
        answer:
          'No. Unless a specific service expressly states otherwise in a separate written agreement, NavStreet provides technology, marketplace access and educational information. It does not act as your real estate broker, attorney, lender, appraiser, inspector, title insurer or escrow agent.'
      },
      {
        id: 'support',
        category: 'Safety and support',
        question:
          'What if I need help using the platform?',
        answer:
          'Contact NavStreet support if you experience a technical problem, cannot access your listing or need help understanding how a platform feature works. For legal, tax, title, lending, property-condition or contract advice, contact a professional qualified to advise you in the state where the property is located.'
      }
    ];

  protected readonly categories:
    ReadonlyArray<FaqCategory> = [
      'Getting started',
      'Costs and commissions',
      'Creating your listing',
      'Buyers and offers',
      'Contracts and closing',
      'Safety and support'
    ];

  protected readonly filteredFaqItems = computed(() => {
    const searchTerm =
      this.searchTerm().trim().toLowerCase();

    if (!searchTerm) {
      return this.faqItems;
    }

    return this.faqItems.filter(item =>
      [
        item.category,
        item.question,
        item.answer
      ]
        .join(' ')
        .toLowerCase()
        .includes(searchTerm)
    );
  });

  protected updateSearchTerm(event: Event): void {
    const input =
      event.target as HTMLInputElement;

    this.searchTerm.set(input.value);
  }

  protected clearSearch(): void {
    this.searchTerm.set('');
  }

  protected getFaqItemsByCategory(
    category: FaqCategory
  ): ReadonlyArray<FaqItem> {
    return this.filteredFaqItems().filter(
      item => item.category === category
    );
  }
}