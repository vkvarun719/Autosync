export interface User {
  id: string
  email: string
  name: string
  rollId: string
  gender: string
  defaultUpiId?: string | null
  emergencyContact?: string | null
  collegeName?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface Hub {
  id: string
  name: string
  type: string
  lat: number
  lng: number
}

export interface Destination {
  id: string
  name: string
  lat: number
  lng: number
}

export interface PoolMember {
  id: string
  poolId: string
  userId: string
  status: string // JOINED, PAID, LEFT
  shareAmt?: number | null
  joinedAt: string
  paidAt?: string | null
  quickStatus?: string | null
  user: User
}

export interface Pool {
  id: string
  hubId: string
  destinationId: string
  vehicleType: 'AUTO' | 'CAB'
  womenOnly: boolean
  status: string // WAITING, ACTIVE, COMPLETED, CANCELLED
  maxSeats: number
  seatsAvailable: number
  leadId?: string | null
  totalFare?: number | null
  splitType?: string | null // EQUAL, PROPORTIONAL
  vehicleNumber?: string | null
  sosTriggered: boolean
  createdAt: string
  updatedAt: string
  expiresAt: string
  hub: Hub
  destination: Destination
  lead?: User | null
  members: PoolMember[]
}

export interface StatusUpdate {
  id: string
  poolId: string
  userId: string
  message: string
  createdAt: string
}
