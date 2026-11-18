import catalogData from '../../catalog.json'

export type Block = { day: number; start: number; end: number }
export type Preference = 'gaps' | 'days'
export type Schedule = {
  sections: Record<string, string>
  gap_minutes: number
  class_days: number
}
export type Request = { courses: string[]; unavailable: Block[]; preference: Preference }
export const staticDemo = import.meta.env.MODE === 'demo'
export const catalog = catalogData
export const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
export const example: Request = {
  courses: ['MAT101', 'INF110', 'FIS120', 'EST200'],
  unavailable: [],
  preference: 'gaps',
}

export const clock = (minutes: number) =>
  [Math.floor(minutes / 60), minutes % 60].map(n => String(n).padStart(2, '0')).join(':')

export function gapLabel(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return [hours ? hours + ' h' : '', remainder || !hours ? remainder + ' min' : ''].filter(Boolean).join(' ')
}

export async function generate(request: Request, signal: AbortSignal): Promise<Schedule[]> {
  if (staticDemo) {
    const { demoSchedules } = await import('./demo')
    return demoSchedules(request)
  }
  const response = await fetch('/api/schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal,
  })
  if (!response.ok) throw new Error('La API no pudo generar los horarios.')
  return response.json()
}
