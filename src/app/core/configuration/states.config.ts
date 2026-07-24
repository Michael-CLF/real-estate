export interface StateConfiguration {
  abbreviation: string;
  isActive: boolean;
  name: string;
  slug: string;
}

export const STATES: readonly StateConfiguration[] = [
  { abbreviation: 'AL', isActive: false, name: 'Alabama', slug: 'alabama' },
  { abbreviation: 'AK', isActive: false, name: 'Alaska', slug: 'alaska' },
  { abbreviation: 'AZ', isActive: false, name: 'Arizona', slug: 'arizona' },
  { abbreviation: 'AR', isActive: false, name: 'Arkansas', slug: 'arkansas' },
  { abbreviation: 'CA', isActive: false, name: 'California', slug: 'california' },
  { abbreviation: 'CO', isActive: false, name: 'Colorado', slug: 'colorado' },
  { abbreviation: 'CT', isActive: false, name: 'Connecticut', slug: 'connecticut' },
  { abbreviation: 'DE', isActive: false, name: 'Delaware', slug: 'delaware' },
  { abbreviation: 'FL', isActive: false, name: 'Florida', slug: 'florida' },
  { abbreviation: 'GA', isActive: false, name: 'Georgia', slug: 'georgia' },
  { abbreviation: 'HI', isActive: false, name: 'Hawaii', slug: 'hawaii' },
  { abbreviation: 'ID', isActive: false, name: 'Idaho', slug: 'idaho' },
  { abbreviation: 'IL', isActive: false, name: 'Illinois', slug: 'illinois' },
  { abbreviation: 'IN', isActive: false, name: 'Indiana', slug: 'indiana' },
  { abbreviation: 'IA', isActive: false, name: 'Iowa', slug: 'iowa' },
  { abbreviation: 'KS', isActive: false, name: 'Kansas', slug: 'kansas' },
  { abbreviation: 'KY', isActive: false, name: 'Kentucky', slug: 'kentucky' },
  { abbreviation: 'LA', isActive: false, name: 'Louisiana', slug: 'louisiana' },
  { abbreviation: 'ME', isActive: false, name: 'Maine', slug: 'maine' },
  { abbreviation: 'MD', isActive: false, name: 'Maryland', slug: 'maryland' },
  { abbreviation: 'MA', isActive: false, name: 'Massachusetts', slug: 'massachusetts' },
  { abbreviation: 'MI', isActive: false, name: 'Michigan', slug: 'michigan' },
  { abbreviation: 'MN', isActive: false, name: 'Minnesota', slug: 'minnesota' },
  { abbreviation: 'MS', isActive: false, name: 'Mississippi', slug: 'mississippi' },
  { abbreviation: 'MO', isActive: false, name: 'Missouri', slug: 'missouri' },
  { abbreviation: 'MT', isActive: false, name: 'Montana', slug: 'montana' },
  { abbreviation: 'NE', isActive: false, name: 'Nebraska', slug: 'nebraska' },
  { abbreviation: 'NV', isActive: false, name: 'Nevada', slug: 'nevada' },
  { abbreviation: 'NH', isActive: false, name: 'New Hampshire', slug: 'new-hampshire' },
  { abbreviation: 'NJ', isActive: false, name: 'New Jersey', slug: 'new-jersey' },
  { abbreviation: 'NM', isActive: false, name: 'New Mexico', slug: 'new-mexico' },
  { abbreviation: 'NY', isActive: false, name: 'New York', slug: 'new-york' },

  { abbreviation: 'NC', isActive: true, name: 'North Carolina', slug: 'north-carolina' },

  { abbreviation: 'ND', isActive: false, name: 'North Dakota', slug: 'north-dakota' },
  { abbreviation: 'OH', isActive: false, name: 'Ohio', slug: 'ohio' },
  { abbreviation: 'OK', isActive: false, name: 'Oklahoma', slug: 'oklahoma' },
  { abbreviation: 'OR', isActive: false, name: 'Oregon', slug: 'oregon' },
  { abbreviation: 'PA', isActive: false, name: 'Pennsylvania', slug: 'pennsylvania' },
  { abbreviation: 'RI', isActive: false, name: 'Rhode Island', slug: 'rhode-island' },
  { abbreviation: 'SC', isActive: false, name: 'South Carolina', slug: 'south-carolina' },
  { abbreviation: 'SD', isActive: false, name: 'South Dakota', slug: 'south-dakota' },
  { abbreviation: 'TN', isActive: false, name: 'Tennessee', slug: 'tennessee' },
  { abbreviation: 'TX', isActive: false, name: 'Texas', slug: 'texas' },
  { abbreviation: 'UT', isActive: false, name: 'Utah', slug: 'utah' },
  { abbreviation: 'VT', isActive: false, name: 'Vermont', slug: 'vermont' },
  { abbreviation: 'VA', isActive: false, name: 'Virginia', slug: 'virginia' },
  { abbreviation: 'WA', isActive: false, name: 'Washington', slug: 'washington' },
  { abbreviation: 'WV', isActive: false, name: 'West Virginia', slug: 'west-virginia' },
  { abbreviation: 'WI', isActive: false, name: 'Wisconsin', slug: 'wisconsin' },
  { abbreviation: 'WY', isActive: false, name: 'Wyoming', slug: 'wyoming' }
];