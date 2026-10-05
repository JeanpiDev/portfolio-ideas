/**
 * Demo mode (no ANTHROPIC_API_KEY): canned but GROUNDED answers.
 *
 * A keyword match picks an intent; the answer text is assembled from profile.ts,
 * so it stays true when you edit your data. Text uses the same `[[source-id]]`
 * markers as the live model and goes through the same citation parser, and the
 * same component events are emitted. The UI therefore behaves exactly like live mode.
 */
import { experience, person, projects, skillsByProject, type Lang } from '../data/profile';
import type { ComponentEvent } from './assistant';

export type DemoAnswer = { text: string; components: ComponentEvent[] };

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

const has = (q: string, words: string[]) => words.some((w) => q.includes(w));

const KEYWORDS = {
  contact: ['contact', 'email', 'mail', 'hire', 'reach', 'touch', 'contacto', 'correo', 'contratar', 'escribir'],
  skills: ['skill', 'stack', 'tech', 'tool', 'know', 'habilidad', 'tecnolog', 'herramienta', 'sabe'],
  experience: ['experience', 'career', 'job', 'timeline', 'compan', 'worked', 'background', 'experiencia', 'trayectoria', 'trabaj', 'empresa'],
  projects: ['project', 'built', 'build', 'frontend', 'case', 'work', 'proyecto', 'construi', 'hecho', 'caso'],
};

const projectEvents = (ids: string[]): ComponentEvent[] =>
  ids.map((id) => ({ type: 'component', name: 'project', id }) as const);

export function demoAnswer(message: string, lang: Lang, mode?: string): DemoAnswer {
  const q = norm(message);
  const es = lang === 'es';
  const first = person.firstName;
  const [current, ...previous] = experience;
  const [p1, p2] = projects;

  if (mode === 'recruiter') {
    return {
      text: es
        ? `${person.name} es ${person.role.es} (${person.location.es}). [[profile.summary]] Hoy es ${current.role.es} en ${current.company}: ${current.summary.es} [[experience.${current.id}]] Dos proyectos para empezar: ${p1.name.es} y ${p2.name.es}. [[projects.${p1.id}]] [[projects.${p2.id}]] La forma más rápida de contactarle es ${person.email}. [[contact]]`
        : `${person.name} is a ${person.role.en} (${person.location.en}). [[profile.summary]] Currently ${current.role.en} at ${current.company}: ${current.summary.en} [[experience.${current.id}]] Two projects to start with: ${p1.name.en} and ${p2.name.en}. [[projects.${p1.id}]] [[projects.${p2.id}]] The fastest way to reach ${first} is ${person.email}. [[contact]]`,
      components: [...projectEvents([p1.id, p2.id]), { type: 'component', name: 'contact' }],
    };
  }

  if (has(q, KEYWORDS.contact)) {
    return {
      text: es
        ? `La mejor forma de contactar a ${first} es por email en ${person.email}; también tiene GitHub y LinkedIn. [[contact]] Trabaja en modalidad ${person.location.es}. [[profile.summary]]`
        : `The best way to reach ${first} is by email at ${person.email}; GitHub and LinkedIn are linked too. [[contact]] ${first} works ${person.location.en}. [[profile.summary]]`,
      components: [{ type: 'component', name: 'contact' }],
    };
  }

  if (has(q, KEYWORDS.skills)) {
    const { rows } = skillsByProject();
    const top = rows
      .flatMap((r) => r.skills.map((s) => ({ ...s, group: r.group.id })))
      .sort((a, b) => b.projectIds.length - a.projectIds.length)
      .slice(0, 3);
    const list = top.map((s) => `${s.skill} (${s.projectIds.length})`).join(', ');
    const groups = [...new Set(top.map((s) => s.group))].map((g) => `[[skills.${g}]]`).join(' ');
    return {
      text: es
        ? `En lugar de una autoevaluación, esto muestra en qué proyectos aparece cada skill. Las más presentes son ${list}. ${groups}`
        : `Instead of a self-rating, this shows which projects actually use each skill. The most used are ${list}. ${groups}`,
      components: [{ type: 'component', name: 'skills' }],
    };
  }

  if (has(q, KEYWORDS.experience)) {
    const before = previous.map((e) => `${es ? e.role.es : e.role.en} ${es ? 'en' : 'at'} ${e.company} [[experience.${e.id}]]`);
    return {
      text: es
        ? `${first} es ${current.role.es} en ${current.company} desde ${current.start}: ${current.summary.es} [[experience.${current.id}]] Antes fue ${before.join(' y ')}.`
        : `${first} has been ${current.role.en} at ${current.company} since ${current.start}: ${current.summary.en} [[experience.${current.id}]] Before that: ${before.join(' and ')}.`,
      components: [{ type: 'component', name: 'timeline' }],
    };
  }

  if (has(q, KEYWORDS.projects)) {
    return {
      text: es
        ? `${first} tiene ${projects.length} proyectos en su perfil. ${p1.name.es}: ${p1.description.es} [[projects.${p1.id}]] ${p2.name.es}: ${p2.description.es} [[projects.${p2.id}]] Aquí están todos:`
        : `${first} has ${projects.length} projects in the profile. ${p1.name.en}: ${p1.description.en} [[projects.${p1.id}]] ${p2.name.en}: ${p2.description.en} [[projects.${p2.id}]] Here they all are:`,
      components: projectEvents(projects.map((p) => p.id)),
    };
  }

  // Fallback: a grounded overview instead of a guess.
  return {
    text: es
      ? `En palabras de ${first}: «${person.summary.es}» [[profile.summary]] Puedes preguntar por proyectos, experiencia, skills o contacto. Un vistazo rápido a los proyectos:`
      : `In ${first}'s own words: "${person.summary.en}" [[profile.summary]] You can ask about projects, experience, skills or contact. A quick look at the projects:`,
    components: projectEvents(projects.map((p) => p.id)),
  };
}

/** Split text into small word groups to simulate a streamed response. */
export function chunkText(text: string, wordsPerChunk = 3): string[] {
  const words = text.split(/(\s+)/);
  const out: string[] = [];
  for (let i = 0; i < words.length; i += wordsPerChunk * 2) out.push(words.slice(i, i + wordsPerChunk * 2).join(''));
  return out;
}
