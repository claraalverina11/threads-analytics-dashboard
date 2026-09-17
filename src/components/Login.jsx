import { useState } from 'react'
import { attemptLogin } from '../lib/auth'

/** Password gate shown before the dashboard. Calls onSuccess() when unlocked. */
export default function Login({ onSuccess }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  function submit(e) {
    e.preventDefault()
    if (attemptLogin(password)) {
      setError(false)
      onSuccess()
    } else {
      setError(true)
    }
  }

  return (
    <div className="login">
      <form className="login__card" onSubmit={submit}>
        <div className="login__brand">
          <div className="brand__mark" aria-hidden>
            <svg viewBox="0 0 32 32">
              <path
                d="M16 7c-4.6 0-7.7 2.6-7.9 7.6-.2 4.6 2.4 8 6.9 8.4 3 .3 5.4-.9 6.4-3.3.6-1.5.5-3.2-.4-4.4-.8-1.1-2.1-1.8-3.7-1.9-2-.1-3.4.9-3.5 2.5-.1 1.3.8 2.2 2.1 2.3.9.1 1.6-.3 1.8-1"
                fill="none"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <div className="brand__name">Threads Analytics</div>
            <div className="brand__sub">Performance Studio</div>
          </div>
        </div>

        <h1 className="login__title">Sign in</h1>
        <p className="login__sub">Enter the access password to view the dashboard.</p>

        <label className="login__label" htmlFor="access-pw">
          Password
        </label>
        <input
          id="access-pw"
          type="password"
          className={`input${error ? ' invalid' : ''}`}
          value={password}
          autoFocus
          autoComplete="current-password"
          placeholder="••••••••"
          onChange={(e) => {
            setPassword(e.target.value)
            if (error) setError(false)
          }}
        />
        {error && <div className="field-error" style={{ marginTop: 6 }}>Incorrect password. Please try again.</div>}

        <button type="submit" className="btn btn--primary login__btn">
          Unlock dashboard
        </button>

        <p className="login__note">For authorized team members only.</p>
      </form>
    </div>
  )
}
