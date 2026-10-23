/**
 * Rejestr możliwości bloków (Block Capability Registry).
 *
 * Aplikacja udostępnia ok. 80 typów bloków, ale do tej pory AI znało tylko kilka z nich.
 * Rejestr opisuje każdy typ: do czego służy, jakie ma pola obowiązkowe, w jakich rolach
 * semantycznych sekcji ma sens, czy ma realny renderer w edytorze oraz jaki zamiennik
 * (fallback) zastosować, gdy renderera brakuje. Planista dobiera bloki wyłącznie
 * z tego rejestru, a walidator używa go do sprawdzania i naprawiania wyniku.
 */

import type { BlockType, DocBlock } from '../../../types/workspace';
import type { SectionRole, ValidationIssue } from './types';

export type BlockCategory =
  | 'text'
  | 'list'
  | 'emphasis'
  | 'data'
  | 'code'
  | 'media'
  | 'layout'
  | 'interactive'
  | 'reference';

export interface BlockSpec {
  type: BlockType;
  label: string;
  category: BlockCategory;
  /** Kiedy tego bloku używać – zdanie opisujące cel, nie ozdobę. */
  purpose: string;
  /** Role sekcji, w których blok ma uzasadnione zastosowanie. */
  roles: SectionRole[];
  /** Czy edytor posiada rzeczywisty renderer tego typu. */
  renderable: boolean;
  /** Zamiennik dla typów bez renderera. */
  fallback?: BlockType;
  /** Pola, które muszą być niepuste, aby blok był poprawny. */
  required: Array<keyof DocBlock>;
  /** Opis konwencji zapisu danych w polach (np. „A | B"). */
  convention?: string;
  /** Blok, który niesie interakcję użytkownika (głosowanie, kanban…). */
  interactive?: boolean;
  /** Blok wizualnie ciężki – planista ogranicza jego liczbę w dokumencie. */
  heavy?: boolean;
  /** Maks. liczba wystąpień na stronie dla planisty (domyślnie bez limitu). */
  maxPerPage?: number;
  tags: string[];
}

const T = (spec: BlockSpec): BlockSpec => spec;

export const BLOCK_SPECS: BlockSpec[] = [
  // ----- Tekst
  T({ type: 'p', label: 'Akapit', category: 'text', purpose: 'Główna treść narracyjna – krótkie akapity o jednej myśli.', roles: ['intro', 'definition', 'mechanism', 'applications', 'risks', 'techniques', 'people', 'future', 'generic', 'facts'], renderable: true, required: ['content'], tags: ['tekst', 'opis'] }),
  T({ type: 'h1', label: 'Nagłówek 1', category: 'text', purpose: 'Tytuł dokumentu lub główny podział na część.', roles: ['intro', 'generic'], renderable: true, required: ['content'], maxPerPage: 1, tags: ['nagłówek', 'tytuł'] }),
  T({ type: 'h2', label: 'Nagłówek 2', category: 'text', purpose: 'Początek nowej sekcji tematycznej.', roles: ['intro', 'definition', 'mechanism', 'classification', 'timeline', 'applications', 'comparison', 'risks', 'techniques', 'people', 'facts', 'media', 'future', 'review', 'sources', 'generic'], renderable: true, required: ['content'], tags: ['nagłówek', 'sekcja'] }),
  T({ type: 'h3', label: 'Nagłówek 3', category: 'text', purpose: 'Podsekcja w obrębie sekcji; dzieli długie wyjaśnienia.', roles: ['definition', 'mechanism', 'classification', 'applications', 'techniques', 'generic'], renderable: true, required: ['content'], tags: ['nagłówek', 'podsekcja'] }),
  T({ type: 'h4', label: 'Nagłówek 4', category: 'text', purpose: 'Drobna podsekcja, np. pojedynczy wariant lub przypadek.', roles: ['classification', 'techniques', 'generic'], renderable: true, required: ['content'], tags: ['nagłówek'] }),
  T({ type: 'h5', label: 'Nagłówek 5', category: 'text', purpose: 'Etykieta pomocnicza w gęstych dokumentach technicznych.', roles: ['techniques', 'generic'], renderable: true, required: ['content'], tags: ['nagłówek'] }),
  T({ type: 'h6', label: 'Nagłówek 6', category: 'text', purpose: 'Najniższy poziom hierarchii – rzadko potrzebny.', roles: ['generic'], renderable: true, required: ['content'], tags: ['nagłówek'] }),
  T({ type: 'lead', label: 'Lead', category: 'text', purpose: 'Wyróżniony akapit wprowadzający, streszcza sekcję w 1–2 zdaniach.', roles: ['intro', 'definition', 'generic'], renderable: true, required: ['content'], maxPerPage: 3, tags: ['wstęp', 'streszczenie'] }),
  T({ type: 'subtext', label: 'Przypis', category: 'text', purpose: 'Źródło, podpis lub zastrzeżenie o mniejszej wadze.', roles: ['media', 'sources', 'generic', 'facts'], renderable: true, required: ['content'], tags: ['przypis', 'źródło'] }),
  T({ type: 'quote', label: 'Cytat', category: 'text', purpose: 'Dosłowny fragment źródła lub myśl wartą zapamiętania.', roles: ['intro', 'people', 'generic', 'facts', 'future'], renderable: true, required: ['content'], maxPerPage: 4, tags: ['cytat'] }),

  // ----- Listy
  T({ type: 'bullet', label: 'Lista punktowana', category: 'list', purpose: 'Równorzędne elementy bez kolejności.', roles: ['mechanism', 'classification', 'applications', 'risks', 'techniques', 'facts', 'review', 'generic'], renderable: true, required: ['content'], tags: ['lista'] }),
  T({ type: 'number', label: 'Lista numerowana', category: 'list', purpose: 'Kroki procesu lub elementy o ustalonej kolejności.', roles: ['mechanism', 'techniques', 'timeline', 'generic'], renderable: true, required: ['content'], tags: ['lista', 'kroki'] }),
  T({ type: 'todo', label: 'Checklista', category: 'list', purpose: 'Rzeczy do sprawdzenia lub wykonania; dobra do materiałów praktycznych.', roles: ['review', 'applications', 'techniques', 'generic'], renderable: true, required: ['content'], tags: ['checklista', 'zadanie'] }),
  T({ type: 'toggle', label: 'Sekcja zwijana', category: 'list', purpose: 'Szczegóły, które nie powinny przeszkadzać w skanowaniu strony.', roles: ['definition', 'mechanism', 'facts', 'review', 'generic'], renderable: true, required: ['content', 'toggleDetails'], convention: 'content = tytuł, toggleDetails = treść', tags: ['szczegóły', 'zwijane'] }),
  T({ type: 'numbered_toggle', label: 'Numerowana sekcja zwijana', category: 'list', purpose: 'Kolejne kroki z rozwijanymi szczegółami.', roles: ['mechanism', 'techniques'], renderable: true, required: ['content', 'toggleDetails'], tags: ['kroki', 'zwijane'] }),
  T({ type: 'tabs', label: 'Zakładki', category: 'list', purpose: 'Równoległe warianty tej samej treści (np. per grupa odbiorców).', roles: ['classification', 'comparison', 'techniques'], renderable: true, required: ['content', 'toggleDetails'], convention: 'content = „A | B | C", toggleDetails = „tekst A | tekst B | tekst C"', heavy: true, maxPerPage: 2, tags: ['warianty'] }),
  T({ type: 'faq', label: 'FAQ', category: 'list', purpose: 'Pytania i odpowiedzi – dobre do powtórki oraz typowych wątpliwości.', roles: ['review', 'facts', 'generic'], renderable: true, required: ['faqItems'], interactive: true, maxPerPage: 2, tags: ['pytania', 'powtórka'] }),
  T({ type: 'event_schedule', label: 'Punkt agendy', category: 'list', purpose: 'Pozycja harmonogramu z godziną i prowadzącym.', roles: ['timeline'], renderable: true, required: ['eventScheduleData'], tags: ['agenda'] }),
  T({ type: 'meeting_action_item', label: 'Action item', category: 'list', purpose: 'Zadanie ze spotkania z właścicielem i terminem.', roles: ['review'], renderable: true, required: ['content'], tags: ['zadanie', 'spotkanie'] }),

  // ----- Wyróżnienia
  T({ type: 'callout', label: 'Callout', category: 'emphasis', purpose: 'Neutralne wyróżnienie dłuższej myśli.', roles: ['intro', 'generic', 'facts'], renderable: true, required: ['content'], tags: ['wyróżnienie'] }),
  T({ type: 'callout_info', label: 'Callout – informacja', category: 'emphasis', purpose: 'Kontekst lub objaśnienie, które pomaga zrozumieć sekcję.', roles: ['intro', 'definition', 'mechanism', 'facts', 'generic'], renderable: true, required: ['content'], tags: ['informacja', 'definicja'] }),
  T({ type: 'callout_success', label: 'Callout – sukces', category: 'emphasis', purpose: 'Potwierdzona korzyść lub dobry wynik.', roles: ['applications', 'review', 'generic'], renderable: true, required: ['content'], tags: ['korzyść'] }),
  T({ type: 'callout_warning', label: 'Callout – ostrzeżenie', category: 'emphasis', purpose: 'Typowy błąd, ograniczenie lub pułapka.', roles: ['risks', 'techniques', 'mechanism', 'generic'], renderable: true, required: ['content'], tags: ['ostrzeżenie', 'uwaga'] }),
  T({ type: 'callout_danger', label: 'Callout – krytyczne', category: 'emphasis', purpose: 'Poważne ryzyko lub czynność nieodwracalna.', roles: ['risks'], renderable: true, required: ['content'], maxPerPage: 2, tags: ['ryzyko', 'krytyczne'] }),
  T({ type: 'callout_tip', label: 'Callout – wskazówka', category: 'emphasis', purpose: 'Praktyczna rada, ciekawostka lub skrót myślowy.', roles: ['applications', 'techniques', 'facts', 'generic', 'review'], renderable: true, required: ['content'], tags: ['wskazówka', 'ciekawostka'] }),
  T({ type: 'key_takeaway', label: 'Kluczowy wniosek', category: 'emphasis', purpose: 'Jedno zdanie, które czytelnik ma zapamiętać z sekcji.', roles: ['intro', 'review', 'generic', 'future'], renderable: true, required: ['content'], maxPerPage: 3, tags: ['wniosek', 'zapamiętaj'] }),
  T({ type: 'summary_box', label: 'Podsumowanie TL;DR', category: 'emphasis', purpose: 'Streszczenie całej strony na początku lub końcu.', roles: ['intro', 'review'], renderable: true, required: ['content'], maxPerPage: 2, tags: ['tldr', 'podsumowanie'] }),
  T({ type: 'alert_banner', label: 'Baner alertu', category: 'emphasis', purpose: 'Komunikat o znaczeniu dla całego dokumentu.', roles: ['risks', 'generic'], renderable: true, required: ['content'], maxPerPage: 1, tags: ['alert'] }),
  T({ type: 'announcement_banner', label: 'Baner ogłoszeniowy', category: 'emphasis', purpose: 'Ogłoszenie z przyciskiem akcji.', roles: ['generic'], renderable: true, required: ['announcementData'], maxPerPage: 1, tags: ['ogłoszenie'] }),
  T({ type: 'testimonial', label: 'Referencja', category: 'emphasis', purpose: 'Opinia konkretnej osoby – tylko gdy pochodzi ze źródła.', roles: ['people', 'applications'], renderable: true, required: ['content', 'quoteAuthor'], tags: ['opinia'] }),

  // ----- Kod i technologia
  T({ type: 'code', label: 'Blok kodu', category: 'code', purpose: 'Przykład kodu lub konfiguracji możliwy do skopiowania.', roles: ['techniques', 'mechanism', 'applications'], renderable: true, required: ['content', 'language'], tags: ['kod'] }),
  T({ type: 'terminal', label: 'Terminal', category: 'code', purpose: 'Polecenia powłoki do wykonania krok po kroku.', roles: ['techniques'], renderable: true, required: ['content'], tags: ['bash', 'cli'] }),
  T({ type: 'math', label: 'Wzór', category: 'code', purpose: 'Równanie lub zależność matematyczna.', roles: ['mechanism', 'definition', 'facts'], renderable: true, required: ['content'], tags: ['wzór', 'matematyka'] }),
  T({ type: 'json', label: 'JSON', category: 'code', purpose: 'Struktura danych lub odpowiedź API.', roles: ['techniques', 'mechanism'], renderable: true, required: ['content'], tags: ['dane', 'api'] }),
  T({ type: 'diff', label: 'Diff', category: 'code', purpose: 'Pokazanie różnicy przed/po w kodzie.', roles: ['techniques'], renderable: true, required: ['content'], tags: ['zmiana'] }),
  T({ type: 'sql', label: 'SQL', category: 'code', purpose: 'Zapytanie do bazy danych.', roles: ['techniques'], renderable: true, required: ['content'], tags: ['baza'] }),
  T({ type: 'mermaid', label: 'Diagram Mermaid', category: 'code', purpose: 'Schemat procesu, zależności lub hierarchii pojęć.', roles: ['mechanism', 'classification', 'timeline', 'comparison'], renderable: true, required: ['diagramSyntax'], heavy: true, maxPerPage: 2, tags: ['diagram', 'schemat'] }),
  T({ type: 'api_endpoint', label: 'Endpoint API', category: 'code', purpose: 'Opis metody HTTP, ścieżki i przykładowej odpowiedzi.', roles: ['techniques'], renderable: true, required: ['apiEndpointData'], tags: ['api'] }),
  T({ type: 'code_sandbox', label: 'Piaskownica kodu', category: 'code', purpose: 'Kod, który czytelnik może uruchomić.', roles: ['techniques'], renderable: true, required: ['codeSandboxData'], interactive: true, heavy: true, maxPerPage: 1, tags: ['kod', 'uruchom'] }),

  // ----- Dane
  T({ type: 'table', label: 'Tabela', category: 'data', purpose: 'Zestawienie cech, porównanie wariantów lub dane uporządkowane w kolumnach.', roles: ['classification', 'comparison', 'facts', 'timeline', 'applications', 'generic', 'sources'], renderable: true, required: ['tableData'], maxPerPage: 4, tags: ['tabela', 'porównanie'] }),
  T({ type: 'stat', label: 'Statystyka', category: 'data', purpose: 'Jedna kluczowa liczba z podpisem.', roles: ['intro', 'facts', 'applications'], renderable: true, required: ['content', 'statValue'], tags: ['liczba', 'kpi'] }),
  T({ type: 'stat_grid', label: 'Siatka statystyk', category: 'data', purpose: 'Dwie liczby obok siebie dla kontrastu.', roles: ['intro', 'facts', 'applications', 'comparison'], renderable: true, required: ['content', 'statValue'], convention: 'wartości rozdzielone znakiem |', maxPerPage: 3, tags: ['liczby'] }),
  T({ type: 'progress', label: 'Pasek postępu', category: 'data', purpose: 'Odsetek lub stopień realizacji (0–100).', roles: ['facts', 'review', 'applications'], renderable: true, required: ['content', 'progressPercent'], tags: ['postęp', 'procent'] }),
  T({ type: 'rating', label: 'Ocena', category: 'data', purpose: 'Skala 1–5 dla opinii lub oceny jakości.', roles: ['comparison', 'review'], renderable: true, required: ['content', 'ratingStars'], tags: ['ocena'] }),
  T({ type: 'poll', label: 'Ankieta', category: 'data', purpose: 'Zebranie opinii czytelnika.', roles: ['review', 'generic'], renderable: true, required: ['content', 'pollOptions'], interactive: true, maxPerPage: 1, tags: ['ankieta'] }),
  T({ type: 'kanban_board', label: 'Kanban', category: 'data', purpose: 'Plan prac z kolumnami statusów.', roles: ['applications', 'review'], renderable: true, required: ['kanbanColumns'], interactive: true, heavy: true, maxPerPage: 1, tags: ['tablica', 'zadania'] }),
  T({ type: 'target_meter', label: 'Miernik celu', category: 'data', purpose: 'Postęp względem celu z jednostką.', roles: ['facts', 'review'], renderable: true, required: ['gaugeData'], tags: ['cel'] }),
  T({ type: 'decision_matrix', label: 'Macierz decyzji', category: 'data', purpose: 'Ważenie wariantów według kryteriów.', roles: ['comparison'], renderable: true, required: ['decisionMatrixData'], heavy: true, maxPerPage: 1, tags: ['decyzja', 'kryteria'] }),
  T({ type: 'risk_register', label: 'Rejestr ryzyk', category: 'data', purpose: 'Ryzyka z prawdopodobieństwem, wpływem i mitygacją.', roles: ['risks'], renderable: true, required: ['riskRegisterData'], heavy: true, maxPerPage: 1, tags: ['ryzyko'] }),
  T({ type: 'milestone_roadmap', label: 'Roadmapa', category: 'data', purpose: 'Etapy rozwoju lub plan w czasie.', roles: ['timeline', 'future'], renderable: true, required: ['roadmapData'], heavy: true, maxPerPage: 1, tags: ['plan', 'etapy'] }),
  T({ type: 'swot_analysis', label: 'Analiza SWOT', category: 'data', purpose: 'Mocne/słabe strony, szanse i zagrożenia – tylko gdy materiał to uzasadnia.', roles: ['risks', 'comparison'], renderable: true, required: ['swotData'], heavy: true, maxPerPage: 1, tags: ['swot', 'strategia'] }),
  T({ type: 'kpi_scorecard', label: 'Karta KPI', category: 'data', purpose: 'Wskaźnik z wartością bieżącą, celem i trendem.', roles: ['facts', 'applications'], renderable: true, required: ['kpiScorecardData'], tags: ['kpi'] }),
  T({ type: 'spec_table', label: 'Specyfikacja', category: 'data', purpose: 'Parametry w układzie klucz–wartość.', roles: ['facts', 'definition', 'techniques', 'classification'], renderable: true, required: ['specTableData'], maxPerPage: 3, tags: ['parametry', 'specyfikacja'] }),
  T({ type: 'pros_cons', label: 'Zalety i wady', category: 'data', purpose: 'Bilans argumentów za i przeciw.', roles: ['comparison', 'risks', 'applications'], renderable: true, required: ['content', 'toggleDetails'], convention: 'content = linie zaczynające się od „+", toggleDetails = linie od „-"', maxPerPage: 2, tags: ['zalety', 'wady'] }),
  T({ type: 'before_after', label: 'Przed i po', category: 'data', purpose: 'Zestawienie stanu wyjściowego i docelowego.', roles: ['comparison', 'applications'], renderable: true, required: ['beforeAfterData'], maxPerPage: 1, tags: ['porównanie'] }),
  T({ type: 'timeline', label: 'Oś czasu', category: 'data', purpose: 'Wydarzenie z datą; kolejne bloki tworzą oś.', roles: ['timeline', 'future'], renderable: true, required: ['content', 'timelineDate'], tags: ['historia', 'data'] }),
  T({ type: 'countdown', label: 'Odliczanie', category: 'data', purpose: 'Termin z licznikiem – tylko dla realnych dat.', roles: ['review'], renderable: true, required: ['targetDate'], tags: ['termin'] }),
  T({ type: 'changelog', label: 'Changelog', category: 'data', purpose: 'Zmiany w wersji.', roles: ['timeline', 'techniques'], renderable: true, required: ['changelogData'], tags: ['wersja'] }),
  T({ type: 'chart', label: 'Wykres analityczny', category: 'data', purpose: 'Interaktywny wykres SVG (słupkowy, liniowy lub kołowy) z realnych danych.', roles: ['facts', 'comparison', 'applications', 'review'], renderable: true, required: ['chartData'], interactive: true, heavy: true, maxPerPage: 2, tags: ['wykres', 'dane', 'chart'] }),
  T({ type: 'linked_database', label: 'Powiązana baza danych (Linked Database)', category: 'data', purpose: 'Osadzony na żywo widok bazy danych (Projects, Tasks, Meetings) z przełączaniem Table/Board/Calendar/List/Gallery.', roles: ['applications', 'review', 'generic'], renderable: true, required: ['linkedDatabaseData'], interactive: true, heavy: true, maxPerPage: 4, tags: ['baza', 'database', 'tasks', 'projects', 'meetings'] }),

  // ----- Media
  T({ type: 'image', label: 'Obraz', category: 'media', purpose: 'Ilustracja wyjaśniająca omawiane zagadnienie.', roles: ['intro', 'definition', 'mechanism', 'classification', 'applications', 'people', 'media', 'timeline'], renderable: true, required: ['imageUrl'], maxPerPage: 6, tags: ['obraz', 'ilustracja'] }),
  T({ type: 'video', label: 'Wideo', category: 'media', purpose: 'Materiał wideo rzeczywiście wyjaśniający temat.', roles: ['media', 'mechanism', 'applications'], renderable: true, required: ['videoUrl'], maxPerPage: 2, tags: ['film', 'youtube'] }),
  T({ type: 'audio', label: 'Audio', category: 'media', purpose: 'Nagranie lub podcast.', roles: ['media'], renderable: true, required: ['audioUrl'], tags: ['dźwięk'] }),
  T({ type: 'bookmark', label: 'Zakładka linku', category: 'media', purpose: 'Karta z linkiem do artykułu, dokumentacji lub publikacji.', roles: ['sources', 'media', 'generic', 'review'], renderable: true, required: ['bookmarkUrl', 'bookmarkTitle'], tags: ['link', 'źródło'] }),
  T({ type: 'file', label: 'Plik', category: 'media', purpose: 'Załącznik do pobrania.', roles: ['media', 'sources'], renderable: true, required: ['fileUrl', 'fileName'], tags: ['plik'] }),
  T({ type: 'file_card', label: 'Karta pliku', category: 'media', purpose: 'Załącznik z opisem typu i rozmiaru.', roles: ['media', 'sources'], renderable: true, required: ['fileName'], tags: ['plik'] }),
  T({ type: 'embed', label: 'Osadzenie', category: 'media', purpose: 'Interaktywna strona WWW w ramce.', roles: ['media'], renderable: true, required: ['embedUrl'], heavy: true, maxPerPage: 1, tags: ['iframe'] }),
  T({ type: 'map', label: 'Mapa', category: 'media', purpose: 'Lokalizacja geograficzna omawianego miejsca.', roles: ['media', 'people', 'facts'], renderable: true, required: ['embedUrl'], maxPerPage: 1, tags: ['mapa', 'miejsce'] }),
  T({ type: 'badge', label: 'Etykieta', category: 'media', purpose: 'Status lub kategoria jako znacznik.', roles: ['intro', 'generic'], renderable: true, required: ['content'], tags: ['status'] }),
  T({ type: 'embed_github', label: 'Repozytorium GitHub', category: 'media', purpose: 'Karta repozytorium.', roles: ['techniques', 'sources'], renderable: true, required: ['bookmarkUrl'], tags: ['github'] }),
  T({ type: 'audio_memo', label: 'Notatka głosowa', category: 'media', purpose: 'Nagranie głosowe użytkownika.', roles: ['media'], renderable: true, required: ['audioMemoData'], tags: ['audio'] }),
  T({ type: 'citation_source', label: 'Karta źródła', category: 'reference', purpose: 'Publikacja z autorami, rokiem i DOI.', roles: ['sources'], renderable: true, required: ['citationData'], tags: ['źródło', 'doi'] }),

  // ----- Układ
  T({ type: 'divider', label: 'Separator', category: 'layout', purpose: 'Wyraźne oddzielenie dużych części dokumentu.', roles: ['generic', 'sources', 'review'], renderable: true, required: [], maxPerPage: 5, tags: ['separator'] }),
  T({ type: 'spacer', label: 'Odstęp', category: 'layout', purpose: 'Dodatkowa przestrzeń pionowa.', roles: ['generic'], renderable: true, required: [], tags: ['odstęp'] }),
  T({ type: 'columns_2', label: '2 kolumny', category: 'layout', purpose: 'Dwie równoległe treści (np. definicja obok przykładu).', roles: ['comparison', 'definition', 'classification', 'applications'], renderable: true, required: ['content', 'toggleDetails'], convention: 'content = lewa kolumna, toggleDetails = prawa', maxPerPage: 3, tags: ['kolumny'] }),
  T({ type: 'columns_3', label: '3 kolumny', category: 'layout', purpose: 'Trzy równoległe kategorie lub etapy.', roles: ['classification', 'applications', 'comparison'], renderable: true, required: ['content', 'toggleDetails'], convention: 'toggleDetails = „kolumna 2|kolumna 3"', maxPerPage: 2, tags: ['kolumny'] }),
  T({ type: 'card', label: 'Karta', category: 'layout', purpose: 'Samodzielny, wyróżniony fragment (np. definicja pojęcia).', roles: ['definition', 'facts', 'people', 'applications', 'generic'], renderable: true, required: ['content', 'toggleDetails'], convention: 'content = tytuł karty, toggleDetails = treść', maxPerPage: 6, tags: ['karta', 'pojęcie'] }),

  // ----- Interakcja
  T({ type: 'button', label: 'Przycisk', category: 'interactive', purpose: 'Przejście do powiązanej strony lub zewnętrznego zasobu.', roles: ['intro', 'sources', 'review', 'generic'], renderable: true, required: ['content', 'buttonUrl'], interactive: true, maxPerPage: 4, tags: ['link', 'nawigacja'] }),
  T({ type: 'ai_prompt', label: 'Prompt AI', category: 'interactive', purpose: 'Pole do zadania pytania AI wewnątrz dokumentu.', roles: ['review', 'generic'], renderable: true, required: ['content'], interactive: true, maxPerPage: 1, tags: ['ai'] }),
  T({ type: 'signature', label: 'Podpis', category: 'interactive', purpose: 'Akceptacja dokumentu.', roles: ['review'], renderable: true, required: ['content'], tags: ['podpis'] }),
  T({ type: 'user_mention', label: 'Osoba', category: 'interactive', purpose: 'Wizytówka osoby powiązanej z dokumentem.', roles: ['people'], renderable: true, required: ['mentionUser'], tags: ['osoba'] }),

  // ----- Typy zadeklarowane w modelu, ale BEZ renderera w edytorze – tylko fallbacki
  T({ type: 'user_story', label: 'User story', category: 'reference', purpose: 'Historyjka użytkownika (brak renderera).', roles: ['techniques'], renderable: false, fallback: 'card', required: ['userStoryData'], tags: ['user story'] }),
  T({ type: 'math_equation_card', label: 'Karta równania', category: 'reference', purpose: 'Wzór z objaśnieniem (brak renderera).', roles: ['mechanism'], renderable: false, fallback: 'math', required: ['content'], tags: ['wzór'] }),
  T({ type: 'stepper', label: 'Stepper', category: 'reference', purpose: 'Proces krok po kroku (brak renderera).', roles: ['mechanism'], renderable: false, fallback: 'number', required: ['stepperData'], tags: ['kroki'] }),
  T({ type: 'pros_cons_matrix', label: 'Macierz plusów i minusów', category: 'reference', purpose: 'Rozszerzone za/przeciw (brak renderera).', roles: ['comparison'], renderable: false, fallback: 'pros_cons', required: ['content'], tags: ['za', 'przeciw'] }),
  T({ type: 'interactive_poll', label: 'Interaktywna ankieta', category: 'reference', purpose: 'Ankieta (brak renderera).', roles: ['review'], renderable: false, fallback: 'poll', required: ['content'], tags: ['ankieta'] }),
  T({ type: 'embed_figma', label: 'Figma', category: 'reference', purpose: 'Osadzenie Figma (brak renderera).', roles: ['media'], renderable: false, fallback: 'embed', required: ['embedUrl'], tags: ['figma'] }),
  T({ type: 'team_directory', label: 'Katalog zespołu', category: 'reference', purpose: 'Lista osób (brak renderera).', roles: ['people'], renderable: false, fallback: 'bullet', required: ['teamMembers'], tags: ['zespół'] }),
  T({ type: 'persona_card', label: 'Persona', category: 'reference', purpose: 'Profil persony (brak renderera).', roles: ['people'], renderable: false, fallback: 'card', required: ['personaData'], tags: ['persona'] }),
  T({ type: 'release_notes', label: 'Release notes', category: 'reference', purpose: 'Notatki wydania (brak renderera).', roles: ['timeline'], renderable: false, fallback: 'changelog', required: ['content'], tags: ['wydanie'] }),
  T({ type: 'data_metric_bar', label: 'Pasek metryki', category: 'reference', purpose: 'Pasek wskaźnika (brak renderera).', roles: ['facts'], renderable: false, fallback: 'progress', required: ['content'], tags: ['metryka'] }),
];

const SPEC_INDEX: Map<BlockType, BlockSpec> = new Map(BLOCK_SPECS.map((s) => [s.type, s]));

export function getBlockSpec(type: BlockType): BlockSpec | undefined {
  return SPEC_INDEX.get(type);
}

export function allBlockTypes(): BlockType[] {
  return BLOCK_SPECS.map((s) => s.type);
}

export function renderableBlockTypes(): BlockType[] {
  return BLOCK_SPECS.filter((s) => s.renderable).map((s) => s.type);
}

export function isRenderable(type: BlockType): boolean {
  return SPEC_INDEX.get(type)?.renderable ?? false;
}

/** Zwraca typ, który można bezpiecznie wyrenderować (zastępuje typy bez renderera). */
export function resolveRenderableType(type: BlockType): BlockType {
  const spec = SPEC_INDEX.get(type);
  if (!spec) return 'p';
  if (spec.renderable) return type;
  return spec.fallback && isRenderable(spec.fallback) ? spec.fallback : 'p';
}

/** Typy pasujące do roli sekcji (tylko renderowalne), posortowane wg kategorii. */
export function blocksForRole(role: SectionRole): BlockSpec[] {
  return BLOCK_SPECS.filter((s) => s.renderable && s.roles.includes(role));
}

export function describeCatalog(): { total: number; renderable: number; withoutRenderer: BlockType[]; byCategory: Record<string, number> } {
  const byCategory: Record<string, number> = {};
  BLOCK_SPECS.forEach((s) => {
    byCategory[s.category] = (byCategory[s.category] || 0) + 1;
  });
  return {
    total: BLOCK_SPECS.length,
    renderable: BLOCK_SPECS.filter((s) => s.renderable).length,
    withoutRenderer: BLOCK_SPECS.filter((s) => !s.renderable).map((s) => s.type),
    byCategory,
  };
}

// ---------------------------------------------------------------------------
// Walidacja pojedynczego bloku
// ---------------------------------------------------------------------------

function isEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value as object).length === 0;
  return false;
}

/** Pola, których brak nie czyni bloku niepoprawnym, mimo że są w `required`. */
const OPTIONAL_CONTENT_TYPES = new Set<BlockType>([
  'image', 'divider', 'spacer', 'faq', 'video', 'audio', 'embed', 'map', 'mermaid', 'file', 'file_card', 'bookmark',
  'stat_grid', 'table', 'announcement_banner', 'countdown', 'embed_github', 'event_schedule', 'user_mention',
  'citation_source', 'spec_table', 'kpi_scorecard', 'swot_analysis', 'risk_register', 'milestone_roadmap',
  'decision_matrix', 'before_after', 'kanban_board', 'target_meter', 'changelog', 'api_endpoint', 'code_sandbox',
  'audio_memo', 'chart', 'linked_database',
]);

const URL_FIELDS: Array<keyof DocBlock> = ['imageUrl', 'videoUrl', 'audioUrl', 'bookmarkUrl', 'buttonUrl', 'fileUrl', 'embedUrl'];

export function isSafeUrl(value: unknown, allowInternal = false): boolean {
  if (typeof value !== 'string' || !value.trim()) return false;
  const v = value.trim();
  if (allowInternal && (v.startsWith('#page:') || v.startsWith('page:'))) return true;
  try {
    const u = new URL(v);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

export function validateBlockShape(block: DocBlock): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const spec = SPEC_INDEX.get(block.type);
  const base = { blockId: block.id, blockType: block.type };
  if (!spec) {
    issues.push({ severity: 'error', code: 'unknown_type', message: `Nieznany typ bloku: ${String(block.type)}`, ...base });
    return issues;
  }
  if (!spec.renderable) {
    issues.push({ severity: 'warning', code: 'no_renderer', message: `Typ „${block.type}" nie ma renderera w edytorze – zastosowano zamiennik „${spec.fallback || 'p'}".`, ...base });
  }
  if (!block.id) issues.push({ severity: 'error', code: 'missing_id', message: 'Blok bez identyfikatora.', ...base });

  for (const field of spec.required) {
    const value = (block as unknown as Record<string, unknown>)[field as string];
    if (isEmptyValue(value)) {
      if (field === 'content' && OPTIONAL_CONTENT_TYPES.has(block.type)) continue;
      issues.push({ severity: 'error', code: 'missing_field', message: `Blok „${block.type}" wymaga pola „${String(field)}".`, ...base });
    }
  }

  for (const field of URL_FIELDS) {
    const v = (block as unknown as Record<string, unknown>)[field as string];
    if (typeof v === 'string' && v.trim() && !isSafeUrl(v, field === 'buttonUrl' || field === 'bookmarkUrl')) {
      issues.push({ severity: 'error', code: 'bad_url', message: `Niepoprawny lub niebezpieczny adres w polu „${String(field)}".`, ...base });
    }
  }

  switch (block.type) {
    case 'table': {
      const rows = block.tableData || [];
      if (rows.length > 0) {
        const width = rows[0].length;
        if (width < 2) issues.push({ severity: 'error', code: 'table_width', message: 'Tabela musi mieć co najmniej 2 kolumny.', ...base });
        if (rows.some((r) => r.length !== width)) issues.push({ severity: 'error', code: 'table_ragged', message: 'Wiersze tabeli mają różną liczbę kolumn.', ...base });
        if (rows.length < 2) issues.push({ severity: 'warning', code: 'table_short', message: 'Tabela bez wierszy danych.', ...base });
      }
      break;
    }
    case 'stat_grid': {
      const parts = (block.content || '').split('|').length;
      const vals = (block.statValue || '').split('|').length;
      if (parts !== vals) issues.push({ severity: 'error', code: 'stat_grid_mismatch', message: 'Etykiety i wartości statystyk mają różną liczbę elementów.', ...base });
      break;
    }
    case 'tabs': {
      const titles = (block.content || '').split('|').length;
      const bodies = (block.toggleDetails || '').split('|').length;
      if (titles !== bodies) issues.push({ severity: 'error', code: 'tabs_mismatch', message: 'Liczba zakładek nie zgadza się z liczbą treści.', ...base });
      break;
    }
    case 'progress':
      if (typeof block.progressPercent === 'number' && (block.progressPercent < 0 || block.progressPercent > 100)) {
        issues.push({ severity: 'error', code: 'progress_range', message: 'Postęp musi mieścić się w zakresie 0–100.', ...base });
      }
      break;
    case 'rating':
      if (typeof block.ratingStars === 'number' && (block.ratingStars < 1 || block.ratingStars > 5)) {
        issues.push({ severity: 'error', code: 'rating_range', message: 'Ocena musi mieścić się w zakresie 1–5.', ...base });
      }
      break;
    case 'mermaid': {
      const syntax = (block.diagramSyntax || '').trim();
      if (syntax && !/^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|mindmap|gantt|pie|timeline)/m.test(syntax)) {
        issues.push({ severity: 'error', code: 'mermaid_syntax', message: 'Składnia diagramu musi zaczynać się od typu (np. graph TD).', ...base });
      }
      break;
    }
    case 'faq':
      if (Array.isArray(block.faqItems) && block.faqItems.some((f) => !f.question?.trim() || !f.answer?.trim())) {
        issues.push({ severity: 'error', code: 'faq_item_empty', message: 'Pozycje FAQ muszą mieć pytanie i odpowiedź.', ...base });
      }
      break;
    case 'pros_cons':
      if (block.content && !/^\s*\+/m.test(block.content)) issues.push({ severity: 'warning', code: 'pros_no_plus', message: 'Zalety powinny zaczynać się od „+".', ...base });
      if (block.toggleDetails && !/^\s*-/m.test(block.toggleDetails)) issues.push({ severity: 'warning', code: 'cons_no_minus', message: 'Wady powinny zaczynać się od „-".', ...base });
      break;
    case 'timeline':
      if (!block.timelineDate) issues.push({ severity: 'error', code: 'timeline_no_date', message: 'Blok osi czasu wymaga daty.', ...base });
      break;
    case 'video':
      if (block.videoUrl && !/(youtube\.com|youtu\.be|vimeo\.com|\.mp4($|\?))/i.test(block.videoUrl)) {
        issues.push({ severity: 'warning', code: 'video_host', message: 'Adres wideo nie wygląda na YouTube/Vimeo/MP4.', ...base });
      }
      break;
    default:
      break;
  }

  if ((block.content || '').length > 12000) {
    issues.push({ severity: 'warning', code: 'content_too_long', message: 'Blok zawiera bardzo długi tekst – podziel go na akapity.', ...base });
  }
  return issues;
}
