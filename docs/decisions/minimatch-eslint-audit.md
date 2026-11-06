# Scope minimatch 11.0.5 to typescript-estree 8.63.0

On 2026-11-06 a full npm audit on main reported eight moderate findings from
[one minimatch advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249).
The affected copy is a development dependency of the TypeScript ESLint parser.
The lockfile also contains minimatch 3.1.5 for other consumers. It is outside
the affected range (>=7.0.0, <11.0.1).

## Why an exception is needed

eslint-config-next 16.4.1 declares typescript-eslint ^8.56.0. The family
uses matching versions of its parser, plugin and typescript-estree. Across
the stable versions in this range, typescript-estree declares minimatch
^9.0.5 or ^10.2.2. Even [8.72.1](https://registry.npmjs.org/@typescript-eslint%2ftypescript-estree/8.72.1)
still requires ^10.2.2. Updating the family within its supported range
would therefore retain the vulnerable major. The pinned exception changes
only the dependency of the [installed consumer, 8.63.0](https://registry.npmjs.org/@typescript-eslint%2ftypescript-estree/8.63.0).
11.0.1 introduced the upstream fix. [11.0.5](https://github.com/isaacs/minimatch/compare/v11.0.1...v11.0.5)
also bounds expansion work and rejects incomplete expansions.

## Compatibility and removal

The published consumer uses one CommonJS named export. Its
`dist/useProgramFromProjectService.js` calls
`minimatch(filePath, pattern, { dot: true })` for project-service default
project inclusion. Both versions expose that function via `require`.
The consumer does not use regex internals or optimizer level 2. Its validator
rejects double globstars in `allowDefaultProject` patterns. The repository's
ESLint config does not enable this project-service option. We confirmed the
affected installation and audit finding; no application input path was identified.

Minimatch 11.0.5 requires Node 20 or >=22. The repository pins Node 24.18.0.
Its new matching engine, `@isaacs/nonrecursive-glob-match@1.1.0`, is the only
additional package. With both matcher versions the actual parser's
`parseForESLint` supplied a TypeScript program for an out-of-project
`.config.js` allowed by `*.js` and rejected an out-of-project `omitted.ts`.
The same ordinary wildcard, dotfile, brace and nonmatching paths also gave
the same results with the consumer's `{ dot: true }` options.

In a bounded variant of the [upstream regression test](https://github.com/isaacs/minimatch/blob/v11.0.5/test/preprocess-limits.ts),
seven repetitions of `**/../a/b` at optimization level 2 with
`braceExpandMax: 32` expanded to 128 alternatives on 10.2.5. On 11.0.5 the
matcher threw `RangeError` and continued to accept below-limit patterns.
A clean npm install from the new lockfile followed by a full `npm audit`
reported zero vulnerabilities.

On the next typescript-eslint update, check the new consumer's declared range
and rerun the full audit. Remove the exception when the upstream dependency
resolves safely. Its exact parent-version guard ensures a future parser
cannot silently inherit this exception without another compatibility review.
