/**
 * profile.ts — ALL personal content of the site lives here.
 *
 * "Alex Moreno" is a FICTIONAL person used so every template in the gallery
 * looks consistent. Replace everything in this file with your own data.
 *
 * This one file feeds:
 *   1. The static page (hero, about, experience, projects, skills, contact).
 *   2. The assistant's system prompt and demo answers (every block is tagged
 *      with a source id, e.g. `projects.loan-simulator`, which the chat turns
 *      into citations that link back to the page).
 *   3. The whitelists used to validate ids coming back from the AI.
 *
 * Bilingual text uses the `L` shape: { en, es }.
 * Keep descriptions qualitative: put real numbers where you see `[YOUR RESULT]`.
 */

export type Lang = 'en' | 'es';
export type L = { en: string; es: string };

export interface Job {
  /** Stable id: used for anchors (#exp-<id>) and source ids (experience.<id>). */
  id: string;
  period: L;
  role: L;
  company: string;
  summary: L;
  highlights: { en: string[]; es: string[] };
  tags: string[];
}

/** Which drawn placeholder a project card shows (see components/ProjectVisual.astro). */
export type ProjectVisualKind = 'slider' | 'queue' | 'map' | 'chat';

export interface Project {
  /** Stable id: used for anchors (#project-<id>), source ids and AI components. */
  id: string;
  name: L;
  /** Short label shown above the title, e.g. "Web Components · client work". */
  kind: L;
  description: L;
  tags: string[];
  /**
   * Drawn placeholder used while you have no screenshots.
   * Each entry is one carousel slide (the same visual drawn in a different state).
   */
  visual: ProjectVisualKind;
  slides?: number;
  /**
   * Real screenshots. Drop the files in `src/assets/projects/` and list their
   * file names here, e.g. ['loan-simulator.png', 'loan-simulator-mobile.png'].
   * When set, they replace the drawn placeholder and are rendered with
   * `<Image>` from astro:assets (webp, sizes, lazy). Ideal ratio 16:9.
   */
  images?: string[];
  repo?: string;
  live?: string;
  /** Full-width card. */
  featured?: boolean;
}

export interface SkillGroup {
  id: 'frontend' | 'uiux' | 'backend' | 'ai';
  label: L;
  items: string[];
}

export const profile = {
  name: 'Alex Moreno',
  firstName: 'Alex',
  /** Used in the terminal motif: `visitor@alex:~$` and the `~/alex.moreno` logo. */
  handle: 'alex',
  role: { en: 'Frontend Engineer', es: 'Frontend Engineer' } as L,
  location: { en: 'Remote · UTC-5', es: 'Remoto · UTC-5' } as L,
  email: 'hello@example.com',
  links: {
    github: 'https://github.com/your-user',
    linkedin: 'https://www.linkedin.com/in/your-user',
  },
  /** Path to a CV inside /public (e.g. '/cv.pdf'). Empty hides the button. */
  cvUrl: '',
  tagline: {
    en: 'Frontend engineer who designs interfaces and makes them work. I care about accessible UI, motion with purpose and putting AI where it actually helps.',
    es: 'Frontend engineer que diseña interfaces y las hace funcionar. Me importan la UI accesible, el movimiento con propósito y poner la IA donde de verdad ayuda.',
  } as L,
  about: [
    {
      en: "I'm Alex, a frontend engineer who sits between design and engineering. I like turning rough ideas into interfaces that feel calm, load fast and work for everyone, including keyboard and screen reader users.",
      es: 'Soy Alex, un frontend engineer entre el diseño y la ingeniería. Me gusta convertir ideas en bruto en interfaces que se sienten tranquilas, cargan rápido y funcionan para todos, incluidas las personas que usan teclado o lector de pantalla.',
    },
    {
      en: 'Lately I work on design systems, data-heavy dashboards and small AI features that stay honest: they answer from real data, cite where it came from and say so when they do not know.',
      es: 'Últimamente trabajo en design systems, dashboards con muchos datos y pequeñas funciones de IA que se mantienen honestas: responden con datos reales, citan de dónde salen y lo dicen cuando no saben.',
    },
  ] as L[],
  facts: [
    { k: { en: 'Location', es: 'Ubicación' }, v: { en: 'Remote · UTC-5', es: 'Remoto · UTC-5' } },
    { k: { en: 'Focus', es: 'Enfoque' }, v: { en: 'Frontend & AI', es: 'Frontend e IA' } },
    { k: { en: 'Languages', es: 'Idiomas' }, v: { en: 'English · Spanish', es: 'Inglés · Español' } },
    { k: { en: 'Status', es: 'Estado' }, v: { en: 'Open to work', es: 'Disponible' } },
  ] as { k: L; v: L }[],
  education: {
    degree: { en: 'B.Sc. in Computer Science', es: 'Grado en Ingeniería Informática' } as L,
    school: { en: 'Example University · [YEAR]', es: 'Universidad de Ejemplo · [AÑO]' } as L,
  },
  recognitions: [
    { en: '[YOUR RECOGNITION: talk, award or open source work]', es: '[TU RECONOCIMIENTO: charla, premio u open source]' },
    { en: '[YOUR RECOGNITION]', es: '[TU RECONOCIMIENTO]' },
  ] as L[],
  availability: {
    en: 'Open to full-time remote frontend roles. [YOUR AVAILABILITY: start date, time zones, contract type]',
    es: 'Abierto a roles frontend remotos a tiempo completo. [TU DISPONIBILIDAD: fecha de inicio, husos horarios, tipo de contrato]',
  } as L,
};

export const experience: Job[] = [
  {
    id: 'northwind-labs',
    period: { en: '2024 → present', es: '2024 → hoy' },
    role: { en: 'Senior Frontend Engineer', es: 'Senior Frontend Engineer' },
    company: 'Northwind Labs',
    summary: {
      en: 'Leads the design system and builds data-heavy dashboards.',
      es: 'Lidera el design system y construye dashboards con muchos datos.',
    },
    highlights: {
      en: [
        'Owns the shared component library: tokens, accessible primitives and documentation.',
        'Builds dashboards that stay readable with dense, live data.',
        'Pairs with designers on motion and states before anything ships. [YOUR RESULT]',
      ],
      es: [
        'Responsable de la librería de componentes: tokens, primitivas accesibles y documentación.',
        'Construye dashboards que siguen siendo legibles con datos densos y en vivo.',
        'Trabaja con diseño el movimiento y los estados antes de publicar. [TU RESULTADO]',
      ],
    },
    tags: ['TypeScript', 'React', 'Storybook', 'Figma'],
  },
  {
    id: 'acme-mobility',
    period: { en: '2022 – 2024', es: '2022 – 2024' },
    role: { en: 'Frontend Engineer', es: 'Frontend Engineer' },
    company: 'Acme Mobility',
    summary: {
      en: 'Worked on the booking flow, map interfaces and performance.',
      es: 'Trabajó en el flujo de reservas, interfaces de mapas y rendimiento.',
    },
    highlights: {
      en: [
        'Rebuilt the booking flow as small, testable steps with clear error states.',
        'Built map filters that work by keyboard and on small screens.',
        'Profiled and trimmed the critical rendering path. [YOUR RESULT]',
      ],
      es: [
        'Rehizo el flujo de reservas en pasos pequeños y testeables con estados de error claros.',
        'Construyó filtros de mapa que funcionan con teclado y en pantallas pequeñas.',
        'Perfiló y aligeró la ruta crítica de renderizado. [TU RESULTADO]',
      ],
    },
    tags: ['TypeScript', 'Leaflet', 'CSS'],
  },
  {
    id: 'studio-example',
    period: { en: '2020 – 2022', es: '2020 – 2022' },
    role: { en: 'Web Developer', es: 'Web Developer' },
    company: 'Studio Example',
    summary: {
      en: 'Built marketing sites and CMS integrations.',
      es: 'Construyó sitios de marketing e integraciones con CMS.',
    },
    highlights: {
      en: [
        'Shipped marketing sites for several clients from design to launch.',
        'Connected sites to headless CMSs so editors could publish on their own.',
      ],
      es: [
        'Publicó sitios de marketing para varios clientes, del diseño al lanzamiento.',
        'Conectó sitios a CMS headless para que el equipo editorial publicara por su cuenta.',
      ],
    },
    tags: ['JavaScript', 'HTML5', 'Sass'],
  },
];

export const projects: Project[] = [
  {
    id: 'job-queue',
    featured: true,
    name: { en: 'Live job queue dashboard', es: 'Panel de cola de trabajos en vivo' },
    kind: { en: 'WebSockets · internal tool', es: 'WebSockets · herramienta interna' },
    description: {
      en: 'A dashboard that streams the state of background jobs over WebSockets, with calm status changes, retry controls and a readable history.',
      es: 'Un panel que transmite el estado de trabajos en segundo plano por WebSockets, con cambios de estado tranquilos, controles de reintento y un historial legible.',
    },
    tags: ['WebSockets', 'TypeScript', 'Node.js'],
    visual: 'queue',
    slides: 3,
    repo: 'https://github.com/your-user/job-queue',
  },
  {
    id: 'loan-simulator',
    name: { en: 'Loan simulator', es: 'Simulador de préstamos' },
    kind: { en: 'Web Components · client work', es: 'Web Components · cliente' },
    description: {
      en: 'An embeddable loan simulator built as framework-free Web Components: amount slider, term picker and a live payment breakdown that works inside any CMS.',
      es: 'Un simulador de préstamos embebible hecho con Web Components sin framework: slider de monto, selector de plazo y desglose de cuota en vivo que funciona dentro de cualquier CMS.',
    },
    tags: ['Web Components', 'TypeScript', 'Accessibility'],
    visual: 'slider',
    slides: 2,
    repo: 'https://github.com/your-user/loan-simulator',
  },
  {
    id: 'map-filters',
    name: { en: 'Map filters', es: 'Filtros de mapa' },
    kind: { en: 'Maps UI · product feature', es: 'UI de mapas · funcionalidad' },
    description: {
      en: 'A filter panel for a map-based search: chips, ranges and a result count that stay usable by keyboard and on small screens.',
      es: 'Un panel de filtros para una búsqueda sobre mapa: chips, rangos y un conteo de resultados que siguen siendo usables con teclado y en pantallas pequeñas.',
    },
    tags: ['Leaflet', 'TypeScript', 'CSS'],
    visual: 'map',
    live: 'https://example.com/map-filters',
  },
  {
    id: 'ai-portfolio',
    name: { en: 'Portfolio with AI assistant', es: 'Portafolio con asistente de IA' },
    kind: { en: 'Astro · this site', es: 'Astro · este sitio' },
    description: {
      en: 'This site: a bilingual portfolio whose assistant answers only from the profile, streams its answers, shows project cards and cites every source.',
      es: 'Este sitio: un portafolio bilingüe cuyo asistente responde solo desde el perfil, transmite sus respuestas, muestra tarjetas de proyecto y cita cada fuente.',
    },
    tags: ['Astro', 'Claude', 'Tailwind CSS'],
    visual: 'chat',
    repo: 'https://github.com/your-user/portfolio',
  },
];

export const skills: SkillGroup[] = [
  { id: 'frontend', label: { en: 'Frontend', es: 'Frontend' }, items: ['TypeScript', 'Astro', 'React', 'Web Components', 'CSS', 'Tailwind CSS'] },
  { id: 'uiux', label: { en: 'UI/UX', es: 'UI/UX' }, items: ['Design systems', 'Accessibility (WCAG)', 'Motion', 'Figma', 'Storybook'] },
  { id: 'backend', label: { en: 'Backend', es: 'Backend' }, items: ['Node.js', 'REST', 'WebSockets', 'PostgreSQL'] },
  { id: 'ai', label: { en: 'AI', es: 'IA' }, items: ['Claude', 'Tool use', 'Streaming UIs', 'Grounded answers'] },
];

/**
 * Extra knowledge for the assistant ONLY (not shown on the page): FAQs a
 * recruiter might ask. Write true things only — the assistant answers from this.
 */
export const assistantNotes: L = {
  en: [
    'Works remotely and is comfortable overlapping with time zones from UTC-8 to UTC+1.',
    'Prefers product teams where design and engineering work closely together.',
    'On rates or salary: invite the visitor to discuss it by email; never give numbers.',
  ].join(' '),
  es: [
    'Trabaja en remoto y se acomoda a husos horarios entre UTC-8 y UTC+1.',
    'Prefiere equipos de producto donde diseño e ingeniería trabajan muy juntos.',
    'Sobre tarifa o salario: invita a conversarlo por email; nunca des cifras.',
  ].join(' '),
};

/* -------------------------------------------------------------------------- */
/* Helpers (no need to edit below this line)                                    */
/* -------------------------------------------------------------------------- */

export const projectIds = projects.map((p) => p.id);
export const getProject = (id: string) => projects.find((p) => p.id === id);

export interface SourceEntry {
  label: string;
  text: string;
  /** Page anchor the citation links to. */
  href: string;
}

/**
 * Every citable block of the profile, keyed by source id.
 * Used by the system prompt, demo mode and the `source` events of the chat.
 */
export function sourceIndex(lang: Lang): Record<string, SourceEntry> {
  const es = lang === 'es';
  const out: Record<string, SourceEntry> = {};
  out['profile.summary'] = {
    label: es ? 'Perfil · Resumen' : 'Profile · Summary',
    text: `${profile.name}, ${profile.role[lang]}, ${profile.location[lang]}. ${profile.tagline[lang]} ${profile.about.map((p) => p[lang]).join(' ')}`,
    href: '#about',
  };
  out['profile.education'] = {
    label: es ? 'Perfil · Formación' : 'Profile · Education',
    text: `${profile.education.degree[lang]} — ${profile.education.school[lang]}. ${profile.recognitions.map((r) => r[lang]).join(' ')}`,
    href: '#about',
  };
  out['profile.availability'] = {
    label: es ? 'Perfil · Disponibilidad' : 'Profile · Availability',
    text: `${profile.availability[lang]} ${assistantNotes[lang]}`,
    href: '#contact',
  };
  out['profile.contact'] = {
    label: es ? 'Contacto' : 'Contact',
    text: `Email: ${profile.email}. GitHub: ${profile.links.github}. LinkedIn: ${profile.links.linkedin}.`,
    href: '#contact',
  };
  for (const j of experience) {
    out[`experience.${j.id}`] = {
      label: `${es ? 'Experiencia' : 'Experience'} · ${j.company}`,
      text: `${j.role[lang]} at ${j.company} (${j.period[lang]}). ${j.summary[lang]} ${j.highlights[lang].join(' ')} Stack: ${j.tags.join(', ')}.`,
      href: `#exp-${j.id}`,
    };
  }
  for (const p of projects) {
    out[`projects.${p.id}`] = {
      label: `${es ? 'Proyectos' : 'Projects'} · ${p.name[lang]}`,
      text: `${p.name[lang]} (${p.kind[lang]}): ${p.description[lang]} Tags: ${p.tags.join(', ')}.${p.repo ? ` Repo: ${p.repo}.` : ''}${p.live ? ` Live: ${p.live}.` : ''}`,
      href: `#project-${p.id}`,
    };
  }
  for (const s of skills) {
    out[`skills.${s.id}`] = {
      label: `Skills · ${s.label[lang]}`,
      text: `${s.label[lang]}: ${s.items.join(', ')}.`,
      href: '#skills',
    };
  }
  return out;
}
