export interface LocationPoint {
  id: string
  name: string
  area: string
  lat: number
  lng: number
  type: 'METRO' | 'JUNCTION' | 'SUBURB'
}

export const DESTINATION_RVITM: LocationPoint = {
  id: 'rvitm',
  name: 'RVITM (R V Institute of Technology and Management)',
  area: 'JP Nagar 8th Phase / Kothanur, Bengaluru',
  lat: 12.8731,
  lng: 77.5789,
  type: 'JUNCTION'
}

export const PICKUP_LOCATIONS: LocationPoint[] = [
  {
    id: 'konanakunte-cross',
    name: 'Konanakunte Cross Metro Station',
    area: 'Green Line Metro, Kanakapura Road',
    lat: 12.8850,
    lng: 77.5730,
    type: 'METRO'
  },
  {
    id: 'gottigere',
    name: 'Gottigere',
    area: 'Bannerghatta Road',
    lat: 12.8564,
    lng: 77.5888,
    type: 'SUBURB'
  },
  {
    id: 'jp-nagar-6th-phase',
    name: 'JP Nagar 6th Phase',
    area: 'Ring Road / Puttenahalli',
    lat: 12.9082,
    lng: 77.5804,
    type: 'JUNCTION'
  },
  {
    id: 'anjanapura',
    name: 'Anjanapura',
    area: 'Anjanapura 80ft Road',
    lat: 12.8567,
    lng: 77.5525,
    type: 'SUBURB'
  },
  {
    id: 'yelchenahalli',
    name: 'Yelchenahalli',
    area: 'Yelachenahalli Metro Station',
    lat: 12.8960,
    lng: 77.5702,
    type: 'METRO'
  },
  {
    id: 'bannerghatta',
    name: 'Bannerghatta',
    area: 'Bannerghatta Circle / Village',
    lat: 12.8121,
    lng: 77.5842,
    type: 'SUBURB'
  }
]

export function getLocationById(id: string): LocationPoint | undefined {
  return PICKUP_LOCATIONS.find((loc) => loc.id === id)
}
