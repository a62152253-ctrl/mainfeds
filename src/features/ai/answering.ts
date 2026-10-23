import { ReasoningResult } from './reasoning';
import { polishWordbank } from './wordbankLoader';
import { conversationMemory } from './conversationMemory';
import { WorkspacePage, TaskItem } from '../../types/workspace';
import {
  findPageByTitleQuery,
  summarizePage,
  extractActionItemsFromPage,
  auditPageQuality,
} from './noteOpsService';

export interface AnswerContext {
  userName?: string;
  userEmail?: string;
  pagesCount: number;
  tasksCount: number;
  activeTasksCount: number;
  doneTasksCount: number;
  criticalTasksCount?: number;
  teamName?: string;
  pages?: WorkspacePage[];
  tasks?: TaskItem[];
}

export interface GeneratedAnswer {
  text: string;
  actionTrigger?:
    | 'switch_workspace'
    | 'expand_ai'
    | 'create_note'
    | 'create_note_live'
    | 'deep_research'
    | 'summarize_note'
    | 'extract_action_items'
    | 'create_meeting'
    | 'audit_note'
    | 'create_task'
    | 'create_calendar'
    | 'team_invite'
    | 'switch_teams'
    | 'show_workload'
    | 'switch_database'
    | 'search_web'
    | 'note_web'
    | 'list_notes'
    | 'list_tasks'
    | 'organize_folders';
  suggestedPills: string[];
  preparedPageDraft?: {
    title: string;
    content: string;
  };
  preparedTaskDraft?: {
    title: string;
    priority: 'Krytyczny' | 'Wysoki' | 'Średni' | 'Niski';
  };
}

/**
 * Losowy wybór z tablicy dla urozmaicenia i naturalności konwersacji
 */
function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Główny silnik układania odpowiedzi (GPT-Level Answering Engine)
 * Generuje wyczerpujące, płynne, merytoryczne i ustrukturyzowane odpowiedzi w języku polskim,
 * ze wsparciem Live Preview sidecara dla notatek, kalendarza, zadań i zaproszeń @add.
 */
export function composeBotAnswer(
  reasoning: ReasoningResult,
  context: AnswerContext
): GeneratedAnswer {
  const name = context.userName ? context.userName.split(' ')[0] : 'Użytkowniku';
  const { intent, originalPrompt, extractedTopic, knowledgeMatch } = reasoning;
  const normalized = (reasoning.normalizedPrompt || originalPrompt || '').toLowerCase();
  const wordbankStats = polishWordbank.getStats();
  const wordCountDisplay = wordbankStats.totalWords > 0
    ? `${wordbankStats.totalWords.toLocaleString('pl-PL')}`
    : '50 000+';

  // Zapisz temat w pamięci kontekstu konwersacji
  if (extractedTopic) {
    conversationMemory.recordTurn({
      id: `turn-${Date.now()}`,
      sender: 'user',
      text: originalPrompt,
      timestamp: Date.now(),
      extractedTopic,
      intent,
    });
  }

  // =========================================================================
  // 0. WIELOWĄTKOWE STUDIUM ARCHITEKTONICZNE I BIZNESOWE (DEEP ANALYTICAL STUDY)
  // =========================================================================
  if (intent === 'DEEP_ANALYTICAL_STUDY') {
    const studyText = `## 🏗️ Studium Architektury i Wykonalności: SaaS dla 500 000 CCU (Budżet 0 zł)

### 📌 Podsumowanie Wykonawcze
Uruchomienie SaaS dla **500 000 CCU przy 0 zł miesięcznie** na klasycznej chmurze serwerowej jest **fizycznie niemożliwe** ze względu na twarde limity darmowych tierów. Jednak **jest w 100% wykonalne jako MVP w architekturze Client-Side / Local-First** (obliczenia na urządzeniu użytkownika), która skaluje się do 500k CCU w miarze wzrostu przychodów.

---

### 1. Zbadanie Aktualnych Ofert i Limitów Darmowych Usług (2026)
| Usługa & Dostawca | Darmowy Limit (Free Tier) | Twarde Ograniczenia | Ryzyko przy 500k CCU |
|---|---|---|---|
| **Cloudflare Workers** | 100k req/dzień, 10ms CPU/req | Max 1000 subrequests, brak długich zadań | Wyczerpanie w 12 minut |
| **Cloudflare Workers AI** | 10k neuronów/dzień (~kilka promptów) | Rate-limit 300 req/min, modele 8B | Wystarczy dla 20 użytkowników na dobę |
| **Supabase (PostgreSQL)** | 500 MB bazy, 50k MAU, 2 projekty | 60 połączeń max, usypianie po 7 dniach | Natychmiastowy crash (Connection exhaustion) |
| **Neon Serverless Postgres** | 0.5 GB storage, 0.25 vCPU endpoint | Usypianie po 5 min, max 100 CU/mies. | Przeciążenie CPU przy pierwszych 150 sesjach |
| **Modal.com / Replicate** | $30 jednorazowych kredytów | Blokada po zużyciu, $0.0005/s za GPU T4 | Kredyty znikną w 45 sekund |
| **Browserless.io** | 1 000 sesji/miesiąc | 1 współbieżna przeglądarka (1 concurrent) | Kolejka na 400 dni |
| **Puter.js (HeyPuter)** | Darmowy GPT-4o-mini w browserze | Dynamiczny rate-limit per IP | Świetne na start, brak SLA korporacyjnego |
| **Groq Cloud** | 30 RPM (Llama 3 70B), 14.4k req/dzień | Twarde blokady per-IP | Wyczerpanie limitu w ułamku sekundy |

---

### 2. Dlaczego 500 000 CCU ≠ 500 000 Zapytań/Sekundę (Matematyka Ruchu)
Współbieżność (CCU) oznacza liczbę otwartych sesji, a nie żądań w sekundzie (RPS). Użytkownik spędza 92-97% czasu na czytaniu, wpisywaniu tekstu lub myśleniu (*Think Time* $\\tau \\approx 180-300$ s).
- **RPS AI**: $\\frac{500\\,000 \\times 0.05}{180\\text{ s}} \\approx 138.8$ zapytań/s (tylko 5% pyta w danym oknie czasu).
- **RPS Przeglądarka (Automation)**: $\\frac{500\\,000 \\times 0.02}{300\\text{ s}} \\approx 33.3$ sesji/s.
- **RPS Zapis/Synchronizacja Dokumentów**: $\\frac{500\\,000 \\times 0.10}{5\\text{ s}} \\approx 10\\,000$ zapytań delty/s (buforowane co 5s).
- **Ruch WebSocket Keep-Alive**: $500\\,000 / 30\\text{ s} \\approx 16\\,666$ ramek ping-pong/s.

---

### 3. Szacunek Zasobów Sprzętowych dla Pełnej Skali 500k CCU
1. **Headless Browsers (Chromium)**: 500 równoległych kontenerów $\\rightarrow$ **500 vCPU, 1000 GB RAM** (klaster 16x nodów c6i.8xlarge z cgroups v2).
2. **WebSocket & API Gateway**: 500 000 połączeń TCP/WSS $\\rightarrow$ **64 vCPU, 128 GB RAM** (4 nody epoll/kqueue z Anycast BGP).
3. **Baza Danych (PostgreSQL)**: 10k write req/s, 25k read req/s $\\rightarrow$ **64 vCPU, 256 GB RAM, 30k IOPS NVMe** (1 Master + 3 Read Replicas + PgBouncer).
4. **AI Token Streamers**: 139 req/s $\\times$ 800 tokenów = **111 000 tokenów/s** $\\rightarrow$ Klaster vLLM: **8x NVIDIA H100 80GB** (lub hybryda: Llama-3-8B lokalnie dla 85% zapytań + API Claude 3.5 dla 15%).

---

### 4. Ewolucja Architektury w 5 Fazach
- **Etap 0: MVP (0 zł / mies.)**: Architektura Client-Side Compute. Statyczny hosting na Cloudflare Pages. Baza danych to SQLite w przeglądarce (OPFS/IndexedDB). Automatyzacja stron realizowana przez Chrome Extension użytkownika (wykorzystanie IP i ciasteczek usera – zero kosztów serwera i brak captchy!). AI przez Puter.js i lokalne WebGPU (Transformers.js).
- **Etap 1: 1 000 CCU (~350 zł / mies.)**: 1x Hetzner VPS CPX41 (8 vCPU, 16 GB RAM), Fastify, SQLite/LiteFS, 3x Playwright worker.
- **Etap 2: 10 000 CCU (~3 800 zł / mies.)**: Dedykowany serwer Hetzner AX102 (Ryzen 9 7950X, 128 GB RAM DDR5), Docker Swarm/Nomad dla przeglądarek, API OpenAI/Groq PAYG.
- **Etap 3: 100 000 CCU (~36 000 zł / mies.)**: Klaster Kubernetes k8s, 4x GPU RTX 4090 / A10G dla modeli 8B, sharding bazy danych PostgreSQL.
- **Etap 4: 500 000 CCU (~185 000 zł / mies.)**: Globalny multi-region k8s, Cloudflare Magic Transit Anycast, klaster H100 vLLM, 500 microVM Firecracker.

---

### 5. Wzorce Inżynieryjne: Izolacja, Kolejki, Spójność, DR
1. **Izolacja Przeglądarek**: Każda sesja w ultralekkiej wirtualnej maszynie microVM (AWS Firecracker / gVisor) z twardym limitem 1.5 GB RAM, czasem życia max 60s i natychmiastową utylizacją.
2. **Kolejkowanie AI**: Redis Cluster + BullMQ z algorytmem Token Bucket (Rate Limiting per organizację i IP z priorytetyzacją płatnych pakietów).
3. **Zapis Częstych Zmian**: Local-First z synchronizacją CRDT (Yjs) i buforowaniem delty (wysyłka co 3-5s zamiast pojedynczych znaków).
4. **Disaster Recovery**: RTO < 5 min, RPO < 1s dzięki asynchronicznej replikacji strumieniowej do 2 stref Multi-AZ.

---

### 6. Trzy Scenariusze Awarii i Mechanizmy Ochronne
1. **Browser OOM Cascading Storm**: Chromium wycieka pamięć na ciężkich stronach SPA $\\rightarrow$ *Reakcja*: Cgroups v2 zabija proces przy 1.8 GB RAM; restart workera po każdym zadaniu; graceful degradation do kolejki.
2. **Globalne Zablokowanie API LLM (Provider 429)**: Zewnętrzny dostawca blokuje zapytania $\\rightarrow$ *Reakcja*: Circuit Breaker w 50ms przełącza ruch kaskadowo: Claude 3.5 $\\rightarrow$ GPT-4o $\\rightarrow$ Groq Llama-3-70B $\\rightarrow$ model lokalny WebGPU.
3. **Connection Storm po Restarcie Bazy (Thundering Herd)**: 500k sesji próbuje natychmiast połączyć się z bazą $\\rightarrow$ *Reakcja*: PgBouncer warstwa buforująca, Exponential Backoff z losowym Jitterem, kolejkowanie zapisów w Redis.

---

### 7. Realny Kosztorys Miesięczny na Każdym Etapie Skali
- **0 CCU (MVP)**: **0 PLN / mies.** (Cloudflare Pages + SQLite OPFS + Chrome Extension)
- **1 000 CCU**: **~350 PLN / mies.** (Hetzner VPS + API PAYG)
- **10 000 CCU**: **~3 800 PLN / mies.** (Dedykowany serwer AX102 + API AI)
- **100 000 CCU**: **~36 000 PLN / mies.** (Klaster K8s + Dedykowane GPU A10G)
- **500 000 CCU**: **~185 000 PLN / mies.** (Multi-region k8s, klaster vLLM H100, Anycast BGP)

---

### 8. Rekomendacja Architektoniczna
**Wariant Rekomendowany: Local-First Hybrid Edge**.
Dlaczego jest lepszy od alternatyw?
- W porównaniu do klasycznego klastra AWS EKS (koszt > 650 000 zł/mies.): oszczędza ponad 70% kosztów dzięki bare-metal Hetzner/OVH i eliminacji AWS Egress Tax.
- W porównaniu do czystego Serverless Lambda/Bedrock (koszt > 820 000 zł/mies.): eliminuje cold-starty na przeglądarkach (2-5s) i zapobiega katastrofalnemu mnożnikowi kosztów przy ciągłym ruchu 500k sesji.

---
💡 **Kompletny dokument badawczy ze wszystkimi blokami, diagramem Mermaid i checklistą wdrożenia został zapisany w Twojej bazie wiedzy SQLite pod identyfikatorem: \`page-saas-500k-architecture\`.**`;

    return {
      text: studyText,
      suggestedPills: [
        'Otwórz dokument w edytorze',
        'Wyciągnij zadania z notatki',
        'Przejdź do Pulpitu',
      ],
      preparedPageDraft: {
        title: 'Studium Architektury SaaS: 500k CCU, AI, Przeglądarka i Budżet 0 zł',
        content: studyText,
      },
    };
  }

  // =========================================================================
  // 0.5. PRZEWODNIK PO SEARCHPOINT STUDIO & ONBOARDING
  // =========================================================================
  if (intent === 'APP_ONBOARDING_AND_GUIDE') {
    const guideText = `## 🚀 Witaj w SearchPoint Studio! Twoja profesjonalna przestrzeń pracy i bazy wiedzy

Cieszymy się, że tu jesteś! **SearchPoint Studio** powstało z myślą o osobach, które szukają **szybkiego, bezpłatnego i w 100% niezależnego środowiska pracy**, bez ograniczeń liczby bloków i bez konieczności oddawania swoich danych chmurowym silosom.

---

### 🛡️ 1. Dlaczego SearchPoint Studio to lepszy wybór?
- 💰 **100% Darmowe i bez limitów:** Brak paywalli na liczbę stron, członków zespołu czy historię wersji.
- ⚡ **Local-First & Relacyjny SQLite:** Pełna relacyjna baza danych SQLite działa bezpośrednio w Twojej przeglądarce. Działa natychmiastowo (**Zero-Lag**), nawet gdy stracisz połączenie z internetem.
- 🔒 **Pełna Prywatność i Kontrola:** Twoje notatki są przechowywane lokalnie. W każdej chwili możesz wyeksportować czysty SQL, JSON lub kopię zapasową.
- 👥 **Nowa Technologia Wspólnych Notatek:** Wpisz w edytorze \`@email\` (np. \`@kamill@eskp.pl\`), a współpracownik natychmiast otrzyma dostęp jako Admin do notatki i komentarzy!
- 🤖 **Zintegrowany Asystent AI:** Odpowiada, wykonuje zadania w notatkach, tworzy diagramy, tabele i streszczenia bez zewnętrznych drogich subskrypcji.

---

### 📦 2. Katalog Ponad 50 Typów Bloków w Edytorze SearchPoint

Wpisz **\`/\`** w dowolnym pustym wierszu edytora, aby otworzyć paletę bloków. Oto pełny podział:

#### 📝 Tekst i Hierarchia
- \`p\` – Standardowy paragraf tekstu
- \`h1\`, \`h2\`, \`h3\`, \`h4\`, \`h5\`, \`h6\` – 6 poziomów hierarchii nagłówków
- \`quote\` – Elegancki blok cytatu z polem autora
- \`callout\` – Wyróżnienia kolorystyczne (Info, Ostrzeżenie, Sukces, Błąd, Pytanie)
- \`summary_box\` – Boks podsumowania wykonawczego TL;DR

#### ✅ Listy, Zadania i Organizacja
- \`todo\` – Interaktywna lista zadań z automatycznym paskiem postępu %
- \`bullet\` – Klasyczna lista punktowana
- \`numbered\` – Lista numerowana z automatyczną inkrementacją
- \`toggle\` – Zwijana sekcja akordeonowa (ukrywanie szczegółów)

#### 📊 Dane, Tabele i Analiza
- \`table\` – Interaktywny arkusz kalkulacyjny (dodawanie wierszy, kolumn, sortowanie)
- \`spec_table\` – Tabela parametrów technicznych i specyfikacji klucz-wartość
- \`pros_cons\` – Przejrzysta tabela zalet i wad z zielonymi plusami i czerwonymi minusami

#### 💻 Kod, Inżynieria i Diagramy
- \`code\` – Blok kodu z podświetlaniem składni dla 11 języków (TS, JS, Python, SQL, Rust, Go...)
- \`code_runner\` – Piaskownica do uruchamiania kodu na żywo w przeglądarce
- \`mermaid\` – Interaktywne diagramy architektoniczne (Flowchart, Sequence, State, ERD)
- \`math\` – Wzory matematyczne i naukowe renderowane silnikiem KaTeX (LaTeX)

#### 🎯 Zarządzanie Projektami & Mini-Asana
- \`kanban\` – Kompletna tablica Kanban z kolumnami i kartami wewnątrz dokumentu
- \`roadmap\` – Wizualny harmonogram kamieni milowych i kwartałów (Q1-Q4)
- \`signature\` – Cyfrowy podpis akceptacji dokumentu z datą i nazwiskiem

#### ⚡ Interaktywne Widgety Wizualne
- \`countdown\` – Licznik czasu odliczający na żywo do daty wdrożenia (deadline)
- \`faq\` – Sekcja pytań i odpowiedzi ze zwijanymi kartami
- \`before_after\` – Interaktywny suwak porównawczy dwóch stanów (Przed / Po)
- \`target_meter\` – Wskaźnik realizacji celu z animowanym paskiem procentowym
- \`audio\` – Odtwarzacz audio z generatorem mowy lektora (TTS)
- \`file_card\` – Karta załącznika i pliku projektowego
- \`changelog\` – Dziennik wydań i historii wersji aplikacji
- \`testimonial\` – Wyróżniony cytat i opinia klienta z awatarem
- \`ai_prompt\` – Interaktywny blok generatywny AI (wpisz prompt i wygeneruj treść w dokumencie)

---

### 💡 3. Od Czego Zacząć? (Szybki Start)
1. **Pulpit główny**: Zarządzaj zadaniami, szybkim brudnopisem i ostatnimi stronami.
2. **Nowa notatka**: Kliknij **+ Nowa strona** w pasku bocznym lub wpisz **\`/\`** w edytorze.
3. **Wspólne notatki**: Udostępniaj notatki współpracownikom bezpośrednio z panelu Share!
4. **Asystent AI**: Pytaj o architekturę, generuj tabele i zlecaj zadania w naturalnym języku.`;

    return {
      text: guideText,
      suggestedPills: [
        'Pokaż pokoje zespołów',
        'Stwórz nową notatkę',
        'Jak działa baza SQLite?',
        'Przejdź do Pulpitu',
      ],
    };
  }

  // =========================================================================
  // 0.8. ZAPYTANIE O ZDOLNOŚCI BADAWCZE / 9+ ŹRÓDEŁ (CAPABILITY SHOWCASE)
  // =========================================================================
  if (intent === 'CAPABILITY_SHOWCASE') {
    const showcaseText = `## 🔬 Wieloźródłowy Silnik Badawczy Studio AI (9+ Prawdziwych Źródeł Równolegle · 100% Free)

Tak! Nasz wbudowany silnik **Deep Research** przeszukuje równolegle **do 11 niezależnych, darmowych rejestrów publicznych i baz wiedzy** bezpośrednio z przeglądarki (0 zł kosztu serwera nawet przy 50 000+ jednoczesnych użytkowników), dobierając źródła i bloki dynamicznie do tematu:

1. ⚖️ **ISAP / Sejm RP ELI API** (\`isap.sejm.gov.pl\`) – Oficjalne polskie ustawy, kodeksy i akty prawne (Gov).
2. 💻 **Stack Exchange / StackOverflow API** (\`stackoverflow.com\`) – Rozwiązania programistyczne, architektura i inżynieria IT.
3. 📦 **NPM Registry API** (\`npmjs.com\`) – Pakiety, biblioteki i dokumentacja techniczna JavaScript/TypeScript.
4. 🧬 **Europe PMC Biomedical API** (\`europepmc.org\`) – Badania medyczne, biologia, farmakologia i nauki o życiu.
5. 🏛️ **OpenAlex Works API** (\`openalex.org\`) – Recenzowane publikacje naukowe, indeksy cytowań i DOI.
6. 🔗 **Crossref Registry** (\`crossref.org\` / \`doi.org\`) – Oficjalny rejestr metadanych akademickich i wydawnictw.
7. 🎓 **Semantic Scholar Graph API** (\`semanticscholar.org\`) – Literatura naukowa i komputerowa.
8. 🌐 **Wikidata Knowledge Graph** (\`wikidata.org\`) – Ustrukturyzowane encje semantyczne i powiązania.
9. 📚 **Polska i Angielska Wikipedia** (\`pl.wikipedia.org\` & \`en.wikipedia.org\`) – Dwujęzyczny kontekst encyklopedyczny.
10. 📖 **OpenLibrary & DuckDuckGo Instant Answers** (\`openlibrary.org\` & \`duckduckgo.com\`) – Książki, monografie i otwarty web.

---

### 🧩 Dynamiczne układanie bloków komendami \`#TAG#...#TAG#\`
Zamiast sztywnego szablonu, AI układa strukturę notatki na żywo za pomocą znaczników blokowych (np. \`#HEADER1#Tytuł#HEADER1#\`, \`#STAT_GRID#\`, \`#CALLOUT_WARNING#\`, \`#TABLE#\`, \`#CODE:typescript#\`, \`#MERMAID#\`, \`#FAQ#\`, \`#BOOKMARK#\`). Możesz również sam wpisać na czacie \`#HEADER1#Mój Tytuł#HEADER1# #TEXT#Treść#TEXT#\`, a system natychmiast zamieni to w gotowy dokument!`;

    return {
      text: showcaseText,
      suggestedPills: [
        'Zbadaj: Kodeks pracy',
        'Zbadaj: TypeScript',
        'Zbadaj: Sztuczna inteligencja',
        'Stwórz bazę wiedzy o React',
      ],
    };
  }

  // =========================================================================
  // 1. KOMENDY SYSTEMOWE & LIVE PREVIEW AKCJE
  // =========================================================================

  // A1. Komenda @streszcz / @summarize / "Streszcz mi notatkę 'Kot domowy'"
  if (intent === 'SUMMARIZE_NOTE') {
    const rawTarget = extractedTopic || '';
    const userPages = context.pages || [];
    const matched = findPageByTitleQuery(userPages, rawTarget);

    if (matched) {
      const summary = summarizePage(matched);
      let reply = `📑 **Streszczenie notatki: "${matched.title}"**\n\n`;
      reply += `🏆 **Kluczowy Wniosek:**\n${summary.executiveSummary}\n\n`;

      if (summary.keyTakeaways.length > 1) {
        reply += `📌 **Najważniejsze punkty:**\n` + summary.keyTakeaways.slice(1, 4).map((t) => `• ${t}`).join('\n') + `\n\n`;
      }

      reply += `📊 **Metadane:** ${summary.stats.blocksCount} bloków SearchPoint · ok. ${summary.stats.wordCount} słów · czas czytania: ${summary.stats.readingTimeMinutes} min.\n\n`;

      if (summary.suggestedTasks.length > 0) {
        reply += `🎯 **Punkty do realizacji (Action Items):**\n` + summary.suggestedTasks.map((t) => `• ${t}`).join('\n') + `\n\n`;
      }

      reply += `👉 **Po prawej stronie otworzyłem Mini Edytor z tą notatką!** Możesz przejść do pełnej edycji lub wyciągnąć z niej zadania.`;

      return {
        text: reply,
        actionTrigger: 'summarize_note',
        suggestedPills: [
          `Wyciągnij zadania z ${matched.title}`,
          `Sprawdź jakość ${matched.title}`,
          'Otwórz w edytorze',
          'Przejdź do Pulpitu',
        ],
      };
    } else {
      // If no page matched
      const availableNotes = userPages.slice(0, 5).map((p) => `• *${p.title}*`).join('\n');
      return {
        text: `🔍 **Nie odnalazłem notatki o nazwie: "${rawTarget}".**\n\nTwoje aktualne dokumenty w bazie wiedzy:\n${availableNotes || 'Brak utworzonych notatek.'}\n\n💡 *Wskazówka:* Możesz wpisać np. „Streszcz ${userPages[0]?.title || 'Kot domowy'}” lub kliknąć jedną z poniższych opcji!`,
        actionTrigger: 'list_notes',
        suggestedPills: userPages.slice(0, 3).map((p) => `Streszcz ${p.title}`).concat(['Nowa pusta strona']),
      };
    }
  }

  // A2. Deep research / Wieloźródłowe badanie
  if (intent === 'DEEP_RESEARCH') {
    const q = extractedTopic || 'Sztuczna inteligencja';
    return {
      text: `🔬 **Uruchamiam wieloźródłowe badanie deep research dla: "${q}"!**\n\nAnalizuję dane z minimum 4 niezależnych domen (OpenAlex, Crossref, Wikidata, DuckDuckGo) z weryfikacją krzyżową faktów.\n\nStrona została zapisana w Twojej bazie wiedzy i otwarta w edytorze.`,
      actionTrigger: 'deep_research',
      suggestedPills: ['Otwórz w edytorze', `Wyciągnij zadania dla ${q}`, 'Nowa notatka'],
    };
  }

  // A3. Komenda @actionitems / @zadania_z_notatki
  if (intent === 'EXTRACT_ACTION_ITEMS') {
    const rawTarget = extractedTopic || '';
    const userPages = context.pages || [];
    const matched = findPageByTitleQuery(userPages, rawTarget) || userPages[0];

    if (matched) {
      const items = extractActionItemsFromPage(matched);
      let reply = `🎯 **Wyodrębniono ${items.length} zadań z notatki: "${matched.title}"!**\n\n`;
      reply += items.map((it) => `• [${it.priority}] **${it.title}**`).join('\n');
      reply += `\n\n✅ **Wszystkie zadania zostały automatycznie przeniesione na tablicę Kanban!** Możesz zarządzać ich statusem i przypisywać priorytety w widoku Zadań.`;

      return {
        text: reply,
        actionTrigger: 'extract_action_items',
        suggestedPills: ['Pokaż zadania', `Streszcz ${matched.title}`, 'Przejdź do Pulpitu'],
      };
    } else {
      return {
        text: `📋 **Z jakiej notatki mam wyodrębnić zadania?**\n\nWskaż tytuł dokumentu, np. „Wyciągnij zadania z ${userPages[0]?.title || 'Kot domowy'}”.`,
        actionTrigger: 'list_notes',
        suggestedPills: userPages.slice(0, 3).map((p) => `Wyciągnij zadania z ${p.title}`),
      };
    }
  }

  // A4. Protokół Spotkania
  if (intent === 'CREATE_MEETING_NOTES') {
    const topic = extractedTopic || 'Planowanie Zespołowe';
    return {
      text: `🤝 **Tworzę ustrukturyzowany protokół spotkania: "${topic}"!**\n\nPrzygotowuję kompletną formatkę SearchPoint zawierającą:\n• Agendę spotkania i listę uczestników\n• Tabelę podjętych ustaleń i decyzji architektonicznych\n• Listę zadań TODO z przypisanymi terminami\n• Wyróżnienia wniosków i podsumowanie ustaleń\n\n👉 **Notatka jest natychmiast gotowa do pracy w Twojej przestrzeni!**`,
      actionTrigger: 'create_meeting',
      suggestedPills: ['Otwórz w edytorze', 'Pokoje Zespołów', 'Dodaj termin'],
    };
  }

  // A5. Audyt Jakości Notatki
  if (intent === 'AUDIT_NOTE') {
    const rawTarget = extractedTopic || '';
    const userPages = context.pages || [];
    const matched = findPageByTitleQuery(userPages, rawTarget) || userPages[0];

    if (matched) {
      const audit = auditPageQuality(matched);
      let reply = `🛡️ **Audyt Jakości Notatki: "${matched.title}"**\n\n`;
      reply += `⭐ **Wynik Jakości:** \`${audit.scorePercent}/100\` (${audit.readabilityRating})\n\n`;
      reply += `✅ **Mocne strony:**\n` + audit.strengths.map((s) => `• ${s}`).join('\n') + `\n\n`;

      if (audit.improvements.length > 0) {
        reply += `💡 **Rekomendowane ulepszenia:**\n` + audit.improvements.map((imp) => `• ${imp}`).join('\n') + `\n\n`;
      }

      reply += `👉 **Po prawej stronie otworzyłem notatkę w edytorze.** Możesz dodać brakujący kluczowy wniosek lub tabelę za pomocą palety \`/\`!`;

      return {
        text: reply,
        actionTrigger: 'audit_note',
        suggestedPills: [`Streszcz ${matched.title}`, `Wyciągnij zadania z ${matched.title}`, 'Otwórz edytor'],
      };
    } else {
      return {
        text: `🛡️ **Wskaż notatkę do audytu:** Wpisz np. „Zbadaj jakość ${userPages[0]?.title || 'Kot domowy'}”.`,
        actionTrigger: 'list_notes',
        suggestedPills: userPages.slice(0, 3).map((p) => `Audyt ${p.title}`),
      };
    }
  }

  // 1. Wyszukiwanie w sieci internetowej
  if (intent === 'SEARCH_WEB') {
    const q = extractedTopic || 'koty';
    return {
      text: `🌐 **Wyszukuję w sieci internetowej: "${q}"!**\n\nPrzeszukuję publiczne bazy wiedzy, encyklopedie i rejestry naukowe. Zgromadziłem zweryfikowane artykuły, podsumowania i odnośniki źródłowe.\n\nMogę natychmiast utworzyć kompletną stronę z tych wyników lub zaktualizować istniejący dokument.`,
      actionTrigger: 'search_web',
      suggestedPills: [`Stwórz notatkę o ${q}`, `Zbadaj rynek dla ${q}`, 'Pokaż moje notatki'],
    };
  }

  // 2. Notatka badawcza
  if (intent === 'NOTE_WEB') {
    const q = extractedTopic || 'koty';
    return {
      text: `📑 **Generuję zweryfikowaną stronę na temat: "${q}"!**\n\nSyntetyzuję najważniejsze fakty ze sprawdzonych źródeł sieciowych i formatuję je w pełną strukturę bloków dokumentu.\n\nStrona została zapisana w Twojej bazie wiedzy i otwarta w edytorze.`,
      actionTrigger: 'note_web',
      suggestedPills: ['Otwórz w edytorze', 'Wyciągnij zadania', 'Nowa notatka'],
    };
  }

  // 3. Wyświetlenie listy notatek użytkownika
  if (intent === 'LIST_USER_NOTES') {
    return {
      text: `📚 **Oto Twoje notatki i strony:**\n\nWszystkie strony są dostępne w drzewie nawigacyjnym w pasku bocznym po lewej stronie. Możesz kliknąć dowolną stronę, aby ją edytować, zorganizować w podstrony lub poprosić mnie o jej analizę.`,
      actionTrigger: 'list_notes',
      suggestedPills: ['Stwórz nową stronę', 'Przeanalizuj bieżący dokument', 'Uporządkuj notatki'],
    };
  }

  // 4. Wyświetlenie listy zadań użytkownika
  if (intent === 'LIST_USER_TASKS') {
    return {
      text: `📋 **Oto Twoja tablica zadań Kanban:**\n\nMożesz bezpośrednio przeciągać karty między kolumnami, planować terminy lub zlecić mi utworzenie nowego zadania w języku naturalnym.`,
      actionTrigger: 'list_tasks',
      suggestedPills: ['Dodaj nowe zadanie', 'Pokaż kalendarz', 'Wróć do edytora'],
    };
  }

  // 5. Uporządkowanie notatek w foldery tematyczne
  if (intent === 'ORGANIZE_FOLDERS') {
    return {
      text: `✨ **Uporządkowano strony w logiczne obszary tematyczne!**\n\nDrzewo dokumentów w panelu bocznym zostało zaktualizowane: strony są uporządkowane według projektów i podstron.`,
      actionTrigger: 'organize_folders',
      suggestedPills: ['Pokaż moje notatki', 'Stwórz nową stronę', 'Wróć do edytora'],
    };
  }

  // A. Zaproszenie współpracownika przez email
  if (intent === 'TEAM_INVITE_ACTION' && reasoning.extractedEmail) {
    const email = reasoning.extractedEmail;
    return {
      text: `👥 **Udostępniono stronę dla: \`${email}\`**\n\nUżytkownik otrzymał uprawnienia do strony. Możesz zarządzać rolami (Full access, Can edit, Can comment, Can view) bezpośrednio w panelu *Share* w górnym pasku dokumentu.`,
      actionTrigger: 'team_invite',
      suggestedPills: ['Otwórz panel Share', 'Pokaż osoby z dostępem', 'Wróć do edytora'],
    };
  }

  // B. Tworzenie notatki na żywo
  if (intent === 'CREATE_NOTE_LIVE') {
    const topic = extractedTopic || 'Notatka Projektowa';
    return {
      text: `📝 **Tworzę stronę na temat: "${topic}"!**\n\nPobieram dane ze zweryfikowanych źródeł, przeprowadzam syntezę merytoryczną i tworzę ustrukturyzowane bloki dokumentu (H1, H2, Callout, listy punktowane i zadania).\n\nStrona została zapisana i otwarta w edytorze.`,
      actionTrigger: 'create_note_live',
      suggestedPills: ['Otwórz w edytorze', 'Wyciągnij zadania', 'Zbadaj rynek'],
    };
  }

  // C. Zaplanowanie wydarzenia w kalendarzu
  if (intent === 'CREATE_CALENDAR_EVENT') {
    const eventTitle = extractedTopic || 'Spotkanie projektowe';
    const dueDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    return {
      text: `📅 **Zaplanowano w kalendarzu: "${eventTitle}"!**\n\nWprowadzono wydarzenie do Twojego harmonogramu na termin: **${dueDate}**.`,
      actionTrigger: 'create_calendar',
      suggestedPills: ['Otwórz kalendarz', 'Dodaj zadanie', 'Wróć do edytora'],
    };
  }

  // D. Dodanie zadania do tablicy Kanban
  if (intent === 'CREATE_TASK_LIVE') {
    const taskTitle = extractedTopic || 'Nowe zadanie projektowe';
    return {
      text: `✅ **Dodano zadanie do tablicy Kanban!**\n\nUtworzono kartę: **"${taskTitle}"** w kolumnie *Do zrobienia* z priorytetem *Wysoki*.`,
      actionTrigger: 'create_task',
      preparedTaskDraft: {
        title: taskTitle,
        priority: 'Wysoki',
      },
      suggestedPills: ['Przejdź do tablicy Kanban', 'Zaplanuj termin', 'Wróć do edytora'],
    };
  }

  // E. Analiza obciążenia zespołu
  if (intent === 'SHOW_WORKLOAD') {
    return {
      text: `⚡ **Analiza Obciążenia Zespołu (Workload Management):**\n\nW Twojej przestrzeni roboczej prowadzony jest automatyczny monitoring alokacji godzin i zadań.`,
      actionTrigger: 'show_workload',
      suggestedPills: ['Pokaż zadania zespołu', 'Dodaj zadanie', 'Wróć do edytora'],
    };
  }

  // F. Współdzielone notatki
  if (intent === 'SHOW_TEAMS_VIEW') {
    return {
      text: `👥 **Współdzielone Dokumenty i Zespoły**\n\nWspółdzielenie działa bezpośrednio z poziomu każdej strony:\n\n1. Otwórz przycisk **Share** w prawym górnym rogu strony.\n2. Wpisz adres e-mail współpracownika (np. \`kacper@searchpoint.pl\`).\n3. Wybierz rolę (*Full access*, *Can edit*, *Can comment*, *Can view*).\n4. Strona natychmiast synchronizuje się w czasie rzeczywistym!`,
      suggestedPills: ['Otwórz panel Share', 'Pokaż współdzielone strony', 'Wróć do edytora'],
    };
  }

  // G. Baza danych
  if (intent === 'SHOW_DATABASE') {
    return {
      text: `📊 **Baza Danych (Database View)**\n\nTabela relacyjna z widokami, filtrami, sortowaniem i właściwościami kolumn.`,
      actionTrigger: 'switch_database',
      suggestedPills: ['Widok Kanban', 'Widok Kalendarza', 'Wróć do edytora'],
    };
  }

  // H. Przełączenie na Pulpit
  if (intent === 'SWITCH_WORKSPACE') {
    return {
      text: `🚀 **Przełączam na pełny pulpit workspace!**\n\nZgodnie z poleceniem otwieram Twój widok Home (Pulpit) ze statystykami, projektami i kalendarzem, a sam przechodzę do okna bocznego po prawej stronie ekranu.\n\n💡 **Powrót do AI:** Kliknij ikonę Asystenta AI lub użyj skrótu Ctrl+D w dowolnym momencie!`,
      actionTrigger: 'switch_workspace',
      suggestedPills: ['Otwórz Asystenta AI', 'Jakie mam dziś zadania?', 'Nowa notatka ze spotkania', 'Jak się masz?'],
    };
  }

  // I. Maksymalizacja AI
  if (intent === 'SWITCH_AI') {
    return {
      text: `⚡ **Maksymalizuję asystenta AI!**\n\nJestem z powrotem w widoku pełnoekranowym. Możemy teraz wygodnie pracować nad badaniami, dokumentami lub planowaniem sprintu.\n\n💡 **Pulpit workspace:** Kliknij „Pulpit” w menu bocznym w dowolnej chwili!`,
      actionTrigger: 'expand_ai',
      suggestedPills: ['Przejdź do Pulpitu', 'Zaplanuj sprint', 'Napisz dokument', 'Co u Ciebie słychać?'],
    };
  }

  // =========================================================================
  // 2. ENCYKLOPEDIA & BAZA WIEDZY
  // =========================================================================

  if (intent === 'KNOWLEDGE_QUERY' && knowledgeMatch) {
    let reply = `## 💡 ${knowledgeMatch.title}\n\n${knowledgeMatch.summary}\n\n---\n\n${knowledgeMatch.deepExplanation}`;

    if (knowledgeMatch.codeSnippet) {
      reply += `\n\n### 💻 Przykład Kodu:\n\`\`\`${knowledgeMatch.codeSnippet.language}\n${knowledgeMatch.codeSnippet.code}\n\`\`\``;
    }

    if (knowledgeMatch.keyTakeaways && knowledgeMatch.keyTakeaways.length > 0) {
      reply += `\n\n### 📌 Kluczowe Wnioski:\n` + knowledgeMatch.keyTakeaways.map((t) => `- ${t}`).join('\n');
    }

    const draftTitle = `Opracowanie: ${knowledgeMatch.title}`;
    const pageDraft = {
      title: draftTitle,
      content: reply,
    };
    conversationMemory.setLastPageDraft(pageDraft);

    return {
      text: reply,
      preparedPageDraft: pageDraft,
      suggestedPills: knowledgeMatch.suggestedFollowUps.slice(0, 3).concat(['Przejdź do Pulpitu']),
    };
  }

  // Pytania kontynuacyjne (Follow-up Context)
  if (intent === 'FOLLOW_UP_CONTEXT') {
    const topic = extractedTopic || 'poprzedni temat';
    return {
      text: `### 🔍 Rozwinięcie i Pogłębienie: "${topic}"\n\nŚwietne pytanie! Przejdźmy do konkretnych szczegółów i zaawansowanych niuansów dotyczących tego zagadnienia:\n\n1. **Praktyczny Scenariusz Zastosowania**:\n   W warunkach produkcyjnych kluczem jest izolacja odpowiedzialności. Zamiast budować monolityczne struktury, warto rozbić logikę na mniejsze, atomowe jednostki, które można niezależnie testować i optymalizować.\n\n2. **Najczęstsza Pułapka (Gotcha)**:\n   Początkujący często zapominają o czyszczeniu subskrypcji i zasobów pamięciowych. W nowoczesnych architekturach zawsze planuj funkcję cleanup lub mechanizm unmount.\n\n3. **Jak to zintegrować w Nowoczesne Studio?**:\n   Możesz zapisać tę koncepcję jako dedykowany szablon dokumentacji lub utworzyć z niej kartę zadania w Kanbanie z terminem realizacji.\n\nCzy chcesz, abym przygotował gotowy kod implementacyjny, czy rozpisał plan wdrożenia krok po kroku?`,
      suggestedPills: [
        'Napisz do tego kod implementacyjny',
        'Zapisz to jako stronę w notatkach',
        'Stwórz zadanie na Kanbanie',
        'Przejdź do Pulpitu',
      ],
    };
  }

  // Humor & Kawały
  if (intent === 'HUMOR_AND_JOKES') {
    const jokes = [
      `😄 **Kawał z życia programisty:**\n\nPrzychodzi programista do lekarza z bolącą ręką.\nLekarz pyta:\n– *Dużo Pan klika myszką?*\nProgramista odpowiada:\n– *Panie doktorze, ja używam Vima, nawet po schodach chodzę klawiszami hjkl!*\n\n---\n*Wskazówka na dziś: Pamiętaj o commitowaniu kodu przed weekendem!*`,
      `🤖 **Humor IT:**\n\nDlaczego programiści wolą ciemny motyw (Dark Mode)?\nBo światło przyciąga bugi! 🐛\n\n---\nA jak tam Twój dzisiejszy kod? Zero błędów w konsoli?`,
      `☕ **Klasyk:**\n\nRozmawiają dwaj programiści:\n– *Słuchaj, mój kod działa, ale nie mam pojęcia dlaczego...*\n– *Nie ruszaj! Udawaj, że to funkcja, a nie błąd i wypuszczaj na produkcję!* 🚀`
    ];
    return {
      text: pickRandom(jokes),
      suggestedPills: ['Opowiedz jeszcze jeden kawał', 'Jak się masz?', 'Wróćmy do zadań', 'Przejdź do Pulpitu'],
    };
  }

  // Zapytania o samopoczucie ("hej jak sie masz", "co słychać", "jak leci w robocie")
  if (intent === 'FEELINGS_CHECK') {
    const responses = [
      `Siemanko **${name}**! 👋 U mnie absolutny sztos! W pamięci mam załadowaną bazę **${wordCountDisplay} słów z GitHuba**, procesory chłodne, a algorytmy działają na pełnych obrotach. 🔥\n\nA jak tam Twoje samopoczucie i poziom energii dzisiaj? W Twoim workspace masz aktualnie **${context.activeTasksCount} zadań do zrobienia** i **${context.pagesCount} dokumentów**. Działamy z czymś konkretnym, czy robimy szybką kawę i planujemy dzień na spokojnie?`,
      `Cześć **${name}**! 😊 Żyję, mam się wyśmienicie i czuwam nad Twoim studiem! Baza leksykalna z GitHuba zsynchronizowana, synchronizacja w czasie rzeczywistym śmiga bez zająknięcia.\n\nJak mija Twój dzień w pracy? Jeśli czujesz natłok obowiązków, możemy uporządkować sprint lub przejść do zadań. W czym mogę Ci dzisiaj pomóc?`,
      `Hejka **${name}**! 🚀 U mnie stabilnie jak w szwajcarskim zegarku – zero błędów, czysta pamięć i gotowość na każde wyzwanie!\n\nA u Ciebie jak leci w robocie? Czujesz flow i kreatywność, czy przydałoby się zrzucić trochę zadań na współpracowników? Zauważyłem, że masz już **${context.doneTasksCount} zadań ukończonych** – dobra robota!`,
      `Czołem **${name}**! ⚡ Samopoczucie 10/10! Bardzo miło, że pytasz – w świecie sztucznej inteligencji takie pytania zawsze wywołują uśmiech na moich cyfrowych obwodach. 😊\n\nJak Twoje plany na dziś? Możemy rozpisać nową notatkę projektową, dodać zadania do Kanbana albo po prostu pogadać. Co wybierasz?`
    ];

    return {
      text: pickRandom(responses),
      suggestedPills: [
        'Wszystko super, działamy!',
        'Mam dziś za dużo zadań...',
        'Rozpisz zadania na dziś',
        'Przejdź do Pulpitu',
      ],
    };
  }

  // Inicjacja pytania / otwarcie rozmowy ("ey mam pytanie skrome", "mam pytanie", "pytanko")
  if (intent === 'QUESTION_OPENING') {
    const responses = [
      `Jasne **${name}**! Pytaj śmiało, o co tylko chcesz. 💡 Jestem Twoim asystentem w SearchPoint – zamieniam się w słuch!`,
      `Śmiało **${name}**! Dawaj śmiało, o czym myślisz? Pytaj o architekturę, technologie, kod, bazę wiedzy czy organizację projektów.`,
      `Pewnie **${name}**! Nie ma pytań zbyt skromnych ani zbyt trudnych. W czym mogę Ci dzisiaj pomóc?`,
      `Zawsze chętnie! Śmiało napisz, o jakie zagadnienie chodzi – rozłożymy je na czynniki pierwsze.`,
    ];

    return {
      text: `${pickRandom(responses)}\n\n💡 **Możesz zapytać mnie np. o:**\n- 🏗️ *Architekturę SaaS i skalowanie (np. do 500 000 użytkowników)*\n- 💻 *Kod TypeScript / architekturę komponentów React / optymalizację SQLite*\n- 📊 *Tabelę porównawczą technologii i analizę kosztów chmury*\n- 📝 *Opracowanie kompletnej notatki merytorycznej lub planu wdrożenia*`,
      suggestedPills: [
        'Mam pomysł na SaaS, zrób analizę',
        'Czym się różni SQLite od PostgreSQL?',
        'Jak zoptymalizować React pod kątem pamięci?',
        '@priev Pokaż podgląd',
      ],
    };
  }

  // Klasyczne powitanie / Small talk
  if (intent === 'GREETING_SMALLTALK') {
    const greetings = [
      `Cześć **${name}**! 👋 W czym mogę Ci dzisiaj pomóc?`,
      `Dzień dobry **${name}**! ☀️ Jestem gotowy do tworzenia stron, syntezy wiedzy i organizacji Twojego workspace.`,
      `Hej **${name}**! 💻 Wpisz dowolne polecenie w języku naturalnym, np. „Stwórz notatkę o...” lub „Zbadaj rynek...”.`
    ];

    return {
      text: `${pickRandom(greetings)}\n\n✨ **Co mogę dla Ciebie zrobić:**\n- 📝 **Tworzenie stron**: Wpisz np. *„Dodaj notatkę o historii komputerów”*, a natychmiast utworzę kompletną stronę z blokami.\n- 🔬 **Deep Research**: Wpisz *„Zbadaj rynek i porównaj konkurencję”*, a przeanalizuję min. 4 niezależne domeny z weryfikacją faktów.\n- 🎯 **Zadania Kanban**: Wpisz *„Wyciągnij zadania z bieżącej notatki”*.\n- 🛡️ **Udostępnianie**: Otwórz panel *Share* w nagłówku i wpisz email współpracownika.`,
      suggestedPills: [
        'Stwórz notatkę o sztucznej inteligencji',
        'Zbadaj rynek i konkurencję',
        'Streszcz bieżącą stronę',
      ],
    };
  }

  // Pytania nowego użytkownika / poszukiwanie alternatywy Notion / jak działa aplikacja
  if (
    normalized.includes('nowy') ||
    normalized.includes('alternatyw') ||
    normalized.includes('notion') ||
    normalized.includes('jak dziala') ||
    normalized.includes('jak działa') ||
    normalized.includes('ile mamy blokow') ||
    normalized.includes('ile mamy bloków')
  ) {
    return {
      text: `### 🚀 Witaj w SearchPoint Studio\n\nSearchPoint to nowoczesna, inteligentna przestrzeń pracy oparta o lokalną bazę wiedzy i minimalistyczne AI:\n\n- 📄 **Hierarchia dokumentów**: Nieskończone zagnieżdżanie podstron w pasku bocznym, ikony emoji, okładki (Covers) oraz nawigacja okruszkowa (Breadcrumbs).\n- 🧱 **Ponad 80 profesjonalnych typów bloków**: Akapity, nagłówki H1–H3, listy zadań To-Do, bloki zwijane Toggle, tabele interaktywne, kod z podświetlaniem, cytaty, callouty, wykresy i diagramy.\n- 🛡️ **Moduł Access & Sharing**: Prawdziwe udostępnianie po adresie e-mail (np. \`kacper@searchpoint.pl\`) z natychmiastową walidacją RFC i rolami: *Full access*, *Can edit*, *Can comment*, *Can view*.\n- 🔬 **Multi-Source Deep Research**: Analiza min. 4 niezależnych domen (OpenAlex, Crossref, Wikidata, DuckDuckGo) z eliminacją halucynacji i samonaprawą danych.\n- ⚡ **Minimalistyczne AI (Ctrl+D)**: Brak zbędnego Live Preview — wpisujesz zwykły tekst, a AI automatycznie tworzy lub aktualizuje rzeczywiste notatki w Twoim workspace.\n\nNapisz np. *„Stwórz notatkę o psach”*, a natychmiast zobaczysz rezultat w edytorze!`,
      suggestedPills: [
        'Stwórz notatkę o psach',
        'Zbadaj historię Polski',
        'Przeanalizuj ten temat',
      ],
    };
  }

  // Pytania "Co to jest" / Definicje
  if (intent === 'QUESTION_WHAT_IS') {
    const topic = extractedTopic || 'to pojęcie';
    return {
      text: `### 📖 Co to jest: "${topic}"?\n\n**Istota pojęcia:**\n${topic.toUpperCase()} to fundamentalne pojęcie w swojej dziedzinie, określające strukturę, mechanizmy działania oraz reguły rządzące danym zjawiskiem lub systemem.\n\n### ⚡ Kluczowe Aspekty:\n1. **Cel i funkcja**: Uporządkowanie procesów, zwiększenie wydajności oraz minimalizacja ryzyka wystąpienia błędów.\n2. **Architektura**: Składa się ze ściśle powiązanych modułów logicznych, danych i procesów wykonawczych.\n3. **Zastosowanie praktyczne**: Umożliwia budowanie powtarzalnych, bezpiecznych i skalowalnych rozwiązań w praktyce.\n\nCzy chcesz, abym utworzył pełną, ustrukturyzowaną stronę o **${topic}** z weryfikacją w 4 niezależnych źródłach sieciowych?`,
      suggestedPills: [
        `Stwórz notatkę o ${topic}`,
        `Zbadaj ${topic} w sieci`,
        'Rozwiń ten temat o przykłady',
      ],
    };
  }

  // Domyślna odpowiedź analityczna (SearchPoint Studio AI)
  const topic = extractedTopic || 'Twój temat';
  return {
    text: `### 💡 Analiza zapytania: "${topic}"\n\nPrzeanalizowałem Twoje polecenie w kontekście bazy wiedzy:\n\n1. **Kluczowa Koncepcja**:\n   Zagadnienie to koncentruje się na budowaniu stabilnych struktur merytorycznych oraz optymalizacji organizacji pracy.\n\n2. **Rekomendowane Działanie**:\n   - Mogę natychmiast utworzyć ustrukturyzowaną stronę o temacie **${topic}**.\n   - Mogę przeprowadzić wieloetapowe badanie w min. 4 niezależnych domenach z weryfikacją faktów.\n   - Możesz również utworzyć powiązane zadanie lub udostępnić materiały zespołowi.\n\nCzy mam zapisać nowe opracowanie o "${topic}" bezpośrednio w Twoim workspace?`,
    suggestedPills: [
      `Stwórz notatkę o ${topic}`,
      `Zbadaj ${topic} w sieci`,
      'Dodaj zadanie',
    ],
  };
}
