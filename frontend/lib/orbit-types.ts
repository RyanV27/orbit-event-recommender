export type PersonCategory =
  | 'customer'
  | 'investor'
  | 'founder'
  | 'operator'
  | 'mentor'
  | 'hire'

export type Person = {
  id: string
  name: string
  role: string
  company: string
  neighborhood: string
  category: PersonCategory
  tags: string[]
  matchScore: number
  why: string
  signal: string
  openTo: string
}

export type OrbitEvent = {
  id: string
  name: string
  source: 'Luma' | 'Eventbrite' | 'Partiful'
  date: string
  venue: string
  why: string
  matchesAttending: number
  attendees?: string[]
}

export type Profile = {
  background: string
  startup: string
  stage: string
  goals: string[]
  preferences: string[]
}

export type SignalKind = 'liked' | 'passed' | 'feedback' | 'context'

export type Signal = {
  id: string
  kind: SignalKind
  text: string
  at: number
}

export type Memory = {
  profile: Profile | null
  signals: Signal[]
  sessions: number
  cities: string[]
}

export type RecommendResponse = {
  people: Person[]
  events: OrbitEvent[]
  profile: Profile
}

export const GOAL_OPTIONS = [
  'Customers',
  'Design partners',
  'Fundraising',
  'Cofounder',
  'Early hires',
  'Mentors',
] as const
