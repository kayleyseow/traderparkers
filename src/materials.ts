import type { Material } from './types'

/** Canonical display order — most common TJ tote materials first. */
export const MATERIAL_ORDER: Material[] = [
  'canvas',
  'polypropylene',
  'jute',
  'paper',
  'insulated',
  'nylon',
]

export const MATERIAL_LABEL: Record<Material, string> = {
  canvas: 'Canvas',
  polypropylene: 'Polypropylene',
  jute: 'Jute',
  paper: 'Paper',
  insulated: 'Insulated',
  nylon: 'Nylon',
}
