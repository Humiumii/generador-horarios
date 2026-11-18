import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Calendar } from './Calendar'
import { catalog, clock, days, example, gapLabel, generate, staticDemo } from './schedule'
import type { Request, Schedule } from './schedule'

function minutes(time: string) {
  const [hours, mins] = time.split(':').map(Number)
  return hours * 60 + mins
}

export function App() {
  const [draft, setDraft] = useState<Request>(example)
  const [applied, setApplied] = useState({ request: example, revision: 0 })
  const [results, setResults] = useState<Schedule[]>([])
  const [active, setActive] = useState(0)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [day, setDay] = useState(0)
  const [start, setStart] = useState('09:00')
  const [end, setEnd] = useState('10:30')
  const [blockError, setBlockError] = useState('')
  const resultHeading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const controller = new AbortController()
    generate(applied.request, controller.signal).then(setResults).catch(() => {
      if (!controller.signal.aborted) setFailed(true)
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [applied])

  function run() {
    setLoading(true)
    setFailed(false)
    setActive(0)
    setApplied(previous => ({ request: draft, revision: previous.revision + 1 }))
    resultHeading.current?.focus()
  }

  function addBlock(event: FormEvent) {
    event.preventDefault()
    const block = { day, start: minutes(start), end: minutes(end) }
    if (block.start >= block.end) {
      setBlockError('El término debe ser posterior al inicio.')
      return
    }
    if (draft.unavailable.some(item => item.day === day && item.start === block.start && item.end === block.end)) {
      setBlockError('Ese bloque ya está agregado.')
      return
    }
    if (draft.unavailable.length >= 100) {
      setBlockError('Puedes agregar hasta 100 bloques ocupados.')
      return
    }
    setDraft({ ...draft, unavailable: [...draft.unavailable, block] })
    setBlockError('')
  }

  function toggleCourse(id: string) {
    const courses = draft.courses.includes(id)
      ? draft.courses.filter(course => course !== id)
      : [...draft.courses, id]
    setDraft({ ...draft, courses })
  }

  const current = results[active]
  return (
    <>
      <header className="top"><div className="top-inner">
        <div className="brand"><span className="mark" aria-hidden="true"><i /><i /><i /><i /></span>Cuadra</div>
        <span>{staticDemo ? 'Demo de ejemplo · catálogo ficticio' : 'Planificador universitario'}</span>
      </div></header>
      <main>
        <div className="intro">
          <h1>Arma tu horario</h1>
          <p>Elige tus ramos, reserva tus horas ocupadas y compara alternativas sin choques.</p>
        </div>
        <div className="workspace">
          <aside className="settings" aria-label="Configura tu horario">
            <section className="setting">
              <div className="setting-heading"><h2>Ramos</h2><span>{draft.courses.length} de {catalog.length}</span></div>
              <div className="courses">
                {catalog.map((course, index) => (
                  <label key={course.id} className="course">
                    <input type="checkbox" checked={draft.courses.includes(course.id)}
                      onChange={() => toggleCourse(course.id)} />
                    <span className={'swatch color-' + index} aria-hidden="true" />
                    <span>{course.name}<small>{course.id}</small></span>
                  </label>
                ))}
              </div>
            </section>
            <section className="setting">
              <div className="setting-heading"><h2>Horas ocupadas</h2><span>{draft.unavailable.length}</span></div>
              <form className="block-form" onSubmit={addBlock}>
                <label className="full"><span id="busy-day">Día</span><select aria-labelledby="busy-day" value={day} onChange={e => setDay(Number(e.target.value))}>
                  {days.map((name, index) => <option key={name} value={index}>{name}</option>)}
                </select></label>
                <label>Desde<input required type="time" value={start} onChange={e => setStart(e.target.value)} /></label>
                <label>Hasta<input required type="time" value={end} onChange={e => setEnd(e.target.value)} /></label>
                <button className="outline full" type="submit">+ Agregar bloque</button>
              </form>
              {blockError && <p className="block-error" role="alert">{blockError}</p>}
              {draft.unavailable.length > 0 && <ul className="busy-list">
                {draft.unavailable.map((block, index) => {
                  const label = days[block.day] + ' ' + clock(block.start) + '–' + clock(block.end)
                  return <li key={label}>
                    {label}
                    <button type="button" aria-label={'Quitar ' + label} onClick={() => {
                      setDraft({ ...draft, unavailable: draft.unavailable.filter((_, i) => i !== index) })
                      setBlockError('')
                    }}>×</button>
                  </li>
                })}
              </ul>}
            </section>
            <fieldset className="setting preference">
              <legend>Preferencia</legend>
              <label><input type="radio" name="preference" checked={draft.preference === 'gaps'}
                onChange={() => setDraft({ ...draft, preference: 'gaps' })} /> Menos ventanas</label>
              <label><input type="radio" name="preference" checked={draft.preference === 'days'}
                onChange={() => setDraft({ ...draft, preference: 'days' })} /> Menos días con clases</label>
            </fieldset>
            <div className="actions">
              <button className="primary" disabled={!draft.courses.length || loading} onClick={run}>Generar horarios</button>
              {!draft.courses.length && <p>Selecciona al menos un ramo.</p>}
            </div>
          </aside>
          <section className="results" aria-labelledby="result-heading" aria-busy={loading}>
            <div className="result-heading">
              <h2 id="result-heading" tabIndex={-1} ref={resultHeading}>Alternativas</h2>
              <span>{applied.request.preference === 'gaps' ? 'Ordenadas por ventanas' : 'Ordenadas por días'}</span>
            </div>
            {draft !== applied.request && <p className="pending">Genera horarios para aplicar tus cambios.</p>}
            {loading ? <div className="empty" role="status">Generando horarios…</div>
              : failed ? <div className="empty" role="alert"><h3>No se pudo conectar con el motor</h3>
                <p>Comprueba que la API esté disponible y vuelve a generar.</p></div>
              : !current ? <div className="empty" role="status"><h3>No hay horarios sin choques</h3>
                <p>Revisa los ramos seleccionados o quita algún bloque ocupado y vuelve a generar.</p></div>
              : <>
                <div className="alternatives" role="group" aria-label="Comparar alternativas">
                  {results.map((item, index) => <button key={index} onClick={() => setActive(index)}
                    aria-pressed={index === active}>
                    <strong>Opción {index + 1}</strong>
                    <span>{item.class_days} {item.class_days === 1 ? 'día' : 'días'} con clases</span>
                    <span>{gapLabel(item.gap_minutes)} de ventanas</span>
                  </button>)}
                </div>
                <Calendar schedule={current} busy={applied.request.unavailable} />
              </>}
          </section>
        </div>
      </main>
    </>
  )
}
