// Simple static dataset for first responder locations.
// Each item: { type: 'police'|'fire'|'hospital'|'shelter', name, lat, lng, address, phone }
const STATIC_RESPONDERS = [
  { type: 'police', name: 'Dallas Police Department', lat: 32.7763, lng: -96.7969, address: '1400 S Lamar St, Dallas, TX', phone: '(214) 671-3001' },
  { type: 'fire', name: 'Dallas Fire Station 4', lat: 32.7779, lng: -96.8060, address: '816 S Akard St, Dallas, TX', phone: '(214) 670-0319' },
  { type: 'hospital', name: 'UT Southwestern Medical Center', lat: 32.8100, lng: -96.8366, address: '5323 Harry Hines Blvd, Dallas, TX', phone: '(214) 648-3111' },
  { type: 'shelter', name: 'Kay Bailey Hutchison Convention Center Shelter', lat: 32.7733, lng: -96.8015, address: '650 S Griffin St, Dallas, TX', phone: '(214) 939-2700' },

  { type: 'police', name: 'LAPD Central Community Station', lat: 34.0505, lng: -118.2425, address: '251 E 6th St, Los Angeles, CA', phone: '(213) 486-6606' },
  { type: 'fire', name: 'LAFD Fire Station 3', lat: 34.0537, lng: -118.2468, address: '108 N Fremont Ave, Los Angeles, CA', phone: '(213) 485-6203' },
  { type: 'hospital', name: 'LAC+USC Medical Center', lat: 34.0619, lng: -118.2058, address: '2051 Marengo St, Los Angeles, CA', phone: '(323) 409-1000' },
  { type: 'shelter', name: 'LA Emergency Shelter - Downtown', lat: 34.0484, lng: -118.2509, address: 'Downtown, Los Angeles, CA', phone: '(213) 555-0100' },

  { type: 'police', name: 'NYPD 1st Precinct', lat: 40.7200, lng: -74.0062, address: '16 Ericsson Pl, New York, NY', phone: '(212) 334-0611' },
  { type: 'fire', name: 'FDNY Engine 7/Ladder 1', lat: 40.7136, lng: -74.0067, address: '100 Duane St, New York, NY', phone: '(212) 628-2900' },
  { type: 'hospital', name: 'NY-Presbyterian Lower Manhattan', lat: 40.7133, lng: -74.0072, address: '170 William St, New York, NY', phone: '(212) 312-5000' },
  { type: 'shelter', name: 'NYC Emergency Shelter - Lower Manhattan', lat: 40.7115, lng: -74.0100, address: 'Lower Manhattan, NY', phone: '(212) 555-0133' },

  { type: 'police', name: 'Chicago Police Department - 1st District', lat: 41.8722, lng: -87.6278, address: '1718 S State St, Chicago, IL', phone: '(312) 745-4290' },
  { type: 'fire', name: 'Chicago Fire Dept Engine 1', lat: 41.8823, lng: -87.6200, address: '419 S Wells St, Chicago, IL', phone: '(312) 744-5000' },
  { type: 'hospital', name: 'Northwestern Memorial Hospital', lat: 41.8947, lng: -87.6205, address: '251 E Huron St, Chicago, IL', phone: '(312) 926-2000' },
  { type: 'shelter', name: 'Chicago Emergency Shelter - Loop', lat: 41.8785, lng: -87.6292, address: 'The Loop, Chicago, IL', phone: '(312) 555-0199' },
];

export async function fetchFirstResponders() {
  // Placeholder for future API integration. For now, return static dataset.
  return STATIC_RESPONDERS;
}


