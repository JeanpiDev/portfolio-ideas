/**
 * Demo mode: used when ANTHROPIC_API_KEY is not set.
 * Picks a canned, grounded answer by simple keyword matching over profile.ts,
 * so the template is fully usable (and testable) without an API key.
 */
import { experience, getPiece, getProject, profile, projects, skills, type Lang } from '../data/profile';
import type { Mode } from './context';

export interface DemoAnswer {
  text: string;
  component?: { name: 'project' | 'piece'; id: string };
  sources: string[];
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

const TOPICS: { id: string; words: string[] }[] = [
  { id: 'project:loan-simulator', words: ['loan', 'prestamo', 'simulador', 'simulator', 'slider', 'web component', 'frontend', 'built', 'construido', 'hecho'] },
  { id: 'project:job-queue', words: ['queue', 'cola', 'websocket', 'dashboard', 'panel', 'real time', 'tiempo real', 'jobs', 'trabajos'] },
  { id: 'project:map-filters', words: ['map', 'mapa', 'filter', 'filtro', 'leaflet', 'chips'] },
  { id: 'project:ai-portfolio', words: [' ai', 'ia ', ' ia', 'assistant', 'asistente', 'claude', 'llm', 'portfolio', 'portafolio', 'streaming'] },
  { id: 'experience', words: ['experience', 'experiencia', 'work', 'job', 'trabajo', 'company', 'empresa', 'northwind', 'acme', 'studio', 'career', 'carrera', 'senior'] },
  { id: 'skills', words: ['stack', 'skill', 'habilidad', 'tech', 'tecnolog', 'tools', 'herramientas', 'typescript', 'astro', 'react', 'backend'] },
  { id: 'availability', words: ['available', 'availability', 'disponib', 'hire', 'contrat', 'remote', 'remoto', 'open to', 'contact', 'contacto'] },
];

function pick(question: string): string | null {
  const q = ` ${norm(question)} `;
  let best: string | null = null;
  let bestScore = 0;
  for (const t of TOPICS) {
    const score = t.words.reduce((n, w) => n + (q.includes(w) ? 1 : 0), 0);
    if (score > bestScore) {
      best = t.id;
      bestScore = score;
    }
  }
  return best;
}

export function demoAnswer(message: string, lang: Lang, mode: Mode, context?: string): DemoAnswer {
  const es = lang === 'es';

  if (mode === 'inspect' && context) {
    const piece = getPiece(context);
    if (piece) {
      const project = piece.projectId ? getProject(piece.projectId) : undefined;
      const from = project ? (es ? ` Viene de ${project.name.es}.` : ` It comes from ${project.name.en}.`) : '';
      return {
        text: `${piece.story[lang]}${from}`,
        sources: [`pieces.${piece.id}`, ...(project ? [`projects.${project.id}`] : [])],
      };
    }
  }

  if (mode === 'recruiter') {
    const top = projects.slice(0, 2).map((p) => p.name[lang]).join(es ? ' y ' : ' and ');
    const job = experience[0];
    return {
      text: es
        ? `${profile.name} es ${profile.role.es} (${job.role.es} en ${job.company}). Proyectos destacados: ${top}. Stack principal: ${skills[0].items.slice(0, 3).join(', ')}. ${profile.availability.es}`
        : `${profile.name} is a ${profile.role.en} (${job.role.en} at ${job.company}). Standout projects: ${top}. Core stack: ${skills[0].items.slice(0, 3).join(', ')}. ${profile.availability.en}`,
      component: { name: 'project', id: projects[0].id },
      sources: ['profile.summary', `experience.${job.id}`, `projects.${projects[0].id}`, 'skills.frontend', 'profile.availability'],
    };
  }

  const topic = pick(message);

  if (topic?.startsWith('project:')) {
    const p = getProject(topic.slice(8))!;
    return {
      text: es
        ? `Un buen ejemplo es ${p.name.es}: ${p.description.es.charAt(0).toLowerCase()}${p.description.es.slice(1)}`
        : `A good example is the ${p.name.en}: ${p.description.en.charAt(0).toLowerCase()}${p.description.en.slice(1)}`,
      component: { name: 'project', id: p.id },
      sources: [`projects.${p.id}`],
    };
  }
  if (topic === 'experience') {
    const [a, b, c] = experience;
    return {
      text: es
        ? `Hoy Alex es ${a.role.es} en ${a.company} (${a.period.es}): ${a.summary.es.toLowerCase()} Antes fue ${b.role.es} en ${b.company} y ${c.role.es} en ${c.company}.`
        : `Alex is currently ${a.role.en} at ${a.company} (${a.period.en}): ${a.summary.en.toLowerCase()} Before that, ${b.role.en} at ${b.company} and ${c.role.en} at ${c.company}.`,
      sources: experience.map((j) => `experience.${j.id}`),
    };
  }
  if (topic === 'skills') {
    const [fe, ux, , ai] = skills;
    return {
      text: es
        ? `Frontend: ${fe.items.join(', ')}. UI/UX: ${ux.items.join(', ')}. En IA trabaja con ${ai.items.join(', ')}.`
        : `Frontend: ${fe.items.join(', ')}. UI/UX: ${ux.items.join(', ')}. On the AI side: ${ai.items.join(', ')}.`,
      sources: ['skills.frontend', 'skills.uiux', 'skills.ai'],
    };
  }
  if (topic === 'availability') {
    return {
      text: `${profile.availability[lang]} ${es ? 'Contacto' : 'Contact'}: ${profile.email}.`,
      sources: ['profile.availability'],
    };
  }
  // Nothing matched: answer honestly, with no sources (the UI shows the "no source" note).
  return {
    text: es
      ? 'No encuentro eso en el perfil de Alex y prefiero no inventarlo.'
      : "I can't find that in Alex's profile and I'd rather not make it up.",
    sources: [],
  };
}
