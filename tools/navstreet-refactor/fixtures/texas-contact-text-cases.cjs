const cases=[];
for(const [role,prefix]of [['buyer','buyerNotice'],['seller','sellerNotice'],['buyerAgent','buyerAgent'],['sellerAgent','sellerAgent']])
 for(const [key,suffix]of [['addressLine1','AddressLine1'],['addressLine2','AddressLine2'],['email','Email']])
  cases.push({id:role+'-'+key,parts:['notices',role,key],fieldKey:prefix+suffix});
for(const role of ['buyer','seller'])for(const key of ['name','email'])
 cases.push({id:role+'-attorney-'+key,parts:['attorneys',role+'Attorney',key],fieldKey:role+'Attorney'+(key==='name'?'Name':'Email')});
module.exports=cases;
