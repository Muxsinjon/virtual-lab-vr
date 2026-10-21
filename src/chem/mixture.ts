// What is inside a container. `volume` is liquid volume in mL. `amounts` holds everything else,
// keyed by name; each topic decides the units (mol, pieces, drops).

export interface Mixture {
  volume: number;
  amounts: Record<string, number>;
}

export const emptyMix = (): Mixture => ({ volume: 0, amounts: {} });

export const amount = (m: Mixture, key: string) => m.amounts[key] ?? 0;

export function scaled(m: Mixture, k: number): Mixture {
  const amounts: Record<string, number> = {};
  for (const [key, v] of Object.entries(m.amounts)) amounts[key] = v * k;
  return { volume: m.volume * k, amounts };
}

export function addTo(dst: Mixture, part: Mixture) {
  dst.volume += part.volume;
  for (const [key, v] of Object.entries(part.amounts)) dst.amounts[key] = (dst.amounts[key] ?? 0) + v;
}

export function change(m: Mixture, key: string, delta: number) {
  m.amounts[key] = Math.max(0, (m.amounts[key] ?? 0) + delta);
}

export interface Tint {
  color: number;
  opacity: number;
}
