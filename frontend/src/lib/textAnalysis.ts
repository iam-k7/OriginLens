/**
 * Explainable stylistic signals, computed in the browser. No AI probability is produced:
 * stylometry alone is not a validated AI detector.
 */
const SENT_SPLIT = /(?<=[.!?])\s+(?=["'([]?[A-Z0-9])/;
const WORD = /[A-Za-z][A-Za-z'-]*/g;
const STOCK_PHRASES = ["delve", "tapestry", "it's important to note", "it is important to note", "in conclusion",
  "in today's fast-paced", "furthermore", "moreover", "additionally", "navigate the", "a testament to",
  "plays a crucial role", "in the realm of", "unlock the", "seamless", "robust", "leverage", "embark",
  "ever-evolving", "game-changer", "not only", "foster"];

const LIMITATIONS = [
  "These are stylistic measurements, not an AI detector. Human writing can show the same patterns.",
  "Short texts (under ~150 words) give unreliable signals.",
  "Edited, translated or templated writing skews these measurements.",
  "No result here proves who or what wrote a text.",
];

const words = (s: string) => s.match(WORD) ?? [];
const count = (hay: string, needle: string) => hay.split(needle).length - 1;

function syllables(word: string): number {
  const w = word.toLowerCase().replace(/^'+|'+$/g, "");
  const groups = w.match(/[aeiouy]+/g) ?? [];
  return Math.max(1, groups.length - (w.endsWith("e") && groups.length > 1 ? 1 : 0));
}

export function sentences(text: string): string[] {
  return text.trim().split(SENT_SPLIT).map((s) => s.trim()).filter(Boolean);
}

export function analyzeText(text: string) {
  const sents = sentences(text);
  const all = words(text);
  const nWords = all.length;
  const lengths = sents.length ? sents.map((s) => words(s).length) : [0];
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const stdev = lengths.length > 1 ? Math.sqrt(lengths.reduce((a, b) => a + (b - mean) ** 2, 0) / lengths.length) : 0;
  const round = (v: number, d: number) => Math.round(v * 10 ** d) / 10 ** d;
  const burstiness = mean ? round(stdev / mean, 3) : 0;
  const ttr = nWords ? round(new Set(all.map((w) => w.toLowerCase())).size / nWords, 3) : 0;
  const syll = all.reduce((n, w) => n + syllables(w), 0);
  const flesch = round(206.835 - 1.015 * (nWords / Math.max(sents.length, 1)) - 84.6 * (syll / Math.max(nWords, 1)), 1);
  const lower = text.toLowerCase();
  const phrases = Object.fromEntries(STOCK_PHRASES.filter((p) => lower.includes(p)).map((p) => [p, count(lower, p)]));
  const phraseTotal = Object.values(phrases).reduce((a, b) => a + b, 0);
  const starters = sents.map((s) => s.split(/\s+/)[0]?.toLowerCase().replace(/^,+|,+$/g, "")).filter(Boolean) as string[];
  const repeated = Object.fromEntries([...new Set(starters)].map((w) => [w, starters.filter((x) => x === w).length]).filter(([, c]) => (c as number) >= 3));

  const signals = [
    { name: "Sentence length variation", value: burstiness,
      observation: burstiness < 0.35 ? "Low variation (uniform sentence lengths)" : "Natural variation",
      explanation: "Writers usually mix short and long sentences. Very uniform lengths are common in templated or machine-generated text, and in some formal writing." },
    { name: "Vocabulary diversity", value: ttr,
      observation: nWords > 150 && ttr < 0.4 ? "Repetitive vocabulary" : "Typical range",
      explanation: "Share of unique words. It falls naturally as text gets longer." },
    { name: "Stock phrases", value: phraseTotal, details: phrases,
      observation: phraseTotal >= 3 ? "Several stock transition phrases" : "Few or none",
      explanation: "Phrases over-represented in assistant-style prose. Many humans use them too." },
    { name: "Repeated sentence openers", value: Object.keys(repeated).length, details: repeated,
      observation: Object.keys(repeated).length ? "Repeated openers" : "Varied openers",
      explanation: "Starting many sentences the same way reduces flow." },
  ];

  const rows = sents.slice(0, 300).map((s, index) => {
    const ln = lengths[index];
    const flags: string[] = [];
    if (ln > 35) flags.push("very long");
    if (stdev && Math.abs(ln - mean) < 0.15 * mean) flags.push("near-average length");
    if (Object.keys(phrases).some((p) => s.toLowerCase().includes(p))) flags.push("stock phrase");
    return { index, text: s.slice(0, 600), words: ln, flags };
  });

  return {
    stats: { characters: text.length, words: nWords, sentences: sents.length, avg_sentence_words: round(mean, 1),
      flesch_reading_ease: flesch, reading_time_min: round(nWords / 230, 1) },
    signals,
    sentences: rows,
    signal_reliability: nWords < 150 ? "low" : nWords < 500 ? "medium" : "high",
    detector: { status: "unavailable", score: null, reason: "No validated AI-text detector is used; signals are descriptive only." },
    limitations: LIMITATIONS,
  };
}
