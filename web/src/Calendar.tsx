import { useState } from 'react'
import type { CSSProperties } from 'react'
import { catalog, clock, days } from './schedule'
import type { Block, Schedule } from './schedule'

export function Calendar({ schedule, busy }: { schedule: Schedule; busy: Block[] }) {
  const [mobileDay, setMobileDay] = useState(0)
  const classes = catalog.flatMap((course, color) => {
    const section = course.sections.find(item => item.id === schedule.sections[course.id])
    return section?.blocks.map(block => ({ ...block, course, section: section.id, color })) ?? []
  })
  const start = 480
  const end = 1020
  const hours = Array.from({ length: (end - start) / 60 }, (_, i) => start + 60 * i)
  const position = (block: Block): CSSProperties => ({
    top: ((Math.max(block.start, start) - start) / (end - start)) * 100 + '%',
    height: ((Math.min(block.end, end) - Math.max(block.start, start)) / (end - start)) * 100 + '%',
  })
  return (
    <>
      <div className="day-switch" aria-label="Día visible" role="group">
        {days.map((day, index) => (
          <button key={day} aria-label={day} aria-pressed={index === mobileDay}
            onClick={() => setMobileDay(index)}>{day.slice(0, 3)}</button>
        ))}
      </div>
      <div className="calendar" aria-label="Grilla semanal">
        <div className="hour-column" aria-hidden="true">
          <div className="day-name">Hora</div>
          <div className="hour-body">{hours.map(hour => <div key={hour}>{clock(hour)}</div>)}</div>
        </div>
        {days.map((day, index) => (
          <section className={'day-column' + (index === mobileDay ? ' mobile-active' : '')} key={day}>
            <h3 className="day-name">{day}</h3>
            <div className="day-body">
              {busy.map((block, id) => block.day === index && block.end > start && block.start < end && (
                <div className="busy-event" key={id} style={position(block)}
                  title={clock(block.start) + '–' + clock(block.end)} aria-label="Ocupado" />
              ))}
              {classes.filter(block => block.day === index).sort((a, b) => a.start - b.start).map(block => (
                <div key={block.course.id + '/' + block.start} style={position(block)} className="event">
                  <div className={'event-inner color-' + block.color}>
                    <strong>{block.course.name}</strong>
                    <span>{clock(block.start)}–{clock(block.end)}</span>
                    <small>Sección {block.section}</small>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
      <p className="calendar-note">Grilla de 08:00 a 17:00 · los bloques rayados indican horas ocupadas.</p>
    </>
  )
}

