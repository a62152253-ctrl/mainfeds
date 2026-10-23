import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateAndMigratePage, WorkspacePage, PageComment } from '../src/types/workspace';
import { reasonAboutUserInput } from '../src/features/ai/reasoning';
import { composeBotAnswer } from '../src/features/ai/answering';

describe('Nowa Technologia Wspólnych Notatek & @email Mentions (Peer-to-Peer Admin)', () => {
  it('1. validateAndMigratePage zachowuje sharedWith i sharedCollaborators', () => {
    const raw = {
      id: 'p-shared-1',
      title: 'Notatka ze wspolpracy z @kamill@eskp.pl',
      blocks: [
        { id: 'b1', type: 'p', content: 'Hej @kamill@eskp.pl zobacz specyfikacje architektury!' },
      ],
      sharedWith: ['kamill@eskp.pl'],
      sharedCollaborators: [
        { email: 'kamill@eskp.pl', name: 'kamil', role: 'admin', addedAt: Date.now() },
      ],
      comments: [
        {
          id: 'c-1',
          author: 'kamil (Admin)',
          authorEmail: 'kamill@eskp.pl',
          avatar: 'K',
          text: 'Wyglada super, zatwierdzam jako admin!',
          timestamp: Date.now(),
          resolved: false,
        },
      ],
    };

    const page = validateAndMigratePage(raw);
    assert.equal(page.sharedWith?.length, 1);
    assert.equal(page.sharedWith?.[0], 'kamill@eskp.pl');
    assert.equal(page.sharedCollaborators?.[0]?.role, 'admin');
    assert.equal(page.comments.length, 1);
    assert.equal(page.comments[0].authorEmail, 'kamill@eskp.pl');
  });

  it('2. Wykrywanie wzmianki @kamill@eskp.pl i automatyczna ekstrakcja', () => {
    const blockContent = 'W tym projekcie glownym prowadzacym jest @kamill@eskp.pl oraz @anna@firma.pl.';
    const matches = blockContent.match(/@([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g);
    assert.ok(matches);
    const extracted = matches.map((m) => m.slice(1).toLowerCase().trim());
    assert.deepEqual(extracted, ['kamill@eskp.pl', 'anna@firma.pl']);
  });

  it('3. Dodawanie komentarza i oznaczanie jako rozwiazany', () => {
    const page: WorkspacePage = validateAndMigratePage({
      id: 'p-1',
      title: 'Projekt Alpha',
      blocks: [{ id: 'b1', type: 'p', content: 'Opis' }],
      sharedWith: ['kamill@eskp.pl'],
      comments: [],
    });

    const newComment: PageComment = {
      id: 'c-100',
      author: 'Kamil',
      authorEmail: 'kamill@eskp.pl',
      avatar: 'K',
      text: 'Dodaje komentarz z uprawnieniami administratora',
      timestamp: Date.now(),
      resolved: false,
    };

    page.comments.push(newComment);
    assert.equal(page.comments.length, 1);
    assert.equal(page.comments[0].resolved, false);

    // Rozwiazanie komentarza
    page.comments[0].resolved = true;
    assert.equal(page.comments[0].resolved, true);
  });

  it('4. Reasoning AI rozpoznaje zapytanie o nowicjusza / alternatywe dla Notion i podaje 50+ blokow', () => {
    const query = 'wiesz jestem nowy i szukam tanszą alternatyw dla notion';
    const reasoning = reasonAboutUserInput(query);
    assert.equal(reasoning.intent, 'APP_ONBOARDING_AND_GUIDE');

    const answer = composeBotAnswer(reasoning, {
      userName: 'Kamil',
      tasksCount: 0,
      activeTasksCount: 0,
      doneTasksCount: 0,
      pagesCount: 0,
      pages: [],
      tasks: [],
    });

    // Weryfikacja: nie uzywa "bloków Notion" w metadanych
    assert.equal(answer.text.includes('bloków Notion'), false);
    // Weryfikacja: zna bloki SearchPoint (p, h1-h6, table, code, mermaid, kanban, countdown...)
    assert.ok(answer.text.includes('SearchPoint Studio'));
    assert.ok(answer.text.includes('50 Typów Bloków'));
    assert.ok(answer.text.includes('Local-First & Relacyjny SQLite'));
    assert.ok(answer.text.includes('Nowa Technologia Wspólnych Notatek'));
    assert.ok(answer.text.includes('@kamill@eskp.pl'));
  });

  it('5. Podsumowanie dokumentu nie zawiera "bloków Notion"', () => {
    const samplePage: WorkspacePage = validateAndMigratePage({
      id: 'p-test',
      title: 'Kot domowy',
      blocks: [
        { id: 'b1', type: 'h1', content: 'Kot domowy - opis gatunku' },
        { id: 'b2', type: 'p', content: 'Kot to ssak drapieżny z rodziny kotowatych.' },
        { id: 'b3', type: 'todo', content: 'Kupić karmę', checked: false },
      ],
    });

    const reasoning = reasonAboutUserInput('@streszcz Kot domowy');
    const answer = composeBotAnswer(reasoning, {
      userName: 'Kamil',
      tasksCount: 1,
      activeTasksCount: 1,
      doneTasksCount: 0,
      pagesCount: 1,
      pages: [samplePage],
      tasks: [],
    });

    assert.equal(answer.text.includes('bloków Notion'), false);
    assert.ok(answer.text.includes('bloków SearchPoint'));
  });
});
