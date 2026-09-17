import { useEffect, useMemo, useRef, useState } from 'react'
import { parsePostsText } from '../data/dataSource'
import { PillarBadge, StatusBadge } from './ui'
import { IconDownload } from './Icons'
import { formatDate, truncate } from '../lib/format'

/**
 * Bulk import modal. Paste CSV/TSV (e.g. straight from a spreadsheet) or upload
 * a .csv/.tsv/.txt file. Shows a live preview and imports in append or replace
 * mode. Parsing is delegated to parsePostsText (handles the sheet's columns,
 * DD/MM/YYYY dates, and the "Posted" status).
 */
export default function ImportModal({ open, hasExisting, onImport, onClose }) {
  const [tab, setTab] = useState('paste')
  const [text, setText] = useState('')
  const [mode, setMode] = useState('append')
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    if (open) {
      setTab('paste')
      setText('')
      setMode(hasExisting ? 'append' : 'replace')
      setDragging(false)
    }
  }, [open, hasExisting])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const parsed = useMemo(() => (text.trim() ? parsePostsText(text) : []), [text])

  if (!open) return null

  function handleFile(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setText(String(reader.result || ''))
      setTab('paste')
    }
    reader.readAsText(file)
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    handleFile(file)
  }

  function doImport() {
    if (!parsed.length) return
    onImport(parsed, mode)
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal--wide" role="dialog" aria-modal="true" aria-label="Import posts">
        <div className="modal__head">
          <div>
            <h2>Import posts</h2>
            <p>Paste from your spreadsheet or upload a CSV/TSV file.</p>
          </div>
          <div className="spacer" />
          <button className="modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal__body">
          <p className="form-note">
            Expected columns (extra columns like <b>No</b> are ignored):{' '}
            <b>Date, Pillar, Content, Status, Link, Views, Likes, Comments, Reposts, Shares</b>. Dates may be{' '}
            <b>DD/MM/YYYY</b> or <b>YYYY-MM-DD</b>; <b>“Posted”</b> is treated as Published. Metrics can be left blank
            and filled in later.
          </p>

          <div className="import-tabs" role="tablist">
            <button className={tab === 'paste' ? 'is-active' : ''} onClick={() => setTab('paste')} role="tab">
              Paste
            </button>
            <button className={tab === 'upload' ? 'is-active' : ''} onClick={() => setTab('upload')} role="tab">
              Upload file
            </button>
          </div>

          {tab === 'paste' ? (
            <textarea
              className="import-area"
              placeholder={
                'Paste rows here, including the header row, e.g.\n\nDate,Pillar,Content,Status,Link,Views,Likes,Comments,Reposts,Shares\n01/09/2026,Lifestyle,"hi, September!",Posted,https://…,,,,,'
              }
              value={text}
              onChange={(e) => setText(e.target.value)}
              spellCheck={false}
            />
          ) : (
            <div
              className={`dropzone${dragging ? ' dragging' : ''}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              <IconDownload />
              <div>
                <b>Click to choose a file</b> or drag &amp; drop
              </div>
              <div style={{ fontSize: 12, marginTop: 4 }}>.csv, .tsv or .txt</div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain"
                style={{ display: 'none' }}
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>
          )}

          {text.trim() && (
            <>
              <div className="import-summary">
                <span className="big">{parsed.length}</span>
                <span>
                  {parsed.length === 1 ? 'post' : 'posts'} detected
                  {parsed.length === 0 && (
                    <span className="warn-txt"> — couldn’t find a header row with Date/Pillar/Content.</span>
                  )}
                </span>
              </div>

              {parsed.length > 0 && (
                <>
                  <div className="import-preview">
                    <table className="data">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Pillar</th>
                          <th>Content</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsed.slice(0, 8).map((p) => (
                          <tr key={p.id}>
                            <td style={{ whiteSpace: 'nowrap' }}>{formatDate(p.date)}</td>
                            <td>
                              <PillarBadge pillar={p.pillar} />
                            </td>
                            <td>{truncate(p.content, 60)}</td>
                            <td>
                              <StatusBadge status={p.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsed.length > 8 && (
                    <p className="muted" style={{ fontSize: 12, margin: '8px 2px 0' }}>
                      …and {parsed.length - 8} more.
                    </p>
                  )}

                  {hasExisting && (
                    <div className="mode-toggle">
                      <label className={mode === 'append' ? 'sel' : ''}>
                        <input
                          type="radio"
                          name="import-mode"
                          checked={mode === 'append'}
                          onChange={() => setMode('append')}
                        />
                        Add to existing posts
                      </label>
                      <label className={mode === 'replace' ? 'sel' : ''}>
                        <input
                          type="radio"
                          name="import-mode"
                          checked={mode === 'replace'}
                          onChange={() => setMode('replace')}
                        />
                        Replace all existing posts
                      </label>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        <div className="modal__foot">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn--primary" onClick={doImport} disabled={!parsed.length}>
            Import {parsed.length ? parsed.length : ''} {parsed.length === 1 ? 'post' : 'posts'}
          </button>
        </div>
      </div>
    </div>
  )
}
