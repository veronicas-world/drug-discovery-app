'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Hypothesis = {
  proposed_indication:  string
  mechanism_rationale:  string
  plausibility_score:   number | null
  evidence_level:       string
}

const EVIDENCE_COLORS: Record<string, string> = {
  established: '#4a7c59',
  emerging:    '#b07d2e',
  speculative: '#a04040',
}

const EVIDENCE_LABELS: Record<string, string> = {
  established: 'established',
  emerging:    'emerging',
  speculative: 'speculative',
}

export default function DrugPage() {
  const params   = useParams()
  const drugName = decodeURIComponent(params.drug_name as string)

  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)

  useEffect(() => {
    async function fetchHypotheses() {
      const { data, error } = await supabase
        .from('candidates')
        .select('proposed_indication, mechanism_rationale, plausibility_score, evidence_level')
        .eq('drug_name', drugName)
        .order('plausibility_score', { ascending: false, nullsFirst: false })

      if (error) { setError(error.message); setLoading(false); return }
      setHypotheses(data ?? [])
      setLoading(false)
    }
    fetchHypotheses()
  }, [drugName])

  return (
    <main style={{ maxWidth: '720px', margin: '0 auto', padding: '72px 32px 120px' }}>

      {/* ── Back link ── */}
      <Link href="/" style={{ color: '#aaa', fontSize: '0.8rem', display: 'inline-block', marginBottom: '56px' }}>
        ← all drugs
      </Link>

      {/* ── Header ── */}
      <h1 style={{
        fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
        fontWeight: 400,
        letterSpacing: '-0.025em',
        marginBottom: '10px',
      }}>
        {drugName}
      </h1>
      <p style={{ color: '#aaa', fontSize: '0.8rem', marginBottom: '72px' }}>
        {loading
          ? 'loading...'
          : `${hypotheses.length} hypothesis${hypotheses.length !== 1 ? 'es' : ''}`
        }
      </p>

      {error && <p style={{ color: '#a04040', fontSize: '0.875rem' }}>error: {error}</p>}

      {/* ── Hypothesis list ── */}
      {!loading && !error && hypotheses.length === 0 && (
        <p style={{ color: '#aaa', fontSize: '0.875rem' }}>no hypotheses found.</p>
      )}

      {!loading && !error && hypotheses.map((h, i) => (
        <div key={i} style={{ marginBottom: '56px' }}>

          {/* Indication + dot */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
              background: EVIDENCE_COLORS[h.evidence_level] ?? '#bbb',
            }} />
            <span style={{ fontSize: '1rem', fontWeight: 400 }}>
              {h.proposed_indication || 'unknown indication'}
            </span>
          </div>

          {/* Mechanism rationale */}
          {h.mechanism_rationale && (
            <p style={{
              color: '#555',
              fontSize: '0.875rem',
              lineHeight: '1.75',
              marginLeft: '18px',
              marginBottom: '14px',
              maxWidth: '580px',
            }}>
              {h.mechanism_rationale}
            </p>
          )}

          {/* Meta row */}
          <div style={{
            marginLeft: '18px',
            fontSize: '0.75rem',
            color: '#aaa',
            display: 'flex',
            gap: '28px',
          }}>
            <span>
              plausibility:{' '}
              <span style={{ color: '#777' }}>
                {h.plausibility_score != null ? h.plausibility_score.toFixed(2) : '—'}
              </span>
            </span>
            <span>
              evidence:{' '}
              <span style={{ color: EVIDENCE_COLORS[h.evidence_level] ?? '#777' }}>
                {EVIDENCE_LABELS[h.evidence_level] ?? h.evidence_level ?? '—'}
              </span>
            </span>
          </div>

          {/* Divider (not on last item) */}
          {i < hypotheses.length - 1 && (
            <div style={{ marginTop: '56px', borderTop: '1px solid #eeede9' }} />
          )}
        </div>
      ))}
    </main>
  )
}
