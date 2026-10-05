/**
 * ALL personal content lives here.
 *
 * "Alex Moreno" is a FICTIONAL person used so every template in the gallery
 * looks consistent. Replace every value with your own data. Keep descriptions
 * qualitative: where you have real numbers, replace the `[YOUR RESULT]`
 * placeholders instead of inventing metrics.
 *
 * The AI assistant only answers from this file (+ src/data/pieces.ts). Each
 * block gets a source id (e.g. `projects.loan-simulator`) that the assistant
 * cites.
 */

export type Lang = 'en' | 'es';
export type Localized = Record<Lang, string>;

export const profile = {
  name: 'Alex Moreno',
  initials: 'AM',
  role: { en: 'Frontend Engineer', es: 'Ingeniero Frontend' } as Localized,
  location: 'Remote · UTC-5',
  email: 'hello@example.com',
  links: {
    github: 'https://github.com/your-user',
    linkedin: 'https://www.linkedin.com/in/your-user',
  },
  summary: {
    en: 'Frontend engineer who designs interfaces and makes them work. I care about accessible UI, motion with purpose and putting AI where it actually helps.',
    es: 'Ingeniero frontend que diseña interfaces y las hace funcionar. Me importan la UI accesible, el movimiento con propósito y poner la IA donde de verdad ayuda.',
  } as Localized,
  availability: {
    en: 'Open to frontend and design-engineering roles. [YOUR AVAILABILITY]',
    es: 'Abierto a roles de frontend y design engineering. [TU DISPONIBILIDAD]',
  } as Localized,
};

export interface Experience {
  id: string;
  period: string;
  role: Localized;
  company: string;
  summary: Localized;
}

export const experience: Experience[] = [
  {
    id: 'northwind-labs',
    period: '2024 → present',
    role: { en: 'Senior Frontend Engineer', es: 'Ingeniero Frontend Senior' },
    company: 'Northwind Labs',
    summary: {
      en: 'Leads the design system and builds data-heavy dashboards: shared tokens, accessible components and charts that stay readable with real data. [YOUR RESULT]',
      es: 'Lidera el design system y construye dashboards con muchos datos: tokens compartidos, componentes accesibles y gráficas legibles con datos reales. [TU RESULTADO]',
    },
  },
  {
    id: 'acme-mobility',
    period: '2022 – 2024',
    role: { en: 'Frontend Engineer', es: 'Ingeniero Frontend' },
    company: 'Acme Mobility',
    summary: {
      en: 'Owned the booking flow, map-based search and performance work on the customer web app. [YOUR RESULT]',
      es: 'Responsable del flujo de reservas, la búsqueda sobre mapa y el trabajo de rendimiento de la web de clientes. [TU RESULTADO]',
    },
  },
  {
    id: 'studio-example',
    period: '2020 – 2022',
    role: { en: 'Web Developer', es: 'Desarrollador Web' },
    company: 'Studio Example',
    summary: {
      en: 'Built marketing sites and CMS integrations for small and mid-size clients.',
      es: 'Construyó sitios de marketing e integraciones con CMS para clientes pequeños y medianos.',
    },
  },
];

export interface Project {
  id: string;
  name: Localized;
  description: Localized;
  tags: string[];
  kind: Localized;
  repo?: string;
  live?: string;
}

export const projects: Project[] = [
  {
    id: 'loan-simulator',
    name: { en: 'Loan simulator', es: 'Simulador de crédito' },
    description: {
      en: 'A framework-free loan simulator built with Web Components: amount and term sliders, instant quote, OTP verification and a tabbed summary.',
      es: 'Un simulador de crédito sin framework hecho con Web Components: sliders de monto y plazo, cotización instantánea, verificación OTP y un resumen con pestañas.',
    },
    tags: ['Web Components', 'TypeScript', 'Accessibility'],
    kind: { en: 'Product UI', es: 'UI de producto' },
    repo: 'https://github.com/your-user/loan-simulator',
  },
  {
    id: 'live-job-queue',
    name: { en: 'Live job queue dashboard', es: 'Dashboard de cola en vivo' },
    description: {
      en: 'A real-time dashboard for background jobs over WebSockets: live status cards, retry actions and a compact throughput chart.',
      es: 'Un dashboard en tiempo real para trabajos en segundo plano vía WebSockets: tarjetas de estado en vivo, reintentos y una gráfica compacta de rendimiento.',
    },
    tags: ['WebSockets', 'Data viz', 'Dashboards'],
    kind: { en: 'Dashboard', es: 'Dashboard' },
    live: 'https://example.com/queue',
  },
  {
    id: 'map-filters',
    name: { en: 'Map filters', es: 'Filtros de mapa' },
    description: {
      en: 'Leaflet-style filtering UI for a map search: filter chips, result counts and an empty state that suggests what to relax.',
      es: 'UI de filtros estilo Leaflet para una búsqueda en mapa: chips de filtro, conteo de resultados y un estado vacío que sugiere qué relajar.',
    },
    tags: ['Maps', 'Filtering', 'UX'],
    kind: { en: 'Interaction design', es: 'Diseño de interacción' },
  },
  {
    id: 'portfolio-ai',
    name: { en: 'Portfolio with AI assistant', es: 'Portafolio con asistente IA' },
    description: {
      en: 'This site: a UI playground where an AI inspector explains each piece, grounded only in this profile, with a demo mode when no API key is set.',
      es: 'Este sitio: un playground de UI donde un inspector con IA explica cada pieza, basado solo en este perfil, con modo demo si no hay API key.',
    },
    tags: ['Astro', 'Claude API', 'Physics'],
    kind: { en: 'Personal site', es: 'Sitio personal' },
    repo: 'https://github.com/your-user/portfolio',
  },
];

export const skills: { group: Localized; items: string[] }[] = [
  { group: { en: 'Frontend', es: 'Frontend' }, items: ['TypeScript', 'Astro', 'Web Components', 'React', 'CSS architecture'] },
  { group: { en: 'UI/UX', es: 'UI/UX' }, items: ['Design systems', 'Accessibility (WCAG 2.2)', 'Motion design', 'Prototyping'] },
  { group: { en: 'Backend', es: 'Backend' }, items: ['Node.js', 'WebSockets', 'REST APIs', 'PostgreSQL'] },
  { group: { en: 'AI', es: 'IA' }, items: ['Claude API', 'Tool use', 'Prompt design', 'Grounded answers'] },
];

export const projectById = (id: string) => projects.find((p) => p.id === id);
export const experienceById = (id: string) => experience.find((e) => e.id === id);
