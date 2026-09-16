import {
  educationSchema,
  entrySchema,
  linkSchema,
  profileSchema,
  skillGroupSchema,
} from './schema';

/**
 * The résumé content, as records.
 *
 * Parsed through the schemas at module load: a malformed entry fails the build
 * instead of rendering an empty section. Each record carries a `slug` so that a
 * future per-entry page has a stable identifier to use.
 *
 * Nothing here may contain a phone number, an email address, a street address,
 * or the city printed on the résumé. `tests/privacy.spec.ts` enforces that
 * against the built output. See specs/0003-resume-content-page.md.
 */

export const profile = profileSchema.parse({
  name: 'Drew Lewis',
  descriptor: 'Full Stack Engineer & Scrum Lead',
  location: 'Austin, TX',
  careerStart: '2022-07-01',
  // `{years}` is substituted at render time so the figure cannot go stale.
  summary:
    'Self-driven full-stack software engineer with {years} years of experience ' +
    'building and maintaining microservices, observability pipelines, and ' +
    'developer tools. Skilled at shipping software solutions and maintaining ' +
    'them through the whole lifecycle.',
});

export const links = [
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/drew-lewis-94137618b',
    description: 'Professional profile and the best way to get in touch',
  },
  {
    label: 'GitHub',
    href: 'https://github.com/drewlew13',
    description: 'Public repositories and contributions',
  },
].map((link) => linkSchema.parse(link));

export const experience = [
  {
    slug: 'dell-powerstore-metrics-telemetry',
    title: 'Full Stack Engineer, Scrum Lead',
    organisation: 'Dell Technologies',
    context: 'Software Engineer II — PowerStore Metrics and Telemetry Team',
    start: 'Jul 2024',
    end: 'Present',
    location: 'Austin, TX',
    highlights: [
      'Developed and architected multiple backend Java and Python microservices and frontend plugins to address complex stakeholder requirements',
      'Designed and implemented a telemetry ingestion pipeline, processing telemetry updates on a five-minute cadence across a large production install base',
      'Led design and work efforts across multiple teams to define architecture, create development and test strategies, and ship cross-team deliverables',
    ],
  },
  {
    slug: 'dell-idrac-memory',
    title: 'Firmware Engineer',
    organisation: 'Dell Technologies',
    context: 'Engineering Rotation Program — iDRAC Memory Team',
    start: 'Jul 2023',
    end: 'Jul 2024',
    location: 'Remote',
    highlights: [
      'Developed multithreaded firmware in C and C++ for monitoring DIMM temperature, current and voltage, detecting faults and handling interrupts for a remote access controller',
      'Implemented I3C communication between DIMMs, the access controller and CPUs, improving bandwidth and reducing power consumption relative to legacy I2C interfaces',
      'Built, deployed and validated firmware on multiple target hardware configurations to verify functionality and performance',
    ],
  },
  {
    slug: 'dell-powerscale-supportability',
    title: 'Software Supportability Engineer',
    organisation: 'Dell Technologies',
    context: 'Engineering Rotation Program — PowerScale Supportability Team',
    start: 'Jul 2022',
    end: 'Jul 2023',
    location: 'Remote',
    highlights: [
      'Developed customer-facing health check diagnostics that leveraged telemetry and real-time system analysis to identify and prevent issues across storage array deployments',
      'Designed an internal log analysis and collection tool that measurably accelerated root cause analysis',
    ],
  },
].map((entry) => entrySchema.parse(entry));

export const projects = [
  {
    slug: 'rotation-intern-placement-algorithm',
    title: 'Rotation and Intern Placement Algorithm',
    organisation: 'Engineering Rotation Program',
    start: 'Jul 2022',
    end: 'Aug 2025',
    highlights: [
      'Designed a custom matching algorithm to place incoming rotation program engineers and interns by their preferences and skills',
      'Coordinated with HR to scale the matching process across 4 geographies and 10 programs, supporting 600+ annual new participants',
      'Led a team of 4–8 engineers over 3 years to gather feedback from stakeholders and translate requirements into product features',
    ],
  },
  {
    slug: 'ipxe-aes-cipher-suite',
    title: 'AES Cipher Suite',
    organisation: 'iPXE',
    start: 'Jan 2022',
    end: 'Apr 2022',
    highlights: [
      'Implemented AES-GCM cryptographic support for the iPXE bootloader in C, securing network communications',
    ],
  },
  {
    slug: 'purdue-teaching-assistant-advanced-c',
    title: 'Teaching Assistant — Advanced C Programming',
    organisation: 'Purdue University',
    start: 'Aug 2021',
    end: 'Dec 2021',
    highlights: [
      'Mentored students in C programming topics such as pointers, memory management, data structures and recursion',
      'Held 8–10 hours of office hours weekly, coordinating with faculty and teaching staff to support a course serving 400+ students',
    ],
  },
].map((entry) => entrySchema.parse(entry));

export const education = [
  {
    slug: 'purdue-university',
    institution: 'Purdue University',
    qualification: 'Bachelor of Science, Computer Engineering',
    focus: 'Minor in Management',
    start: '2018',
    end: '2022',
    location: 'West Lafayette, IN',
  },
].map((entry) => educationSchema.parse(entry));

export const skills = [
  {
    name: 'Languages',
    items: [
      'C',
      'C++',
      'Python',
      'Java',
      'Bash',
      'JavaScript/TypeScript',
      'HTML/CSS',
      'C#',
    ],
  },
  {
    name: 'Skills & Proficiencies',
    items: [
      'Git',
      'Linux',
      'Docker',
      'Apache Kafka',
      'RabbitMQ',
      'RESTful APIs',
      'PostgreSQL',
      'Cassandra',
      'MongoDB',
      'Jenkins',
      'CI/CD',
      'Jira',
      'Confluence',
      'MATLAB',
      'QTest',
    ],
  },
  {
    name: 'Frameworks & Practices',
    items: [
      'Spring',
      'Angular',
      'Agile/Scrum',
      'OpenTelemetry',
      'Spec-Driven Development',
      'Prompt Engineering',
    ],
  },
].map((group) => skillGroupSchema.parse(group));

/** Whole years elapsed since a date, in UTC. */
export function yearsSince(isoDate: string, now = new Date()): number {
  const start = new Date(`${isoDate}T00:00:00Z`);
  let years = now.getUTCFullYear() - start.getUTCFullYear();
  const months = now.getUTCMonth() - start.getUTCMonth();
  if (months < 0 || (months === 0 && now.getUTCDate() < start.getUTCDate())) {
    years -= 1;
  }
  return years;
}

/** The summary with the years figure filled in, so it cannot go stale. */
export function renderSummary(now = new Date()): string {
  return profile.summary.replace(
    '{years}',
    String(yearsSince(profile.careerStart, now)),
  );
}
