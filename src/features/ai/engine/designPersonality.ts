/**
 * Osobowość dokumentu (Design Personality).
 *
 * Problem: wszystkie notatki wyglądały tak samo. Rozwiązanie: każdy dokument dostaje
 * „osobowość" złożoną z (a) archetypu tematu, (b) stylu wybranego przez użytkownika
 * lub dobranego z tematu oraz (c) ziarna losowego. Osobowość determinuje wybór
 * wprowadzenia, układu definicji, kolejności wyróżnień, okładki, ikon i sposobu
 * prezentacji mediów – zawsze w obrębie wspólnego systemu designu aplikacji.
 */

import type { StyleHint, TopicArchetype } from './types';

/** Mulberry32 – szybki, deterministyczny generator pseudolosowy. */
export function createRng(seed: number) {
  let t = seed >>> 0;
  const next = () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    chance: (p: number) => next() < p,
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    pick: <T>(arr: readonly T[]): T => arr[Math.floor(next() * arr.length)],
    shuffle: <T>(arr: readonly T[]): T[] => {
      const copy = arr.slice();
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    },
  };
}

export type Rng = ReturnType<typeof createRng>;

export type IntroStyle = 'lead_takeaway' | 'summary_first' | 'callout_first' | 'stats_first' | 'quote_first';
export type DefinitionLayout = 'cards' | 'columns' | 'bullets' | 'table' | 'toggles';
export type HeadingDecor = 'emoji' | 'plain' | 'numbered';
export type MediaPlacement = 'section_start' | 'after_intro' | 'section_end';
export type EmphasisPalette = 'info_tip' | 'tip_warning' | 'success_info' | 'info_warning';
export type ReviewStyle = 'faq' | 'checklist' | 'quiz_toggles' | 'takeaways';

export interface DocumentPersonality {
  id: string;
  label: string;
  intro: IntroStyle;
  definitionLayout: DefinitionLayout;
  headingDecor: HeadingDecor;
  mediaPlacement: MediaPlacement;
  emphasis: EmphasisPalette;
  reviewStyle: ReviewStyle;
  /** Gęstość: ile wizualnych elementów na akapit (0–1). */
  visualDensity: number;
  /** Czy sekcje oddzielać liniami. */
  useDividers: boolean;
  /** Czy dodawać cytat wyróżniony. */
  usePullQuote: boolean;
  /** Czy używać kolumn do zestawień. */
  useColumns: boolean;
  /** Czy dodawać diagram pojęć. */
  useDiagram: boolean;
  coverGradient: string;
  icon: string;
  accent: string;
  tags: string[];
}

export const COVER_GRADIENTS = [
  'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
  'linear-gradient(135deg, #064e3b 0%, #022c22 100%)',
  'linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)',
  'linear-gradient(135deg, #78350f 0%, #451a03 100%)',
  'linear-gradient(135deg, #7c2d12 0%, #431407 100%)',
  'linear-gradient(135deg, #134e4a 0%, #042f2e 100%)',
  'linear-gradient(135deg, #581c87 0%, #3b0764 100%)',
  'linear-gradient(135deg, #1e3a8a 0%, #172554 100%)',
  'linear-gradient(135deg, #831843 0%, #500724 100%)',
  'linear-gradient(135deg, #365314 0%, #1a2e05 100%)',
];

const ARCHETYPE_ICONS: Record<TopicArchetype, string[]> = {
  concept_science: ['🔬', '🧠', '📐', '⚛️', '🧪'],
  technology: ['💻', '⚙️', '🛰️', '🧩', '🔌'],
  history_event: ['🏛️', '📜', '⏳', '🗺️', '⚔️'],
  biology_nature: ['🌿', '🐾', '🦋', '🌍', '🧬'],
  business_market: ['📈', '💼', '🏢', '🧭', '💡'],
  comparison: ['⚖️', '🆚', '📊', '🔍'],
  how_to: ['🛠️', '✅', '🧭', '📋'],
  person_place: ['👤', '📍', '🏙️', '🎓'],
  health_medicine: ['🩺', '🫀', '💊', '🧘'],
  general: ['📄', '📘', '📝', '📚', '🔖'],
};

interface PersonalityTemplate {
  id: string;
  label: string;
  styles: StyleHint[];
  archetypes: TopicArchetype[];
  intro: IntroStyle[];
  definitionLayout: DefinitionLayout[];
  headingDecor: HeadingDecor[];
  mediaPlacement: MediaPlacement[];
  emphasis: EmphasisPalette[];
  reviewStyle: ReviewStyle[];
  visualDensity: [number, number];
  useDividers: boolean;
  usePullQuote: boolean;
  useColumns: boolean;
  useDiagram: boolean;
  accent: string;
}

const TEMPLATES: PersonalityTemplate[] = [
  {
    id: 'editorial', label: 'Redakcyjna', styles: ['academic', 'creative'],
    archetypes: ['history_event', 'person_place', 'general', 'concept_science'],
    intro: ['lead_takeaway', 'quote_first'], definitionLayout: ['cards', 'toggles'], headingDecor: ['plain', 'emoji'],
    mediaPlacement: ['after_intro', 'section_start'], emphasis: ['info_tip', 'success_info'], reviewStyle: ['takeaways', 'faq'],
    visualDensity: [0.4, 0.6], useDividers: true, usePullQuote: true, useColumns: false, useDiagram: false, accent: '#7c3aed',
  },
  {
    id: 'study', label: 'Zeszyt do nauki', styles: ['school'],
    archetypes: ['concept_science', 'biology_nature', 'history_event', 'health_medicine', 'general'],
    intro: ['summary_first', 'callout_first'], definitionLayout: ['cards', 'columns'], headingDecor: ['emoji', 'numbered'],
    mediaPlacement: ['section_start', 'after_intro'], emphasis: ['info_tip', 'tip_warning'], reviewStyle: ['quiz_toggles', 'checklist', 'faq'],
    visualDensity: [0.6, 0.85], useDividers: false, usePullQuote: false, useColumns: true, useDiagram: true, accent: '#16a34a',
  },
  {
    id: 'dashboard', label: 'Panel danych', styles: ['business', 'visual'],
    archetypes: ['business_market', 'comparison', 'technology'],
    intro: ['stats_first', 'summary_first'], definitionLayout: ['table', 'columns'], headingDecor: ['plain'],
    mediaPlacement: ['section_end', 'after_intro'], emphasis: ['info_warning', 'success_info'], reviewStyle: ['takeaways', 'checklist'],
    visualDensity: [0.55, 0.8], useDividers: true, usePullQuote: false, useColumns: true, useDiagram: true, accent: '#2563eb',
  },
  {
    id: 'minimal', label: 'Minimalistyczna', styles: ['minimal'],
    archetypes: ['general', 'how_to', 'concept_science', 'person_place'],
    intro: ['lead_takeaway'], definitionLayout: ['bullets'], headingDecor: ['plain'],
    mediaPlacement: ['section_end'], emphasis: ['info_tip'], reviewStyle: ['takeaways'],
    visualDensity: [0.15, 0.3], useDividers: false, usePullQuote: false, useColumns: false, useDiagram: false, accent: '#475569',
  },
  {
    id: 'technical', label: 'Dokumentacja techniczna', styles: ['technical'],
    archetypes: ['technology', 'how_to', 'concept_science'],
    intro: ['summary_first', 'callout_first'], definitionLayout: ['table', 'bullets', 'toggles'], headingDecor: ['numbered', 'plain'],
    mediaPlacement: ['after_intro', 'section_end'], emphasis: ['tip_warning', 'info_warning'], reviewStyle: ['checklist', 'faq'],
    visualDensity: [0.45, 0.7], useDividers: true, usePullQuote: false, useColumns: false, useDiagram: true, accent: '#0891b2',
  },
  {
    id: 'magazine', label: 'Magazyn wizualny', styles: ['visual', 'creative'],
    archetypes: ['biology_nature', 'history_event', 'person_place', 'general'],
    intro: ['quote_first', 'lead_takeaway', 'stats_first'], definitionLayout: ['columns', 'cards'], headingDecor: ['emoji', 'plain'],
    mediaPlacement: ['section_start'], emphasis: ['success_info', 'info_tip'], reviewStyle: ['takeaways', 'faq'],
    visualDensity: [0.65, 0.9], useDividers: false, usePullQuote: true, useColumns: true, useDiagram: false, accent: '#db2777',
  },
  {
    id: 'report', label: 'Raport wykonawczy', styles: ['business', 'academic'],
    archetypes: ['business_market', 'health_medicine', 'comparison', 'technology'],
    intro: ['summary_first', 'stats_first'], definitionLayout: ['table', 'cards'], headingDecor: ['numbered', 'plain'],
    mediaPlacement: ['section_end'], emphasis: ['info_warning', 'tip_warning'], reviewStyle: ['takeaways', 'checklist'],
    visualDensity: [0.4, 0.6], useDividers: true, usePullQuote: false, useColumns: false, useDiagram: false, accent: '#b45309',
  },
  {
    id: 'workbook', label: 'Zeszyt ćwiczeń', styles: ['school', 'technical'],
    archetypes: ['how_to', 'concept_science', 'technology', 'general'],
    intro: ['callout_first'], definitionLayout: ['toggles', 'cards'], headingDecor: ['numbered', 'emoji'],
    mediaPlacement: ['after_intro'], emphasis: ['tip_warning', 'info_tip'], reviewStyle: ['quiz_toggles', 'checklist'],
    visualDensity: [0.5, 0.75], useDividers: false, usePullQuote: false, useColumns: true, useDiagram: true, accent: '#ea580c',
  },
];

function scoreTemplate(t: PersonalityTemplate, archetype: TopicArchetype, style: StyleHint | undefined): number {
  let s = 0;
  if (style && t.styles.includes(style)) s += 6;
  if (t.archetypes.includes(archetype)) s += 3;
  return s;
}

export interface PersonalityRequest {
  archetype: TopicArchetype;
  style?: StyleHint;
  seed: number;
  /** Kolejne notatki w tej samej serii (podstrony) dostają spójną, lecz nie identyczną osobowość. */
  variant?: number;
}

/** Wybiera osobowość: najlepsze szablony wg dopasowania, a spośród nich losowo wg ziarna. */
export function pickPersonality(req: PersonalityRequest): DocumentPersonality {
  const rng = createRng(req.seed + (req.variant || 0) * 7919);
  const scored = TEMPLATES.map((t) => ({ t, s: scoreTemplate(t, req.archetype, req.style) + rng.next() * 2.2 }))
    .sort((a, b) => b.s - a.s);
  const template = scored[0].t;
  const density = template.visualDensity[0] + rng.next() * (template.visualDensity[1] - template.visualDensity[0]);
  const icons = ARCHETYPE_ICONS[req.archetype] || ARCHETYPE_ICONS.general;
  return {
    id: template.id,
    label: template.label,
    intro: rng.pick(template.intro),
    definitionLayout: rng.pick(template.definitionLayout),
    headingDecor: rng.pick(template.headingDecor),
    mediaPlacement: rng.pick(template.mediaPlacement),
    emphasis: rng.pick(template.emphasis),
    reviewStyle: rng.pick(template.reviewStyle),
    visualDensity: Math.round(density * 100) / 100,
    useDividers: template.useDividers,
    usePullQuote: template.usePullQuote && rng.chance(0.85),
    useColumns: template.useColumns && rng.chance(0.8),
    useDiagram: template.useDiagram && rng.chance(0.85),
    coverGradient: rng.pick(COVER_GRADIENTS),
    icon: rng.pick(icons),
    accent: template.accent,
    tags: [template.label, req.archetype],
  };
}

/** Rodzina wariantów dla serii stron: wspólna okładka i akcent, różne układy sekcji. */
export function pickSeriesPersonalities(count: number, req: PersonalityRequest): DocumentPersonality[] {
  const base = pickPersonality(req);
  const list: DocumentPersonality[] = [base];
  for (let i = 1; i < count; i++) {
    const variant = pickPersonality({ ...req, variant: i });
    list.push({ ...variant, coverGradient: base.coverGradient, accent: base.accent });
  }
  return list;
}

export interface EmphasisKinds {
  primary: 'info' | 'tip' | 'success';
  secondary: 'tip' | 'warning' | 'info';
}

export function emphasisKinds(palette: EmphasisPalette): EmphasisKinds {
  switch (palette) {
    case 'tip_warning':
      return { primary: 'tip', secondary: 'warning' };
    case 'success_info':
      return { primary: 'success', secondary: 'info' };
    case 'info_warning':
      return { primary: 'info', secondary: 'warning' };
    default:
      return { primary: 'info', secondary: 'tip' };
  }
}

/** Tekst nagłówka z dekoracją zgodną z osobowością (emoji / numeracja / brak). */
export function decorateHeading(personality: DocumentPersonality, title: string, icon: string, index: number): string {
  switch (personality.headingDecor) {
    case 'emoji':
      return `${icon} ${title}`;
    case 'numbered':
      return `${index + 1}. ${title}`;
    default:
      return title;
  }
}

/** Odcisk palca osobowości – pozwala w testach sprawdzić, że kolejne notatki się różnią. */
export function personalityFingerprint(p: DocumentPersonality): string {
  return [p.id, p.intro, p.definitionLayout, p.headingDecor, p.mediaPlacement, p.emphasis, p.reviewStyle, p.coverGradient].join('|');
}

/** Dopasowuje wskazówkę stylu z polecenia użytkownika („akademicki", „minimalistyczny"…). */
export function detectStyleHint(text: string): StyleHint | undefined {
  const t = text.toLowerCase();
  const rules: Array<[RegExp, StyleHint]> = [
    [/akademick|naukow|uczeln|studi/, 'academic'],
    [/szkoln|do nauki|uczniow|sprawdzian|kartkówk|egzamin|maturaln/, 'school'],
    [/techniczn|dokumentacj|developersk|programist/, 'technical'],
    [/biznes|firmow|raport|executive|zarząd|rynkow/, 'business'],
    [/kreatywn|artystyczn|magazyn|luźn/, 'creative'],
    [/minimalist|prost|czyst|krótk|lakonicz/, 'minimal'],
    [/styl\s+wizualn|wizualn|graficzn|bogato\s+ilustrowan/, 'visual'],
  ];
  for (const [re, hint] of rules) if (re.test(t)) return hint;
  return undefined;
}

export interface DesignPersonality extends DocumentPersonality {
  name: string;
  description: string;
  calloutStyle: 'info' | 'tip' | 'quote';
  preferredTable: 'comparison' | 'decision_matrix';
  accentColor: string;
}

function adaptPersonality(docP: DocumentPersonality): DesignPersonality {
  const calloutStyle = docP.intro === 'quote_first' ? 'quote' : docP.id === 'study' ? 'tip' : 'info';
  const preferredTable = docP.id === 'dashboard' ? 'decision_matrix' : 'comparison';
  return {
    ...docP,
    name: docP.label,
    description: `Styl ${docP.label} z paletą ${docP.accent}`,
    calloutStyle,
    preferredTable,
    accentColor: docP.accent,
  };
}

/** Pobiera osobowość designu po identyfikatorze (editorial, study, dashboard, minimal itp.) */
export function getPersonalityById(id: string): DesignPersonality {
  const t = TEMPLATES.find((tpl) => tpl.id === id) || TEMPLATES[0];
  const req: PersonalityRequest = { archetype: 'general', seed: 42 };
  const docP = pickPersonality(req);
  return adaptPersonality({ ...docP, id: t.id, label: t.label, accent: t.accent });
}

/** Wybiera losową lub deterministyczną osobowość designu na podstawie ziarna */
export function getRandomPersonality(seed: number | string = Date.now()): DesignPersonality {
  const numSeed = typeof seed === 'number' ? seed : Array.from(String(seed)).reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const rng = createRng(numSeed);
  const t = rng.pick(TEMPLATES);
  const req: PersonalityRequest = { archetype: 'general', seed: numSeed };
  const docP = pickPersonality(req);
  return adaptPersonality({ ...docP, id: t.id, label: t.label, accent: t.accent });
}

/** Zwraca listę wszystkich dostępnych szablonów osobowości */
export function getAllPersonalities(): DesignPersonality[] {
  return TEMPLATES.map((t) => getPersonalityById(t.id));
}

