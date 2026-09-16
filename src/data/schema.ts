import { z } from 'zod';

/**
 * Schemas for the résumé content.
 *
 * These are parsed at module load, so a malformed or incomplete record fails
 * `npm run build` rather than rendering a blank section. `zod` is a direct
 * dependency rather than Astro's `astro:content` re-export because the test
 * suite imports these records too, and `astro:content` is a virtual module that
 * only exists inside Astro's build.
 *
 * See specs/0003-resume-content-page.md.
 */

const nonEmpty = z.string().trim().min(1);

/**
 * A link in the link bank: an absolute https URL, or the one approved mailto.
 *
 * The mailto pattern rejects `%` outright, which keeps the `+` in the
 * sub-address literal. A browser hands the href to the mail client without
 * decoding it, so `%2B` arrives as those three characters and only a
 * conformant client turns it back into `+`. The literal is unambiguous
 * everywhere. See specs/0005-contact-email-link.md.
 */
const httpsUrl = z.string().url().startsWith('https://');

const mailtoUrl = z
  .string()
  .regex(
    /^mailto:[^\s@%]+@[^\s@%]+\.[^\s@%]+$/,
    'mailto must be a single address, with no query string and no percent-encoding',
  );

export const linkSchema = z.object({
  label: nonEmpty,
  href: z.union([httpsUrl, mailtoUrl]),
  description: nonEmpty,
});

export const profileSchema = z.object({
  name: nonEmpty,
  descriptor: nonEmpty,
  location: nonEmpty,
  summary: nonEmpty,
  /** Start of professional experience, used to derive the years figure. */
  careerStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const entrySchema = z.object({
  /** Stable identifier, used for anchors now and for per-entry pages later. */
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be kebab-case'),
  title: nonEmpty,
  organisation: nonEmpty,
  /** Team or programme within the organisation, where there is one. */
  context: nonEmpty.optional(),
  start: nonEmpty,
  end: nonEmpty,
  location: nonEmpty.optional(),
  highlights: z.array(nonEmpty).min(1),
});

export const educationSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be kebab-case'),
  institution: nonEmpty,
  qualification: nonEmpty,
  focus: nonEmpty.optional(),
  start: nonEmpty,
  end: nonEmpty,
  location: nonEmpty,
});

/**
 * The headshot. `alt` and `isPlaceholder` must agree, enforced here rather than
 * only in a test: a placeholder must not ship described as a photograph of
 * Drew, and the real photograph must not ship still described as a placeholder.
 *
 * `file` is a name, not an import. The tests read this record, and a bundler
 * image import would not resolve outside Astro's build — the same reason `zod`
 * is a direct dependency. The page does the importing.
 *
 * See specs/0006-about-section-headshot.md.
 */
export const headshotSchema = z
  .object({
    file: nonEmpty,
    alt: nonEmpty,
    isPlaceholder: z.boolean(),
  })
  .superRefine((value, ctx) => {
    const saysPlaceholder = /placeholder/i.test(value.alt);
    if (value.isPlaceholder && !saysPlaceholder) {
      ctx.addIssue({
        code: 'custom',
        path: ['alt'],
        message:
          'isPlaceholder is true, so the alt text must say it is a placeholder',
      });
    }
    if (!value.isPlaceholder && saysPlaceholder) {
      ctx.addIssue({
        code: 'custom',
        path: ['alt'],
        message:
          'isPlaceholder is false, so the alt text must not call it a placeholder',
      });
    }
  });

export const skillGroupSchema = z.object({
  name: nonEmpty,
  items: z.array(nonEmpty).min(1),
});

export type Link = z.infer<typeof linkSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type Entry = z.infer<typeof entrySchema>;
export type Education = z.infer<typeof educationSchema>;
export type SkillGroup = z.infer<typeof skillGroupSchema>;
export type Headshot = z.infer<typeof headshotSchema>;
