/** Existing published-listing edit labels and order; separate from creation questions. */
export const COLORADO_LISTING_EDIT_FIELDS = [
    ['includedItems','Additional included items and garage remotes'],['excludedItems','Excluded items'],
    ['leasedItems','Leased equipment'],['encumberedItems','Equipment debt or PACE obligation'],
    ['solarPowerPlan','Solar power purchase plan'],['parkingStorage','Parking and storage rights'],
    ['waterSource','Potable water source (required)'],['deededWaterRights','Deeded water rights'],
    ['otherWaterRights','Other water rights'],['wellPermit','Well and permit'],['waterStock','Water stock'],
    ['mineralRights','Mineral interests'],['offRecordMatters','Off-record matters and existing surveys'],
    ['thirdPartyRights','Third-party purchase or approval rights'],['leases','Continuing occupancy agreements'],

  ].map(([key,label]) => ({key,label}));
