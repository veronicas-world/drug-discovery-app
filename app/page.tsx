'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Candidate = {
  drug_name: string
  proposed_indication: string
  evidence_level: string
  plausibility_score: number | null
}

const EVIDENCE_COLORS: Record<string, string> = {
  high:   '#4a7c59',
  medium: '#b07d2e',
  low:    '#a04040',
}

const EVIDENCE_LEVELS = ['high', 'medium', 'low']

const headerStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.08em',
  color: '#aaa',
  textTransform: 'uppercase',
  flexShrink: 0,
}

export default function HomePage() {
  const [allRows, setAllRows]         = useState<Candidate[]>([])
  const [search, setSearch]           = useState('')
  const [evidenceFilter, setEvidence] = useState('all')
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)

  useEffect(() => {
    async function fetchAll() {
      const { data, error } = await supabase
        .from('candidates')
        .select('drug_name, proposed_indication, evidence_level, plausibility_score')
        .order('drug_name')
      if (error) { setError(error.message); setLoading(false); return }
      setAllRows(data ?? [])
      setLoading(false)
    }
    fetchAll()
  }, [])

  const filtered = allRows.filter(row => {
    const q = search.toLowerCase()
    const matchesSearch = !search
      || row.drug_name?.toLowerCase().includes(q)
      || row.proposed_indication?.toLowerCase().includes(q)
    const matchesEvidence = evidenceFilter === 'all' || row.evidence_level === evidenceFilter
    return matchesSearch && matchesEvidence
  })

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, sans-serif' }}>

      {/* Hero */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 8, lineHeight: 1.3 }}>
          Veronica&apos;s Drug Repurposing<br />Discovery Engine
        </h1>
        <p style={{ color: '#666', fontSize: 14, lineHeight: 1.6 }}>
          Computational hypotheses for drug repurposing &mdash;<br />
          powered by SIDER, PubMed, and Claude.
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 32, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, letterSpacing: '0.08em', color: '#888', textTransform: 'uppercase' }}>
          search
          <input
            type="text"
            placeholder="drug name or indication..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ border: 'none', borderBottom: '1px solid #ccc', outline: 'none', padding: '6px 0', width: '220px', fontSize: 14 }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, letterSpacing: '0.08em', color: '#888', textTransform: 'uppercase' }}>
          confidence level
          <select
            value={evidenceFilter}
            onChange={e => setEvidence(e.target.value)}
            style={{ border: 'none', borderBottom: '1px solid #ccc', outline: 'none', padding: '6px 0', cursor: 'pointer', fontSize: 14, color: evidenceFilter === 'all' ? '#888' : '#1a1a1a', background: 'transparent' }}
          >
            <option value="all">all</option>
            {EVIDENCE_LEVELS.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </label>
      </div>

      {loading && <p style={{ color: '#999', fontSize: 14 }}>loading...</p>}
      {error   && <p style={{ color: '#c00', fontSize: 14 }}>error: {error}</p>}

      {!loading && !error && (
        <>
          {/* Header row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 0 10px',
            borderBottom: '1px solid #e8e8e8',
            gap: 12,
          }}>
            <span style={{ ...headerStyle, flex: '1 1 160px' }}>drug / indication</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              <span style={{ ...headerStyle, minWidth: 110, textAlign: 'right' }}>confidence level</span>
              <span style={{ ...headerStyle, minWidth: 28, textAlign: 'right' }}>score</span>
            </div>
          </div>

          {filtered.length === 0 ? (
            <p style={{ color: '#999', fontSize: 14, marginTop: 16 }}>no results</p>
          ) : (
            <div>
              {filtered.map((row, i) => (
                <Link
                  key={i}
                  href={`/drug/${encodeURIComponent(row.drug_name)}`}
                  style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 0',
                    borderBottom: '1px solid #f0f0f0',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}>
                    <div style={{ flex: '1 1 160px', minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{row.drug_name}</div>
                      <div style={{ fontSize: 13, color: '#666' }}>{row.proposed_indication || '—'}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 110, justifyContent: 'flex-end' }}>
                        <span style={{
                          width: 10, height: 10,
                          borderRadius: '50%',
                          background: EVIDENCE_COLORS[row.evidence_level] ?? '#ccc',
                          display: 'inline-block',
                          flexShrink: 0,
                        }} />
                        <span style={{ fontSize: 12, color: '#666' }}>{row.evidence_level || '—'}</span>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 500, color: '#333', minWidth: 28, textAlign: 'right' }}>
                        {row.plausibility_score != null ? row.plausibility_score : '—'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <p style={{ marginTop: 16, fontSize: 12, color: '#bbb' }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
        </>
      )}

    </main>
  )
}
