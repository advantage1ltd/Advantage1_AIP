// Types
export interface Customer {
  id: string;
  name: string;
  type: string;
}

export interface Store {
  id: string;
  name: string;
  address: string;
  region: string;
  customerId: string;
}

export interface Officer {
  id: string;
  name: string;
  role: string;
  badge: string;
}

export interface OfficerRole {
  id: string;
  name: string;
  level: number;
}

// Mock Data
export const MOCK_CUSTOMERS: Customer[] = [
  { id: '1', name: 'Central England COOP', type: 'Retail' },
  { id: '2', name: 'Midcounties COOP', type: 'Retail' },
  { id: '3', name: 'Heart of England COOP', type: 'Retail' },
  { id: '4', name: 'Tesco Express', type: 'Retail' },
  { id: '5', name: 'Sainsbury\'s Local', type: 'Retail' },
  { id: '6', name: 'ASDA', type: 'Retail' },
  { id: '7', name: 'Waitrose', type: 'Retail' },
  { id: '8', name: 'Co-op', type: 'Retail' },
];

export const MOCK_STORES: Store[] = Array.from(
  new Map([
    ...[
      // Central England COOP stores
      { id: '1', name: 'Anson Road Store', address: 'Leicester Central', region: 'Leicester Central', customerId: '1' },
      { id: '2', name: 'Cropston Drive Store', address: 'Leicester Central', region: 'Leicester Central', customerId: '1' },
      { id: '3', name: 'Fosse Park Store', address: 'Leicester Central', region: 'Leicester Central', customerId: '1' },
      { id: '4', name: 'Beaumont Leys Store', address: 'Leicester Central', region: 'Leicester Central', customerId: '1' },
      { id: '5', name: 'Thurmaston Store', address: 'Leicester Central', region: 'Leicester Central', customerId: '1' },
      { id: '6', name: 'Syston Store', address: 'Leicester Central', region: 'Leicester Central', customerId: '1' },
      { id: '7', name: 'Glenfield Store', address: 'Leicester Central', region: 'Leicester Central', customerId: '1' },
      { id: '8', name: 'Birstall Store', address: 'Leicester Central', region: 'Leicester Central', customerId: '1' },
      { id: '9', name: 'Ilkeston Store', address: 'Nottingham District', region: 'Nottingham District', customerId: '1' },
      { id: '10', name: 'Derby Road Store', address: 'Nottingham District', region: 'Nottingham District', customerId: '1' },
      { id: '11', name: 'Beeston Store', address: 'Nottingham District', region: 'Nottingham District', customerId: '1' },
      { id: '12', name: 'West Bridgford Store', address: 'Nottingham District', region: 'Nottingham District', customerId: '1' },
      // Midcounties COOP stores
      { id: '13', name: 'Warwick Main Store', address: 'Warwick Central', region: 'Warwick Central', customerId: '2' },
      { id: '14', name: 'Leamington Spa Store', address: 'Warwick Central', region: 'Warwick Central', customerId: '2' },
      { id: '15', name: 'Kenilworth Store', address: 'Warwick Central', region: 'Warwick Central', customerId: '2' },
      { id: '16', name: 'Stratford Store', address: 'Warwick Central', region: 'Warwick Central', customerId: '2' },
      { id: '17', name: 'Coventry City Store', address: 'Coventry District', region: 'Coventry District', customerId: '2' },
      { id: '18', name: 'Tile Hill Store', address: 'Coventry District', region: 'Coventry District', customerId: '2' },
      { id: '30', name: 'Henley-in-Arden Store', address: 'Henley-in-Arden', region: 'Warwickshire', customerId: '2' },
      { id: '31', name: 'Banbury Store', address: 'Banbury', region: 'Oxfordshire', customerId: '2' },
      { id: '32', name: 'Witney Store', address: 'Witney', region: 'Oxfordshire', customerId: '2' },
      { id: '33', name: 'Stratford-upon-Avon Store', address: 'Stratford-upon-Avon', region: 'Warwickshire', customerId: '2' },
      { id: '34', name: 'Chipping Norton Store', address: 'Chipping Norton', region: 'Oxfordshire', customerId: '2' },
      { id: '35', name: 'Evesham Store', address: 'Evesham', region: 'Worcestershire', customerId: '2' },
      { id: '36', name: 'Moreton-in-Marsh Store', address: 'Moreton-in-Marsh', region: 'Gloucestershire', customerId: '2' },
      { id: '37', name: 'Kidlington Store', address: 'Kidlington', region: 'Oxfordshire', customerId: '2' },
      { id: '38', name: 'Bicester Store', address: 'Bicester', region: 'Oxfordshire', customerId: '2' },
      { id: '39', name: 'Shipston-on-Stour Store', address: 'Shipston-on-Stour', region: 'Warwickshire', customerId: '2' },
      // Heart of England COOP stores
      { id: '19', name: 'Nuneaton High Street', address: 'Nuneaton Central', region: 'Nuneaton Central', customerId: '3' },
      { id: '20', name: 'Bedworth Store', address: 'Nuneaton Central', region: 'Nuneaton Central', customerId: '3' },
      { id: '21', name: 'Rugby Central Store', address: 'Rugby District', region: 'Rugby District', customerId: '3' },
      { id: '22', name: 'Dunchurch Store', address: 'Rugby District', region: 'Rugby District', customerId: '3' },
      { id: '40', name: 'Binley Woods Store', address: 'Binley Woods', region: 'Warwickshire', customerId: '3' },
      { id: '41', name: 'Nuneaton Store', address: 'Nuneaton', region: 'Warwickshire', customerId: '3' },
      { id: '42', name: 'Bedworth Store', address: 'Bedworth', region: 'Warwickshire', customerId: '3' },
      { id: '43', name: 'Rugby Store', address: 'Rugby', region: 'Warwickshire', customerId: '3' },
      { id: '44', name: 'Atherstone Store', address: 'Atherstone', region: 'Warwickshire', customerId: '3' },
      { id: '45', name: 'Coleshill Store', address: 'Coleshill', region: 'Warwickshire', customerId: '3' },
      { id: '46', name: 'Leamington Spa Store', address: 'Leamington Spa', region: 'Warwickshire', customerId: '3' },
      { id: '47', name: 'Bedworth Heath Store', address: 'Bedworth Heath', region: 'Warwickshire', customerId: '3' },
      { id: '48', name: 'Bulkington Store', address: 'Bulkington', region: 'Warwickshire', customerId: '3' },
      { id: '49', name: 'Attleborough Store', address: 'Attleborough', region: 'Warwickshire', customerId: '3' },
      // Original stores (assign to Tesco Express, Sainsbury's Local, etc. as appropriate)
      { id: '23', name: 'London Bridge Store', address: '123 London Bridge St, London', region: 'South', customerId: '4' },
      { id: '24', name: 'Manchester Central', address: '456 Market St, Manchester', region: 'North', customerId: '5' },
      { id: '25', name: 'Birmingham South', address: '789 High St, Birmingham', region: 'Midlands', customerId: '6' },
    ]
  ].map(store => [store.name, store])
).values()
);

export const MOCK_OFFICERS: Officer[] = [
  // Central England COOP officers
  { id: '1', name: 'John Smith', role: 'Security Officer', badge: 'SO001' },
  { id: '2', name: 'Emma Wilson', role: 'Security Officer', badge: 'SO002' },
  { id: '3', name: 'Mark Stevens', role: 'Senior Security Officer', badge: 'SO003' },
  { id: '4', name: 'Rachel Johnson', role: 'Security Officer', badge: 'SO004' },
  { id: '5', name: 'James Parker', role: 'Store Detective', badge: 'SO005' },
  { id: '6', name: 'Sophie Taylor', role: 'Security Officer', badge: 'SO006' },
  { id: '7', name: 'David Mitchell', role: 'Store Detective', badge: 'SO007' },
  { id: '8', name: 'Karen Edwards', role: 'Senior Security Officer', badge: 'SO008' },
  { id: '9', name: 'Simon Blake', role: 'Security Officer', badge: 'SO009' },
  { id: '10', name: 'Nicole Foster', role: 'Senior Store Detective', badge: 'SO010' },
  // Midcounties COOP officers
  { id: '11', name: 'Tom Wilson', role: 'Security Officer', badge: 'SO011' },
  { id: '12', name: 'Rachel Green', role: 'Senior Security Officer', badge: 'SO012' },
  { id: '13', name: 'Alex Johnson', role: 'Store Detective', badge: 'SO013' },
  { id: '14', name: 'Sarah Williams', role: 'Security Officer', badge: 'SO014' },
  { id: '15', name: 'Michael Brown', role: 'Senior Store Detective', badge: 'SO015' },
  // Heart of England COOP officers
  { id: '16', name: 'Chris Evans', role: 'Security Officer', badge: 'SO016' },
  { id: '17', name: 'Danny Murphy', role: 'Store Detective', badge: 'SO017' },
  { id: '18', name: 'Kelly Wright', role: 'Senior Security Officer', badge: 'SO018' },
  { id: '19', name: 'Amanda Clark', role: 'Security Officer', badge: 'SO019' },
  { id: '20', name: 'Robert Turner', role: 'Senior Store Detective', badge: 'SO020' },
  // Original officers
  { id: '21', name: 'Emma Brown', role: 'Senior Security Officer', badge: 'SO021' },
  { id: '22', name: 'David Clark', role: 'Security Officer', badge: 'SO022' },
  { id: '23', name: 'Alice Thompson', role: 'Security Supervisor', badge: 'SO023' },
  { id: '24', name: 'Mark Wilson', role: 'Security Officer', badge: 'SO024' },
  // Add all officer names from various data sources - update this as needed
  { id: '25', name: 'Sarah Johnson', role: 'Security Officer', badge: 'SO025' },
  { id: '26', name: 'Mike Davies', role: 'Senior Security Officer', badge: 'SO026' },
  { id: '27', name: 'Lisa Brown', role: 'Store Detective', badge: 'SO027' },
  { id: '28', name: 'Emma Thompson', role: 'Security Officer', badge: 'SO028' },
  { id: '29', name: 'James Carter', role: 'Security Officer', badge: 'SO029' },
  { id: '30', name: 'Sophie Davis', role: 'Senior Security Officer', badge: 'SO030' },
  { id: '31', name: 'Mark Roberts', role: 'Store Detective', badge: 'SO031' },
  { id: '32', name: 'Helen Taylor', role: 'Security Officer', badge: 'SO032' },
  { id: '33', name: 'Robert Jones', role: 'Security Officer', badge: 'SO033' },
  { id: '34', name: 'Laura Mitchell', role: 'Senior Security Officer', badge: 'SO034' },
  { id: '35', name: 'David Chen', role: 'Store Detective', badge: 'SO035' },
  { id: '36', name: 'Amy Rodriguez', role: 'Security Officer', badge: 'SO036' },
  { id: '37', name: 'Paul Anderson', role: 'Security Officer', badge: 'SO037' },
]

export const MOCK_OFFICER_ROLES: OfficerRole[] = [
  { id: '1', name: 'Store Detective', level: 1 },
  { id: '2', name: 'Uniform Officer', level: 1 },
]; 