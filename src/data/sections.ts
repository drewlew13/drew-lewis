import { z } from 'zod';

/**
 * The homepage sections, in the order they appear.
 *
 * This is the single source of truth for section identifiers. The page renders
 * its headings from it and the site header builds its navigation from it, so a
 * new section or a renamed id reaches both at once — nobody has to remember to
 * update the header, and `tests/navigation.spec.ts` fails the build if the two
 * ever disagree.
 *
 * `title` is the visible section heading; `navLabel` is the shorter form the
 * header uses, because "Projects & Other Experience" does not fit a nav bar.
 *
 * See specs/0004-section-driven-navigation.md.
 */

const sectionSchema = z.object({
  id: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'section id must be kebab-case'),
  title: z.string().trim().min(1),
  navLabel: z.string().trim().min(1),
});

export const sections = [
  { id: 'about', title: 'About', navLabel: 'About' },
  { id: 'experience', title: 'Work Experience', navLabel: 'Experience' },
  {
    id: 'projects',
    title: 'Projects & Other Experience',
    navLabel: 'Projects',
  },
  { id: 'education', title: 'Education', navLabel: 'Education' },
  { id: 'skills', title: 'Technical Skills', navLabel: 'Skills' },
] as const;

// Validated at module load: a malformed record fails the build.
sections.forEach((entry) => sectionSchema.parse(entry));

const ids = sections.map((entry) => entry.id);
if (new Set(ids).size !== ids.length) {
  throw new Error(`Duplicate section id in sections: ${ids.join(', ')}`);
}

export type SectionId = (typeof sections)[number]['id'];

/**
 * Look a section up by id, for the page to spread onto its heading.
 *
 * The parameter is typed to the literal ids, so renaming one in the list above
 * makes every call site a type error rather than a silently missing section.
 */
export function section(id: SectionId): { id: string; title: string } {
  const found = sections.find((entry) => entry.id === id);
  if (!found) throw new Error(`Unknown section id: ${id}`);
  return { id: found.id, title: found.title };
}
