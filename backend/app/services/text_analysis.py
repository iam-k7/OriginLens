"""Explainable stylistic signals computed locally. No AI probability is produced:
stylometry alone is not a validated AI detector."""
import re
import statistics

SENT_SPLIT = re.compile(r"(?<=[.!?])\s+(?=[\"'(\[]?[A-Z0-9])")
WORD = re.compile(r"[A-Za-z][A-Za-z'-]*")
STOCK_PHRASES = ("delve", "tapestry", "it's important to note", "it is important to note", "in conclusion",
                 "in today's fast-paced", "furthermore", "moreover", "additionally", "navigate the",
                 "a testament to", "plays a crucial role", "in the realm of", "unlock the", "seamless",
                 "robust", "leverage", "embark", "ever-evolving", "game-changer", "not only", "foster")

LIMITATIONS = [
    "These are stylistic measurements, not an AI detector. Human writing can show the same patterns.",
    "Short texts (under ~150 words) give unreliable signals.",
    "Edited, translated or templated writing skews these measurements.",
    "No result here proves who or what wrote a text.",
]


def _syllables(word: str) -> int:
    w = word.lower().strip("'")
    groups = re.findall(r"[aeiouy]+", w)
    n = len(groups) - (1 if w.endswith("e") and len(groups) > 1 else 0)
    return max(1, n)


def sentences(text: str) -> list[str]:
    return [s.strip() for s in SENT_SPLIT.split(text.strip()) if s.strip()]


def analyze(text: str) -> dict:
    sents = sentences(text)
    words = WORD.findall(text)
    n_words = len(words)
    lengths = [len(WORD.findall(s)) for s in sents] or [0]
    mean_len = statistics.fmean(lengths) if lengths else 0
    stdev = statistics.pstdev(lengths) if len(lengths) > 1 else 0.0
    burstiness = round(stdev / mean_len, 3) if mean_len else 0.0
    lower = [w.lower() for w in words]
    ttr = round(len(set(lower)) / n_words, 3) if n_words else 0.0
    syll = sum(_syllables(w) for w in words)
    flesch = round(206.835 - 1.015 * (n_words / max(len(sents), 1)) - 84.6 * (syll / max(n_words, 1)), 1)
    low_text = text.lower()
    phrases = {p: low_text.count(p) for p in STOCK_PHRASES if p in low_text}
    starters = [s.split()[0].lower().strip(",") for s in sents if s.split()]
    repeated_starters = {w: c for w in set(starters) if (c := starters.count(w)) >= 3}

    signals = [
        {"name": "Sentence length variation", "value": burstiness,
         "observation": "Low variation (uniform sentence lengths)" if burstiness < 0.35 else "Natural variation",
         "explanation": "Writers usually mix short and long sentences. Very uniform lengths are common "
                        "in templated or machine-generated text, and in some formal writing."},
        {"name": "Vocabulary diversity", "value": ttr,
         "observation": "Repetitive vocabulary" if n_words > 150 and ttr < 0.4 else "Typical range",
         "explanation": "Share of unique words. It falls naturally as text gets longer."},
        {"name": "Stock phrases", "value": sum(phrases.values()), "details": phrases,
         "observation": "Several stock transition phrases" if sum(phrases.values()) >= 3 else "Few or none",
         "explanation": "Phrases over-represented in assistant-style prose. Many humans use them too."},
        {"name": "Repeated sentence openers", "value": len(repeated_starters), "details": repeated_starters,
         "observation": "Repeated openers" if repeated_starters else "Varied openers",
         "explanation": "Starting many sentences the same way reduces flow."},
    ]
    sentence_rows = []
    for i, (s, ln) in enumerate(zip(sents, lengths, strict=False)):
        flags = []
        if ln > 35:
            flags.append("very long")
        if stdev and abs(ln - mean_len) < 0.15 * mean_len:
            flags.append("near-average length")
        if any(p in s.lower() for p in phrases):
            flags.append("stock phrase")
        sentence_rows.append({"index": i, "text": s[:600], "words": ln, "flags": flags})

    reliability = "low" if n_words < 150 else "medium" if n_words < 500 else "high"
    return {
        "stats": {"characters": len(text), "words": n_words, "sentences": len(sents),
                  "avg_sentence_words": round(mean_len, 1), "flesch_reading_ease": flesch,
                  "reading_time_min": round(n_words / 230, 1)},
        "signals": signals,
        "sentences": sentence_rows[:300],
        "signal_reliability": reliability,
        "detector": {"status": "unavailable", "score": None,
                     "reason": "No validated AI-text detector is configured; signals are descriptive only."},
        "limitations": LIMITATIONS,
    }
