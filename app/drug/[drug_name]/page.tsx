'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Hypothesis = {
  proposed_indication:    string
  mechanism_rationale:    string
  plausibility_score:     number | null
  evidence_level:         string
  top_pubmed_titles:      string | null  // pipe-separated titles
  pubmed_hit_count:       number | null
  clinicaltrials_hit_count: number | null
}

const EVIDENCE_COLORS: Record<string, string> = {
  high:   '#4a7c59',
  medium: '#b07d2e',
  low:    '#a04040',
}

/** Splits a pipe-separated string into a trimmed array, dropping empties. */
function splitPipe(s: string | null): string[] {
  if (!s) return []
  return s.split('|').map(x => x.trim()).filter(Boolean)
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
        .select([
          'proposed_indication',
          'mechanism_rationale',
          'plausibility_score',
          'evidence_level',
          'top_pubmed_titles',
          'pubmed_hit_count',
          'clinicaltrials_hit_count',
        ].join(', '))
        .eq('drug_name', drugName)
        .order('plausibility_score', { ascending: false, nullsFirst: false })

      if (error) { setError(error.message); setLoading(false); return }
      setHypotheses((data as unknown as Hypothesis[]) ?? [])
      setLoading(false)
    }
    fetchHypotheses()
  }, [drugName])

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px', fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Back link ── */}
      <Link href="/" style={{ fontSize: 13, color: '#888', textDecoration: 'none', display: 'inline-block', marginBottom: 32 }}>
        ← all drugs
      </Link>

      {/* ── Header ── */}
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>{drugName}</h1>
      <p style={{ fontSize: 13, color: '#999', marginBottom: 40 }}>
        {loading ? 'loading...' : `${hypotheses.length} hypothesis${hypotheses.length !== 1 ? 'es' : ''}`}
      </p>

      {error && <p style={{ color: '#c00', fontSize: 14 }}>error: {error}</p>}

      {!loading && !error && hypotheses.length === 0 && (
        <p style={{ color: '#999', fontSize: 14 }}>no hypotheses found.</p>
      )}

      {!loading && !error && hypotheses.map((h, i) => {
        const titles = splitPipe(h.top_pubmed_titles)

        return (
          <div key={i} style={{ marginBottom: 40 }}>

            {/* Indication + evidence dot */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{
                width: 14, height: 14,
                borderRadius: '50%',
                background: EVIDENCE_COLORS[h.evidence_level] ?? '#ccc',
                flexShrink: 0,
                display: 'inline-block',
              }} />
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
                {h.proposed_indication || 'unknown indication'}
              </h2>
            </div>

            {/* Mechanism rationale */}
            {h.mechanism_rationale && (
              <p style={{ fontSize: 14, color: '#444', lineHeight: 1.6, marginBottom: 14 }}>
                {h.mechanism_rationale}
              </p>
            )}

            {/* Meta row */}
            <div style={{ display: 'flex', gap: 24, fontSize: 13, color: '#888', marginBottom: 16 }}>
              <span>
                plausibility:{' '}
                <strong style={{ color: '#333' }}>
                  {h.plausibility_score != null ? h.plausibility_score : '—'}
                </strong>
              </span>
              <span>
                evidence:{' '}
                <strong style={{ color: EVIDENCE_COLORS[h.evidence_level] ?? '#aaa' }}>
                  {h.evidence_level || '—'}
                </strong>
              </span>
              {h.pubmed_hit_count != null && (
                <span>pubmed hits: <strong style={{ color: '#333' }}>{h.pubmed_hit_count}</strong></span>
              )}
              {h.clinicaltrials_hit_count != null && (
                <span>trials: <strong style={{ color: '#333' }}>{h.clinicaltrials_hit_count}</strong></span>
              )}
            </div>

            {/* PubMed article titles as search links */}
            {titles.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <p style={{ fontSize: 12, letterSpacing: '0.06em', color: '#aaa', textTransform: 'uppercase', marginBottom: 8 }}>
                  pubmed ({titles.length})
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {titles.map((title, j) => (
                    <li key={j} style={{ marginBottom: 6 }}>
                      <a
                        href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(title)}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: 13, color: '#4a7c59', textDecoration: 'none' }}
                      >
                        {title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Divider */}
            {i < hypotheses.length - 1 && (
              <hr style={{ border: 'none', borderTop: '1px solid #f0f0f0', marginTop: 32 }} />
            )}

          </div>
        )
      })}

    </main>
  )
}
