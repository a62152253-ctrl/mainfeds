/**
 * Autorska Baza Wiedzy i Pojęć (Knowledge Base)
 * Działa w 100% po stronie przeglądarki – 0 kosztów, 0 opóźnień, darmowe dla nielimitowanej liczby użytkowników.
 * Obejmuje programowanie (JS/TS, React, Node, Web, Bazy danych), produktywność, biznes,
 * naukę, filozofię, kreatywne pisanie oraz humor.
 */

export interface KnowledgeEntry {
  id: string;
  keywords: string[];
  title: string;
  category: 'programming' | 'productivity' | 'business' | 'science' | 'philosophy' | 'creative' | 'humor';
  summary: string;
  deepExplanation: string;
  codeSnippet?: {
    language: string;
    code: string;
  };
  keyTakeaways: string[];
  suggestedFollowUps: string[];
}

export const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  // =========================================================================
  // 1. PROGRAMOWANIE & TECHNOLOGIA
  // =========================================================================
  {
    id: 'js-closure',
    keywords: ['closure', 'domkniecie', 'domknięcie', 'domkniecia', 'domknięcia', 'lexical scope', 'zakres leksykalny'],
    title: 'Domknięcia w JavaScript (Closures)',
    category: 'programming',
    summary: 'Domknięcie (closure) to mechanizm, w którym funkcja wewnętrzna zachowuje dostęp do zmiennych ze swojego zakresu leksykalnego, nawet po zakończeniu działania funkcji zewnętrznej.',
    deepExplanation: `W JavaScript każda funkcja tworzy domknięcie w momencie jej definiowania. Oznacza to, że funkcja "pamięta" środowisko, w którym powstała.\n\n### Dlaczego to jest kluczowe?\n1. **Enkapsulacja i prywatność danych**: Pozwala tworzyć prywatne zmienne, do których dostęp mają tylko dedykowane metody.\n2. **Fabryki funkcji (Function Factories)**: Generowanie wyspecjalizowanych funkcji z zapamiętaną konfiguracją.\n3. **Obsługa zdarzeń i asynchroniczność**: Przekazywanie stanu do callbacków i timerów bez używania zmiennych globalnych.`,
    codeSnippet: {
      language: 'javascript',
      code: `function createCounter(initialValue = 0) {
  let count = initialValue; // Zmienna prywatna w domknięciu

  return {
    increment: () => ++count,
    decrement: () => --count,
    getValue: () => count
  };
}

const counter = createCounter(10);
console.log(counter.increment()); // 11
console.log(counter.getValue());  // 11
// count nie jest dostępne bezpośrednio z zewnątrz!`
    },
    keyTakeaways: [
      'Domknięcie powstaje, gdy funkcja odwołuje się do zmiennych zadeklarowanych poza jej ciałem.',
      'Pomaga uniknąć zanieczyszczania globalnego zakresu (window/global).',
      'Należy uważać na wycieki pamięci, gdy domknięcia przetrzymują duże obiekty.'
    ],
    suggestedFollowUps: ['Jak działają closures w React Hooks?', 'Pokaż przykład wycieku pamięci przez closure', 'Czym różni się closure od prototype?']
  },
  {
    id: 'react-hooks',
    keywords: ['hook', 'hooki', 'hooks', 'usestate', 'useeffect', 'usememo', 'usecallback', 'useref', 'custom hook'],
    title: 'Wszystko o React Hooks (useState, useEffect, useMemo, useCallback)',
    category: 'programming',
    summary: 'React Hooks to funkcje wprowadzone w React 16.8, które pozwalają korzystać ze stanu i cyklu życia komponentu w funkcjonalnych komponentach Reacta.',
    deepExplanation: `Hooks zrewolucjonizowały tworzenie aplikacji w React, eliminując potrzebę pisania komponentów klasowych i ułatwiając ponowne wykorzystanie logiki stanowej.\n\n### Podstawowe Hooki:\n- **useState**: Zarządza lokalnym stanem komponentu i wyzwala ponowne renderowanie przy zmianie.\n- **useEffect**: Obsługuje efekty uboczne (subskrypcje, zapytania HTTP, timery, modyfikacje DOM).\n- **useMemo**: Zapamiętuje wynik kosztownych obliczeń, chroniąc przed zbędnymi kalkulacjami.\n- **useCallback**: Zapamiętuje instancję funkcji, zapobiegając niepotrzebnym re-renderom komponentów potomnych.\n- **useRef**: Przechowuje zmienną mutowalną bez wyzwalania re-renderu lub referencję do węzła DOM.`,
    codeSnippet: {
      language: 'tsx',
      code: `import React, { useState, useEffect, useCallback, useMemo } from 'react';

export function DataViewer({ filter }: { filter: string }) {
  const [data, setData] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // useMemo: kosztowne filtrowanie tylko przy zmianie data lub filter
  const filteredData = useMemo(() => {
    return data.filter(item => item.toLowerCase().includes(filter.toLowerCase()));
  }, [data, filter]);

  // useCallback: stabilna referencja do funkcji
  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/items');
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <div>Ładowanie danych...</div>;
  return <ul>{filteredData.map((d, i) => <li key={i}>{d}</li>)}</ul>;
}`
    },
    keyTakeaways: [
      'Zasada Hooków: Wywołuj je tylko na najwyższym poziomie funkcji i tylko w komponentach funkcyjnych.',
      'useEffect z pustą tablicą zależności [] odpala się tylko raz przy montowaniu.',
      'useMemo i useCallback stosuj tam, gdzie re-render jest faktycznie kosztowny.'
    ],
    suggestedFollowUps: ['Jak napisać własny Custom Hook?', 'Kiedy useMemo pogarsza wydajność?', 'Czym różni się useRef od useState?']
  },
  {
    id: 'typescript-generics',
    keywords: ['typescript', 'ts', 'generics', 'typy', 'generyki', 'interfejs', 'interface', 'type'],
    title: 'Typy Generyczne w TypeScript (Generics)',
    category: 'programming',
    summary: 'Typy generyczne (Generics) pozwalają tworzyć komponenty, funkcje i interfejsy, które współpracują z wieloma różnymi typami danych, zachowując pełne bezpieczeństwo statycznego typowania.',
    deepExplanation: `Zamiast stosować niebezpieczny typ \`any\`, generyki pozwalają przekazać typ jako parametr (zwykle oznaczany jako \`<T>\`). Dzięki temu TypeScript może dokładnie śledzić powiązania między typami argumentów a typem zwracanym.\n\n### Zastosowania:\n1. **Funkcje generyczne**: Przetwarzanie tablic lub obiektów o nieznanej strukturze z zachowaniem typu.\n2. **Generyczne interfejsy API**: Typowanie odpowiedzi serwera np. \`ApiResponse<T>\`.\n3. **Ograniczenia generyczne (Constraints)**: Wymuszenie, aby typ spełniał określony warunek np. \`<T extends { id: string }>\`.`,
    codeSnippet: {
      language: 'typescript',
      code: `// Generyczna odpowiedź API
interface ApiResponse<TData> {
  data: TData;
  status: 200 | 400 | 500;
  timestamp: number;
}

// Generyczna funkcja asynchroniczna z ograniczeniem
async function fetchEntity<T extends { id: string }>(endpoint: string, id: string): Promise<ApiResponse<T>> {
  const response = await fetch(\`\${endpoint}/\${id}\`);
  const data = await response.json();
  return {
    data,
    status: 200,
    timestamp: Date.now()
  };
}`
    },
    keyTakeaways: [
      'Generyki zapewniają elastyczność bez utraty kontroli typów (Type Safety).',
      'Używaj konwencji nazewnictwa T, K, V lub opisowych np. TItem, TResponse.',
      'Ograniczenia \`extends\` pozwalają bezpiecznie odwoływać się do właściwości obiektów.'
    ],
    suggestedFollowUps: ['Pokaż zaawansowane typy warunkowe (Conditional Types)', 'Jak działa keyof i typeof w TypeScript?', 'Jak otypować formularz generyczny w React?']
  },
  {
    id: 'event-loop',
    keywords: ['event loop', 'petla zdarzen', 'pętla zdarzeń', 'asynchronicznosc', 'asynchroniczność', 'microtasks', 'macrotasks', 'call stack', 'stos wywolan'],
    title: 'Event Loop w JavaScript i Przeglądarce',
    category: 'programming',
    summary: 'Event Loop to serce asynchronicznego środowiska JavaScript, odpowiedzialne za koordynację stosu wywołań (Call Stack), kolejki mikrozadań (Microtask Queue) oraz kolejki makrozadań (Callback/Task Queue).',
    deepExplanation: `JavaScript jest jednowątkowy, co oznacza, że może wykonywać tylko jedną operację naraz. Dzięki mechanizmowi Event Loop przeglądarka deleguje operacje wejścia/wyjścia (Web APIs) i powraca do nich, gdy stos wywołań jest pusty.\n\n### Kolejność wykonywania:\n1. **Call Stack**: Wykonuje synchroniczny kod linijka po linijce.\n2. **Microtasks Queue**: Obietnice (\`Promise.then\`, \`catch\`, \`queueMicrotask\`, \`MutationObserver\`) – mają ZAWSZE pierwszeństwo i są opróżniane do zera po każdym zadaniu synchronicznym.\n3. **Macrotasks Queue**: \`setTimeout\`, \`setInterval\`, zdarzenia DOM, I/O.`,
    codeSnippet: {
      language: 'javascript',
      code: `console.log('1. Start'); // Synchroniczny

setTimeout(() => {
  console.log('4. Timeout (Makrozadanie)');
}, 0);

Promise.resolve().then(() => {
  console.log('3. Promise (Mikrozadanie)');
});

console.log('2. Koniec'); // Synchroniczny

// Wynik w konsoli:
// 1. Start
// 2. Koniec
// 3. Promise (Mikrozadanie)
// 4. Timeout (Makrozadanie)`
    },
    keyTakeaways: [
      'Mikrozadania (Promises) wykonują się przed makrozadaniami (setTimeout).',
      'Zablokowanie Call Stacka długą pętlą zamraża interfejs użytkownika (UI).',
      'Długie obliczenia warto dzielić przy użyciu \`requestIdleCallback\` lub \`Web Workers\`.'
    ],
    suggestedFollowUps: ['Jak działają Web Workery?', 'Dlaczego setTimeout(fn, 0) nie odpala się od razu?', 'Jak uniknąć blokowania wątku głównego?']
  },
  {
    id: 'rest-vs-graphql',
    keywords: ['graphql', 'rest', 'api', 'rest api', 'overfetching', 'underfetching', 'endpointy'],
    title: 'REST API vs GraphQL – Porównanie Architektur',
    category: 'programming',
    summary: 'REST opiera się na wielu dedykowanych endpointach i metodach HTTP, podczas gdy GraphQL udostępnia pojedynczy endpoint i pozwala klientowi zażądać dokładnie takich pól, jakich potrzebuje.',
    deepExplanation: `### REST API:\n- **Zalety**: Proste w implementacji, doskonałe buforowanie HTTP (Cache-Control, ETag), powszechny standard, bezstanowość.\n- **Wady**: Problem over-fetchingu (pobieranie zbyt wielu niepotrzebnych danych) lub under-fetchingu (konieczność wykonywania wielu zapytań do różnych endpointów).\n\n### GraphQL:\n- **Zalety**: Klient sam definiuje schemat odpowiedzi, jedno zapytanie pobiera relacje wielopoziomowe, wbudowany silny system typowania.\n- **Wady**: Trudniejsze buforowanie po stronie serwera HTTP, narzut na parsowanie zapytań, podatność na zbyt złożone zapytania (N+1 problem).`,
    keyTakeaways: [
      'Dla prostych aplikacji CRUD i mikrousług REST jest zazwyczaj szybszy i tańszy we wdrożeniu.',
      'Dla aplikacji mobilnych i rozbudowanych dashboardów GraphQL radykalnie redukuje transfer danych.',
      'Hybryda: REST do uploadu plików i prostych zadań, GraphQL dla złożonych widoków danych.'
    ],
    suggestedFollowUps: ['Jak rozwiązać problem N+1 w GraphQL?', 'Jak zabezpieczyć endpoint GraphQL przed przeciążeniem?', 'Przykłady zapytań w GraphQL']
  },

  // =========================================================================
  // 2. ZARZĄDZANIE PROJEKTEM & PRODUKTYWNOŚĆ
  // =========================================================================
  {
    id: 'scrum-sprint',
    keywords: ['sprint', 'scrum', 'agile', 'kanban', 'daily', 'retro', 'retrospektywa', 'story points', 'planning'],
    title: 'Skuteczne Planowanie Sprintu w Scrum & Kanban',
    category: 'productivity',
    summary: 'Sprint to stały okres czasu (zwykle 1-2 tygodnie), w trakcie którego zespół tworzy gotowy, przetestowany i działający przyrost produktu.',
    deepExplanation: `### Filar Sprintu:\n1. **Sprint Planning (Planowanie)**: Zespół wybiera zadania z Backlogu Produktu, estymuje ich złożoność (Story Points) i ustala cel sprintu (Sprint Goal).\n2. **Daily Scrum (Codzienne spotkanie)**: 15-minutowa synchronizacja: Co zrobiłem wczoraj? Co zrobię dzisiaj? Jakie mam blokery?\n3. **Sprint Review (Przegląd)**: Prezentacja działającego oprogramowania interesariuszom.\n4. **Sprint Retrospective (Retrospektywa)**: Analiza procesu: Co poszło świetnie? Co możemy poprawić w następnym sprincie?`,
    keyTakeaways: [
      'Cel sprintu (Sprint Goal) jest ważniejszy niż "odhaczenie" każdego pojedynczego taska.',
      'Nie zmieniaj zakresu sprintu w trakcie jego trwania bez porozumienia z Product Ownerem.',
      'Używaj tablicy Kanban z limitami WIP (Work in Progress), aby unikać wielozadaniowości.'
    ],
    suggestedFollowUps: ['Jak estymować zadania w Planning Poker?', 'Jak ustalić limit WIP na tablicy Kanban?', 'Jak prowadzić ciekawą retrospektywę?']
  },
  {
    id: 'time-management',
    keywords: ['pomodoro', 'zarzadzanie czasem', 'zarządzanie czasem', 'prokrastynacja', 'eisenhower', 'gtd', 'produktywnosc', 'produktywność', 'skupienie'],
    title: 'Najlepsze Techniki Zarządzania Czasem i Walki z Prokrastynacją',
    category: 'productivity',
    summary: 'Systemowe metody zarządzania uwagą i energią: Technika Pomodoro, Matryca Eisenhowera oraz zasada 2 minut.',
    deepExplanation: `Produktywność to nie robienie więcej rzeczy, lecz robienie właściwych rzeczy we właściwym stanie skupienia.\n\n### 1. Technika Pomodoro:\n- 25 minut głębokiej pracy bez rozpraszaczy (blokada telefonu, powiadomień).\n- 5 minut pełnego odpoczynku (wstań, napij się wody, odciągnij wzrok od ekranu).\n- Po 4 cyklach długa przerwa 20-30 minut.\n\n### 2. Matryca Eisenhowera:\n- **Ważne i Pilne**: Zrób natychmiast (kryzysy, deadline'y).\n- **Ważne i Niepilne**: Zaplanuj w kalendarzu (strategia, rozwój, zdrowie, relacje) – to tu buduje się sukces!\n- **Nieważne i Pilne**: Deleguj innym.\n- **Nieważne i Niepilne**: Usuń bez wahania.`,
    keyTakeaways: [
      'Zasada 2 minut: Jeśli zadanie zajmuje mniej niż 2 minuty, zrób je od razu.',
      'Planuj kolejny dzień wieczorem – rano natychmiast wejdziesz w stan flow.',
      'Wyeliminuj multitasking – przełączanie kontekstu kosztuje do 40% produktywności.'
    ],
    suggestedFollowUps: ['Jak wejść w stan Deep Work?', 'Jak zorganizować tablicę zadań w Nowoczesne Studio?', 'Jak walczyć z chronicznym zmęczeniem?']
  },

  // =========================================================================
  // 3. BIZNES & STARTUPY
  // =========================================================================
  {
    id: 'mvp-strategy',
    keywords: ['mvp', 'startup', 'minimum viable product', 'biznes', 'walidacja', 'product market fit', 'klient'],
    title: 'Jak Zbudować Prawdziwe MVP (Minimum Viable Product)',
    category: 'business',
    summary: 'MVP to wersja produktu z minimalnym zestawem funkcji, która pozwala zebrać maksymalną ilość zweryfikowanej wiedzy o klientach przy najmniejszym wysiłku.',
    deepExplanation: `Najczęstszy błąd twórców to spędzenie 6 miesięcy w piwnicy na budowaniu "idealnego" systemu, którego nikt nie potrzebuje.\n\n### Prawidłowe podejście do MVP:\n1. **Zdefiniuj problem, nie rozwiązanie**: Jaki konkretny ból ma klient? Ile płaci za rozwiązanie tego bólu obecnie?\n2. **Koncepcja deskorolki**: Jeśli celem jest samochód, Twoim MVP nie jest koło ani podwozie – Twoim MVP jest deskorolka (zapewnia podstawową mobilność od dnia 1).\n3. **Szybka pętla zwrotna**: Zbuduj -> Zmierz reakcję -> Wyciągnij wnioski (Build-Measure-Learn).`,
    keyTakeaways: [
      'Lepsze niedoskonałe MVP u 100 użytkowników niż perfekcyjny kod na dysku twardym.',
      'Mierz zachowania, a nie opinie – liczy się to, co ludzie robią (i czy płacą), a nie co mówią.',
      'Nie bój się manualnych procesów na początku (Concierge MVP).'
    ],
    suggestedFollowUps: ['Jak zdobyć pierwszych 10 płacących klientów?', 'Jak mierzyć Product-Market Fit?', 'Jak wycenić usługę SaaS?']
  },

  // =========================================================================
  // 4. NAUKA & FIZYKA & ŚWIAT
  // =========================================================================
  {
    id: 'relativity-theory',
    keywords: ['teoria wzglednosci', 'teoria względności', 'einstein', 'czasoprzestrzen', 'czasoprzestrzeń', 'dylatacja czasu', 'fizyka'],
    title: 'Szczególna i Ogólna Teoria Względności Alberta Einsteina',
    category: 'science',
    summary: 'Teoria względności zrewolucjonizowała fizykę, pokazując, że czas i przestrzeń nie są absolutne, lecz tworzą elastyczną czterowymiarową czasoprzestrzeń.',
    deepExplanation: `Przed Einsteinem sądzono, że czas płynie wszędzie tak samo. Einstein udowodnił, że:\n\n### 1. Szczególna Teoria Względności (1905):\n- Prędkość światła w próżni (ok. 300 000 km/s) jest stała dla każdego obserwatora, niezależnie od tego, jak szybko sam się porusza.\n- Skutek: **Dylatacja czasu** – im szybciej się poruszasz w przestrzeni, tym wolniej upływa dla Ciebie czas w stosunku do obserwatora spoczywającego.\n- Równoważność masy i energii: Słynne równanie **E = mc²**.\n\n### 2. Ogólna Teoria Względności (1915):\n- Grawitacja to nie magiczna siła przyciągania, lecz **zakrzywienie czasoprzestrzeni** spowodowane obecnością masy.\n- Ziemia krąży wokół Słońca nie dlatego, że jest ciągnięta niewidzialną liną, lecz dlatego, że porusza się po najprostszej możliwej ścieżce (geodezyjnej) w czasoprzestrzeni wykrzywionej przez gigantyczną masę Słońca.`,
    keyTakeaways: [
      'Czas płynie wolniej w silnym polu grawitacyjnym (np. w pobliżu czarnej dziury).',
      'Systemy GPS w Twoim telefonie muszą uwzględniać poprawki relatywistyczne, inaczej myliłyby się o kilometry dziennie!',
      'Światło ugina się wokół masywnych obiektów (zjawisko soczewkowania grawitacyjnego).'
    ],
    suggestedFollowUps: ['Czym jest czarna dziura i horyzont zdarzeń?', 'Czy podróże w czasie są możliwe według fizyki?', 'Wyjaśnij paradoks bliźniąt']
  },
  {
    id: 'why-sky-is-blue',
    keywords: ['dlaczego niebo jest niebieskie', 'rozpraszanie rayleigha', 'atmosfera', 'swiatlo', 'światło', 'kolor nieba', 'zachod slonca'],
    title: 'Dlaczego Niebo jest Niebieskie? (Rozpraszanie Rayleigha)',
    category: 'science',
    summary: 'Niebieski kolor nieba wynika ze zjawiska zwanego rozpraszaniem Rayleigha – cząsteczki gazów w atmosferze silniej rozpraszają krótsze fale świetlne (niebieskie i fioletowe).',
    deepExplanation: `Światło słoneczne wydaje się białe, ale w rzeczywistości składa się ze wszystkich kolorów tęczy. Każdy kolor to fala o innej długości:\n- Czerwony i pomarańczowy: długie fale.\n- Niebieski i fioletowy: krótkie fale.\n\nGdy światło słoneczne dociera do atmosfery Ziemi, zderza się z cząsteczkami azotu i tlenu. Krótkie, niebieskie fale zderzają się z nimi i rozpraszają we wszystkich kierunkach znacznie intensywniej niż fale czerwone. Kiedy patrzymy w niebo, widzimy właśnie to rozproszone, niebieskie światło!\n\n### A dlaczego zachód słońca jest czerwony?\nPodczas zachodu słońce jest nisko nad horyzontem. Światło musi przebyć znacznie dłuższą drogę przez atmosferę. Prawie całe niebieskie światło rozprasza się po drodze, a do naszych oczu docierają tylko najdłuższe, czerwone i pomarańczowe promienie.`,
    keyTakeaways: [
      'Rozpraszanie Rayleigha rośnie odwrotnie proporcjonalnie do czwartej potęgi długości fali (1/λ⁴).',
      'Fiolet rozprasza się jeszcze silniej niż błękit, ale ludzkie oko jest znacznie bardziej czułe na światło niebieskie, a Słońce emituje mniej fioletu.',
      'Na Księżycu nie ma atmosfery, dlatego nawet w dzień niebo jest tam smoliście czarne.'
    ],
    suggestedFollowUps: ['Dlaczego chmury są białe?', 'Jak powstaje tęcza?', 'Dlaczego zachód słońca ma różne kolory?']
  },

  // =========================================================================
  // 5. FILOZOFIA & ROZWÓJ OSOBISTY
  // =========================================================================
  {
    id: 'stoicism-daily',
    keywords: ['stoicyzm', 'filozofia', 'spokoj', 'spokój', 'stres', 'marek aureliusz', 'seneka', 'epiktet', 'kontrola'],
    title: 'Stoicyzm w Praktyce: Jak Zachować Wewnętrzny Spokój',
    category: 'philosophy',
    summary: 'Stoicyzm to antyczna filozofia działania, której fundamentem jest Dychotomia Kontroli: podział spraw na te, na które mamy wpływ, i te, na które wpływu nie mamy.',
    deepExplanation: `Marek Aureliusz, Seneka i Epiktet nauczali, że to nie wydarzenia nas denerwują, lecz nasza interpretacja tych wydarzeń.\n\n### 3 Kluczowe Zasady Stoicyzmu:\n1. **Dychotomia Kontroli**: Pod Twoją kontrolą są Twoje myśli, reakcje, nawyki i czyny. Poza Twoją kontrolą: pogoda, opinia innych ludzi, sytuacja gospodarcza, przeszłość. Skupienie energii wyłącznie na tym, co kontrolujesz, daje niezniszczalny spokój ducha.\n2. **Amor Fati (Ukochaj swój los)**: Nie tylko znoś trudności, ale witaj je jako okazję do ćwiczenia charakteru i cierpliwości.\n3. **Memento Mori**: Świadomość przemijania nie ma dołować, lecz przypominać, by nie marnować ani jednej godziny na błahe kłótnie i narzekanie.`,
    keyTakeaways: [
      '"Człowiek cierpi bardziej w wyobraźni niż w rzeczywistości." – Seneka',
      'Przeszkoda na drodze staje się samą drogą.',
      'Zadaj sobie pytanie przy każdym zmartwieniu: "Czy mam na to bezpośredni wpływ teraz?". Jeśli nie – odpuść.'
    ],
    suggestedFollowUps: ['Cytaty Marka Aureliusza na stres', 'Jak radzić sobie z toksycznymi ludźmi według stoików?', 'Medytacja stoicka krok po kroku']
  },

  // =========================================================================
  // 6. HUMOR & ŻARTY
  // =========================================================================
  {
    id: 'programmer-humor',
    keywords: ['zart', 'żart', 'kawal', 'kawał', 'smieszne', 'śmieszne', 'humor', 'opowiedz kawal', 'opowiedz zart'],
    title: 'Najlepszy Humor Programistyczny',
    category: 'humor',
    summary: 'Kolekcja inteligentnych żartów i anegdot z życia programistów i świata IT.',
    deepExplanation: `Oto wyselekcjonowane dowcipy z branży IT:\n\n1. **Klasyk o 10 rodzajach ludzi**:\n   Na świecie jest 10 rodzajów ludzi: ci, którzy rozumieją system binarny, i ci, którzy go nie rozumieją.\n\n2. **Żona i programista**:\n   Żona wysyła programistę do sklepu:\n   – *Kup bochenek chleba, a jak będą jajka, to weź dziesięć.*\n   Programista wraca z dziesięcioma bochenkami chleba.\n   Żona pyta przerażona:\n   – *Dlaczego kupiłeś dziesięć chlebów?!*\n   – *Bo były jajka.*\n\n3. **Optymista, pesymista i programista**:\n   Dla optymisty szklanka jest w połowie pełna.\n   Dla pesymisty szklanka jest w połowie pusta.\n   Dla programisty szklanka ma dwa razy za dużą pojemność w stosunku do alokowanych danych.\n\n4. **QA Tester wchodzi do baru**:\n   Tester zamawia piwo, zamawia 0 piw, zamawia 9999999 piw, zamawia jaszczurkę, zamawia -1 piwa, zamawia "asdfghjkl". Wszystko działa bez błędu.\n   Wchodzi prawdziwy klient i pyta, gdzie jest toaleta. Bar staje w płomieniach.`,
    keyTakeaways: [
      'Debugowanie kodu: Usuwanie 1 błędu, dodawanie 3 nowych.',
      '"U mnie działa" to oficjalny stan oprogramowania.',
      'Kawa zamienia się w kod za pomocą programisty.'
    ],
    suggestedFollowUps: ['Opowiedz jeszcze jeden kawał', 'Jaki jest najkrótszy żart o programistach?', 'Dlaczego programiści mylą Halloween z Bożym Narodzeniem?']
  }
];

/**
 * Przeszukuje bazę wiedzy na podstawie zapytań użytkownika
 */
export function queryKnowledgeBase(queryText: string): KnowledgeEntry | null {
  const normalized = queryText
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'<>]/g, ' ')
    .trim();

  // 1. Sprawdzenie dokładnych słów kluczowych
  let bestMatch: KnowledgeEntry | null = null;
  let highestScore = 0;

  for (const entry of KNOWLEDGE_BASE) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (normalized.includes(kw)) {
        score += kw.length; // dłuższe frazy mają większą wagę
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = entry;
    }
  }

  return highestScore >= 3 ? bestMatch : null;
}
