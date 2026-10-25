export interface StateConfiguration {
  abbreviation: string;
  isActive: boolean;
  name: string;
  slug: string;
}

export const STATES: readonly StateConfiguration[] = [
  { abbreviation: 'AL', isActive: true, name: 'Alabama', slug: 'alabama' },
  { abbreviation: 'AK', isActive: false, name: 'Alaska', slug: 'alaska' },
  { abbreviation: 'AZ', isActive: true, name: 'Arizona', slug: 'arizona' },
  { abbreviation: 'AR', isActive: true, name: 'Arkansas', slug: 'arkansas' },
  { abbreviation: 'CA', isActive: true, name: 'California', slug: 'california' },
  { abbreviation: 'CO', isActive: true, name: 'Colorado', slug: 'colorado' },
  { abbreviation: 'CT', isActive: false, name: 'Connecticut', slug: 'connecticut' },
  { abbreviation: 'DE', isActive: true, name: 'Delaware', slug: 'delaware' },
  { abbreviation: 'FL', isActive: true, name: 'Florida', slug: 'florida' },
  { abbreviation: 'GA', isActive: true, name: 'Georgia', slug: 'georgia' },
  { abbreviation: 'HI', isActive: false, name: 'Hawaii', slug: 'hawaii' },
  { abbreviation: 'ID', isActive: true, name: 'Idaho', slug: 'idaho' },
  { abbreviation: 'IL', isActive: true, name: 'Illinois', slug: 'illinois' },
  { abbreviation: 'IN', isActive: true, name: 'Indiana', slug: 'indiana' },
  { abbreviation: 'IA', isActive: true, name: 'Iowa', slug: 'iowa' },
  { abbreviation: 'KS', isActive: true, name: 'Kansas', slug: 'kansas' },
  { abbreviation: 'KY', isActive: true, name: 'Kentucky', slug: 'kentucky' },
  { abbreviation: 'LA', isActive: true, name: 'Louisiana', slug: 'louisiana' },
  { abbreviation: 'ME', isActive: true, name: 'Maine', slug: 'maine' },
  { abbreviation: 'MD', isActive: true, name: 'Maryland', slug: 'maryland' },
  { abbreviation: 'MA', isActive: false, name: 'Massachusetts', slug: 'massachusetts' },
  { abbreviation: 'MI', isActive: true, name: 'Michigan', slug: 'michigan' },
  { abbreviation: 'MN', isActive: true, name: 'Minnesota', slug: 'minnesota' },
  { abbreviation: 'MS', isActive: true, name: 'Mississippi', slug: 'mississippi' },
  { abbreviation: 'MO', isActive: true, name: 'Missouri', slug: 'missouri' },
  { abbreviation: 'MT', isActive: true, name: 'Montana', slug: 'montana' },
  { abbreviation: 'NE', isActive: true, name: 'Nebraska', slug: 'nebraska' },
  { abbreviation: 'NV', isActive: true, name: 'Nevada', slug: 'nevada' },
  { abbreviation: 'NH', isActive: true, name: 'New Hampshire', slug: 'new-hampshire' },
  { abbreviation: 'NJ', isActive: false, name: 'New Jersey', slug: 'new-jersey' },
  { abbreviation: 'NM', isActive: true, name: 'New Mexico', slug: 'new-mexico' },
  { abbreviation: 'NY', isActive: false, name: 'New York', slug: 'new-york' },

  { abbreviation: 'NC', isActive: true, name: 'North Carolina', slug: 'north-carolina' },

  { abbreviation: 'ND', isActive: true, name: 'North Dakota', slug: 'north-dakota' },
  { abbreviation: 'OH', isActive: true, name: 'Ohio', slug: 'ohio' },
  { abbreviation: 'OK', isActive: true, name: 'Oklahoma', slug: 'oklahoma' },
  { abbreviation: 'OR', isActive: true, name: 'Oregon', slug: 'oregon' },
  { abbreviation: 'PA', isActive: true, name: 'Pennsylvania', slug: 'pennsylvania' },
  { abbreviation: 'RI', isActive: true, name: 'Rhode Island', slug: 'rhode-island' },
  { abbreviation: 'SC', isActive: true, name: 'South Carolina', slug: 'south-carolina' },
  { abbreviation: 'SD', isActive: true, name: 'South Dakota', slug: 'south-dakota' },
  { abbreviation: 'TN', isActive: true, name: 'Tennessee', slug: 'tennessee' },
  { abbreviation: 'TX', isActive: true, name: 'Texas', slug: 'texas' },
  { abbreviation: 'UT', isActive: true, name: 'Utah', slug: 'utah' },
  { abbreviation: 'VT', isActive: false, name: 'Vermont', slug: 'vermont' },
  { abbreviation: 'VA', isActive: false, name: 'Virginia', slug: 'virginia' },
  { abbreviation: 'WA', isActive: true, name: 'Washington', slug: 'washington' },
  { abbreviation: 'WV', isActive: true, name: 'West Virginia', slug: 'west-virginia' },
  { abbreviation: 'WI', isActive: true, name: 'Wisconsin', slug: 'wisconsin' },
  { abbreviation: 'WY', isActive: true, name: 'Wyoming', slug: 'wyoming' }
];
