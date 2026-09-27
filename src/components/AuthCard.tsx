import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, ChevronDown, Loader2, RotateCcw } from 'lucide-react'
import {
  ConfirmationResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'
import { Logo } from './Logo'

const COUNTRIES = [
  { code: '+91', label: 'IN' },
  { code: '+1', label: 'US' },
  { code: '+44', label: 'UK' },
  { code: '+971', label: 'AE' },
  { code: '+65', label: 'SG' },
  { code: '+61', label: 'AU' },
]

type Mode = 'phone' | 'otp' | 'success'

function friendlyError(error: unknown) {
  const code = (error as { code?: string })?.code ?? ''
  if (code.includes('popup-closed')) return 'The Google sign-in window was closed.'
  if (code.includes('invalid-phone-number')) return 'Please enter a valid mobile number.'
  if (code.includes('too-many-requests')) return 'Too many attempts. Please try again later.'
  if (code.includes('invalid-verification-code')) return 'That OTP is not correct. Please try again.'
  if (code.includes('captcha-check-failed')) return 'Verification could not be completed. Please try again.'
  return 'Something went wrong. Please try again.'
}

export function AuthCard() {
  const [mode, setMode] = useState<Mode>('phone')
  const [country, setCountry] = useState(COUNTRIES[0])
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const confirmationRef = useRef<ConfirmationResult | null>(null)
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null)

  const fullPhone = useMemo(() => `${country.code}${phone.replace(/\D/g, '')}`, [country.code, phone])

  useEffect(() => {
    if (countdown <= 0) return
    const timer = window.setInterval(() => setCountdown((value) => value - 1), 1000)
    return () => window.clearInterval(timer)
  }, [countdown])

  useEffect(() => {
    return () => recaptchaRef.current?.clear()
  }, [])

  const getRecaptcha = () => {
    if (!recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' })
    }
    return recaptchaRef.current
  }

  const handleGoogle = async () => {
    setLoading(true)
    setError('')
    try {
      await signInWithPopup(auth, googleProvider)
      setMode('success')
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setLoading(false)
    }
  }

  const sendOtp = async () => {
    if (phone.replace(/\D/g, '').length < 7) {
      setError('Enter your mobile number to continue.')
      return
    }
    setLoading(true)
    setError('')
    try {
      confirmationRef.current = await signInWithPhoneNumber(auth, fullPhone, getRecaptcha())
      setMode('otp')
      setCountdown(30)
    } catch (err) {
      console.error("THAANE PHONE AUTH ERROR:", err)
      recaptchaRef.current?.clear()
      recaptchaRef.current = null
      setError(
        `${friendlyError(err)} (${(err as { code?: string })?.code ?? "unknown"})`
      )
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async () => {
    if (!confirmationRef.current || otp.length !== 6) {
      setError('Enter the 6-digit code we sent you.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await confirmationRef.current.confirm(otp)
      setMode('success')
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    confirmationRef.current = null
    setOtp('')
    setError('')
    setMode('phone')
  }

  const logout = async () => {
    await signOut(auth)
    reset()
  }

  return (
    <main className="auth-shell">
      <div className="floating-help">Need help? <span>?</span></div>
      <section className="auth-card" aria-live="polite">
        <Logo />
        {mode === 'success' ? (
          <div className="success-view">
            <div className="success-orbit"><span>✓</span></div>
            <h2>Welcome to Thaane</h2>
            <p>Your journey to timeless beauty begins here.</p>
            <button className="ghost-button" onClick={logout}>Sign out</button>
          </div>
        ) : (
          <>
            <header className="auth-heading">
              <h2>{mode === 'otp' ? 'Verify your number' : 'Welcome to Thaane'}</h2>
              <p>{mode === 'otp' ? `Enter the code sent to ${fullPhone}` : 'BEAUTY · BELONGS · TO · YOU'}</p>
            </header>

            {mode === 'phone' && (
              <>
                <button className="google-button" onClick={handleGoogle} disabled={loading}>
                  <span className="google-icon" aria-hidden="true">
  <svg viewBox="0 0 48 48" width="21" height="21">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.72 1.22 9.22 3.6l6.85-6.85C35.9 2.6 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.2C12.43 13.4 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.5 24.5c0-1.58-.14-3.1-.4-4.5H24v9h12.64c-.54 2.9-2.18 5.35-4.64 6.99l7.19 5.58C43.37 37.41 46.5 31.48 46.5 24.5z"/>
    <path fill="#FBBC05" d="M10.54 28.58A14.49 14.49 0 0 1 9.5 24c0-1.59.37-3.14 1.04-4.58l-7.98-6.2A24 24 0 0 0 0 24c0 3.87.93 7.55 2.56 10.78l7.98-6.2z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.92-2.14 15.89-5.82l-7.19-5.58c-1.99 1.34-4.53 2.13-8.7 2.13-6.26 0-11.57-3.9-13.46-9.42l-7.98 6.2C6.51 42.62 14.62 48 24 48z"/>
  </svg>
</span>
                  <span>Continue with Google</span>
                  {loading ? <Loader2 className="spin" size={18} /> : <ArrowRight size={18} />}
                </button>
                <div className="divider"><span>OR</span></div>
                <label className="field-label" htmlFor="phone">Enter your mobile number</label>
                <div className="phone-field">
                  <select value={country.code} onChange={(e) => setCountry(COUNTRIES.find((item) => item.code === e.target.value) ?? COUNTRIES[0])} aria-label="Country code">
                    {COUNTRIES.map((item) => <option key={item.code} value={item.code}>{item.code} · {item.label}</option>)}
                  </select>
                  <input id="phone" inputMode="tel" autoComplete="tel" placeholder="Enter mobile number" value={phone} onChange={(e) => setPhone(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void sendOtp()} />
                </div>
                <button className="primary-button" onClick={sendOtp} disabled={loading}>
                  <span>{loading ? 'Sending OTP' : 'Send OTP'}</span>
                  {loading ? <Loader2 className="spin" size={18} /> : <ArrowRight size={18} />}
                </button>
                <p className="microcopy">We'll send you a 6-digit code</p>
              </>
            )}

            {mode === 'otp' && (
              <>
                <div className="otp-row" onPaste={(e) => { const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6); setOtp(pasted); e.preventDefault() }}>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <input
                      key={index}
                      aria-label={`Digit ${index + 1}`}
                      inputMode="numeric"
                      maxLength={1}
                      value={otp[index] ?? ''}
                      onChange={(e) => {
                        const digit = e.target.value.replace(/\D/g, '').slice(-1)
                        const next = otp.split(''); next[index] = digit
                        setOtp(next.join('').slice(0, 6))
                        if (digit) (e.currentTarget.nextElementSibling as HTMLInputElement | null)?.focus()
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !otp[index]) (e.currentTarget.previousElementSibling as HTMLInputElement | null)?.focus()
                      }}
                    />
                  ))}
                </div>
                <button className="primary-button" onClick={verifyOtp} disabled={loading}>
                  <span>{loading ? 'Verifying' : 'Verify & continue'}</span>
                  {loading ? <Loader2 className="spin" size={18} /> : <ArrowRight size={18} />}
                </button>
                <div className="otp-actions">
                  <button onClick={reset}>Change number</button>
                  <button onClick={sendOtp} disabled={countdown > 0 || loading}><RotateCcw size={14} /> {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}</button>
                </div>
              </>
            )}

            {error && <div className="error-message" role="alert">{error}</div>}
            <div id="recaptcha-container" />
            <footer className="terms">By continuing, you agree to our<br /><a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a>.</footer>
          </>
        )}
      </section>
      <div className="bottom-note">T I M E L E S S   B E A U T Y .   A   B R I G H T E R   Y O U .</div>
    </main>
  )
}
