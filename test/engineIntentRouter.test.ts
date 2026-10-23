import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyIntent, extractTopic, intentIsActionable, levenshtein } from '../src/features/ai/engine/intentRouter';
import type { EngineContext } from '../src/features/ai/engine/types';
import type { WorkspacePage } from '../src/types/workspace';

function page(id: string, title: string): WorkspacePage {
  return {
    id, title, icon: '📄', blocks: [{ id: 'b1', type: 'p', content: 'Treść strony.' }],
    isFavorite: false, isDeleted: false, isPublic: false, tags: [], comments: [], versions: [], createdAt: 1, updatedAt: 1,
  };
}

const empty: EngineContext = { pages: [] };
const withPage = (title = 'Fotosynteza'): EngineContext => ({ pages: [page('p1', title)], activePage: page('p1', title) });

test('„Daj mi notatkę o fotosyntezie" tworzy jedną notatkę z poprawnym tematem', () => {
  const i = classifyIntent('Daj mi notatkę o fotosyntezie', empty);
  assert.equal(i.kind, 'create_note');
  assert.equal(i.topic.toLowerCase(), 'fotosyntezie');
  assert.ok(i.confidence >= 0.7);
});

test('literówki w poleceniu tworzenia notatki', () => {
  const i = classifyIntent('stwurz notatke o psach', empty);
  assert.equal(i.kind, 'create_note');
  assert.equal(i.topic, 'psach');
});

test('„kompletna notatka o sztucznej inteligencji" → struktura wiedzy z podstronami', () => {
  const i = classifyIntent('Zrób kompletną notatkę na temat sztucznej inteligencji', empty);
  assert.equal(i.kind, 'create_knowledge_base');
  assert.equal(i.modifiers.wantsSubpages, true);
  assert.equal(i.topic.toLowerCase(), 'sztucznej inteligencji');
});

test('liczba podstron jest odczytywana z polecenia', () => {
  const i = classifyIntent('stwórz notatkę o Rzymie z 10 podstronami', empty);
  assert.equal(i.kind, 'create_knowledge_base');
  assert.equal(i.modifiers.pageCountHint, 10);
  assert.equal(i.topic, 'Rzymie');
});

test('krótka notatka nie tworzy podstron', () => {
  const i = classifyIntent('daj krótką notatkę o czarnych dziurach', empty);
  assert.equal(i.kind, 'create_note');
  assert.equal(i.modifiers.length, 'short');
  assert.notEqual(i.modifiers.wantsSubpages, true);
});

test('„bez podstron" wymusza pojedynczy dokument', () => {
  const i = classifyIntent('zrób pełne opracowanie o blockchainie bez podstron', empty);
  assert.equal(i.modifiers.wantsSubpages, false);
});

test('„ulepsz design" ≠ „ulepsz notatkę"', () => {
  const design = classifyIntent('ulepsz design', withPage());
  const content = classifyIntent('ulepsz tę notatkę', withPage());
  assert.equal(design.kind, 'improve_design');
  assert.equal(content.kind, 'improve_content');
  assert.equal(design.topic, 'Fotosynteza');
});

test('wariacje „ulepsz design"', () => {
  for (const phrase of ['popraw wygląd notatki', 'zrób to ładniej', 'popraw układ i formatowanie', 'ulepsz desing', 'przeprojektuj wygląd tej strony']) {
    assert.equal(classifyIntent(phrase, withPage()).kind, 'improve_design', phrase);
  }
});

test('„rozwiń temat" oraz „rozbuduj"', () => {
  assert.equal(classifyIntent('rozwiń temat', withPage()).kind, 'expand');
  assert.equal(classifyIntent('rozbuduj tę notatkę o przykłady', withPage()).kind, 'expand');
  assert.equal(classifyIntent('rozwiń', withPage()).kind, 'expand');
  assert.equal(classifyIntent('rozwiń temat', withPage()).topic, 'Fotosynteza');
});

test('„skróć" skraca dokument, a nie tworzy nowy', () => {
  assert.equal(classifyIntent('skróć tę notatkę', withPage()).kind, 'shorten');
  assert.equal(classifyIntent('skróć', withPage()).kind, 'shorten');
  assert.equal(classifyIntent('zrób krótszą wersję', withPage()).kind, 'shorten');
});

test('„wyszukaj i podmień notatkę" → research_replace', () => {
  const i = classifyIntent('wyszukaj informacje o Marsie i podmień tę notatkę', withPage('Mars'));
  assert.equal(i.kind, 'research_replace');
  assert.equal(i.modifiers.replaceExisting, true);
});

test('„znajdź informacje i przygotuj notatkę" → research_note', () => {
  const i = classifyIntent('Znajdź informacje o energii jądrowej i przygotuj notatkę', empty);
  assert.equal(i.kind, 'research_note');
  assert.match(i.topic.toLowerCase(), /energii j/);
});

test('„zrób to lepiej" używa kontekstu', () => {
  const ctx: EngineContext = { ...withPage('Sztuczna inteligencja'), lastAction: { kind: 'create_note', pageIds: ['p1'], topic: 'Sztuczna inteligencja', at: 1 } };
  const i = classifyIntent('zrób to lepiej', ctx);
  assert.equal(i.kind, 'redo_better');
  assert.equal(i.modifiers.improveFocus, 'both');
  assert.equal(i.topic, 'Sztuczna inteligencja');
  assert.equal(classifyIntent('zrób to lepiej, bardziej czytelnie', ctx).modifiers.improveFocus, 'design');
});

test('krótkie „lepiej" / „więcej" / „krócej" w kontekście', () => {
  assert.equal(classifyIntent('lepiej', withPage()).kind, 'redo_better');
  assert.equal(classifyIntent('więcej', withPage()).kind, 'expand');
  assert.equal(classifyIntent('krócej', withPage()).kind, 'shorten');
});

test('operacje na stronach: dodaj podstronę, usuń, przenieś', () => {
  assert.equal(classifyIntent('dodaj podstronę o fotosyntezie ciemnej', withPage()).kind, 'add_subpage');
  assert.equal(classifyIntent('usuń notatkę o psach', withPage()).kind, 'delete_page');
  const mv = classifyIntent('przenieś notatkę o psach do folderu Zwierzęta', withPage());
  assert.equal(mv.kind, 'move_page');
  assert.equal(mv.modifiers.folderQuery, 'Zwierzęta');
});

test('pytania i rozmowa nie uruchamiają silnika dokumentów', () => {
  for (const phrase of ['czym jest fotosynteza?', 'hej, jak się masz', 'dzięki', 'dlaczego niebo jest niebieskie']) {
    assert.equal(classifyIntent(phrase, withPage()).kind, 'none', phrase);
  }
});

test('komendy legacy (@) pozostają dla starego silnika', () => {
  assert.equal(classifyIntent('@tasks', empty).kind, 'none');
  assert.equal(classifyIntent('@calendar spotkanie jutro', empty).kind, 'none');
  assert.equal(classifyIntent('@note koty', empty).kind, 'create_note');
});

test('wskazówka stylu i multimediów jest odczytywana', () => {
  const i = classifyIntent('daj notatkę szkolną o wojnie 1920 z obrazkami i źródłami', empty);
  assert.equal(i.modifiers.styleHint, 'school');
  assert.equal(i.modifiers.includeMedia, true);
  assert.equal(i.modifiers.wantsSources, true);
});

test('extractTopic odcina instrukcje wykonawcze z końca polecenia', () => {
  assert.equal(extractTopic('stwórz notatkę o sieciach neuronowych i dodaj tabelę'), 'sieciach neuronowych');
  assert.equal(extractTopic('napisz opracowanie na temat Układu Słonecznego'), 'Układu Słonecznego');
});

test('intentIsActionable wymaga tematu lub dokumentu', () => {
  const noTopic = classifyIntent('stwórz notatkę', empty);
  assert.equal(intentIsActionable(noTopic, empty).ok, false);
  const edit = classifyIntent('ulepsz design', empty);
  assert.equal(intentIsActionable(edit, empty).ok, false);
  assert.equal(intentIsActionable(classifyIntent('ulepsz design', withPage()), withPage()).ok, true);
});

test('levenshtein działa na krótkich słowach', () => {
  assert.equal(levenshtein('notatke', 'notatka'), 1);
  assert.equal(levenshtein('abc', 'abc'), 0);
  assert.ok(levenshtein('abc', 'xyzxyz', 2) > 2);
});
