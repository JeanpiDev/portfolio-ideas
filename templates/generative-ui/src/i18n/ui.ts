/**
 * ui.ts — every UI string, in English and Spanish (same keys in both).
 * Personal content (name, projects, experience…) lives in src/data/profile.ts.
 */
import type { Lang } from '../data/profile';

export const languages: Record<Lang, string> = { en: 'English', es: 'Español' };

const en = {
  'meta.title': 'Alex Moreno — Frontend Engineer',
  'meta.description':
    'Chat-first portfolio. Ask a question and the answer arrives as real components: projects, timeline, skills and contact.',
  'meta.resumeTitle': 'Alex Moreno — Resume',

  'nav.skip': 'Skip to content',
  'nav.home': 'Home',
  'nav.resume': 'Classic resume',
  'nav.lang': 'Language',
  'nav.label': 'Site',
  'nav.themeToLight': 'Switch to light theme',
  'nav.themeToDark': 'Switch to dark theme',

  'hero.eyebrow': 'Frontend · UI/UX · AI',
  'hero.title': "Hi, I'm Alex. I design interfaces",
  'hero.titleEm': 'and make them work.',

  'chat.label': 'Ask my assistant',
  'chat.placeholder': 'e.g. What has Alex built on the frontend?',
  'chat.ask': 'Ask',
  'chat.stop': 'Stop',
  'chat.disclaimer': "It's an AI and can get things wrong. Every answer cites its source.",
  'chat.thinking': 'Searching the profile and case studies…',
  'chat.writing': 'Writing…',
  'chat.conversation': 'Conversation',
  'chat.you': 'You',
  'chat.assistant': 'Assistant',
  'chat.sample': 'Sample answer',
  'chat.sampleNote': 'Pre-rendered so you can see how answers look. No tokens spent.',
  'chat.suggestions': 'Suggested questions',
  'chat.followUps': 'Follow-up questions',
  'chat.incomplete': '(incomplete)',
  'chat.retry': 'Retry',
  'chat.editQuestion': 'Edit question',
  'chat.seeProjects': 'See projects',
  'chat.openResume': 'Open classic resume',
  'chat.demo': 'Demo mode — add ANTHROPIC_API_KEY for live answers',
  'chat.noscript':
    'The assistant needs JavaScript. Everything it knows is also on the classic resume.',
  'chat.citedSources': 'Sources:',
  'chat.sourceN': 'Source {n}: {label}',
  'chat.shown': 'Shown: {list}',

  'chips.1': 'What has Alex built on the frontend?',
  'chips.2': 'Walk me through the experience',
  'chips.3': 'Which skills show up in real projects?',
  'chips.4': 'How can I contact Alex?',

  'err.network': "Couldn't reach the assistant. Check your connection and try again.",
  'err.rate': "That's a lot of questions in a row. Give it a minute.",
  'err.tooLong': 'Your question is over 500 characters. Can you shorten it?',
  'err.cut': 'The answer got cut off.',
  'err.upstream': "The assistant isn't available right now. The classic resume has everything it knows.",
  'err.invalid': "That request didn't look right. Try asking again.",
  'err.noSource': "I can't find that in Alex's profile and I'd rather not make it up.",

  'sources.title': 'Sources',
  'sources.intro': 'Every citation in an answer points to a section of the classic resume.',

  'recruiter.title': 'Recruiter mode',
  'recruiter.body': 'One click: a 30-second summary with role, stack, recent work and how to get in touch.',
  'recruiter.cta': 'Get the 30-second summary',
  'recruiter.display': 'Recruiter mode: 30-second summary',
  'recruiter.prompt':
    "Give me a 30-second summary of Alex for a recruiter: current role, strongest skills backed by projects, most relevant recent work and how to get in touch.",

  'comp.projects': 'Projects',
  'comp.projectsCarousel': 'Projects carousel',
  'comp.prev': 'Previous project',
  'comp.next': 'Next project',
  'comp.caseStudy': 'Case study',
  'comp.code': 'Code',
  'comp.live': 'Live demo',
  'comp.timeline': 'Experience timeline',
  'comp.present': 'present',
  'comp.skills': 'Skills by project',
  'comp.skillsCaption':
    'Each mark means the skill is used in that project, derived from project tags. Not a self-rating.',
  'comp.skill': 'Skill',
  'comp.count': 'Projects',
  'comp.used': 'Used in {project}',
  'comp.notUsed': 'Not used',
  'comp.noEvidence': 'Also listed, no project evidence yet:',
  'comp.contact': 'Contact',
  'comp.email': 'Email',
  'comp.location': 'Location',
  'comp.scrollHint': 'Scrollable table',

  'resume.heading': 'Resume',
  'resume.summary': 'Summary',
  'resume.experience': 'Experience',
  'resume.projects': 'Projects',
  'resume.skills': 'Skills',
  'resume.contact': 'Contact',
  'resume.print': 'Print or save as PDF',
  'resume.back': 'Back to the assistant',
  'resume.tags': 'Tags',

  'footer.fictional': 'Alex Moreno is a fictional person. Replace src/data/profile.ts with your own data.',
  'footer.credits': 'Concept by Jean Pierre Ramírez.',
} as const;

export type UIKey = keyof typeof en;

const es: Record<UIKey, string> = {
  'meta.title': 'Alex Moreno — Ingeniero Frontend',
  'meta.description':
    'Portafolio centrado en el chat. Haz una pregunta y la respuesta llega como componentes reales: proyectos, trayectoria, skills y contacto.',
  'meta.resumeTitle': 'Alex Moreno — CV',

  'nav.skip': 'Saltar al contenido',
  'nav.home': 'Inicio',
  'nav.resume': 'CV clásico',
  'nav.lang': 'Idioma',
  'nav.label': 'Sitio',
  'nav.themeToLight': 'Cambiar a tema claro',
  'nav.themeToDark': 'Cambiar a tema oscuro',

  'hero.eyebrow': 'Frontend · UI/UX · IA',
  'hero.title': 'Hola, soy Alex. Diseño interfaces',
  'hero.titleEm': 'y las hago funcionar.',

  'chat.label': 'Pregúntale a mi asistente',
  'chat.placeholder': 'p. ej. ¿Qué ha construido Alex en frontend?',
  'chat.ask': 'Preguntar',
  'chat.stop': 'Detener',
  'chat.disclaimer': 'Es una IA y puede equivocarse. Cada respuesta cita su fuente.',
  'chat.thinking': 'Buscando en el perfil y los casos de estudio…',
  'chat.writing': 'Escribiendo…',
  'chat.conversation': 'Conversación',
  'chat.you': 'Tú',
  'chat.assistant': 'Asistente',
  'chat.sample': 'Respuesta de ejemplo',
  'chat.sampleNote': 'Prerenderizada para que veas cómo lucen las respuestas. Sin gastar tokens.',
  'chat.suggestions': 'Preguntas sugeridas',
  'chat.followUps': 'Preguntas de seguimiento',
  'chat.incomplete': '(incompleta)',
  'chat.retry': 'Reintentar',
  'chat.editQuestion': 'Editar pregunta',
  'chat.seeProjects': 'Ver proyectos',
  'chat.openResume': 'Abrir CV clásico',
  'chat.demo': 'Modo demo — añade ANTHROPIC_API_KEY para respuestas en vivo',
  'chat.noscript':
    'El asistente necesita JavaScript. Todo lo que sabe también está en el CV clásico.',
  'chat.citedSources': 'Fuentes:',
  'chat.sourceN': 'Fuente {n}: {label}',
  'chat.shown': 'Mostrado: {list}',

  'chips.1': '¿Qué ha construido Alex en frontend?',
  'chips.2': 'Cuéntame su experiencia',
  'chips.3': '¿Qué skills aparecen en proyectos reales?',
  'chips.4': '¿Cómo contacto a Alex?',

  'err.network': 'No pude conectar con el asistente. Revisa tu conexión e inténtalo de nuevo.',
  'err.rate': 'Son muchas preguntas seguidas. Dale un minuto.',
  'err.tooLong': 'Tu pregunta supera los 500 caracteres. ¿Puedes acortarla?',
  'err.cut': 'La respuesta se cortó.',
  'err.upstream': 'El asistente no está disponible ahora. El CV clásico tiene todo lo que sabe.',
  'err.invalid': 'Esa petición no parecía correcta. Intenta preguntar de nuevo.',
  'err.noSource': 'No encuentro eso en el perfil de Alex y prefiero no inventarlo.',

  'sources.title': 'Fuentes',
  'sources.intro': 'Cada cita de una respuesta apunta a una sección del CV clásico.',

  'recruiter.title': 'Modo reclutador',
  'recruiter.body': 'Un clic: resumen de 30 segundos con rol, stack, trabajo reciente y cómo contactar.',
  'recruiter.cta': 'Obtener el resumen de 30 segundos',
  'recruiter.display': 'Modo reclutador: resumen de 30 segundos',
  'recruiter.prompt':
    'Dame un resumen de 30 segundos de Alex para un reclutador: rol actual, skills más fuertes respaldadas por proyectos, trabajo reciente más relevante y cómo contactarle.',

  'comp.projects': 'Proyectos',
  'comp.projectsCarousel': 'Carrusel de proyectos',
  'comp.prev': 'Proyecto anterior',
  'comp.next': 'Proyecto siguiente',
  'comp.caseStudy': 'Caso de estudio',
  'comp.code': 'Código',
  'comp.live': 'Demo en vivo',
  'comp.timeline': 'Trayectoria',
  'comp.present': 'actualidad',
  'comp.skills': 'Skills por proyecto',
  'comp.skillsCaption':
    'Cada marca indica que la skill se usa en ese proyecto, derivado de sus etiquetas. No es una autoevaluación.',
  'comp.skill': 'Skill',
  'comp.count': 'Proyectos',
  'comp.used': 'Usada en {project}',
  'comp.notUsed': 'No usada',
  'comp.noEvidence': 'También en la lista, aún sin proyecto que lo respalde:',
  'comp.contact': 'Contacto',
  'comp.email': 'Email',
  'comp.location': 'Ubicación',
  'comp.scrollHint': 'Tabla desplazable',

  'resume.heading': 'CV',
  'resume.summary': 'Resumen',
  'resume.experience': 'Experiencia',
  'resume.projects': 'Proyectos',
  'resume.skills': 'Skills',
  'resume.contact': 'Contacto',
  'resume.print': 'Imprimir o guardar como PDF',
  'resume.back': 'Volver al asistente',
  'resume.tags': 'Etiquetas',

  'footer.fictional': 'Alex Moreno es una persona ficticia. Reemplaza src/data/profile.ts con tus datos.',
  'footer.credits': 'Concepto de Jean Pierre Ramírez.',
};

export const ui: Record<Lang, Record<UIKey, string>> = { en, es };

export function useTranslations(lang: Lang) {
  return (key: UIKey, vars?: Record<string, string | number>) => {
    let s: string = ui[lang][key] ?? ui.en[key];
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
    return s;
  };
}

/** Pre-rendered sample answer (cold start). Citation markers `[n]` map to `sampleSources`. */
export const sampleAnswer: Record<Lang, { question: string; text: string }> = {
  en: {
    question: 'What has Alex built on the frontend?',
    text: 'Alex works where design meets engineering. Recent frontend work includes a loan simulator built as framework-free Web Components [1] and a real-time job queue dashboard over WebSockets [2]. Here are the projects:',
  },
  es: {
    question: '¿Qué ha construido Alex en frontend?',
    text: 'Alex trabaja donde el diseño se encuentra con la ingeniería. Su trabajo frontend reciente incluye un simulador de préstamos hecho con Web Components sin framework [1] y un dashboard de colas en tiempo real vía WebSockets [2]. Estos son los proyectos:',
  },
};
export const sampleSources = ['projects.loan-simulator', 'projects.job-queue-dashboard'];
