/**
 * profile.ts — ALL personal content lives here.
 *
 * "Alex Moreno" is a FICTIONAL person used so every template in the gallery shows
 * the same data. Replace everything in this file with your own information.
 *
 * Rules that keep the assistant honest:
 * - Descriptions stay qualitative. Where you have a real number, replace the
 *   `[YOUR RESULT]` placeholder; never invent metrics.
 * - Project `tags` must use skill names from `skills` below. The "skills by
 *   project" matrix is derived from those tags, so skills are shown with evidence
 *   instead of a self-rating.
 * - Ids (`projects[].id`, `experience[].id`, `skills[].id`) are what Claude's tools
 *   reference. The API validates every id against this file.
 */

export type Lang = 'en' | 'es';
/** A string in both languages. */
export type L = { en: string; es: string };

export const loc = (value: L, lang: Lang) => value[lang];

export const person = {
  name: 'Alex Moreno',
  firstName: 'Alex',
  role: { en: 'Frontend Engineer', es: 'Ingeniero Frontend' } satisfies L,
  location: { en: 'Remote · UTC-5', es: 'Remoto · UTC-5' } satisfies L,
  email: 'hello@example.com',
  links: {
    github: 'https://github.com/your-user',
    linkedin: 'https://www.linkedin.com/in/your-user',
  },
  summary: {
    en: 'Frontend engineer who designs interfaces and makes them work. I care about accessible UI, motion with purpose and putting AI where it actually helps.',
    es: 'Ingeniero frontend que diseña interfaces y las hace funcionar. Me importan la UI accesible, el movimiento con propósito y poner la IA donde de verdad ayuda.',
  } satisfies L,
  availability: {
    en: 'Open to frontend and design-engineering roles. [YOUR AVAILABILITY]',
    es: 'Abierto a roles de frontend y design engineering. [TU DISPONIBILIDAD]',
  } satisfies L,
};

export type SkillGroupId = 'frontend' | 'uiux' | 'backend' | 'ai';

export type SkillGroup = { id: SkillGroupId; label: L; items: string[] };

export const skills: SkillGroup[] = [
  {
    id: 'frontend',
    label: { en: 'Frontend', es: 'Frontend' },
    items: ['TypeScript', 'React', 'Astro', 'Web Components', 'CSS / Tailwind', 'Accessibility'],
  },
  {
    id: 'uiux',
    label: { en: 'UI/UX', es: 'UI/UX' },
    items: ['Design systems', 'Interaction design', 'Prototyping', 'Motion'],
  },
  {
    id: 'backend',
    label: { en: 'Backend', es: 'Backend' },
    items: ['Node.js', 'WebSockets', 'REST APIs', 'PostgreSQL'],
  },
  {
    id: 'ai',
    label: { en: 'AI', es: 'IA' },
    items: ['Claude API', 'Tool use', 'Prompt design'],
  },
];

/** Visual used to draw the project thumbnail with pure CSS (no images). */
export type ProjectVisual = 'slider' | 'queue' | 'map' | 'chat';

export type Project = {
  id: string;
  name: L;
  description: L;
  kind: L;
  tags: string[];
  visual: ProjectVisual;
  /** Replace with a real, verifiable outcome or delete the line. */
  outcome: L;
  repo?: string;
  live?: string;
};

export const projects: Project[] = [
  {
    id: 'loan-simulator',
    name: { en: 'Loan simulator', es: 'Simulador de préstamos' },
    description: {
      en: 'Interactive loan calculator built as framework-free Web Components, with an accessible amortization table.',
      es: 'Calculadora de préstamos interactiva hecha con Web Components sin framework, con una tabla de amortización accesible.',
    },
    kind: { en: 'Web Components', es: 'Web Components' },
    tags: ['Web Components', 'TypeScript', 'Accessibility', 'Design systems'],
    visual: 'slider',
    outcome: { en: 'Outcome: [YOUR RESULT]', es: 'Resultado: [TU RESULTADO]' },
    repo: 'https://github.com/your-user/loan-simulator',
  },
  {
    id: 'job-queue-dashboard',
    name: { en: 'Live job queue dashboard', es: 'Dashboard de colas en vivo' },
    description: {
      en: 'Real-time view of background jobs over WebSockets, with filters, status changes and retry controls.',
      es: 'Vista en tiempo real de trabajos en segundo plano vía WebSockets, con filtros, cambios de estado y reintentos.',
    },
    kind: { en: 'Real-time', es: 'Tiempo real' },
    tags: ['React', 'TypeScript', 'WebSockets', 'Node.js', 'Interaction design'],
    visual: 'queue',
    outcome: { en: 'Outcome: [YOUR RESULT]', es: 'Resultado: [TU RESULTADO]' },
    repo: 'https://github.com/your-user/job-queue-dashboard',
  },
  {
    id: 'map-filters',
    name: { en: 'Map filters', es: 'Filtros de mapa' },
    description: {
      en: 'Faceted filters synced with a map-style results view. Leaflet-style UI patterns, keyboard-first, no map tiles needed.',
      es: 'Filtros por facetas sincronizados con una vista de resultados tipo mapa. Patrones de UI estilo Leaflet, primero teclado, sin teselas.',
    },
    kind: { en: 'UI pattern', es: 'Patrón de UI' },
    tags: ['Astro', 'TypeScript', 'CSS / Tailwind', 'Interaction design', 'Accessibility', 'REST APIs'],
    visual: 'map',
    outcome: { en: 'Outcome: [YOUR RESULT]', es: 'Resultado: [TU RESULTADO]' },
    live: 'https://example.com/map-filters',
  },
  {
    id: 'portfolio-ai',
    name: { en: 'Portfolio with AI assistant', es: 'Portafolio con asistente de IA' },
    description: {
      en: 'This site: a chat-first portfolio where answers arrive as real components chosen by Claude tool use, each one cited.',
      es: 'Este sitio: un portafolio centrado en el chat donde las respuestas llegan como componentes reales elegidos por Claude con tool use, cada una citada.',
    },
    kind: { en: 'AI', es: 'IA' },
    tags: ['Astro', 'Web Components', 'Claude API', 'Tool use', 'Prompt design', 'Motion', 'Accessibility'],
    visual: 'chat',
    outcome: { en: 'Outcome: [YOUR RESULT]', es: 'Resultado: [TU RESULTADO]' },
    repo: 'https://github.com/your-user/portfolio',
  },
];

export type Experience = {
  id: string;
  company: string;
  role: L;
  start: string;
  /** `null` means "present". */
  end: string | null;
  summary: L;
};

export const experience: Experience[] = [
  {
    id: 'northwind-labs',
    company: 'Northwind Labs',
    role: { en: 'Senior Frontend Engineer', es: 'Ingeniero Frontend Senior' },
    start: '2024',
    end: null,
    summary: {
      en: 'Leads the design system and builds data-heavy dashboards for internal teams.',
      es: 'Lidera el design system y construye dashboards con muchos datos para equipos internos.',
    },
  },
  {
    id: 'acme-mobility',
    company: 'Acme Mobility',
    role: { en: 'Frontend Engineer', es: 'Ingeniero Frontend' },
    start: '2022',
    end: '2024',
    summary: {
      en: 'Worked on the booking flow, map-based search and frontend performance.',
      es: 'Trabajó en el flujo de reservas, la búsqueda basada en mapas y el rendimiento del frontend.',
    },
  },
  {
    id: 'studio-example',
    company: 'Studio Example',
    role: { en: 'Web Developer', es: 'Desarrollador Web' },
    start: '2020',
    end: '2022',
    summary: {
      en: 'Built marketing sites and integrated them with headless CMSs.',
      es: 'Construyó sitios de marketing y los integró con CMS headless.',
    },
  },
];

/* ------------------------------------------------------------------ */
/* Derived data (no need to edit below this line)                      */
/* ------------------------------------------------------------------ */

export const projectIds = projects.map((p) => p.id);
export const skillGroupIds = skills.map((g) => g.id);
export const getProject = (id: string) => projects.find((p) => p.id === id);

/**
 * Skills-by-project matrix: for each group, the skills that at least one project
 * uses, plus the ids of the projects that use them. Skills with no project
 * evidence are returned separately so the UI can list them honestly.
 */
export function skillsByProject() {
  const rows = skills.map((group) => ({
    group,
    skills: group.items
      .map((skill) => ({
        skill,
        projectIds: projects.filter((p) => p.tags.includes(skill)).map((p) => p.id),
      }))
      .filter((r) => r.projectIds.length > 0),
  }));
  const withoutEvidence = skills.flatMap((g) =>
    g.items.filter((s) => !projects.some((p) => p.tags.includes(s))),
  );
  return { rows, withoutEvidence };
}

/**
 * Source registry. Every block of the assistant's context is tagged with one of
 * these ids, and every citation links to the matching anchor on the static
 * resume page (`/[lang]/resume#<anchor>`), which is real, crawlable content.
 */
export type Source = { id: string; label: L; anchor: string };

export const sources: Source[] = [
  {
    id: 'profile.summary',
    label: { en: 'Profile · Summary', es: 'Perfil · Resumen' },
    anchor: 'profile-summary',
  },
  ...experience.map((e) => ({
    id: `experience.${e.id}`,
    label: { en: `Experience · ${e.company}`, es: `Experiencia · ${e.company}` },
    anchor: `experience-${e.id}`,
  })),
  ...projects.map((p) => ({
    id: `projects.${p.id}`,
    label: { en: `Projects · ${p.name.en}`, es: `Proyectos · ${p.name.es}` },
    anchor: `projects-${p.id}`,
  })),
  ...skills.map((g) => ({
    id: `skills.${g.id}`,
    label: { en: `Skills · ${g.label.en}`, es: `Skills · ${g.label.es}` },
    anchor: `skills-${g.id}`,
  })),
  {
    id: 'contact',
    label: { en: 'Contact', es: 'Contacto' },
    anchor: 'contact',
  },
];

export const getSource = (id: string) => sources.find((s) => s.id === id);
export const sourceHref = (s: Source, lang: Lang) => `/${lang}/resume#${s.anchor}`;
