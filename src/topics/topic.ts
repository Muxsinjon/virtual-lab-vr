import type { Lab } from '../core/lab';
import type { Key } from '../i18n';

export interface TopicApi {
  /** Tick a task off (once). */
  done(step: string): void;
  toast(key: Key): void;
}

export interface TopicDef {
  id: string;
  title: Key;
  /** Unready topics show in the menu as "Coming soon". */
  ready: boolean;
  info?: Key;
  /** Tasks in order; each has step-by-step help behind the ! button. */
  steps?: { id: string; key: Key; hint: Key }[];
  /** Lays out the bench and returns the per-frame update for this topic's chemistry. */
  build?: (lab: Lab, api: TopicApi) => (dt: number) => void;
}
