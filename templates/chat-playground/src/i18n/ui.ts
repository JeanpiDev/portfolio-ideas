/**
 * ui.ts — every interface string, in English and Spanish (same keys in both).
 * Personal content (bio, projects…) lives in src/data/profile.ts instead.
 */
import type { Lang } from '../data/profile';

export const languages: Record<Lang, string> = { en: 'English', es: 'Español' };

export const ui = {
  en: {
    'meta.title': 'Alex Moreno — Frontend Engineer',
    'meta.description': 'Portfolio of Alex Moreno, frontend engineer. Ask the assistant or play with real components.',
    'skip': 'Skip to content',
    'nav.label': 'Main',
    'nav.projects': 'Projects',
    'nav.playground': 'Playground',
    'nav.experience': 'Experience',
    'nav.contact': 'Contact',
    'nav.lang': 'Language',
    'theme.toLight': 'Switch to light theme',
    'theme.toDark': 'Switch to dark theme',

    'hero.eyebrow': 'Frontend engineer · UI/UX + AI',
    'hero.title1': 'I design interfaces',
    'hero.title2': 'and make them work.',
    'hero.lead': 'Ask my assistant: it answers with real components and cites where every fact comes from.',

    'ask.label': 'Ask my assistant',
    'ask.formLabel': 'AI assistant',
    'ask.placeholder': 'e.g. What has Alex built on the frontend?',
    'ask.button': 'Ask',
    'ask.stop': 'Stop',
    'ask.disclaimer': "It's an AI and can get things wrong. Every answer cites its source.",
    'ask.tryWith': 'Try with',
    'ask.chips': 'What has Alex built on the frontend?|How does Alex use AI in real products?|Alex’s stack in 30 seconds|Is Alex available?',
    'ask.thinking': 'Searching the profile and case studies…',
    'ask.writing': 'Writing…',
    'ask.you': 'You',
    'ask.assistantName': 'Alex’s assistant · AI',
    'ask.incomplete': '(incomplete)',
    'ask.retry': 'Retry',
    'ask.edit': 'Edit the question',
    'ask.sources': 'Sources',
    'ask.sourceLabel': 'Source {n}: {label}',
    'ask.noSource': "I can't find that in Alex's profile and I'd rather not make it up.",
    'ask.demo': 'Demo mode — add ANTHROPIC_API_KEY for live answers',
    'ask.err.network': "Couldn't reach the assistant. Check your connection and try again.",
    'ask.err.rate': "That's a lot of questions in a row. Give it a minute.",
    'ask.err.tooLong': 'Your question is over 500 characters. Can you shorten it?',
    'ask.err.cut': 'The answer got cut off.',
    'ask.err.empty': 'Write a question first.',
    'ask.err.upstream': "Couldn't reach the assistant. Check your connection and try again.",
    'ask.conversation': 'Conversation',
    'ask.clear': 'Clear conversation',

    'sample.heading': 'Sample answer',
    'sample.question': 'What has Alex built on the frontend?',
    'sample.answer':
      'One example is the Loan simulator: an embeddable set of framework-free Web Components with an amount slider, a term picker and a live payment breakdown.',
    'sample.demoData': 'sample data',
    'sample.amount': 'Loan amount',

    'comp.viewProject': 'View project',
    'comp.send': 'Send it to the playground',
    'comp.code': 'Code',
    'comp.live': 'Live',

    'projects.eyebrow': 'Projects',
    'projects.title': 'Built to be used, not just demoed.',
    'projects.toPlay': 'Rather touch them? Go to the playground',
    'projects.onTable': 'See it on the table',
    'projects.result': 'Result',

    'play.eyebrow': 'Playground · pieces from my projects',
    'play.title1': 'Throw. Stack.',
    'play.title2': 'Inspect.',
    'play.lead':
      'Every piece comes from a real project. Drop it on the magnifier, or focus it and press Inspect, and the inspector tells you why it is built that way.',
    'play.toolbar': 'Table controls',
    'play.gravity': 'Gravity',
    'play.tidy': 'Tidy',
    'play.scatter': 'Scatter',
    'play.motion': 'Motion',
    'play.motionFull': 'Full',
    'play.motionReduced': 'Reduced',
    'play.keys': 'Keyboard: ← → choose · Enter inspect · Space pick up · Esc cancel',
    'play.table': 'Table of pieces',
    'play.inspect': 'Inspect',
    'play.pickUp': 'Pick up',
    'play.drop': 'Drop',
    'play.add': 'Add to the table',
    'play.fromChat': 'from the chat · focused',
    'play.pieceHint': 'Enter to inspect, Space to pick up.',
    'play.sent': "Done, it's on the table.",
    'play.added': '{name} added to the table.',
    'play.picked': 'Picked up {name}. Arrow keys move it, Space drops it, Escape cancels.',
    'play.moved': '{name} moved.',
    'play.dropped': 'Dropped {name}.',
    'play.cancelled': 'Cancelled. {name} is back where it was.',
    'play.tidied': 'Pieces tidied into a grid.',
    'play.scattered': 'Pieces scattered.',
    'play.inspecting': 'Inspecting {name}.',

    'insp.title': 'The inspector · AI',
    'insp.drop': 'Drop a piece here',
    'insp.dropHint': 'or focus it and press Inspect',
    'insp.inspecting': 'inspecting',
    'insp.tabs': 'About this piece',
    'insp.story': 'Story',
    'insp.states': 'States',
    'insp.code': 'Code',
    'insp.source': 'Source',
    'insp.ask': 'Ask the inspector',
    'insp.placeholder': 'e.g. Why is it built this way?',
    'insp.caseStudy': 'Open the project',

    'exp.eyebrow': 'Experience',
    'exp.title': 'From marketing sites to AI products.',
    'skills.title': 'Skills',

    'contact.eyebrow': 'Recruiter mode · AI',
    'contact.title': 'Got 30 seconds?',
    'contact.lead': 'Summary, stack and availability in one click.',
    'contact.pitch': 'Get the 30-second pitch',
    'contact.pitchShown': 'Recruiter mode: 30-second pitch',
    'contact.pitchPrompt':
      'I am a recruiter with 30 seconds. Give me Alex’s pitch: who Alex is, the strongest relevant projects, the core stack and availability. Keep it short and cite sources.',
    'contact.email': 'Email Alex',

    'footer.built': 'Built with Astro · the assistant uses Claude',
    'footer.fictional': 'Alex Moreno is a fictional person.',
  },
  es: {
    'meta.title': 'Alex Moreno — Frontend Engineer',
    'meta.description': 'Portafolio de Alex Moreno, frontend engineer. Pregúntale al asistente o juega con componentes reales.',
    'skip': 'Saltar al contenido',
    'nav.label': 'Principal',
    'nav.projects': 'Proyectos',
    'nav.playground': 'Playground',
    'nav.experience': 'Experiencia',
    'nav.contact': 'Contacto',
    'nav.lang': 'Idioma',
    'theme.toLight': 'Cambiar a tema claro',
    'theme.toDark': 'Cambiar a tema oscuro',

    'hero.eyebrow': 'Frontend engineer · UI/UX + IA',
    'hero.title1': 'Diseño interfaces',
    'hero.title2': 'y las hago funcionar.',
    'hero.lead': 'Pregúntale a mi asistente: responde con componentes reales y cita de dónde sale cada dato.',

    'ask.label': 'Pregúntale a mi asistente',
    'ask.formLabel': 'Asistente de IA',
    'ask.placeholder': 'Ej.: ¿Qué ha construido Alex en frontend?',
    'ask.button': 'Preguntar',
    'ask.stop': 'Detener',
    'ask.disclaimer': 'Es una IA y puede equivocarse. Cada respuesta cita su fuente.',
    'ask.tryWith': 'Prueba con',
    'ask.chips': '¿Qué ha construido Alex en frontend?|¿Cómo usa Alex la IA en productos reales?|El stack de Alex en 30 segundos|¿Está disponible Alex?',
    'ask.thinking': 'Buscando en el perfil y los casos de estudio…',
    'ask.writing': 'Escribiendo…',
    'ask.you': 'Tú',
    'ask.assistantName': 'Asistente de Alex · IA',
    'ask.incomplete': '(incompleta)',
    'ask.retry': 'Reintentar',
    'ask.edit': 'Editar la pregunta',
    'ask.sources': 'Fuentes',
    'ask.sourceLabel': 'Fuente {n}: {label}',
    'ask.noSource': 'No encuentro eso en el perfil de Alex y prefiero no inventarlo.',
    'ask.demo': 'Modo demo — añade ANTHROPIC_API_KEY para respuestas en vivo',
    'ask.err.network': 'No pude contactar al asistente. Revisa tu conexión e inténtalo de nuevo.',
    'ask.err.rate': 'Son muchas preguntas seguidas. Dale un minuto.',
    'ask.err.tooLong': 'Tu pregunta pasa de 500 caracteres. ¿Puedes acortarla?',
    'ask.err.cut': 'La respuesta se cortó.',
    'ask.err.empty': 'Escribe una pregunta primero.',
    'ask.err.upstream': 'No pude contactar al asistente. Revisa tu conexión e inténtalo de nuevo.',
    'ask.conversation': 'Conversación',
    'ask.clear': 'Borrar conversación',

    'sample.heading': 'Ejemplo de respuesta',
    'sample.question': '¿Qué ha construido Alex en frontend?',
    'sample.answer':
      'Un ejemplo es el Simulador de préstamos: un conjunto embebible de Web Components sin framework, con slider de monto, selector de plazo y desglose de cuota en vivo.',
    'sample.demoData': 'datos de ejemplo',
    'sample.amount': 'Monto del préstamo',

    'comp.viewProject': 'Ver proyecto',
    'comp.send': 'Llévalo al playground',
    'comp.code': 'Código',
    'comp.live': 'En vivo',

    'projects.eyebrow': 'Proyectos',
    'projects.title': 'Hechos para usarse, no solo para la demo.',
    'projects.toPlay': '¿Prefieres tocarlos? Ve al playground',
    'projects.onTable': 'Verlo en la mesa',
    'projects.result': 'Resultado',

    'play.eyebrow': 'Playground · piezas de mis proyectos',
    'play.title1': 'Lanza. Apila.',
    'play.title2': 'Inspecciona.',
    'play.lead':
      'Cada pieza sale de un proyecto real. Suéltala en la lupa, o enfócala y pulsa Inspeccionar, y la inspectora te cuenta por qué es así.',
    'play.toolbar': 'Controles de la mesa',
    'play.gravity': 'Gravedad',
    'play.tidy': 'Ordenar',
    'play.scatter': 'Desordenar',
    'play.motion': 'Movimiento',
    'play.motionFull': 'Completo',
    'play.motionReduced': 'Reducido',
    'play.keys': 'Teclado: ← → elegir · Enter inspeccionar · Espacio levantar · Esc cancelar',
    'play.table': 'Mesa de piezas',
    'play.inspect': 'Inspeccionar',
    'play.pickUp': 'Levantar',
    'play.drop': 'Soltar',
    'play.add': 'Añadir a la mesa',
    'play.fromChat': 'viene del chat · enfocada',
    'play.pieceHint': 'Enter para inspeccionar, Espacio para levantar.',
    'play.sent': 'Listo, está en la mesa.',
    'play.added': '{name} añadida a la mesa.',
    'play.picked': 'Levantaste {name}. Las flechas la mueven, Espacio la suelta, Escape cancela.',
    'play.moved': '{name} movida.',
    'play.dropped': 'Soltaste {name}.',
    'play.cancelled': 'Cancelado. {name} volvió a su sitio.',
    'play.tidied': 'Piezas ordenadas en cuadrícula.',
    'play.scattered': 'Piezas desordenadas.',
    'play.inspecting': 'Inspeccionando {name}.',

    'insp.title': 'La inspectora · IA',
    'insp.drop': 'Suelta una pieza aquí',
    'insp.dropHint': 'o enfócala y pulsa Inspeccionar',
    'insp.inspecting': 'inspeccionando',
    'insp.tabs': 'Sobre esta pieza',
    'insp.story': 'Historia',
    'insp.states': 'Estados',
    'insp.code': 'Código',
    'insp.source': 'Fuente',
    'insp.ask': 'Pregúntale a la inspectora',
    'insp.placeholder': 'Ej.: ¿Por qué está hecha así?',
    'insp.caseStudy': 'Abrir el proyecto',

    'exp.eyebrow': 'Experiencia',
    'exp.title': 'De sitios de marketing a productos con IA.',
    'skills.title': 'Habilidades',

    'contact.eyebrow': 'Modo reclutador · IA',
    'contact.title': '¿Tienes 30 segundos?',
    'contact.lead': 'Resumen, stack y disponibilidad en un clic.',
    'contact.pitch': 'Ver el resumen de 30 s',
    'contact.pitchShown': 'Modo reclutador: resumen de 30 s',
    'contact.pitchPrompt':
      'Soy reclutador y tengo 30 segundos. Dame el pitch de Alex: quién es, los proyectos más relevantes, el stack principal y la disponibilidad. Breve y con fuentes.',
    'contact.email': 'Escríbele a Alex',

    'footer.built': 'Hecho con Astro · el asistente usa Claude',
    'footer.fictional': 'Alex Moreno es una persona ficticia.',
  },
} as const;

export type UIKey = keyof (typeof ui)['en'];

export function useTranslations(lang: Lang) {
  return (key: UIKey, vars: Record<string, string | number> = {}) => {
    let s: string = ui[lang][key] ?? ui.en[key];
    for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
    return s;
  };
}

/** Subset of strings the client-side islands need (serialized into data attributes). */
export function clientStrings(lang: Lang) {
  const keys = Object.keys(ui.en).filter((k) => /^(ask|play|insp|comp|contact)\./.test(k)) as UIKey[];
  return Object.fromEntries(keys.map((k) => [k, ui[lang][k]])) as Record<string, string>;
}
