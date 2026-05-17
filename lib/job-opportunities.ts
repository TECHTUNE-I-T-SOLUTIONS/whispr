export const OPPORTUNITY_TYPES = [
  { value: 'job', label: 'Job' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'internship', label: 'Internship' },
  { value: 'grant', label: 'Grant' },
  { value: 'residency', label: 'Residency' },
  { value: 'competition', label: 'Competition' },
  { value: 'commission', label: 'Commission' },
  { value: 'call_for_submissions', label: 'Call for Submissions' },
  { value: 'volunteer', label: 'Volunteer' },
]

export const REMOTE_TYPES = [
  { value: 'any', label: 'Any' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' },
]

export const SORT_OPTIONS = [
  { value: 'latest', label: 'Latest' },
  { value: 'featured', label: 'Featured first' },
  { value: 'deadline', label: 'Deadline soonest' },
  { value: 'oldest', label: 'Oldest' },
]

export function splitMultilineValues(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function joinMultilineValues(value: string[] | null | undefined) {
  return (value || []).join('\n')
}

export function formatOpportunityType(value?: string | null) {
  return OPPORTUNITY_TYPES.find((option) => option.value === value)?.label || 'Job'
}

export function formatRemoteType(value?: string | null) {
  return REMOTE_TYPES.find((option) => option.value === value)?.label || 'Any'
}

export function formatJobDeadline(value?: string | null) {
  if (!value) return 'Flexible deadline'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Flexible deadline'

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}