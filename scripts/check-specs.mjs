/**
 * Validates the spec directory and keeps specs/README.md in sync.
 *
 * The constitution says specs carry a status and a derivation date, and that a
 * spec in `done` is frozen. Rules that are only written down drift; these are
 * checked, so `npm run verify` refuses work that breaks them.
 *
 *   node scripts/check-specs.mjs            validate, and check the index
 *   node scripts/check-specs.mjs --write    validate, and rewrite the index
 *   node scripts/check-specs.mjs --frozen <ref>
 *                                           additionally fail if a spec that is
 *                                           `done` on <ref> has an edited body
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SPECS_DIR = fileURLToPath(new URL('../specs', import.meta.url));
const INDEX_PATH = join(SPECS_DIR, 'README.md');
const INDEX_REL = 'specs/README.md';

const STATUSES = [
  'draft',
  'accepted',
  'in-progress',
  'done',
  'superseded',
  'withdrawn',
];
const FILE_RE = /^(\d{4})-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const IMPLEMENTED_ALLOWED = ['done', 'superseded'];
const REQUIRED = ['id', 'title', 'status', 'derived'];
const KNOWN = [...REQUIRED, 'implemented', 'supersedes', 'superseded-by'];

const errors = [];
const fail = (file, message) => errors.push(`${file}: ${message}`);

/** Split a spec into its front matter and the body below it. */
function split(raw) {
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(raw);
  if (!match) return null;
  return { frontMatter: match[1], body: raw.slice(match[0].length) };
}

/** Front matter is flat `key: value` only — no nesting, so no YAML dependency. */
function parseFrontMatter(text, file) {
  const fields = {};
  for (const [index, line] of text.split('\n').entries()) {
    if (line.trim() === '') continue;
    const match = /^([a-z][a-z-]*):[ \t]*(.*)$/.exec(line);
    if (!match) {
      fail(
        file,
        `front matter line ${index + 1} is not \`key: value\`: ${line}`,
      );
      continue;
    }
    const [, key, value] = match;
    if (!KNOWN.includes(key)) {
      fail(
        file,
        `unknown front matter key \`${key}\` (known: ${KNOWN.join(', ')})`,
      );
      continue;
    }
    if (key in fields) fail(file, `duplicate front matter key \`${key}\``);
    fields[key] = value.trim();
  }
  return fields;
}

function isValidDate(value) {
  if (!DATE_RE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

const files = readdirSync(SPECS_DIR)
  .filter(
    (name) =>
      name.endsWith('.md') && name !== 'README.md' && name !== 'TEMPLATE.md',
  )
  .sort();

const specs = [];

for (const file of files) {
  const match = FILE_RE.exec(file);
  if (!match) {
    fail(file, 'filename must be NNNN-kebab-case-title.md');
    continue;
  }

  const raw = readFileSync(join(SPECS_DIR, file), 'utf8');
  const parts = split(raw);
  if (!parts) {
    fail(file, 'missing front matter delimited by --- lines');
    continue;
  }

  const fields = parseFrontMatter(parts.frontMatter, file);

  for (const key of REQUIRED) {
    if (!fields[key])
      fail(file, `missing required front matter key \`${key}\``);
  }

  if (fields.id && fields.id !== match[1]) {
    fail(
      file,
      `id \`${fields.id}\` does not match filename prefix \`${match[1]}\``,
    );
  }
  if (fields.status && !STATUSES.includes(fields.status)) {
    fail(
      file,
      `status \`${fields.status}\` is not one of: ${STATUSES.join(', ')}`,
    );
  }
  if (fields.derived && !isValidDate(fields.derived)) {
    fail(file, `derived \`${fields.derived}\` is not a YYYY-MM-DD date`);
  }
  if (fields.implemented && !isValidDate(fields.implemented)) {
    fail(
      file,
      `implemented \`${fields.implemented}\` is not a YYYY-MM-DD date`,
    );
  }

  // `done` asserts the work landed, so it requires a date. `superseded` may
  // also carry one: a spec can be implemented and replaced later, and dropping
  // the date would erase the history the freeze rule exists to protect. No
  // other status describes work that shipped.
  if (fields.status === 'done' && !fields.implemented) {
    fail(file, 'status is `done` but `implemented` is not set');
  }
  if (fields.implemented && !IMPLEMENTED_ALLOWED.includes(fields.status)) {
    fail(
      file,
      `\`implemented\` is set but status is \`${fields.status}\` — only ` +
        `${IMPLEMENTED_ALLOWED.map((allowed) => `\`${allowed}\``).join(' and ')} describe work that shipped`,
    );
  }
  if (
    fields.implemented &&
    fields.derived &&
    isValidDate(fields.implemented) &&
    isValidDate(fields.derived) &&
    fields.implemented < fields.derived
  ) {
    fail(file, 'implemented date is earlier than derived date');
  }
  if (fields.status === 'superseded' && !fields['superseded-by']) {
    fail(file, 'status is `superseded` but `superseded-by` is not set');
  }
  if (parts.body.trim() === '') fail(file, 'body is empty');

  specs.push({ file, fields });
}

const byId = new Map();
for (const spec of specs) {
  const id = spec.fields.id;
  if (!id) continue;
  if (byId.has(id))
    fail(spec.file, `duplicate id \`${id}\` (also ${byId.get(id).file})`);
  byId.set(id, spec);
}

// Cross-references must point at specs that exist, or the index lies.
for (const spec of specs) {
  for (const key of ['supersedes', 'superseded-by']) {
    const value = spec.fields[key];
    if (!value) continue;
    for (const ref of value.split(',').map((part) => part.trim())) {
      if (!byId.has(ref))
        fail(spec.file, `\`${key}\` points at unknown spec \`${ref}\``);
      else if (ref === spec.fields.id)
        fail(spec.file, `\`${key}\` points at itself`);
    }
  }
}

function renderIndex() {
  const rows = specs
    .filter((spec) => spec.fields.id)
    .sort((a, b) => a.fields.id.localeCompare(b.fields.id))
    .map((spec) => {
      const { id, title, status, derived, implemented } = spec.fields;
      return `| [${id}](./${spec.file}) | ${title} | \`${status}\` | ${derived} | ${implemented ?? '—'} |`;
    });

  return `<!-- Generated by scripts/check-specs.mjs. Run \`npm run specs:index\` to update. -->

# Specs

Every non-trivial change starts here. See CONSTITUTION.md, Article 9.

A spec in \`done\` is a historical record and is not edited to match later
reality — supersede it with a new spec instead.

| ID | Title | Status | Derived | Implemented |
| --- | --- | --- | --- | --- |
${rows.length ? rows.join('\n') : '| — | _No specs yet._ | | | |'}

Statuses: ${STATUSES.map((status) => `\`${status}\``).join(', ')}.
`;
}

const write = process.argv.includes('--write');

if (errors.length === 0) {
  const expected = renderIndex();
  let actual;
  try {
    actual = readFileSync(INDEX_PATH, 'utf8');
  } catch {
    actual = ''; // No index yet; treat as empty so --write creates it.
  }

  if (write) {
    if (actual !== expected) {
      writeFileSync(INDEX_PATH, expected);
      console.warn(`Updated ${INDEX_REL}`);
    }
  } else if (actual !== expected) {
    fail(INDEX_REL, 'out of date — run `npm run specs:index`');
  }
}

// A spec that was `done` before this change is frozen. Its status and
// supersede links may still change; its body may not.
const frozenIndex = process.argv.indexOf('--frozen');
if (frozenIndex !== -1) {
  const ref = process.argv[frozenIndex + 1];
  if (!ref) {
    console.error('--frozen requires a git ref to compare against');
    process.exit(2);
  }

  for (const file of files) {
    const path = `specs/${file}`;
    let before;
    try {
      // stderr is ignored: a spec added on this branch legitimately has no
      // version on the base ref, and git reports that as a fatal error.
      before = execFileSync('git', ['show', `${ref}:${path}`], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
    } catch {
      continue; // New spec on this branch; nothing to freeze.
    }

    const previous = split(before);
    if (!previous) continue;
    if (!/^status:[ \t]*done[ \t]*$/m.test(previous.frontMatter)) continue;

    const current = split(readFileSync(join(SPECS_DIR, file), 'utf8'));
    if (!current || current.body !== previous.body) {
      fail(
        path,
        'is `done` and frozen — its body cannot be edited. Write a new spec that supersedes it.',
      );
    }
  }
}

if (errors.length > 0) {
  console.error('Spec check failed:\n');
  for (const error of errors) console.error(`  - ${error}`);
  console.error('');
  process.exit(1);
}

console.warn(
  `Spec check passed (${specs.length} spec${specs.length === 1 ? '' : 's'}).`,
);
