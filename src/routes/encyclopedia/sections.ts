import type { BagType } from '../../types'

export type SectionDef = {
  type: BagType
  id: string
  label: string
  scrubberLabel?: string
  blurb: string
}

export const STATES_SECTION = {
  id: 'enc-states',
  label: 'States & Cities',
  scrubberLabel: 'States',
  blurb:
    'Regional totes — one per state, plus a few that zoom in on specific cities and regions.',
}

export const NON_LOCATION_SECTIONS: SectionDef[] = [
  {
    type: 'special',
    id: 'enc-special',
    label: 'Special Editions',
    blurb:
      'Themed bags that aren’t tied to a state — pickle, sardine, cheese, wine.',
  },
  {
    type: 'seasonal',
    id: 'enc-seasonal',
    label: 'Seasonal',
    blurb: 'Released around a holiday or season; designs change year to year.',
  },
  {
    type: 'standard',
    id: 'enc-standard',
    label: 'Standard Bags',
    blurb:
      'The everyday lineup — insulated, mini canvas, washable paper, and more.',
  },
]

export const SUGGEST_SECTION = {
  id: 'enc-suggest',
  label: 'Spot a Missing Bag?',
  scrubberLabel: 'Missing Bag',
  blurb:
    "The encyclopedia is hand-curated and almost certainly missing some. If you've seen a TJ bag in the wild that isn't here, send it our way.",
}
