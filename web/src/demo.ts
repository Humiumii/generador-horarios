import { catalog } from './schedule'
import type { Block, Request, Schedule } from './schedule'

const overlaps = (a: Block, b: Block) =>
  a.day === b.day && a.start < b.end && b.start < a.end

function metrics(blocks: Block[]) {
  const byDay = new Map<number, Block[]>()
  for (const block of blocks) {
    const day = byDay.get(block.day)
    if (day) day.push(block)
    else byDay.set(block.day, [block])
  }
  let gapMinutes = 0
  for (const day of byDay.values()) {
    day.sort((a, b) => a.start - b.start)
    for (let i = 1; i < day.length; i++) {
      gapMinutes += day[i].start - day[i - 1].end
    }
  }
  return { gap_minutes: gapMinutes, class_days: byDay.size }
}

export function demoSchedules(request: Request): Schedule[] {
  const courses = catalog.filter(course => request.courses.includes(course.id))
  const results: Schedule[] = []
  if (!courses.length) return results

  function visit(index: number, blocks: Block[], sections: Schedule['sections']) {
    if (index === courses.length) {
      results.push({ sections, ...metrics(blocks) })
      return
    }

    const course = courses[index]
    for (const section of course.sections) {
      const conflicts = section.blocks.some(block =>
        request.unavailable.some(busy => overlaps(block, busy)) ||
        blocks.some(other => overlaps(block, other)),
      )
      if (!conflicts) {
        visit(index + 1, [...blocks, ...section.blocks], { ...sections, [course.id]: section.id })
      }
    }
  }

  visit(0, [], {})
  results.sort((a, b) => request.preference === 'gaps'
    ? a.gap_minutes - b.gap_minutes || a.class_days - b.class_days
    : a.class_days - b.class_days || a.gap_minutes - b.gap_minutes)
  return results.slice(0, 5)
}
