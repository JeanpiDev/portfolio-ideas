/**
 * profile.ts — ALL personal content of the site lives here.
 *
 * "Alex Moreno" is a FICTIONAL person used so every template in the gallery
 * looks consistent. Replace everything in this file with your own data.
 *
 * This file feeds three things at once:
 *   1. The static page (hero, projects, playground pieces, experience, contact).
 *   2. The assistant's system prompt (every block is tagged with a source id,
 *      e.g. `projects.loan-simulator`, which the UI turns into citations).
 *   3. The whitelist used to validate component / context ids coming from the AI.
 *
 * Text that is shown in both languages uses the `L` shape: { en, es }.
 * Keep descriptions qualitative: put real numbers where you see `[YOUR RESULT]`.
 */

export type Lang = 'en' | 'es';
export type L = { en: string; es: string };

export interface Project {
  id: string;
  name: L;
  kind: L;
  description: L;
  tags: string[];
  result: L;
  repo?: string;
  live?: string;
}

export interface Job {
  id: string;
  period: L;
  role: L;
  company: string;
  summary: L;
  stack: string[];
}

export interface SkillGroup {
  id: 'frontend' | 'uiux' | 'backend' | 'ai';
  label: L;
  items: string[];
}

/**
 * A playground piece is a small, real UI component taken from a project.
 * `visual` selects how the piece is drawn (see components/PieceVisual.astro).
 */
export interface Piece {
  id: string;
  name: L;
  projectId?: string;
  visual: 'slider' | 'queue' | 'filters' | 'stream' | 'switch' | 'otp' | 'button' | 'toast' | 'stepper';
  /** Starts on the table (true) or in the "Add to the table" tray (false). */
  onTable: boolean;
  /** Resting rotation in degrees for the initial, slightly messy layout. */
  rotate: number;
  story: L;
  decision: L;
  states: L[];
  code: string;
}

export const profile = {
  name: 'Alex Moreno',
  role: { en: 'Frontend Engineer', es: 'Frontend Engineer' } as L,
  location: { en: 'Remote · UTC-5', es: 'Remoto · UTC-5' } as L,
  email: 'hello@example.com',
  links: {
    github: 'https://github.com/your-user',
    linkedin: 'https://www.linkedin.com/in/your-user',
  },
  summary: {
    en: 'Frontend engineer who designs interfaces and makes them work. I care about accessible UI, motion with purpose and putting AI where it actually helps.',
    es: 'Frontend engineer que diseña interfaces y las hace funcionar. Me importan la UI accesible, el movimiento con propósito y poner la IA donde de verdad ayuda.',
  } as L,
  availability: {
    en: 'Open to full-time remote frontend roles. [YOUR AVAILABILITY: start date, time zones, contract type]',
    es: 'Abierto a roles frontend remotos a tiempo completo. [TU DISPONIBILIDAD: fecha de inicio, husos horarios, tipo de contrato]',
  } as L,
};

export const projects: Project[] = [
  {
    id: 'loan-simulator',
    name: { en: 'Loan simulator', es: 'Simulador de préstamos' },
    kind: { en: 'Web Components · client work', es: 'Web Components · cliente' },
    description: {
      en: 'An embeddable loan simulator built as framework-free Web Components: amount slider, term picker and a live payment breakdown that works inside any CMS.',
      es: 'Un simulador de préstamos embebible hecho con Web Components sin framework: slider de monto, selector de plazo y desglose de cuota en vivo que funciona dentro de cualquier CMS.',
    },
    tags: ['Web Components', 'TypeScript', 'a11y'],
    result: { en: '[YOUR RESULT]', es: '[TU RESULTADO]' },
    repo: 'https://github.com/your-user/loan-simulator',
  },
  {
    id: 'job-queue',
    name: { en: 'Live job queue dashboard', es: 'Panel de cola de trabajos en vivo' },
    kind: { en: 'WebSockets · internal tool', es: 'WebSockets · herramienta interna' },
    description: {
      en: 'A dashboard that streams the state of background jobs over WebSockets, with calm status changes, retry controls and a readable history.',
      es: 'Un panel que transmite el estado de trabajos en segundo plano por WebSockets, con cambios de estado tranquilos, controles de reintento y un historial legible.',
    },
    tags: ['WebSockets', 'TypeScript', 'Data viz'],
    result: { en: '[YOUR RESULT]', es: '[TU RESULTADO]' },
    repo: 'https://github.com/your-user/job-queue',
  },
  {
    id: 'map-filters',
    name: { en: 'Map filters', es: 'Filtros de mapa' },
    kind: { en: 'Maps UI · product feature', es: 'UI de mapas · funcionalidad' },
    description: {
      en: 'A filter panel for a map-based search: chips, ranges and a result count that stay usable by keyboard and on small screens.',
      es: 'Un panel de filtros para una búsqueda sobre mapa: chips, rangos y un conteo de resultados que siguen siendo usables con teclado y en pantallas pequeñas.',
    },
    tags: ['Leaflet-style UI', 'Accessibility', 'Responsive'],
    result: { en: '[YOUR RESULT]', es: '[TU RESULTADO]' },
    live: 'https://example.com/map-filters',
  },
  {
    id: 'ai-portfolio',
    name: { en: 'Portfolio with AI assistant', es: 'Portafolio con asistente de IA' },
    kind: { en: 'Astro · this site', es: 'Astro · este sitio' },
    description: {
      en: 'This site: a bilingual portfolio whose assistant answers only from the profile, streams its answers, renders real components and cites every source.',
      es: 'Este sitio: un portafolio bilingüe cuyo asistente responde solo desde el perfil, transmite sus respuestas, muestra componentes reales y cita cada fuente.',
    },
    tags: ['Astro', 'Claude', 'Streaming'],
    result: { en: '[YOUR RESULT]', es: '[TU RESULTADO]' },
    repo: 'https://github.com/your-user/portfolio',
  },
];

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
    stack: ['TypeScript', 'Design system', 'Dashboards'],
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
    stack: ['Booking flow', 'Maps', 'Performance'],
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
    stack: ['Marketing sites', 'CMS'],
  },
];

export const skills: SkillGroup[] = [
  { id: 'frontend', label: { en: 'Frontend', es: 'Frontend' }, items: ['TypeScript', 'Astro', 'Web Components', 'React', 'CSS'] },
  { id: 'uiux', label: { en: 'UI/UX', es: 'UI/UX' }, items: ['Design systems', 'Accessibility (WCAG)', 'Motion', 'Figma'] },
  { id: 'backend', label: { en: 'Backend', es: 'Backend' }, items: ['Node.js', 'REST', 'WebSockets', 'SQL'] },
  { id: 'ai', label: { en: 'AI', es: 'IA' }, items: ['Claude API', 'Tool use', 'Streaming UIs', 'Grounded answers'] },
];

export const pieces: Piece[] = [
  {
    id: 'theme-switch',
    name: { en: 'Dark mode switch', es: 'Interruptor de modo oscuro' },
    projectId: 'ai-portfolio',
    visual: 'switch',
    onTable: true,
    rotate: -6,
    story: {
      en: 'The theme switch from this portfolio. It persists the choice and applies it before first paint, so there is no flash of the wrong theme.',
      es: 'El interruptor de tema de este portafolio. Guarda la elección y la aplica antes del primer pintado, así no hay destello del tema equivocado.',
    },
    decision: {
      en: '[YOUR DECISION: why a switch and not a menu, and what changed for users.]',
      es: '[TU DECISIÓN: por qué un interruptor y no un menú, y qué cambió para los usuarios.]',
    },
    states: [
      { en: 'Off (dark theme)', es: 'Apagado (tema oscuro)' },
      { en: 'On (light theme)', es: 'Encendido (tema claro)' },
      { en: 'Focus visible', es: 'Foco visible' },
    ],
    code: '<button role="switch" aria-checked="false">\n  Dark mode\n</button>',
  },
  {
    id: 'job-queue',
    name: { en: 'Live job queue', es: 'Cola de trabajos en vivo' },
    projectId: 'job-queue',
    visual: 'queue',
    onTable: true,
    rotate: 5,
    story: {
      en: 'A row-based list fed by WebSockets. Status changes are calm on purpose: rows update in place instead of jumping around.',
      es: 'Una lista por filas alimentada por WebSockets. Los cambios de estado son tranquilos a propósito: las filas se actualizan en su sitio en vez de saltar.',
    },
    decision: {
      en: '[YOUR DECISION: how you handled reconnects and stale data.]',
      es: '[TU DECISIÓN: cómo manejaste reconexiones y datos obsoletos.]',
    },
    states: [
      { en: 'Queued', es: 'En cola' },
      { en: 'Running', es: 'En curso' },
      { en: 'Failed · retry', es: 'Falló · reintentar' },
      { en: 'Disconnected', es: 'Desconectado' },
    ],
    code: '<job-queue src="wss://[YOUR ENDPOINT]">\n  <job-row status="running"></job-row>\n</job-queue>',
  },
  {
    id: 'loan-simulator',
    name: { en: 'Loan amount slider', es: 'Slider de monto del préstamo' },
    projectId: 'loan-simulator',
    visual: 'slider',
    onTable: true,
    rotate: -3,
    story: {
      en: 'The core control of the loan simulator: a native range input wrapped in a Web Component, so it keeps keyboard and screen reader support for free.',
      es: 'El control central del simulador de préstamos: un input range nativo envuelto en un Web Component, así conserva gratis el soporte de teclado y lector de pantalla.',
    },
    decision: {
      en: '[YOUR DECISION: why a slider, and what changed for the people using it.]',
      es: '[TU DECISIÓN: por qué un slider, y qué cambió para quienes lo usan.]',
    },
    states: [
      { en: 'Default', es: 'Por defecto' },
      { en: 'Focus', es: 'Foco' },
      { en: 'Dragging', es: 'Arrastrando' },
      { en: 'Disabled', es: 'Deshabilitado' },
      { en: 'Out of range error', es: 'Error de rango' },
    ],
    code: '<loan-simulator\n  min="[MIN]" max="[MAX]"\n  terms="[TERMS]">\n</loan-simulator>',
  },
  {
    id: 'otp-field',
    name: { en: 'Verification code field', es: 'Campo de código de verificación' },
    projectId: 'ai-portfolio',
    visual: 'otp',
    onTable: true,
    rotate: 8,
    story: {
      en: 'A one-time-code field that is a single input under the hood, so paste, autofill and screen readers just work.',
      es: 'Un campo de código de un solo uso que por debajo es un único input, así pegar, autocompletar y los lectores de pantalla simplemente funcionan.',
    },
    decision: {
      en: '[YOUR DECISION: why one input instead of six boxes.]',
      es: '[TU DECISIÓN: por qué un input en lugar de seis cajas.]',
    },
    states: [
      { en: 'Empty', es: 'Vacío' },
      { en: 'Partially filled', es: 'Parcialmente lleno' },
      { en: 'Invalid code', es: 'Código inválido' },
    ],
    code: '<input inputmode="numeric"\n  autocomplete="one-time-code"\n  maxlength="6">',
  },
  {
    id: 'ai-portfolio',
    name: { en: 'Streaming answer', es: 'Respuesta en streaming' },
    projectId: 'ai-portfolio',
    visual: 'stream',
    onTable: true,
    rotate: -10,
    story: {
      en: 'The assistant message from this site: it streams in chunks, is announced once when complete, and always ends with its sources.',
      es: 'El mensaje del asistente de este sitio: llega por fragmentos, se anuncia una sola vez al terminar y siempre termina con sus fuentes.',
    },
    decision: {
      en: '[YOUR DECISION: what you show while the model is thinking.]',
      es: '[TU DECISIÓN: qué muestras mientras el modelo piensa.]',
    },
    states: [
      { en: 'Thinking', es: 'Pensando' },
      { en: 'Streaming', es: 'Escribiendo' },
      { en: 'Done with sources', es: 'Terminada con fuentes' },
      { en: 'Stopped (incomplete)', es: 'Detenida (incompleta)' },
    ],
    code: '<article aria-busy="true">\n  …\n</article>\n<div aria-live="polite" class="sr-only"></div>',
  },
  {
    id: 'hire-me',
    name: { en: 'Hire me button', es: 'Botón Contrátame' },
    visual: 'button',
    onTable: true,
    rotate: 4,
    story: {
      en: 'The primary action of the site. It uses the ink color, not the accent: in this design the accent is reserved for AI.',
      es: 'La acción principal del sitio. Usa el color de tinta, no el acento: en este diseño el acento está reservado para la IA.',
    },
    decision: {
      en: '[YOUR DECISION: what the button should lead to.]',
      es: '[TU DECISIÓN: a dónde debería llevar el botón.]',
    },
    states: [
      { en: 'Default', es: 'Por defecto' },
      { en: 'Hover', es: 'Hover' },
      { en: 'Focus visible', es: 'Foco visible' },
    ],
    code: '<a class="btn-ink" href="#contact">Hire me</a>',
  },
  {
    id: 'map-filters',
    name: { en: 'Map filter chips', es: 'Chips de filtro de mapa' },
    projectId: 'map-filters',
    visual: 'filters',
    onTable: false,
    rotate: 3,
    story: {
      en: 'Toggle chips from the map filters project. Each chip is a real button with a pressed state, and the result count updates politely.',
      es: 'Chips de alternancia del proyecto de filtros de mapa. Cada chip es un botón real con estado presionado, y el conteo de resultados se actualiza con cortesía.',
    },
    decision: {
      en: '[YOUR DECISION: chips vs. checkboxes on small screens.]',
      es: '[TU DECISIÓN: chips vs. checkboxes en pantallas pequeñas.]',
    },
    states: [
      { en: 'Unpressed', es: 'Sin presionar' },
      { en: 'Pressed', es: 'Presionado' },
      { en: 'No results', es: 'Sin resultados' },
    ],
    code: '<button aria-pressed="true">Open now</button>',
  },
  {
    id: 'toast',
    name: { en: 'Toast', es: 'Toast' },
    projectId: 'job-queue',
    visual: 'toast',
    onTable: false,
    rotate: -4,
    story: {
      en: 'A status message for finished jobs. It is announced politely and never steals focus.',
      es: 'Un mensaje de estado para trabajos terminados. Se anuncia con cortesía y nunca roba el foco.',
    },
    decision: {
      en: '[YOUR DECISION: how long it stays and why.]',
      es: '[TU DECISIÓN: cuánto dura y por qué.]',
    },
    states: [
      { en: 'Info', es: 'Info' },
      { en: 'Success', es: 'Éxito' },
      { en: 'Error with action', es: 'Error con acción' },
    ],
    code: '<div role="status">Job finished.</div>',
  },
  {
    id: 'stepper',
    name: { en: 'Booking stepper', es: 'Stepper de reserva' },
    visual: 'stepper',
    onTable: false,
    rotate: 6,
    story: {
      en: 'The progress indicator from a booking flow: an ordered list with the current step marked with aria-current.',
      es: 'El indicador de progreso de un flujo de reservas: una lista ordenada con el paso actual marcado con aria-current.',
    },
    decision: {
      en: '[YOUR DECISION: how many steps and why.]',
      es: '[TU DECISIÓN: cuántos pasos y por qué.]',
    },
    states: [
      { en: 'Step done', es: 'Paso hecho' },
      { en: 'Current step', es: 'Paso actual' },
      { en: 'Upcoming step', es: 'Paso siguiente' },
    ],
    code: '<ol>\n  <li aria-current="step">Dates</li>\n</ol>',
  },
];

/* ---------- Helpers ---------- */

export const projectIds = projects.map((p) => p.id);
export const pieceIds = pieces.map((p) => p.id);
export const getProject = (id: string) => projects.find((p) => p.id === id);
export const getPiece = (id: string) => pieces.find((p) => p.id === id);

/** Every citable source id with a human label and the on-page anchor it links to. */
export function sourceIndex(lang: Lang) {
  const out: Record<string, { label: string; href: string; text: string }> = {};
  const S = lang === 'es';
  out['profile.summary'] = { label: S ? 'Perfil · Resumen' : 'Profile · Summary', href: '#top', text: profile.summary[lang] };
  out['profile.availability'] = {
    label: S ? 'Perfil · Disponibilidad' : 'Profile · Availability',
    href: '#contact',
    text: profile.availability[lang],
  };
  for (const p of projects)
    out[`projects.${p.id}`] = {
      label: `${S ? 'Proyectos' : 'Projects'} · ${p.name[lang]}`,
      href: `#project-${p.id}`,
      text: `${p.name[lang]} (${p.kind[lang]}): ${p.description[lang]} Tags: ${p.tags.join(', ')}.`,
    };
  for (const j of experience)
    out[`experience.${j.id}`] = {
      label: `${S ? 'Experiencia' : 'Experience'} · ${j.company}`,
      href: `#exp-${j.id}`,
      text: `${j.period[lang]} · ${j.role[lang]} at ${j.company}: ${j.summary[lang]} (${j.stack.join(', ')})`,
    };
  for (const g of skills)
    out[`skills.${g.id}`] = {
      label: `${S ? 'Habilidades' : 'Skills'} · ${g.label[lang]}`,
      href: '#skills',
      text: `${g.label[lang]}: ${g.items.join(', ')}`,
    };
  for (const pc of pieces)
    out[`pieces.${pc.id}`] = {
      label: `Playground · ${pc.name[lang]}`,
      href: `#piece-${pc.id}`,
      text: `${pc.name[lang]}${pc.projectId ? ` (from project ${pc.projectId})` : ''}: ${pc.story[lang]} States: ${pc.states
        .map((s) => s[lang])
        .join(', ')}.`,
    };
  return out;
}
