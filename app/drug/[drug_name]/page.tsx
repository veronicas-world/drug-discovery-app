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
  pubmed_ids:             string | null   // comma-separated PMIDs
  top_pubmed_titles:      string | null   // pipe-separated titles
  nct_ids:                string | null   // comma-separated NCT IDs
  top_trial_status:       string | null   // pipe-separated "NCT123: STATUS"
  pubmed_hit_count:       number | null
  clinicaltrials_hit_count: number | null
}

const EVIDENCE_COLORS: Record<string, string> = {
  established: '#4a7c59',
  emerging:    '#b07d2e',
  speculative: '#a04040',
}

/** Splits a pipe-separated string into a trimmed array, dropping empties. */
function splitPipe(s: string | null): string[] {
  if (!s) return []
  return s.split('|').map(x => x.trim()).filter(Boolean)
}

/** Splits a comma-separated string into a trimmed array, dropping empties. */
function splitComma(s: string | null): string[] {
  if (!s) return []
  return s.split(',').map(x => x.trim()).filter(Boolean)
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
          'pubmed_ids',
          'top_pubmed_titles',
          'nct_ids',
          'top_trial_status',
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

      {!loading && !error && hypotheses.length === 0 && (
        <p style={{ color: '#aaa', fontSize: '0.875rem' }}>no hypotheses found.</p>
      )}

      {!loading && !error && hypotheses.map((h, i) => {
        const pmids  = splitComma(h.pubmed_ids)
        const titles = splitPipe(h.top_pubmed_titles)
        const nctIds = splitComma(h.nct_ids)
        // top_trial_status entries are "NCT123456: COMPLETED" — extract status label
        const trialStatuses = splitPipe(h.top_trial_status)

        return (
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
              marginBottom: '20px',
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
                  {h.evidence_level || '—'}
                </span>
              </span>
            </div>

            {/* PubMed links */}
            {pmids.length > 0 && (
              <div style={{ marginLeft: '18px', marginBottom: '12px' }}>
                <p style={{ fontSize: '0.7rem', color: '#aaa', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>
                  pubmed ({pmids.length})
                </p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {pmids.map((pmid, j) => (
                    <li key={pmid}>
                      <a
                        href={`https://pubmed.ncbi.nlm.nih.gov/${pmid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#4a6fa5', fontSize: '0.8rem', lineHeight: '1.5' }}
                      >
                        {titles[j] || `PMID ${pmid}`}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ClinicalTrials links */}
            {nctIds.length > 0 && (
              <div style={{ marginLeft: '18px' }}>
                <p style={{ fontSize: '0.7rem', color: '#aaa', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>
                  clinical trials ({nctIds.length})
                </p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {nctIds.map((nctId, j) => {
                    // trialStatuses[j] is "NCT123456: COMPLETED" — extract just the status
                    const statusLabel = trialStatuses[j]?.split(':').slice(1).join(':').trim() || ''
                    return (
                      <li key={nctId} style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <a
                          href={`https://clinicaltrials.gov/study/${nctId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#4a6fa5', fontSize: '0.8rem' }}
                        >
                          {nctId}
                        </a>
                        {statusLabel && (
                          <span style={{ color: '#aaa', fontSize: '0.7rem' }}>{statusLabel}</span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {/* Divider */}
            {i < hypotheses.length - 1 && (
              <div style={{ marginTop: '56px', borderTop: '1px solid #eeede9' }} />
            )}
          </div>
        )
      })}
    </main>
  )
}
