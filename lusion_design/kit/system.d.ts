export type DesignSystemTheme = "light" | "dark" | "system";

export interface MountOptions {
  /** Set false to disable every decorative motion (reveal, split, magnetic, tilt, cursor, damped progress). */
  motion?: boolean;
}

export interface NotifyOptions {
  duration?: number;
}

/** Ticker task. Receives seconds since the previous frame (clamped to 1/20). Return false to stop. */
export type TickerTask = (dt: number) => boolean | void;

export interface DesignSystemRuntime {
  destroy(): void;
  notify(message: string, options?: NotifyOptions): void;
  openDialog(id: string): void;
  closeDialog(id: string): void;
  setTheme(theme: DesignSystemTheme): void;
  /** Open a `[data-ds-panel]` by id. Sets `data-ds-panel-state`, `aria-expanded` on openers, and moves focus inside. */
  openPanel(id: string): void;
  /** Close a panel, restore `inert`, and return focus to the element that opened it. */
  closePanel(id: string): void;
  togglePanel(id: string): void;
  /** Re-run a reveal or split-text entrance on an element (or element id). Static under reduced motion. */
  replay(target: HTMLElement | string): void;
  /** Add a per-frame task to the shared requestAnimationFrame loop. Returns a remover. */
  addTask(task: TickerTask): () => void;
  /** Whether decorative motion is currently enabled (option and OS preference). */
  readonly motion: boolean;
}

export interface SpringOptions {
  /** @default 2.8 */
  frequency?: number;
  /** @default 0.82 */
  damping?: number;
  /** @default 1 */
  response?: number;
}

export interface ScalarSpring {
  readonly value: number;
  update(dt: number, target: number): number;
  reset(value?: number): number;
}

/** Second-order dynamics parameters: natural frequency (Hz), damping ratio, response. */
export interface DynamicsOptions {
  /** @default 1.5 */
  frequency?: number;
  /** @default 0.8 */
  damping?: number;
  /** @default 2 */
  response?: number;
}

export interface ScalarDynamics {
  readonly value: number;
  readonly velocity: number;
  /** Advance by `dt` seconds toward `target`. Optional explicit target velocity. */
  update(dt: number, target: number, targetVelocity?: number): number;
  reset(value?: number): number;
  settled(target: number, epsilon?: number): boolean;
}

export type DynamicsPresetName = "pointer" | "cursor" | "focus" | "zoom" | "snap" | "drift" | "rotate";

export type EasingFunction = (t: number) => number;

export interface EasingTable {
  linear: EasingFunction;
  /** cubic-bezier(.4, 0, .1, 1) */
  standard: EasingFunction;
  /** cubic-bezier(.35, 0, 0, 1) — the public bundle's `ease.lusion`. */
  smooth: EasingFunction;
  /** cubic-bezier(.4, 0, 0, 1) */
  enter: EasingFunction;
  /** cubic-bezier(.16, 1, .3, 1) */
  out: EasingFunction;
  /** cubic-bezier(.1, 0, .1, 1) */
  loop: EasingFunction;
  expoOut: EasingFunction;
  expoInOut: EasingFunction;
  cubicOut: EasingFunction;
  cubicInOut: EasingFunction;
  sineOut: EasingFunction;
  backOut: EasingFunction;
}

export const dynamicsPresets: Readonly<Record<DynamicsPresetName, Readonly<Required<DynamicsOptions>>>>;
export const ease: Readonly<EasingTable>;

export function mount(root: HTMLElement, options?: MountOptions): DesignSystemRuntime;
export function createSpring(options?: SpringOptions): ScalarSpring;
export function createDynamics(options?: DynamicsOptions): ScalarDynamics;
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): EasingFunction;
/** Frame-rate independent smoothing: current + (target - current) * (1 - exp(-lambda * dt)). */
export function damp(current: number, target: number, lambda: number, dt: number): number;
