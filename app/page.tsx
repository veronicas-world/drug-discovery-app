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
  established: '#4a7c59',
  emerging:    '#b07d2e',
  speculative: '#a04040',
}

const EVIDENCE_LEVELS = ['established', 'emerging', 'speculative']

export default function HomePage() {
  const [allRows, setAllRows]           = useState<Candidate[]>([])
  const [search, setSearch]             = useState('')
  const [evidenceFilter, setEvidence]   = useState('all')
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)

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
    const matchesSearch   = !search || row.drug_name?.toLowerCase().includes(search.toLowerCase())
    const matchesEvidence = evidenceFilter === 'all' || row.evidence_level === evidenceFilter
    return matchesSearch && matchesEvidence
  })

  return (
    <main style={{ maxWidth: '900px', margin: '0 auto', padding: '88px 32px 120px' }}>

      {/* ── Hero ── */}
      <h1 style={{
        fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
        fontWeight: 400,
        letterSpacing: '-0.025em',
        lineHeight: 1.15,
        marginBottom: '16px',
      }}>
        Veronica's Drug Repurposing<br />Discovery Engine
      </h1>
      <p style={{ color: '#888', fontSize: '0.875rem', marginBottom: '64px', maxWidth: '480px' }}>
        Computational hypotheses for drug repurposing —<br />
        powered by SIDER, PubMed, and Claude.
      </p>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: '32px', marginBottom: '48px', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.7rem', color: '#aaa', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            drug name
          </label>
          <input
            type="text"
            placeholder="e.g. metformin"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              border: 'none',
              borderBottom: '1px solid #ccc',
              outline: 'none',
              padding: '6px 0',
              width: '220px',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.7rem', color: '#aaa', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            evidence level
          </label>
          <select
            value={evidenceFilter}
            onChange={e => setEvidence(e.target.value)}
            style={{
              border: 'none',
              borderBottom: '1px solid #ccc',
              outline: 'none',
              padding: '6px 0',
              cursor: 'pointer',
              color: evidenceFilter === 'all' ? '#888' : '#1a1a1a',
            }}
          >
            <option value="all">all</option>
            {EVIDENCE_LEVELS.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Results ── */}
      {loading && <p style={{ color: '#aaa', fontSize: '0.875rem' }}>loading...</p>}
      {error   && <p style={{ color: '#a04040', fontSize: '0.875rem' }}>error: {error}</p>}

      {!loading && !error && (
        <>
          {/* Column headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '180px 1fr 130px 70px',
            gap: '24px',
            paddingBottom: '10px',
            borderBottom: '1px solid #dddbd6',
            fontSize: '0.7rem',
            color: '#aaa',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            <span>drug</span>
            <span>indication</span>
            <span>evidence</span>
            <span>score</span>
          </div>

          {filtered.length === 0 ? (
            <p style={{ color: '#aaa', fontSize: '0.875rem', paddingTop: '32px' }}>no results</p>
          ) : (
            filtered.map((row, i) => (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: '180px 1fr 130px 70px',
                gap: '24px',
                padding: '13px 0',
                borderBottom: '1px solid #eeede9',
                fontSize: '0.875rem',
                alignItems: 'center',
              }}>
                <Link
                  href={`/drug/${encodeURIComponent(row.drug_name)}`}
                  style={{ color: '#4a6fa5' }}
                >
                  {row.drug_name}
                </Link>
                <span style={{ color: '#555' }}>{row.proposed_indication || '—'}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <span style={{
                    width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                    background: EVIDENCE_COLORS[row.evidence_level] ?? '#bbb',
                  }} />
                  <span style={{ color: '#555' }}>{row.evidence_level || '—'}</span>
                </span>
                <span style={{ color: '#999' }}>
                  {row.plausibility_score != null ? row.plausibility_score.toFixed(2) : '—'}
                </span>
              </div>
            ))
          )}

          <p style={{ color: '#bbb', fontSize: '0.75rem', marginTop: '28px' }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </p>
        </>
      )}
    </main>
  )
}
