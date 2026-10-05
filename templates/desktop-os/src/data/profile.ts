/**
 * ALL personal content lives in this file.
 *
 * "Alex Moreno" is a FICTIONAL person used so every template in the gallery shows the same
 * data. Replace everything here with your own information. The UI, the static HTML and the
 * AI assistant (system prompt + demo mode) are all generated from this file.
 *
 * Keep descriptions qualitative. Where you want a number, replace the `[YOUR RESULT]`
 * placeholders with real, verifiable results. Never invent metrics.
 */

export type Lang = 'en' | 'es';
export type Localized = Record<Lang, string>;

export type Area = 'frontend' | 'uiux' | 'backend' | 'ai';

export interface Experience {
  id: string;
  period: Localized;
  role: Localized;
  company: string;
  description: Localized;
  highlights: Record<Lang, string[]>;
  tags: string[];
}

export interface Project {
  id: string;
  name: Localized;
  description: Localized;
  tags: string[];
  /** Short label shown in the file explorer ("Case study", "Side project"…). */
  kind: Localized;
  /** Used by the filter chips in the Projects window. */
  areas: Area[];
  /** Small drawn thumbnail (no images needed). */
  preview: 'slider' | 'queue' | 'map' | 'assistant';
  repo?: string;
  live?: string;
}

/** Older or retired work, shown in the "Archive" desktop icon (bottom right). */
export interface ArchiveItem {
  id: string;
  name: Localized;
  year: string;
  description: Localized;
}

export interface SkillGroup {
  id: Area;
  label: Localized;
  items: string[];
}

export const profile = {
  name: 'Alex Moreno',
  firstName: 'Alex',
  initials: 'AM',
  role: { en: 'Frontend Engineer', es: 'Ingeniero Frontend' } as Localized,
  location: { en: 'Remote · UTC-5', es: 'Remoto · UTC-5' } as Localized,
  email: 'hello@example.com',
  links: {
    github: 'https://github.com/your-user',
    linkedin: 'https://www.linkedin.com/in/your-user',
  },
  summary: {
    en: 'Frontend engineer who designs interfaces and makes them work. I care about accessible UI, motion with purpose and putting AI where it actually helps.',
    es: 'Ingeniero frontend que diseña interfaces y las hace funcionar. Me importan la UI accesible, el movimiento con propósito y poner la IA donde de verdad ayuda.',
  } as Localized,
  /** Extra "About.txt" paragraphs (still fictional). */
  about: {
    en: [
      'I like the space between design and engineering: turning a Figma frame into a component that survives real data, slow networks and keyboards.',
      'Lately I have been building design systems and data-heavy dashboards, and experimenting with small AI features that stay honest about what they know.',
    ],
    es: [
      'Me gusta el espacio entre el diseño y la ingeniería: convertir un frame de Figma en un componente que aguante datos reales, redes lentas y teclados.',
      'Últimamente construyo design systems y dashboards con muchos datos, y experimento con pequeñas funciones de IA que son honestas sobre lo que saben.',
    ],
  } as Record<Lang, string[]>,

  experience: [
    {
      id: 'northwind-labs',
      period: { en: '2024 → present', es: '2024 → actualidad' },
      role: { en: 'Senior Frontend Engineer', es: 'Ingeniero Frontend Sénior' },
      company: 'Northwind Labs',
      description: {
        en: 'Leads the design system and builds data-heavy dashboards used by internal operations teams.',
        es: 'Lidera el design system y construye dashboards con muchos datos para los equipos de operaciones.',
      },
      highlights: {
        en: [
          'Built an accessible component library shared by several product teams.',
          'Designed dashboard patterns for dense tables, filters and charts.',
          'Result: [YOUR RESULT]',
        ],
        es: [
          'Construyó una librería de componentes accesible compartida por varios equipos.',
          'Diseñó patrones de dashboard para tablas densas, filtros y gráficos.',
          'Resultado: [TU RESULTADO]',
        ],
      },
      tags: ['Design system', 'TypeScript', 'Web Components', 'Dashboards'],
    },
    {
      id: 'acme-mobility',
      period: { en: '2022 – 2024', es: '2022 – 2024' },
      role: { en: 'Frontend Engineer', es: 'Ingeniero Frontend' },
      company: 'Acme Mobility',
      description: {
        en: 'Worked on the booking flow, map-based search and frontend performance.',
        es: 'Trabajó en el flujo de reservas, la búsqueda sobre mapas y el rendimiento del frontend.',
      },
      highlights: {
        en: [
          'Rebuilt the booking flow as a clear, step-by-step form.',
          'Built map filters and list/map synchronisation.',
          'Result: [YOUR RESULT]',
        ],
        es: [
          'Rehízo el flujo de reservas como un formulario claro, paso a paso.',
          'Construyó filtros sobre mapa y sincronización lista/mapa.',
          'Resultado: [TU RESULTADO]',
        ],
      },
      tags: ['React', 'Maps', 'Performance', 'Forms'],
    },
    {
      id: 'studio-example',
      period: { en: '2020 – 2022', es: '2020 – 2022' },
      role: { en: 'Web Developer', es: 'Desarrollador Web' },
      company: 'Studio Example',
      description: {
        en: 'Built marketing sites and connected them to headless CMS platforms.',
        es: 'Construyó sitios de marketing y los conectó a plataformas CMS headless.',
      },
      highlights: {
        en: ['Shipped responsive marketing sites with editable content.', 'Integrated headless CMS content models.'],
        es: ['Publicó sitios de marketing responsivos con contenido editable.', 'Integró modelos de contenido de CMS headless.'],
      },
      tags: ['HTML/CSS', 'JavaScript', 'CMS', 'Astro'],
    },
  ] satisfies Experience[],

  projects: [
    {
      id: 'loan-simulator',
      name: { en: 'Loan simulator', es: 'Simulador de préstamos' },
      description: {
        en: 'An embeddable loan calculator built as framework-free Web Components, with sliders that work by keyboard.',
        es: 'Una calculadora de préstamos embebible hecha con Web Components sin framework, con sliders que funcionan con teclado.',
      },
      tags: ['Web Components', 'TypeScript', 'A11y'],
      kind: { en: 'Case study', es: 'Caso de estudio' },
      areas: ['frontend', 'uiux'],
      preview: 'slider',
      repo: 'https://github.com/your-user/loan-simulator',
    },
    {
      id: 'job-queue-dashboard',
      name: { en: 'Live job queue dashboard', es: 'Dashboard de colas en vivo' },
      description: {
        en: 'A real-time dashboard that streams job status over WebSockets, with filters and readable states.',
        es: 'Un dashboard en tiempo real que recibe el estado de los trabajos por WebSockets, con filtros y estados legibles.',
      },
      tags: ['WebSockets', 'Node.js', 'Dashboards'],
      kind: { en: 'Side project', es: 'Proyecto personal' },
      areas: ['frontend', 'backend'],
      preview: 'queue',
      repo: 'https://github.com/your-user/job-queue-dashboard',
    },
    {
      id: 'map-filters',
      name: { en: 'Map filters', es: 'Filtros de mapa' },
      description: {
        en: 'A Leaflet-style map search UI: filter panels, clustered pins and a list that stays in sync with the map.',
        es: 'Una UI de búsqueda sobre mapa estilo Leaflet: paneles de filtros, pines agrupados y una lista sincronizada con el mapa.',
      },
      tags: ['Maps', 'UI', 'State'],
      kind: { en: 'UI experiment', es: 'Experimento de UI' },
      areas: ['frontend', 'uiux'],
      preview: 'map',
      live: 'https://example.com/map-filters',
    },
    {
      id: 'portfolio-ai',
      name: { en: 'Portfolio with AI assistant', es: 'Portafolio con asistente IA' },
      description: {
        en: 'This site: a desktop-style portfolio with an assistant that answers from the profile and cites its sources.',
        es: 'Este sitio: un portafolio con estilo de escritorio y un asistente que responde desde el perfil y cita sus fuentes.',
      },
      tags: ['Astro', 'Claude API', 'Streaming'],
      kind: { en: 'This template', es: 'Esta plantilla' },
      areas: ['frontend', 'ai'],
      preview: 'assistant',
      repo: 'https://github.com/your-user/portfolio',
    },
  ] satisfies Project[],

  archive: [
    {
      id: 'portfolio-v1',
      name: { en: 'Portfolio v1', es: 'Portafolio v1' },
      year: '2020',
      description: {
        en: 'The first personal site: a single static page, kept here for nostalgia.',
        es: 'El primer sitio personal: una sola página estática, guardada por nostalgia.',
      },
    },
    {
      id: 'css-experiments',
      name: { en: 'CSS experiments', es: 'Experimentos CSS' },
      year: '2021',
      description: {
        en: 'Small layout and animation studies made while learning modern CSS.',
        es: 'Pequeños estudios de layout y animación hechos mientras aprendía CSS moderno.',
      },
    },
  ] satisfies ArchiveItem[],

  skills: [
    { id: 'frontend', label: { en: 'Frontend', es: 'Frontend' }, items: ['TypeScript', 'HTML & CSS', 'Web Components', 'React', 'Astro'] },
    { id: 'uiux', label: { en: 'UI/UX', es: 'UI/UX' }, items: ['Design systems', 'Accessibility (WCAG)', 'Prototyping', 'Motion design'] },
    { id: 'backend', label: { en: 'Backend', es: 'Backend' }, items: ['Node.js', 'REST APIs', 'WebSockets', 'PostgreSQL'] },
    { id: 'ai', label: { en: 'AI', es: 'IA' }, items: ['Claude API', 'Prompt design', 'Streaming UIs', 'Grounded answers'] },
  ] satisfies SkillGroup[],

  /**
   * Canned tips used by Assistant.exe in DEMO MODE (no API key), one per window.
   * `sources` must be ids from the assistant's source catalog (see src/lib/assistant.ts).
   */
  demoTips: {
    projects: {
      en: 'Use the filter chips to narrow Alex\'s projects by area. The loan simulator is a good start if you care about accessible inputs.',
      es: 'Usa los filtros para ver los proyectos de Alex por área. El simulador de préstamos es un buen comienzo si te interesan los inputs accesibles.',
      sources: ['projects.loan-simulator'],
      project: 'loan-simulator',
    },
    about: {
      en: 'This is Alex\'s short bio: a frontend engineer focused on accessible UI and useful AI.',
      es: 'Esta es la bio corta de Alex: un ingeniero frontend enfocado en UI accesible e IA útil.',
      sources: ['profile.summary'],
    },
    experience: {
      en: 'Alex\'s most recent role is at Northwind Labs, leading a design system and data-heavy dashboards.',
      es: 'El rol más reciente de Alex es en Northwind Labs, liderando un design system y dashboards con muchos datos.',
      sources: ['experience.northwind-labs'],
    },
    resume: {
      en: 'Skills are grouped into Frontend, UI/UX, Backend and AI. You can print this window as a one-page resume.',
      es: 'Las habilidades están agrupadas en Frontend, UI/UX, Backend e IA. Puedes imprimir esta ventana como CV de una página.',
      sources: ['skills.frontend', 'skills.ai'],
    },
    archive: {
      en: 'The Archive keeps older work, like Alex\'s first portfolio. Newer projects live in the Projects window.',
      es: 'El Archivo guarda trabajo antiguo, como el primer portafolio de Alex. Los proyectos recientes están en Proyectos.',
      sources: ['archive.portfolio-v1'],
    },
    contact: {
      en: 'The fastest way to reach Alex is email. Alex works remotely in UTC-5.',
      es: 'La forma más rápida de contactar a Alex es el email. Alex trabaja en remoto en UTC-5.',
      sources: ['profile.contact'],
    },
  } as Record<string, Record<Lang, string> & { sources: string[]; project?: string }>,
};

export type Profile = typeof profile;
