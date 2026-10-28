import assert from "node:assert/strict";
import { test } from "node:test";
import { analyzeText } from "./textAnalysis.ts";

const SAMPLE = ("Moreover, it is important to note that the tapestry of ideas matters. Furthermore, we must delve " +
  "deeper. Additionally, the realm of thought expands. ").repeat(5);

test("signals are descriptive only and count stock phrases and sentences", () => {
  const out = analyzeText(SAMPLE);
  assert.equal(out.detector.score, null);
  const byName = Object.fromEntries(out.signals.map((s) => [s.name, s]));
  assert.ok(Number(byName["Stock phrases"].value) >= 3);
  assert.equal(out.stats.sentences, 15);
  assert.equal(byName["Repeated sentence openers"].value, 3); // moreover, furthermore, additionally ×5 each
  assert.equal(out.signal_reliability, "low");
});

test("empty-ish text does not crash", () => {
  const out = analyzeText("Hi.");
  assert.equal(out.stats.words, 1);
  assert.equal(out.sentences.length, 1);
});
