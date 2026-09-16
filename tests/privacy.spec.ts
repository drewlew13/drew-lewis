import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

/**
 * Guards the details that must never be published: a phone number, a street
 * address, and any email address other than the one approved for contact.
 * See specs/0003-resume-content-page.md and specs/0005-contact-email-link.md.
 *
 * These match on SHAPE, never on the withheld values themselves. Writing the
 * real phone number into this file would commit to a public repository the
 * exact string the test exists to keep out — `tests/` is as public as `src/`.
 * Matching on shape also catches a number that arrives by a route nobody
 * predicted, which a literal comparison would miss.
 */

const DIST = fileURLToPath(new URL('../dist', import.meta.url));

const TEXTUAL = new Set([
  '.html',
  '.css',
  '.js',
  '.mjs',
  '.json',
  '.svg',
  '.txt',
  '.xml',
  '.webmanifest',
]);

/**
 * The only address allowed to appear. Naming it here is safe — it is published
 * on the site by design. Every other address fails, which is how the withheld
 * personal address stays out without this file ever naming it.
 */
const APPROVED_EMAIL = 'drewlew1313+portfolio@gmail.com';

const MAILTO = /mailto:[^"'\s<>)]+/gi;

/** Every mailto in `text` whose address is not the approved one. */
function unapprovedMailtos(text: string): string[] {
  return [...text.matchAll(MAILTO)]
    .map((match) => match[0].slice('mailto:'.length).split('?')[0])
    .map((address) => {
      try {
        return decodeURIComponent(address);
      } catch {
        return address;
      }
    })
    .filter((address) => address.toLowerCase() !== APPROVED_EMAIL);
}

const FORBIDDEN: { name: string; pattern: RegExp }[] = [
  {
    name: 'telephone number (NNN-NNN-NNNN, NNN.NNN.NNNN, NNN NNN NNNN)',
    pattern: /\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/,
  },
  {
    name: 'telephone number, parenthesised area code',
    pattern: /\(\d{3}\)\s?\d{3}[-.\s]?\d{4}/,
  },
  {
    name: 'telephone number, international prefix',
    pattern: /\+\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
  },
  {
    name: 'tel: link',
    pattern: /\btel:\+?\d/i,
  },
  {
    name: 'street address (number followed by a street-type word)',
    pattern:
      /\b\d{1,6}\s+[A-Z][A-Za-z.]*(?:\s+[A-Z][A-Za-z.]*)*\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Circle|Cir|Way|Terrace|Ter|Place|Pl)\b/,
  },
];

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return [full];
  });
}

test('the built site contains no withheld personal details', () => {
  expect(statSync(DIST).isDirectory()).toBe(true);

  const files = walk(DIST).filter((file) =>
    TEXTUAL.has(extname(file).toLowerCase()),
  );
  expect(files.length).toBeGreaterThan(0);

  const violations: string[] = [];

  for (const file of files) {
    const contents = readFileSync(file, 'utf8');
    for (const { name, pattern } of FORBIDDEN) {
      const match = pattern.exec(contents);
      if (match) {
        // Report the rule and the location, never the matched value — a CI log
        // is public too.
        violations.push(
          `${relative(DIST, file)} matches forbidden pattern: ${name}`,
        );
      }
    }

    if (unapprovedMailtos(contents).length > 0) {
      violations.push(
        `${relative(DIST, file)} links to an email address that is not the approved contact address`,
      );
    }
  }

  expect(violations, violations.join('\n')).toEqual([]);
});

test('the forbidden patterns actually match what they claim to', () => {
  // A guard that cannot fail is not a guard. Every sample below is invented —
  // 555 numbers are reserved for fiction — and none is Drew's.
  const samples = [
    '555-555-0199',
    '(555) 555-0199',
    '+1 555 555 0199',
    'tel:+15555550199',
    '1600 Pennsylvania Avenue',
  ];

  for (const sample of samples) {
    const matched = FORBIDDEN.some(({ pattern }) => pattern.test(sample));
    expect(matched, `no forbidden pattern matched: ${sample}`).toBe(true);
  }

  // And that it does not fire on things the site legitimately contains.
  const benign = [
    'Austin, TX',
    '2018 – 2022',
    'Jul 2024 – Present',
    '600+ annual new participants',
    'https://github.com/drewlew13',
    `mailto:${APPROVED_EMAIL}`,
    '400+ students',
    '8–10 hours',
  ];

  for (const sample of benign) {
    const matched = FORBIDDEN.filter(({ pattern }) => pattern.test(sample));
    expect(
      matched.map((m) => m.name),
      `false positive on: ${sample}`,
    ).toEqual([]);
  }
});

test('the email allow-list accepts only the approved contact address', () => {
  expect(
    unapprovedMailtos(`<a href="mailto:${APPROVED_EMAIL}">Contact</a>`),
  ).toEqual([]);

  // Percent-encoded form of the same address is still the same address.
  expect(
    unapprovedMailtos(
      '<a href="mailto:drewlew1313%2Bportfolio@gmail.com">x</a>',
    ),
  ).toEqual([]);

  // Any other address is a leak, including a near-miss on the sub-address.
  expect(
    unapprovedMailtos('<a href="mailto:someone@example.com">x</a>'),
  ).toEqual(['someone@example.com']);
  expect(
    unapprovedMailtos('<a href="mailto:drewlew1313@gmail.com">x</a>'),
  ).toEqual(['drewlew1313@gmail.com']);
});
