'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getOrCreateAdminId, saveAdminSession } from '@/lib/admin'

const STEPS = ['Basic Info', 'Branding', 'Confirm'] as const
type Step = 0 | 1 | 2

function Stepper({ current }: { current: Step }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors
                ${done ? 'bg-green-500 border-green-500 text-black' : active ? 'border-green-500 text-green-500' : 'border-zinc-700 text-zinc-600'}`}>
                {done ? '✓' : i + 1}
              </div>
              <span className={`mt-1 text-xs font-medium ${active ? 'text-green-400' : done ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-12 sm:w-20 mx-1 mb-4 transition-colors ${done ? 'bg-green-500' : 'bg-zinc-700'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function LivePreviewCard({ name, color, logoUrl }: { name: string; color: string; logoUrl: string }) {
  const displayName = name.trim() || 'Your League Name'
  return (
    <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 w-full max-w-xs mx-auto">
      <div className="h-3 w-full" style={{ backgroundColor: color }} />
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="logo" className="w-10 h-10 rounded-full object-cover border-2"
              style={{ borderColor: color }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          ) : (
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-black"
              style={{ backgroundColor: color + '33', color }}>
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-bold text-sm text-white leading-tight">{displayName}</p>
            <p className="text-zinc-500 text-xs">FIFA 2026 Prediction League</p>
          </div>
        </div>
        <div className="flex gap-2 mb-3">
          <div className="flex-1 bg-zinc-800 rounded-xl p-3 text-center">
            <p className="text-xs text-zinc-500">Members</p>
            <p className="font-bold text-white text-sm">—</p>
          </div>
          <div className="flex-1 bg-zinc-800 rounded-xl p-3 text-center">
            <p className="text-xs text-zinc-500">Matches</p>
            <p className="font-bold text-white text-sm">64</p>
          </div>
        </div>
        <div className="w-full py-2 rounded-xl text-center text-xs font-bold"
          style={{ backgroundColor: color, color: '#000' }}>
          Join League
        </div>
      </div>
    </div>
  )
}

export default function CreateLeaguePage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(0)
  const [name, setName] = useState('')
  const [welcomeMessage, setWelcomeMessage] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#16a34a')
  const [logoUrl, setLogoUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (step === 0) nameRef.current?.focus()
  }, [step])

  async function handleSubmit() {
    setError('')
    setSubmitting(true)
    try {
      const admin_id = getOrCreateAdminId()
      const res = await fetch('/api/leagues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          welcome_message: welcomeMessage.trim() || undefined,
          primary_color: primaryColor,
          logo_url: logoUrl.trim() || undefined,
          admin_id,
          display_name: 'Admin',
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
        setSubmitting(false)
        return
      }
      saveAdminSession({
        admin_id,
        league_id: data.league.id,
        slug: data.league.slug,
        league_name: data.league.name,
      })
      router.push(`/admin/dashboard?league=${data.league.slug}`)
    } catch {
      setError('Network error. Please check your connection.')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="flex items-center px-5 py-4 border-b border-zinc-900 max-w-5xl mx-auto">
        <Link href="/" className="text-zinc-500 hover:text-white text-sm transition-colors mr-auto">← Back</Link>
        <span className="font-bold text-base tracking-tight">Pitch<span className="text-green-500">League</span></span>
        <div className="mr-auto w-16" />
      </div>

      <div className="max-w-5xl mx-auto px-5 py-10">
        <div className="max-w-xl mx-auto lg:max-w-none">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-center mb-1">Create Your League</h1>
          <p className="text-zinc-500 text-sm text-center mb-8">Takes less than 2 minutes ⚡</p>

          <Stepper current={step} />

          <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
            <div className="w-full lg:max-w-md">

              {/* Step 0 */}
              {step === 0 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">
                      League name <span className="text-green-500">*</span>
                    </label>
                    <input ref={nameRef} type="text" value={name} onChange={(e) => setName(e.target.value)}
                      placeholder="BlueToka FIFA League" maxLength={60}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-green-500 rounded-xl px-4 py-3 text-white placeholder-zinc-600 text-sm outline-none transition-colors" />
                    {name.trim().length > 0 && name.trim().length < 3 && (
                      <p className="text-red-400 text-xs mt-1">At least 3 characters required.</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">
                      Welcome message <span className="text-zinc-500 font-normal">(optional)</span>
                    </label>
                    <textarea value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)}
                      placeholder="Welcome to our World Cup prediction league!" maxLength={200} rows={3}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-green-500 rounded-xl px-4 py-3 text-white placeholder-zinc-600 text-sm outline-none transition-colors resize-none" />
                    <p className="text-zinc-600 text-xs mt-1 text-right">{welcomeMessage.length}/200</p>
                  </div>
                  <button onClick={() => setStep(1)} disabled={name.trim().length < 3} type="button"
                    className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-3.5 rounded-full transition-colors">
                    Continue →
                  </button>
                </div>
              )}

              {/* Step 1 */}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Primary color</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-12 h-12 rounded-xl border border-zinc-700 cursor-pointer bg-transparent p-0.5" />
                      <span className="text-sm text-zinc-400 font-mono">{primaryColor}</span>
                      <button onClick={() => setPrimaryColor('#16a34a')}
                        className="text-xs text-zinc-600 hover:text-zinc-400 underline ml-auto">Reset</button>
                    </div>
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {['#16a34a','#2563eb','#dc2626','#d97706','#7c3aed','#0891b2'].map((c) => (
                        <button key={c} onClick={() => setPrimaryColor(c)}
                          className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                          style={{ backgroundColor: c, borderColor: primaryColor === c ? '#fff' : 'transparent' }} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">
                      Logo URL <span className="text-zinc-500 font-normal">(optional)</span>
                    </label>
                    <input type="url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://... or leave blank"
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-green-500 rounded-xl px-4 py-3 text-white placeholder-zinc-600 text-sm outline-none transition-colors" />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setStep(0)}
                      className="flex-1 border border-zinc-700 hover:border-zinc-500 text-white font-semibold py-3.5 rounded-full transition-colors text-sm">
                      ← Back
                    </button>
                    <button onClick={() => setStep(2)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-black font-bold py-3.5 rounded-full transition-colors">
                      Continue →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-0">
                    <h3 className="font-bold text-sm text-zinc-400 uppercase tracking-wider mb-3">Summary</h3>
                    <Row label="League name" value={name.trim()} />
                    <Row label="Welcome message" value={welcomeMessage.trim() || '—'} muted={!welcomeMessage.trim()} />
                    <div className="flex items-center justify-between py-2 border-t border-zinc-800">
                      <span className="text-sm text-zinc-500">Primary color</span>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full border border-zinc-700" style={{ backgroundColor: primaryColor }} />
                        <span className="text-sm font-mono text-white">{primaryColor}</span>
                      </div>
                    </div>
                    <Row label="Logo" value={logoUrl.trim() ? 'Provided' : 'None (initials used)'} muted={!logoUrl.trim()} />
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>
                  )}

                  <button onClick={handleSubmit} disabled={submitting}
                    className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-60 disabled:cursor-not-allowed text-black font-bold py-4 rounded-full transition-colors flex items-center justify-center gap-2 text-base">
                    {submitting ? (
                      <><span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />Creating your league…</>
                    ) : '🏆 Create My League'}
                  </button>

                  <button onClick={() => setStep(1)} disabled={submitting}
                    className="w-full border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white font-medium py-3 rounded-full transition-colors text-sm">
                    ← Edit branding
                  </button>
                </div>
              )}
            </div>

            {/* Live preview */}
            <div className={`w-full lg:w-auto lg:flex-1 lg:max-w-xs ${step === 2 ? 'hidden lg:block' : 'block'}`}>
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold text-center mb-3">Live Preview</p>
              <LivePreviewCard name={name} color={primaryColor} logoUrl={logoUrl} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-t border-zinc-800 first:border-t-0">
      <span className="text-sm text-zinc-500 shrink-0">{label}</span>
      <span className={`text-sm text-right break-all ${muted ? 'text-zinc-600 italic' : 'text-white font-medium'}`}>{value}</span>
    </div>
  )
}
