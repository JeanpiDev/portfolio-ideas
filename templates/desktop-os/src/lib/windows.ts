/**
 * Window ids are shared by the window manager, the static HTML and the AI endpoint
 * (the endpoint rejects any `context` that is not in this list).
 * Safe to import on the client and the server.
 */
export const WINDOW_IDS = ['projects', 'about', 'experience', 'resume', 'contact'] as const;
export type WindowId = (typeof WINDOW_IDS)[number];

export const isWindowId = (v: unknown): v is WindowId =>
  typeof v === 'string' && (WINDOW_IDS as readonly string[]).includes(v);

/** Maps an assistant source id (e.g. `projects.loan-simulator`) to the window that shows it. */
export function sourceTarget(sourceId: string): { win: WindowId; anchor: string } {
  const [group, key] = sourceId.split('.');
  switch (group) {
    case 'projects':
      return { win: 'projects', anchor: `project-${key}` };
    case 'experience':
      return { win: 'experience', anchor: `job-${key}` };
    case 'skills':
      return { win: 'resume', anchor: 'win-resume' };
    case 'profile':
      return key === 'contact'
        ? { win: 'contact', anchor: 'win-contact' }
        : { win: 'about', anchor: 'win-about' };
    default:
      return { win: 'about', anchor: 'win-about' };
  }
}
