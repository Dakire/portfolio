// Préréglages d'apparence d'un QR code : tous sont testés au décodage (tests/qr-decode.test.ts).
import type { RenderOptions } from './render';

export type PresetId = 'minimal' | 'pro' | 'modern' | 'contrast' | 'signal';

export type Appearance = Pick<
  RenderOptions,
  | 'moduleStyle'
  | 'finderOuter'
  | 'finderInner'
  | 'foreground'
  | 'gradient'
  | 'background'
  | 'margin'
>;

export const PRESETS: Record<PresetId, Appearance> = {
  minimal: {
    moduleStyle: 'square',
    finderOuter: 'square',
    finderInner: 'square',
    foreground: '#111111',
    background: '#ffffff',
    margin: 4,
  },
  pro: {
    moduleStyle: 'rounded',
    finderOuter: 'rounded',
    finderInner: 'rounded',
    foreground: '#0b2545',
    background: '#ffffff',
    margin: 4,
  },
  modern: {
    moduleStyle: 'dots',
    finderOuter: 'circle',
    finderInner: 'circle',
    foreground: '#0b5d3b',
    gradient: { to: '#1d3557', angle: 45 },
    background: '#ffffff',
    margin: 4,
  },
  contrast: {
    moduleStyle: 'square',
    finderOuter: 'square',
    finderInner: 'square',
    foreground: '#000000',
    background: '#ffffff',
    margin: 6,
  },
  signal: {
    moduleStyle: 'leaf',
    finderOuter: 'leaf',
    finderInner: 'leaf',
    foreground: '#0c0d0f',
    background: '#c8ff2e',
    margin: 4,
  },
};
