import { useEffect, useState } from 'react'
import { PILLARS, STATUSES, CONTENT_TYPES } from '../lib/constants'

const METRICS = [
  { key: 'views', label: 'Views' },
  { key: 'likes', label: 'Likes' },
  { key: 'comments', label: 'Comments' },
  { key: 'reposts', label: 'Reposts' },
  { key: 'shares', label: 'Shares' },
]

function today() {
  return new Date().toISOString().slice(0, 10)
}

function emptyForm() {
  return {
    date: today(),
    pillar: PILLARS[0],
    content: '',
    status: 'Published',
    link: '',
    contentType: 'Text',
    views: '',
    likes: '',
    comments: '',
    reposts: '',
    shares: '',
  }
}

/**
 * Modal form for logging or editing a post. `initial` (a post) puts it in
 * edit mode; omit it to create. `onSave(values)` receives the raw form.
 */
export default function LogPostModal({ open, initial, onSave, onClose }) {
  const [form, setForm] = useState(emptyForm())
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...emptyForm(), ...initial } : emptyForm())
      setErrors({})
    }
  }, [open, initial])

  // Close on Escape.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  function validate() {
    const e = {}
    if (!form.date) e.date = 'Date is required'
    if (!form.content.trim()) e.content = 'Content is required'
    if (!form.pillar) e.pillar = 'Pillar is required'
    if (form.link && !/^https?:\/\//i.test(form.link.trim())) e.link = 'Must start with http(s)://'
    for (const m of METRICS) {
      const v = form[m.key]
      if (v !== '' && (Number.isNaN(Number(v)) || Number(v) < 0)) e[m.key] = 'Invalid'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function submit(ev) {
    ev.preventDefault()
    if (!validate()) return
    onSave({
      ...form,
      content: form.content.trim(),
      link: form.link.trim(),
    })
  }

  const isEdit = Boolean(initial)

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={isEdit ? 'Edit post' : 'Log a post'}>
        <div className="modal__head">
          <div>
            <h2>{isEdit ? 'Edit post' : 'Log a post'}</h2>
            <p>{isEdit ? 'Update this entry’s details and metrics.' : 'Add a Threads post to your dashboard.'}</p>
          </div>
          <div className="spacer" />
          <button className="modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="modal__body">
            <p className="form-note">
              Metrics are optional — leave them blank for scheduled or draft posts and fill them in later. Only{' '}
              <b>Published</b> posts count toward performance analytics.
            </p>

            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="f-date">
                  Date <span className="req">*</span>
                </label>
                <input
                  id="f-date"
                  type="date"
                  className={`input${errors.date ? ' invalid' : ''}`}
                  value={form.date}
                  onChange={(e) => set('date', e.target.value)}
                />
                {errors.date && <span className="field-error">{errors.date}</span>}
              </div>

              <div className="form-field">
                <label htmlFor="f-pillar">
                  Pillar <span className="req">*</span>
                </label>
                <select
                  id="f-pillar"
                  className="select"
                  style={{ width: '100%' }}
                  value={form.pillar}
                  onChange={(e) => set('pillar', e.target.value)}
                >
                  {PILLARS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field col-span">
                <label htmlFor="f-content">
                  Content <span className="req">*</span>
                </label>
                <textarea
                  id="f-content"
                  className={`textarea${errors.content ? ' invalid' : ''}`}
                  placeholder="What did the post say?"
                  value={form.content}
                  onChange={(e) => set('content', e.target.value)}
                />
                {errors.content && <span className="field-error">{errors.content}</span>}
              </div>

              <div className="form-field">
                <label htmlFor="f-status">Status</label>
                <select
                  id="f-status"
                  className="select"
                  style={{ width: '100%' }}
                  value={form.status}
                  onChange={(e) => set('status', e.target.value)}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="f-type">
                  Content type <span className="hint">(optional)</span>
                </label>
                <select
                  id="f-type"
                  className="select"
                  style={{ width: '100%' }}
                  value={form.contentType}
                  onChange={(e) => set('contentType', e.target.value)}
                >
                  {CONTENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field col-span">
                <label htmlFor="f-link">
                  Link <span className="hint">(URL to the Threads post)</span>
                </label>
                <input
                  id="f-link"
                  type="url"
                  className={`input${errors.link ? ' invalid' : ''}`}
                  placeholder="https://www.threads.net/@you/post/…"
                  value={form.link}
                  onChange={(e) => set('link', e.target.value)}
                />
                {errors.link && <span className="field-error">{errors.link}</span>}
              </div>

              <div className="form-field col-span">
                <label>
                  Metrics <span className="hint">(optional)</span>
                </label>
                <div className="metrics-grid">
                  {METRICS.map((m) => (
                    <div className="form-field" key={m.key}>
                      <label htmlFor={`f-${m.key}`} style={{ fontSize: 11, fontWeight: 550 }}>
                        {m.label}
                      </label>
                      <input
                        id={`f-${m.key}`}
                        type="number"
                        min="0"
                        inputMode="numeric"
                        className={`input${errors[m.key] ? ' invalid' : ''}`}
                        placeholder="0"
                        value={form[m.key]}
                        onChange={(e) => set(m.key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="modal__foot">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary">
              {isEdit ? 'Save changes' : 'Log post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
