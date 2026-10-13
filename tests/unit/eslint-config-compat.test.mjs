import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import path from 'node:path';

const root = process.env.ESLINT_REGRESSION_ROOT || process.cwd();
const require = createRequire(path.join(root, 'package.json'));
const { ESLint } = require('eslint');

async function messages(code, filePath, rules = {}) {
  const eslint = new ESLint({ cwd: root, overrideConfig: [{ rules }] });
  const [result] = await eslint.lintText(code, { filePath });
  assert.equal(result.fatalErrorCount, 0, JSON.stringify(result.messages));
  return result.messages.map(({ ruleId, severity }) => ({ ruleId, severity }))
    .sort((a, b) => a.ruleId.localeCompare(b.ruleId));
}

test('Babel parser resolves declared globals while no-undef still rejects missing globals', async () => {
  const result = await messages(`/* global declaredProbe */
export const probe = () => [declaredProbe, missingProbe];`,
  'src/eslint-compat-probe.mjs', { 'no-undef': 'error' });
  assert.deepEqual(result, [{ ruleId: 'no-undef', severity: 2 }]);
});

test('React, accessibility and Next JSX rules retain their negative diagnostics', async () => {
  const result = await messages(`import { memo } from 'react';
export default memo(function () { return <img src="/probe.png" />; });`,
  'src/eslint-compat-probe.tsx');
  assert.deepEqual(result, [
    { ruleId: '@next/next/no-img-element', severity: 1 },
    // eslint-config-next's existing baseline configures alt-text as a warning.
    { ruleId: 'jsx-a11y/alt-text', severity: 1 },
    { ruleId: 'react/display-name', severity: 2 },
  ]);
});

test('TypeScript import resolver accepts the app alias and rejects an absent module', async () => {
  const result = await messages(`import { getAppBaseUrl } from '@/lib/email/config';
import missing from './__absent_eslint_compat_probe__';
export const probe = () => [getAppBaseUrl(), missing];`,
  'src/eslint-compat-probe.ts', { 'import/no-unresolved': 'error' });
  assert.deepEqual(result, [{ ruleId: 'import/no-unresolved', severity: 2 }]);
});
