// Re-evaluate saved computed browser styles; this does not launch a browser.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';

function color(value) {
  const n = value.match(/[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi)?.map(Number);
  if (!n || n.length < 3) throw new Error(`Unsupported color: ${value}`);
  if (value.startsWith('rgb')) return [...n.slice(0, 3).map(v => v / 255), n[3] ?? 1];
  if (value.startsWith('color(srgb ')) return [...n.slice(0, 3), n[3] ?? 1];
  if (value.startsWith('oklab(')) {
    const [L, a, b] = n;
    const l = (L + .3963377774 * a + .2158037573 * b) ** 3;
    const m = (L - .1055613458 * a - .0638541728 * b) ** 3;
    const s = (L - .0894841775 * a - 1.291485548 * b) ** 3;
    const linear = [4.0767416621*l - 3.3077115913*m + .2309699292*s,
      -1.2684380046*l + 2.6097574011*m - .3413193965*s,
      -.0041960863*l - .7034186147*m + 1.707614701*s];
    return [...linear.map(v => Math.max(0, Math.min(1, v <= .0031308 ? 12.92*v : 1.055*v**(1/2.4)-.055))), n[3] ?? 1];
  }
  throw new Error(`Unsupported color: ${value}`);
}
function blend(front, back) { return [...front.slice(0, 3).map((v, i) => v*front[3] + back[i]*(1-front[3])), 1]; }
function luminance(c) { return c.slice(0, 3).map(v => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4).reduce((s, v, i) => s+v*[.2126,.7152,.0722][i], 0); }
function ratio(a, b) { const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y-x); return (hi+.05)/(lo+.05); }
assert.equal(ratio([1,1,1,1], [0,0,0,1]), 21);
const green = color('oklab(0.433112 -0.0817717 0.0184836 / 0.1)');
// Browser serialization and the approximate Oklab matrix may differ below one 8-bit channel step.
assert.ok(green.slice(0,3).every((v, i) => Math.abs(v-[13,95,71][i]/255) < 1/255));

const samples = JSON.parse(await readFile(new URL('./browser-samples.json', import.meta.url), 'utf8'));
assert.equal(samples.contrast.filter(s => s.kind === 'text').length, 39, 'Expected the complete three-palette text sample, including item notes and panel descriptions');
assert.equal(samples.contrast.filter(s => s.kind === 'border').length, 9, 'Expected normal/error input and select borders');
assert.equal(samples.views.length, 7, 'Expected the recorded component and application viewports');
for (const v of samples.views) {
  assert.equal(v.width, v.requested.width, v.name);
  assert.equal(v.height, v.requested.height, v.name);
  assert.ok(v.scrollWidth <= v.clientWidth, v.name);
  assert.equal(v.fonts, 'loaded', v.name);
}
const results = samples.contrast.map(sample => {
  const background = sample.backgrounds.slice().reverse().reduce((back, c) => blend(color(c), back), [1,1,1,1]);
  const required = sample.kind === 'border' ? 3 : 4.5;
  const actual = ratio(blend(color(sample.color), background), background);
  assert.ok(actual >= required, `${sample.palette}/${sample.role}: ${actual.toFixed(3)} < ${required}`);
  return { palette: sample.palette, role: sample.role, kind: sample.kind, required, ratio: Number(actual.toFixed(3)) };
});
const report = { source: 'Saved computed styles from the real component board, 30.10.2026; not a fresh browser run or full WCAG audit',
  textPairs: results.filter(r => r.kind === 'text').length, borderPairs: results.filter(r => r.kind === 'border').length,
  minimumText: Math.min(...results.filter(r => r.kind === 'text').map(r => r.ratio)),
  minimumBorder: Math.min(...results.filter(r => r.kind === 'border').map(r => r.ratio)), results };
await writeFile(new URL('./contrast-result.json', import.meta.url), JSON.stringify(report, null, 2)+'\n');
console.log(JSON.stringify({ textPairs: report.textPairs, borderPairs: report.borderPairs, minimumText: report.minimumText, minimumBorder: report.minimumBorder }));
