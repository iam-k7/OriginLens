import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { TextAnalysisResult, TextRewriteResult } from '../../shared/models/analysis-result';

export type AnalysisMode = 'standard' | 'deep';

/**
 * Text-intelligence service — Phase 2 mock implementation.
 * Replace with HTTP calls in Phase 6/7.
 */
@Injectable({ providedIn: 'root' })
export class TextIntelligenceService {
  analyze(text: string, mode: AnalysisMode): Observable<TextAnalysisResult> {
    const wordCount = words(text).length;
    const seed = (text.length + mode.length * 7) % 100;
    const score = 0.25 + (seed / 100) * 0.6;
    const confidence: 'low' | 'medium' | 'high' = score > 0.66 ? 'medium' : 'low';
    return of({
      job_id: randomId(),
      ai_signal: {
        score,
        confidence,
        signals: [
          { label: 'Sentence structure', detail: 'Average sentence length and rhythm.' },
          { label: 'Word predictability', detail: 'Vocabulary distribution within mixed-source range.' },
          { label: 'Formatting consistency', detail: 'Punctuation and capitalization patterns.' },
        ],
        explanation:
          'Signals are consistent with mixed or unknown authorship. No strong ' +
          'evidence for a specific generator was found in this text.',
        limitations: [
          'Probabilistic; false positives and false negatives are possible.',
          'Short samples yield less reliable signals than long ones.',
          'A high score does not prove AI authorship.',
        ],
      },
      signals: [
        { label: `Words analyzed: ${wordCount.toLocaleString()}` },
        { label: `Mode: ${mode}` },
      ],
      explanation: 'Heuristic mock — backend wiring lands in Phase 6.',
      limitations: ['Replace with real model output in Phase 7.'],
      model: 'heuristic-mock',
      provider: 'local',
    }).pipe(delay(700));
  }

  rewrite(text: string, tone: string): Observable<TextRewriteResult> {
    const rewritten =
      `This is a ${tone} rewrite of the original text. ` +
      `The implementation lands in Phase 7; for now, the structure below ` +
      `shows where the rewritten version will appear.`;
    return of({
      rewritten,
      notes: [
        'Rewriting is positioned as writing assistance, not as a way to evade detection.',
        'Tone and goal are user-controlled.',
        'The model will aim for clarity, flow, and natural phrasing.',
      ],
      model: 'heuristic-mock',
      provider: 'local',
    }).pipe(delay(700));
  }
}

function words(s: string): string[] {
  return s.trim().split(/\s+/).filter(Boolean);
}

function randomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'job-' + Math.random().toString(36).slice(2, 10);
}
