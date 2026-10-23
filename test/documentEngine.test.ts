import test from 'node:test';
import assert from 'node:assert/strict';
import { documentEngine } from '../src/features/ai/engine/documentEngine';
import type { DocBlock, WorkspacePage } from '../src/types/workspace';

test('generateDocument tworzy bogaty, zweryfikowany dokument z różnymi typami bloków', async () => {
  const result = await documentEngine.generateDocument('TypeScript', {
    topic: 'TypeScript',
    summary: 'Statycznie typowany nadzbiór języka JavaScript kompilowany do czystego JS.',
    extract: 'TypeScript dodaje opcjonalne typowanie statyczne, interfejsy i generyki. Został opracowany przez Andersa Hejlsberga w firmie Microsoft i wydany w 2012 roku. Ponad 78% programistów deklaruje regularne korzystanie z języka.',
    sources: [
      { name: 'Oficjalna Dokumentacja TS', url: 'https://www.typescriptlang.org', domain: 'typescriptlang.org', snippet: 'TypeScript is JavaScript with syntax for types.' },
    ],
  });

  assert.equal(result.title, 'TypeScript');
  assert.ok(result.blocks.length >= 10, `Oczekiwano co najmniej 10 bloków, otrzymano ${result.blocks.length}`);

  const blockTypes = new Set(result.blocks.map((b) => b.type));
  assert.ok(blockTypes.has('h1'), 'Musi zawierać h1');
  assert.ok(blockTypes.has('h2'), 'Musi zawierać h2');
  assert.ok(blockTypes.has('p'), 'Musi zawierać p');
  assert.ok(blockTypes.has('table'), 'Musi zawierać tabelę porównawczą');
  assert.ok(blockTypes.has('todo'), 'Musi zawierać checklistę');

  // Sprawdź czy statystyki słów i czasu czytania są poprawnie wyliczone
  assert.ok(result.stats.wordCount > 50, 'Musi mieć policzone słowa');
  assert.ok(result.stats.readingTimeMinutes >= 1, 'Musi mieć estymowany czas czytania');
});

test('generateKnowledgeBase tworzy hierarchię: 1 Hub + 10 Podstron z parentPageId i [[linkami]]', () => {
  const kbResult = documentEngine.generateKnowledgeBase('Docker i Konteneryzacja', {
    topic: 'Docker',
    summary: 'Platforma wirtualizacji na poziomie systemu operacyjnego.',
    extract: 'Docker umożliwia pakowanie aplikacji w lekkie kontenery zawierające wszystkie zależności.',
  });

  assert.ok(kbResult.hubPage, 'Musi wygenerować stronę główną Hub');
  assert.equal(kbResult.subpages.length, 10, 'Musi wygenerować dokładnie 10 podstron');
  assert.equal(kbResult.totalPagesCount, 11, 'Łącznie 11 stron w bazie wiedzy');

  // Sprawdź czy każda podstrona ma poprawny parentPageId
  for (const sp of kbResult.subpages) {
    assert.equal(sp.parentPageId, kbResult.hubPage.id, `Podstrona ${sp.title} musi mieć parentPageId równy id Hubu`);
    assert.ok(sp.blocks.length >= 8, `Podstrona ${sp.title} musi zawierać co najmniej 8 bloków`);

    // Sprawdź czy podstrona posiada odnośnik zwrotny do Hubu
    const hasBacklink = sp.blocks.some((b) => b.content?.includes(`[[${kbResult.hubPage.title}]]`));
    assert.ok(hasBacklink, `Podstrona ${sp.title} musi mieć odnośnik zwrotny [[${kbResult.hubPage.title}]]`);
  }

  // Sprawdź czy strona główna Hub posiada odnośniki do podstron
  const hubContent = kbResult.hubPage.blocks.map((b) => b.content).join(' ');
  for (const sp of kbResult.subpages) {
    assert.ok(hubContent.includes(`[[${sp.title}]]`), `Hub musi zawierać odnośnik do podstrony [[${sp.title}]]`);
  }
});

test('improveDesign eliminuje ściany tekstu i ulepsza bloki bez utraty treści', () => {
  const sampleBlocks: DocBlock[] = [
    { id: 'b1', type: 'h1', content: 'Testowy Dokument' },
    {
      id: 'b2',
      type: 'p',
      // Długi akapit będący ścianą tekstu (> 380 znaków) z liczbami
      content: 'W roku 2026 wdrożono nowy system przetwarzania danych operacyjnych, który zredukował czas odpowiedzi z 1450 ms do 180 ms, przynosząc oszczędność rzędu 45% rocznych kosztów infrastruktury serwerowej. Cały proces został podzielony na kilka niezależnych mikroserwisów komunikujących się asynchronicznie poprzez kolejkę zdarzeń, co zapobiegło wąskim gardłom i przeciążeniom w godzinach szczytu biznesowego.',
    },
    { id: 'b3', type: 'h2', content: 'Częste Pytania' },
    { id: 'b4', type: 'h3', content: 'Czy system wymaga restartu?' },
    { id: 'b5', type: 'p', content: 'Nie, wszystkie aktualizacje odbywają się w trybie zero-downtime rolling update.' },
  ];

  const result = documentEngine.improveDesign(sampleBlocks);

  assert.ok(result.stats.wallsOfTextEliminated >= 1, 'Musi wyeliminować ścianę tekstu');
  assert.ok(result.stats.blocksUpgradedCount >= 1, 'Musi ulepszyć bloki');

  const types = result.improvedBlocks.map((b) => b.type);
  assert.ok(types.includes('stat_grid') || types.includes('callout_info'), 'Powinien przekształcić ścianę tekstu w statystykę lub callout');
  assert.ok(types.includes('faq'), 'Powinien przekształcić pytanie i odpowiedź w akordeon FAQ');
  assert.ok(types.includes('divider'), 'Powinien dodać separator końcowy');
});

test('expandDocument rozbudowuje dokument o nowe sekcje merytoryczne i FAQ', () => {
  const initialBlocks: DocBlock[] = [
    { id: '1', type: 'h1', content: 'Krótka notatka' },
    { id: '2', type: 'p', content: 'Podstawowe informacje na temat projektu.' },
  ];

  const expanded = documentEngine.expandDocument(initialBlocks, 'Architektura');
  assert.ok(expanded.length > initialBlocks.length, 'Liczba bloków musi wzrosnąć');

  const types = expanded.map((b) => b.type);
  assert.ok(types.includes('table'), 'Rozszerzony dokument musi zawierać tabelę parametryzacji');
  assert.ok(types.includes('faq'), 'Rozszerzony dokument musi zawierać sekcję FAQ');
});

test('shortenDocument kondensuje treść do formatu Executive Summary', () => {
  const lengthyBlocks: DocBlock[] = [
    { id: '1', type: 'h1', content: 'Obszerny Raport Projektowy' },
    { id: '2', type: 'p', content: 'W projekcie zidentyfikowano 120 punktów styku oraz zarejestrowano 45 kluczowych incydentów bezpieczeństwa.' },
    { id: '3', type: 'p', content: 'Działania naprawcze przyniosły poprawę stabilności o 95% w ciągu 14 dni roboczych.' },
    { id: '4', type: 'p', content: 'Rekomenduje się kontynuację monitoringu środowiska produkcyjnego.' },
  ];

  const shortened = documentEngine.shortenDocument(lengthyBlocks, 'Raport Bezpieczeństwa');
  assert.ok(shortened.length >= 4, 'Skrót musi mieć zwięzłą strukturę');

  const types = shortened.map((b) => b.type);
  assert.ok(types.includes('callout_info'), 'Skrót musi zawierać callout informacyjny');
  assert.ok(types.includes('summary_box'), 'Skrót musi zawierać summary box');
});

test('searchAndReplace bezpiecznie podmienia treść we wszystkich typach bloków', () => {
  const blocks: DocBlock[] = [
    { id: '1', type: 'h1', content: 'Wdrożenie technologii AngularJS w projekcie' },
    { id: '2', type: 'p', content: 'Głównym frameworkiem frontendowym jest AngularJS.' },
    { id: '3', type: 'card', content: 'Moduł klienta', toggleDetails: 'Opis oparty o AngularJS' },
  ];

  const { updatedBlocks, replacedCount } = documentEngine.searchAndReplace(blocks, 'AngularJS', 'React');

  assert.equal(replacedCount, 3, 'Powinien podmienić 3 wystąpienia');
  assert.equal(updatedBlocks[0].content, 'Wdrożenie technologii React w projekcie');
  assert.equal(updatedBlocks[1].content, 'Głównym frameworkiem frontendowym jest React.');
  assert.equal(updatedBlocks[2].toggleDetails, 'Opis oparty o React');
});
