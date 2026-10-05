/**
 * Demo mode: used when ANTHROPIC_API_KEY is not set.
 * Picks a canned, grounded answer by simple keyword matching over profile.ts,
 * so the template is fully usable (and testable) without an API key.
 */
import { experience, getProject, profile, projects, skills, type Lang } from '../data/profile';
import type { Mode } from './assistant';

export interface DemoAnswer {
  text: string;
  project?: string;
  sources: string[];
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

const TOPICS: { id: string; words: string[] }[] = [
  { id: 'project:loan-simulator', words: ['loan', 'prestamo', 'simulador', 'simulator', 'slider', 'web component'] },
  { id: 'project:job-queue', words: ['queue', 'cola', 'websocket', 'dashboard', 'panel', 'real time', 'tiempo real', 'jobs'] },
  { id: 'project:map-filters', words: ['map', 'mapa', 'filter', 'filtro', 'leaflet'] },
  { id: 'project:ai-portfolio', words: [' ai ', ' ia ', 'assistant', 'asistente', 'claude', 'llm', 'this site', 'este sitio'] },
  { id: 'projects', words: ['project', 'proyecto', 'built', 'construido', 'portfolio', 'portafolio', 'work sample'] },
  { id: 'experience', words: ['experience', 'experiencia', 'job', 'trabajo', 'company', 'empresa', 'northwind', 'acme', 'studio', 'career', 'carrera', 'senior'] },
  { id: 'skills', words: ['stack', 'skill', 'habilidad', 'tech', 'tecnolog', 'tools', 'herramientas', 'typescript', 'astro', 'react', 'backend'] },
  { id: 'contact', words: ['contact', 'contacto', 'email', 'correo', 'reach', 'touch', 'linkedin', 'github', 'hire', 'contrat'] },
  { id: 'availability', words: ['available', 'availability', 'disponib', 'remote', 'remoto', 'open to', 'salary', 'salario', 'rate', 'tarifa'] },
  { id: 'about', words: ['who is', 'quien es', 'about', 'sobre', 'yourself', 'background', 'education', 'formacion', 'study', 'estudi'] },
];

function pick(question: string): string | null {
  const q = ` ${norm(question).replace(/[^\w\s]/g, ' ')} `;
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

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

function projectAnswer(id: string, lang: Lang): DemoAnswer {
  const p = getProject(id)!;
  const es = lang === 'es';
  return {
    text: es
      ? `**${p.name.es}** (${p.kind.es}): ${lower(p.description.es)} Stack: ${p.tags.join(', ')}.`
      : `**${p.name.en}** (${p.kind.en}): ${lower(p.description.en)} Stack: ${p.tags.join(', ')}.`,
    project: p.id,
    sources: [`projects.${p.id}`],
  };
}

export function demoAnswer(message: string, lang: Lang, mode: Mode, context?: string): DemoAnswer {
  const es = lang === 'es';
  const n = profile.firstName;

  if (context && getProject(context)) return projectAnswer(context, lang);

  if (mode === 'recruiter') {
    const top = projects.slice(0, 2).map((p) => p.name[lang]).join(es ? ' y ' : ' and ');
    const job = experience[0];
    return {
      text: es
        ? `**${profile.name}** es ${profile.role.es}, hoy ${job.role.es} en ${job.company}, donde ${lower(job.summary.es)} Proyectos destacados: ${top}. Stack principal: ${skills[0].items.slice(0, 4).join(', ')}. ${profile.availability.es} Contacto: ${profile.email}.`
        : `**${profile.name}** is a ${profile.role.en}, currently ${job.role.en} at ${job.company}, where ${n} ${lower(job.summary.en)} Standout projects: ${top}. Core stack: ${skills[0].items.slice(0, 4).join(', ')}. ${profile.availability.en} Contact: ${profile.email}.`,
      project: projects[0].id,
      sources: ['profile.summary', `experience.${job.id}`, `projects.${projects[0].id}`, 'skills.frontend', 'profile.availability'],
    };
  }

  const topic = pick(message);

  if (topic?.startsWith('project:')) return projectAnswer(topic.slice(8), lang);

  switch (topic) {
    case 'projects': {
      const names = projects.map((p) => p.name[lang]).join(', ');
      return {
        text: es
          ? `${n} ha construido ${projects.length} proyectos destacados: ${names}. El más completo es **${projects[0].name.es}**: ${lower(projects[0].description.es)}`
          : `${n} has ${projects.length} featured projects: ${names}. The most complete one is the **${projects[0].name.en}**: ${lower(projects[0].description.en)}`,
        project: projects[0].id,
        sources: projects.map((p) => `projects.${p.id}`),
      };
    }
    case 'experience': {
      const [a, b, c] = experience;
      return {
        text: es
          ? `Hoy ${n} es ${a.role.es} en ${a.company} (${a.period.es}): ${lower(a.summary.es)} Antes fue ${b.role.es} en ${b.company} y ${c.role.es} en ${c.company}.`
          : `${n} is currently ${a.role.en} at ${a.company} (${a.period.en}) and ${lower(a.summary.en)} Before that: ${b.role.en} at ${b.company} and ${c.role.en} at ${c.company}.`,
        sources: experience.map((j) => `experience.${j.id}`),
      };
    }
    case 'skills': {
      const [fe, ux, be, ai] = skills;
      return {
        text: es
          ? `Frontend: ${fe.items.join(', ')}. UI/UX: ${ux.items.join(', ')}. Backend: ${be.items.join(', ')}. En IA: ${ai.items.join(', ')}.`
          : `Frontend: ${fe.items.join(', ')}. UI/UX: ${ux.items.join(', ')}. Backend: ${be.items.join(', ')}. On the AI side: ${ai.items.join(', ')}.`,
        sources: skills.map((s) => `skills.${s.id}`),
      };
    }
    case 'contact':
      return {
        text: es
          ? `La forma más directa es el email: **${profile.email}**. También está en GitHub y LinkedIn (enlaces en la sección de contacto).`
          : `The most direct way is email: **${profile.email}**. ${n} is also on GitHub and LinkedIn (links in the contact section).`,
        sources: ['profile.contact'],
      };
    case 'availability':
      return {
        text: `${profile.availability[lang]} ${es ? 'Contacto' : 'Contact'}: ${profile.email}.`,
        sources: ['profile.availability'],
      };
    case 'about':
      return {
        text: `${profile.name}, ${profile.role[lang]} (${profile.location[lang]}). ${es ? 'En sus palabras' : 'In their own words'}: "${profile.tagline[lang]}"`,
        sources: ['profile.summary'],
      };
  }

  // Nothing matched: answer honestly, with no sources (the UI shows the "no source" note).
  return {
    text: es
      ? `No encuentro eso en el perfil de ${n} y prefiero no inventarlo.`
      : `I can't find that in ${n}'s profile and I'd rather not make it up.`,
    sources: [],
  };
}
