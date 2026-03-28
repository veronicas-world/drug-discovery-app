'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Candidate = {
  drug_name: string
  proposed_indication: string
  evidence_level: string
  plausibility_score: number | null
  neglect_reason: string | null
}

const EVIDENCE_COLORS: Record<string, string> = {
  high:   '#4a7c59',
  medium: '#b07d2e',
  low:    '#a04040',
}

const NEGLECT_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  active_research:        { label: 'active research',        color: '#2d6a4f', bg: '#eaf4ee' },
  commercially_neglected: { label: 'commercially neglected', color: '#7c4a1e', bg: '#fdf3e7' },
  side_effect_abandoned:  { label: 'side effect abandoned',  color: '#5a1e7c', bg: '#f5eafd' },
  era_limited:            { label: 'era limited',            color: '#1e4a7c', bg: '#e7f0fd' },
}

const EVIDENCE_LEVELS = ['high', 'medium', 'low']
const NEGLECT_REASONS = ['commercially_neglected', 'side_effect_abandoned', 'era_limited']

const headerStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.08em',
  color: '#aaa',
  textTransform: 'uppercase',
  flexShrink: 0,
}

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  fontSize: 11,
  letterSpacing: '0.08em',
  color: '#888',
  textTransform: 'uppercase',
  flex: '1 1 160px',
  minWidth: 120,
}

const fieldStyle: React.CSSProperties = {
  border: 'none',
  borderBottom: '1px solid #ccc',
  outline: 'none',
  padding: '6px 0',
  fontSize: 14,
  width: '100%',
  boxSizing: 'border-box',
  background: 'transparent',
  textAlign: 'left',
}

export default function HomePage() {
  const [allRows, setAllRows] = useState<Candidate[]>([])
  const [search, setSearch] = useState('')
  const [evidenceFilter, setEvidence] = useState('all')
  const [neglectFilter, setNeglect] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAll() {
      const { data, error } = await supabase
        .from('candidates')
        .select('drug_name, proposed_indication, evidence_level, plausibility_score, neglect_reason')
        .order('drug_name')
      if (error) { setError(error.message); setLoading(false); return }
      setAllRows(data ?? [])
      setLoading(false)
    }
    fetchAll()
  }, [])

  const filtered = allRows.filter(row => {
    const q = search.toLowerCase()
    const matchesSearch = !search ||
      row.drug_name?.toLowerCase().includes(q) ||
      row.proposed_indication?.toLowerCase().includes(q)
    const matchesEvidence = evidenceFilter === 'all' || row.evidence_level === evidenceFilter
    const matchesNeglect =
      neglectFilter === 'all' ||
      (neglectFilter === 'neglected' && row.neglect_reason && row.neglect_reason !== 'active_research') ||
      row.neglect_reason === neglectFilter
    return matchesSearch && matchesEvidence && matchesNeglect
  })

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: '48px 24px', fontFamily: 'system-ui, sans-serif', background: '#f9f8f6', minHeight: '100vh' }}>

      {/* Hero */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15, margin: '0 0 12px', color: '#1a1a1a' }}>
          Veronica&apos;s Drug Repurposing<br />Discovery Engine
        </h1>
        <p style={{ fontSize: 15, color: '#666', margin: 0, lineHeight: 1.6 }}>
          Computational hypotheses for drug repurposing —<br />
          powered by SIDER, PubMed, and Claude.
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 32, flexWrap: 'wrap' }}>
        <label style={labelStyle}>
          search
          <input
            type="text"
            placeholder="drug name or indication..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={fieldStyle}
          />
        </label>

        <label style={labelStyle}>
          confidence level
          <select
            value={evidenceFilter}
            onChange={e => setEvidence(e.target.value)}
            style={{ ...fieldStyle, cursor: 'pointer', color: evidenceFilter === 'all' ? '#888' : '#1a1a1a', minWidth: 120 }}
          >
            <option value="all">all</option>
            {EVIDENCE_LEVELS.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </label>

        <label style={labelStyle}>
          research status
          <select
            value={neglectFilter}
            onChange={e => setNeglect(e.target.value)}
            style={{ ...fieldStyle, cursor: 'pointer', color: neglectFilter === 'all' ? '#888' : '#1a1a1a', minWidth: 120 }}
          >
            <option value="all">all</option>
            <option value="active_research">active research</option>
            <option value="neglected">all neglected</option>
            {NEGLECT_REASONS.map(r => (
              <option key={r} value={r}>{NEGLECT_LABELS[r].label}</option>
            ))}
          </select>
        </label>
      </div>

      {loading && <p style={{ color: '#999' }}>loading...</p>}
      {error && <p style={{ color: '#c0392b' }}>error: {error}</p>}

      {!loading && !error && (
        <>
          {/* Header row */}
          <div style={{ display: 'flex', gap: 12, padding: '0 0 8px', borderBottom: '1px solid #ddd', marginBottom: 4 }}>
            <span style={{ ...headerStyle, flex: 1 }}>drug / indication</span>
            <span style={{ ...headerStyle, width: 120, textAlign: 'right' }}>confidence level &nbsp; score</span>
          </div>

          {filtered.length === 0 ? (
            <p style={{ color: '#999', marginTop: 32 }}>no results</p>
          ) : (
            <div>
              {filtered.map((row, i) => {
                const neglect = row.neglect_reason ? NEGLECT_LABELS[row.neglect_reason] : null
                return (
                  <Link
                    key={i}
                    href={`/drug/${encodeURIComponent(row.drug_name)}/${encodeURIComponent(row.proposed_indication)}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: '16px 0',
                      borderBottom: '1px solid #eee',
                      cursor: 'pointer',
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: 15, color: '#1a1a1a' }}>{row.drug_name}</p>
                        <p style={{ margin: '0 0 6px', fontSize: 14, color: '#555' }}>{row.proposed_indication || '—'}</p>
                        {neglect && (
                          <span style={{ display: 'inline-block', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600, padding: '2px 7px', borderRadius: 4, color: neglect.color, background: neglect.bg }}>
                            {neglect.label}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <span style={{ fontSize: 13, color: EVIDENCE_COLORS[row.evidence_level] || '#888', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: EVIDENCE_COLORS[row.evidence_level] || '#ccc', display: 'inline-block' }} />
                          {row.evidence_level || '—'}
                        </span>
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', minWidth: 28, textAlign: 'right' }}>
                          {row.plausibility_score != null ? row.plausibility_score : '—'}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          <p style={{ marginTop: 16, fontSize: 12, color: '#bbb' }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
        </>
      )}

    </main>
  )
}
