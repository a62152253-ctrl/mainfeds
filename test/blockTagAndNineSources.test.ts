import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  hasAiBlockTags,
  parseAiBlockTagsToBlocks,
  composeDynamicBlockTagStream,
  buildAiBlockTagSystemPrompt,
} from '../src/features/ai/blockTagParser';
import { classifyIntent, classifyDocumentIntent } from '../src/features/ai/engine/intentRouter';
import { reasonAboutUserInput } from '../src/features/ai/reasoning';
import type { VerifiedSource } from '../src/features/ai/multiSourceResearchService';

describe('AI Block Tag DSL (#HEADER1#...#HEADER1#)', () => {
  it('detects and parses #HEADER1#TEXT#HEADER1# and multiple rich block tags', () => {
    const raw = `
      #HEADER1#Prawo Pracy i Czas Pracy w RP#HEADER1#
      #LEAD#Analiza przepisów Kodeksu pracy na podstawie ISAP Sejm RP.#LEAD#
      #STAT_GRID#Wymiar dobowy: 8 godzin (Art. 129 KP) | Przeciętnie tygodniowo: 40 godzin (5-dniowy tydzień)#STAT_GRID#
      #CALLOUT_WARNING#Przekroczenie normy dobowej stanowi pracę w godzinach nadliczbowych.#CALLOUT_WARNING#
      #HEADER2#Porównanie systemów czasu pracy#HEADER2#
      #TABLE#System | Max wymiar dobowy | Okres rozliczeniowy
      Podstawowy | 8h | do 4 miesięcy
      Równoważny | 12h (do 16h/24h) | do 1 miesiąca#TABLE#
      #CODE:typescript#const maxWeeklyHours: number = 40;#CODE#
      #FAQ#Ile wynosi doba pracownicza? :: 24 kolejne godziny poczynając od godziny, w której pracownik rozpoczyna pracę.#FAQ#
      #BOOKMARK#https://isap.sejm.gov.pl | ISAP Sejm RP | Oficjalny rejestr aktów prawnych#BOOKMARK#
      #KEY_TAKEAWAY#Kodeks pracy ściśle reguluje normy odpoczynku dobowego (11h) i tygodniowego (35h).#KEY_TAKEAWAY#
    `;

    assert.equal(hasAiBlockTags(raw), true);
    const parsed = parseAiBlockTagsToBlocks(raw);
    assert.equal(parsed.title, 'Prawo Pracy i Czas Pracy w RP');
    assert.ok(parsed.tagCount >= 9);
    assert.ok(parsed.usedBlockTypes.includes('h1'));
    assert.ok(parsed.usedBlockTypes.includes('lead'));
    assert.ok(parsed.usedBlockTypes.includes('stat_grid'));
    assert.ok(parsed.usedBlockTypes.includes('callout_warning'));
    assert.ok(parsed.usedBlockTypes.includes('table'));
    assert.ok(parsed.usedBlockTypes.includes('code'));
    assert.ok(parsed.usedBlockTypes.includes('faq'));
    assert.ok(parsed.usedBlockTypes.includes('bookmark'));
    assert.ok(parsed.usedBlockTypes.includes('key_takeaway'));
  });

  it('dynamically adapts block tags to topic domain (Law/Gov vs Programming/IT vs BioMed)', () => {
    const lawSources: VerifiedSource[] = [
      {
        id: 'sejm-1',
        name: '[Dz.U. 1974 nr 24 poz. 141] Ustawa Kodeks pracy',
        domain: 'isap.sejm.gov.pl',
        url: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19740240141',
        snippet: 'Ustawa regulująca prawa i obowiązki pracowników oraz pracodawców.',
        confidence: 0.9,
      },
      {
        id: 'wiki-1',
        name: 'Wikipedia: Kodeks pracy',
        domain: 'pl.wikipedia.org',
        url: 'https://pl.wikipedia.org/wiki/Kodeks_pracy',
        snippet: 'Akt normatywny z zakresu prawa pracy.',
        confidence: 0.7,
      },
    ];

    const lawStream = composeDynamicBlockTagStream(
      'Kodeks pracy',
      'Kodeks pracy reguluje stosunek pracy w Polsce.',
      [{ title: 'Zasady prawa pracy', content: 'Katalog podstawowych zasad prawa pracy zawarty jest w dziale pierwszym ustawy.' }],
      lawSources,
      []
    );
    assert.ok(lawStream.includes('#CALLOUT_WARNING#'));
    assert.ok(lawStream.includes('#CARD#'));

    const techSources: VerifiedSource[] = [
      {
        id: 'so-1',
        name: 'StackOverflow: TypeScript generics constraints',
        domain: 'stackoverflow.com',
        url: 'https://stackoverflow.com/questions/1',
        snippet: 'How to constrain generic types in TypeScript using extends.',
        confidence: 0.8,
      },
      {
        id: 'npm-1',
        name: 'NPM Package: typescript (v5.6.2)',
        domain: 'npmjs.com',
        url: 'https://www.npmjs.com/package/typescript',
        snippet: 'TypeScript is a language for application scale JavaScript development.',
        confidence: 0.85,
      },
    ];

    const techStream = composeDynamicBlockTagStream(
      'TypeScript',
      'TypeScript to statycznie typowany nadzbiór języka JavaScript.',
      [],
      techSources,
      []
    );
    assert.ok(techStream.includes('#CALLOUT_TIP#'));
    assert.ok(techStream.includes('#MERMAID#'));
    assert.ok(techStream.includes('#TABLE#'));

    const prompt = buildAiBlockTagSystemPrompt('TypeScript', techSources, 'Opis TS');
    assert.ok(prompt.includes('#HEADER1#'));
    assert.ok(prompt.includes('stackoverflow.com'));
  });
});

describe('Colloquial Polish Command Understanding', () => {
  it('understands casual note creation and task commands in reasoning and intentRouter', () => {
    const r1 = reasonAboutUserInput('weź zrób notkę o sztucznej inteligencji');
    assert.equal(r1.intent, 'CREATE_NOTE_LIVE');

    const r2 = reasonAboutUserInput('poka zadania');
    assert.equal(r2.intent, 'LIST_USER_TASKS');

    const r3 = reasonAboutUserInput('umiesz w 9 zrudlach?');
    assert.equal(r3.intent, 'CAPABILITY_SHOWCASE');

    const i1 = classifyIntent('weź zrób notkę o podatkach VAT');
    assert.equal(i1.kind, 'create_note');

    const i2 = classifyDocumentIntent('odpicuj wygląd tej notatki');
    assert.equal(i2.intent, 'improve_design');

    const i3 = classifyDocumentIntent('za długie skróć to');
    assert.equal(i3.intent, 'shorten');
  });
});
