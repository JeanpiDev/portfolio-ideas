/**
 * The pieces on the playground table. Each one is a real UI component from a
 * project in src/data/profile.ts.
 *
 * - `onTable: true`  -> starts on the table; `false` -> waits in the tray.
 * - `story`          -> the case study the inspector tells (also the demo-mode
 *                       answer). `null` = no case study yet: the inspector shows
 *                       its "I don't have this piece's case study yet" state.
 * - `states`         -> rendered live (and operable) in the inspector's States tab
 *                       by src/components/PieceWidget.astro.
 * - `code`           -> short snippet for the Code tab.
 *
 * The "Pieces discovered x/N" counter uses `pieces.length`: add or remove pieces
 * here and everything else follows.
 */
import type { Localized } from './profile';

export type PieceId =
  | 'loan-slider' | 'otp-input' | 'theme-toggle' | 'tabs' | 'bar-chart'
  | 'queue-card' | 'hire-button' | 'avatar-badge' | 'filter-chips' | 'toast' | 'stepper';

export interface Piece {
  id: PieceId;
  project: string; // project id in profile.ts
  onTable: boolean;
  name: Localized;
  story: Localized | null;
  states: { id: string; label: Localized }[];
  code: { lang: string; snippet: string };
}

export const pieces: Piece[] = [
  {
    id: 'loan-slider',
    project: 'loan-simulator',
    onTable: true,
    name: { en: 'Loan slider', es: 'Slider de crédito' },
    story: {
      en: 'This slider comes from the Loan simulator. It replaced a multi-field form: people drag the amount and see the quote update instantly, instead of typing and submitting. Alex built it as a Web Component on top of a native range input, so keyboard, screen readers and touch work out of the box, and the formatted value is announced through an output element. [YOUR RESULT]',
      es: 'Este slider viene del Simulador de crédito. Reemplazó un formulario de varios campos: la persona arrastra el monto y ve la cotización al instante, sin escribir ni enviar. Alex lo construyó como Web Component sobre un input range nativo, así teclado, lectores de pantalla y táctil funcionan de serie, y el valor formateado se anuncia con un elemento output. [TU RESULTADO]',
    },
    states: [
      { id: 'default', label: { en: 'Default', es: 'Por defecto' } },
      { id: 'max', label: { en: 'At maximum', es: 'En el máximo' } },
      { id: 'disabled', label: { en: 'Disabled', es: 'Deshabilitado' } },
    ],
    code: {
      lang: 'html',
      snippet: `<loan-slider>
  <label for="amount">Loan amount</label>
  <input id="amount" type="range"
         min="1000" max="50000" step="500" value="12000">
  <output for="amount">$12,000</output>
</loan-slider>`,
    },
  },
  {
    id: 'otp-input',
    project: 'loan-simulator',
    onTable: true,
    name: { en: 'OTP input', es: 'Input OTP' },
    story: {
      en: 'The OTP input is the verification step of the Loan simulator. The problem was people pasting codes from SMS into the first box and losing digits. Alex made each box a single-character input that auto-advances, handles Backspace back to the previous box and spreads a pasted code across all six. It sets autocomplete="one-time-code" so phones can fill it. [YOUR RESULT]',
      es: 'El input OTP es el paso de verificación del Simulador de crédito. El problema: la gente pegaba el código del SMS en la primera casilla y perdía dígitos. Alex hizo cada casilla de un carácter con avance automático, Retroceso a la casilla anterior y reparto del código pegado entre las seis. Usa autocomplete="one-time-code" para que el móvil lo rellene. [TU RESULTADO]',
    },
    states: [
      { id: 'empty', label: { en: 'Empty', es: 'Vacío' } },
      { id: 'partial', label: { en: 'Partially filled', es: 'A medias' } },
      { id: 'error', label: { en: 'Error', es: 'Error' } },
    ],
    code: {
      lang: 'ts',
      snippet: `input.addEventListener('input', () => {
  input.value = input.value.replace(/\\D/g, '').slice(-1);
  if (input.value) boxes[i + 1]?.focus();
});
input.addEventListener('paste', (e) => {
  const code = e.clipboardData?.getData('text') ?? '';
  [...code].forEach((d, j) => boxes[j] && (boxes[j].value = d));
});`,
    },
  },
  {
    id: 'theme-toggle',
    project: 'portfolio-ai',
    onTable: true,
    name: { en: 'Theme toggle', es: 'Interruptor de tema' },
    story: {
      en: 'This toggle is from this very portfolio. The goal was a dark-first site with no flash of the wrong theme on load. Alex used a button with role="switch" and aria-checked, plus a tiny inline script in the head that reads the saved preference before the first paint.',
      es: 'Este interruptor es de este mismo portafolio. El objetivo: un sitio oscuro por defecto sin parpadeo del tema equivocado al cargar. Alex usó un botón con role="switch" y aria-checked, más un pequeño script en el head que lee la preferencia guardada antes del primer pintado.',
    },
    states: [
      { id: 'off', label: { en: 'Off', es: 'Apagado' } },
      { id: 'on', label: { en: 'On', es: 'Encendido' } },
      { id: 'disabled', label: { en: 'Disabled', es: 'Deshabilitado' } },
    ],
    code: {
      lang: 'html',
      snippet: `<button role="switch" aria-checked="false">
  <span class="track"><span class="thumb"></span></span>
  Dark mode
</button>`,
    },
  },
  {
    id: 'tabs',
    project: 'loan-simulator',
    onTable: true,
    name: { en: 'Tabs', es: 'Pestañas' },
    story: {
      en: 'These tabs organise the Loan simulator summary into Summary, Payments and Sign. Alex followed the WAI-ARIA tabs pattern: a real tablist, arrow keys move between tabs, and only the active tab is in the Tab order, so keyboard users are not forced through every tab.',
      es: 'Estas pestañas organizan el resumen del Simulador de crédito en Resumen, Cuotas y Firma. Alex siguió el patrón de pestañas de WAI-ARIA: un tablist real, las flechas cambian de pestaña y solo la activa está en el orden de tabulación.',
    },
    states: [
      { id: 'first', label: { en: 'First selected', es: 'Primera activa' } },
      { id: 'second', label: { en: 'Second selected', es: 'Segunda activa' } },
      { id: 'disabled', label: { en: 'With a disabled tab', es: 'Con una deshabilitada' } },
    ],
    code: {
      lang: 'ts',
      snippet: `tablist.addEventListener('keydown', (e) => {
  const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
  if (!dir) return;
  const next = tabs[(index + dir + tabs.length) % tabs.length];
  select(next); next.focus();
});`,
    },
  },
  {
    id: 'bar-chart',
    project: 'live-job-queue',
    onTable: true,
    name: { en: 'Mini bar chart', es: 'Mini gráfica de barras' },
    story: {
      en: 'This mini chart shows jobs processed per hour in the Live job queue dashboard. The challenge was a chart people can read at a glance and also operate: each bar is a button with its value as accessible name, so keyboard and screen-reader users get the numbers, not just the shape. It also has a designed empty state. [YOUR RESULT]',
      es: 'Esta mini gráfica muestra trabajos procesados por hora en el Dashboard de cola en vivo. El reto: una gráfica que se lea de un vistazo y que también se pueda operar. Cada barra es un botón con su valor como nombre accesible, así teclado y lector de pantalla obtienen los números, no solo la forma. Tiene además un estado vacío diseñado. [TU RESULTADO]',
    },
    states: [
      { id: 'default', label: { en: 'Default', es: 'Por defecto' } },
      { id: 'selected', label: { en: 'Bar selected', es: 'Barra seleccionada' } },
      { id: 'empty', label: { en: 'Empty', es: 'Vacía' } },
    ],
    code: {
      lang: 'html',
      snippet: `<div role="group" aria-label="Jobs per hour">
  <button class="bar" style="--h:40%"
          aria-label="09:00, 12 jobs"></button>
  <button class="bar" style="--h:75%"
          aria-label="10:00, 23 jobs"></button>
</div>`,
    },
  },
  {
    id: 'queue-card',
    project: 'live-job-queue',
    onTable: true,
    name: { en: 'Live queue card', es: 'Tarjeta de cola' },
    story: {
      en: 'This card is one job in the Live job queue dashboard. Status arrives over WebSockets, so the card had to change without stealing focus or spamming screen readers. Alex announces only meaningful transitions (failed, done) in a polite live region, and a failed job gets a Retry action right on the card. [YOUR RESULT]',
      es: 'Esta tarjeta es un trabajo del Dashboard de cola en vivo. El estado llega por WebSockets, así que la tarjeta debía cambiar sin robar el foco ni saturar al lector de pantalla. Alex anuncia solo las transiciones importantes (fallo, terminado) en una región viva educada, y un trabajo fallido muestra Reintentar en la propia tarjeta. [TU RESULTADO]',
    },
    states: [
      { id: 'running', label: { en: 'Running', es: 'En curso' } },
      { id: 'failed', label: { en: 'Failed', es: 'Fallido' } },
      { id: 'done', label: { en: 'Done', es: 'Terminado' } },
    ],
    code: {
      lang: 'ts',
      snippet: `socket.addEventListener('message', (e) => {
  const job = JSON.parse(e.data);
  card(job.id).dataset.status = job.status;
  if (job.status === 'failed' || job.status === 'done')
    announce(\`\${job.name}: \${job.status}\`);
});`,
    },
  },
  {
    id: 'hire-button',
    project: 'portfolio-ai',
    onTable: true,
    name: { en: '"Hire me" button', es: 'Botón "Contrátame"' },
    story: {
      en: 'The "Hire me" button is the main call to action of this portfolio. It is a plain link styled as a button, so it works without JavaScript, and it leads to the contact section of the resume page. Its loading and success states are shown for the contact form flow.',
      es: 'El botón "Contrátame" es la llamada a la acción principal de este portafolio. Es un enlace con estilo de botón, así funciona sin JavaScript, y lleva a la sección de contacto del CV. Sus estados de carga y éxito se muestran para el flujo del formulario de contacto.',
    },
    states: [
      { id: 'default', label: { en: 'Default', es: 'Por defecto' } },
      { id: 'loading', label: { en: 'Loading', es: 'Cargando' } },
      { id: 'success', label: { en: 'Success', es: 'Éxito' } },
    ],
    code: {
      lang: 'html',
      snippet: `<a class="btn btn-ink" href="/en/resume#contact">
  Hire me <span aria-hidden="true">→</span>
</a>`,
    },
  },
  {
    id: 'avatar-badge',
    project: 'portfolio-ai',
    onTable: true,
    name: { en: 'Avatar badge', es: 'Avatar con estado' },
    story: {
      en: 'The avatar badge shows Alex\'s initials and availability. Status is never colour alone: each state has a different shape inside the dot and a text label, so it still reads in greyscale and for colour-blind visitors.',
      es: 'El avatar muestra las iniciales de Alex y su disponibilidad. El estado nunca es solo color: cada estado tiene una forma distinta dentro del punto y una etiqueta de texto, así se entiende en escala de grises y para personas con daltonismo.',
    },
    states: [
      { id: 'available', label: { en: 'Available', es: 'Disponible' } },
      { id: 'busy', label: { en: 'Busy', es: 'Ocupado' } },
      { id: 'away', label: { en: 'Away', es: 'Ausente' } },
    ],
    code: {
      lang: 'html',
      snippet: `<span class="avatar" role="img"
      aria-label="Alex Moreno, available">
  AM <span class="dot" data-status="available"></span>
</span>`,
    },
  },
  {
    id: 'filter-chips',
    project: 'map-filters',
    onTable: false,
    name: { en: 'Filter chips', es: 'Chips de filtro' },
    story: {
      en: 'These chips come from Map filters. Each chip is a toggle button with aria-pressed, and the result count updates in a polite live region. When filters leave zero results, the empty state suggests which filter to remove instead of a dead end. [YOUR RESULT]',
      es: 'Estos chips vienen de Filtros de mapa. Cada chip es un botón conmutable con aria-pressed, y el conteo de resultados se actualiza en una región viva educada. Cuando los filtros dejan cero resultados, el estado vacío sugiere qué filtro quitar en vez de un callejón sin salida. [TU RESULTADO]',
    },
    states: [
      { id: 'none', label: { en: 'None selected', es: 'Ninguno' } },
      { id: 'some', label: { en: 'Some selected', es: 'Algunos' } },
      { id: 'zero', label: { en: 'Zero results', es: 'Sin resultados' } },
    ],
    code: {
      lang: 'html',
      snippet: `<button class="chip" aria-pressed="false">Open now</button>
<p aria-live="polite">24 places</p>`,
    },
  },
  {
    id: 'toast',
    project: 'live-job-queue',
    onTable: false,
    name: { en: 'Toast', es: 'Toast' },
    story: null,
    states: [
      { id: 'info', label: { en: 'Info', es: 'Info' } },
      { id: 'error', label: { en: 'Error with action', es: 'Error con acción' } },
    ],
    code: {
      lang: 'html',
      snippet: `<div role="status" class="toast">
  Job queued. <button>Undo</button>
</div>`,
    },
  },
  {
    id: 'stepper',
    project: 'loan-simulator',
    onTable: false,
    name: { en: 'Stepper', es: 'Stepper' },
    story: null,
    states: [
      { id: 'step1', label: { en: 'Step 1', es: 'Paso 1' } },
      { id: 'step2', label: { en: 'Step 2', es: 'Paso 2' } },
      { id: 'complete', label: { en: 'Complete', es: 'Completo' } },
    ],
    code: {
      lang: 'html',
      snippet: `<ol class="stepper">
  <li aria-current="step">Amount</li>
  <li>Verify</li>
  <li>Sign</li>
</ol>`,
    },
  },
];

export const pieceIds = pieces.map((p) => p.id) as string[];
export const pieceById = (id: string) => pieces.find((p) => p.id === id);
