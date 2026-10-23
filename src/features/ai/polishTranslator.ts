/**
 * Profesjonalny Silnik Tłumaczeń i Lokalizacji dla Studio AI Copilot
 * Obsługuje darmowe API Google Translate w locie, tłumaczenia Gemini 2.5
 * oraz deterministyczną macierz leksykalną offline.
 */

import { DocBlock } from '../../types/workspace';
import { callGemini, getGeminiApiKey } from './geminiService';

export type SupportedLanguage = 'en' | 'de' | 'es' | 'fr' | 'pl' | 'it' | 'uk';

export const LANGUAGE_NAMES: Record<SupportedLanguage, { name: string; flag: string; nativeName: string }> = {
  pl: { name: 'Polski', flag: '🇵🇱', nativeName: 'Język polski' },
  en: { name: 'Angielski', flag: '🇬🇧', nativeName: 'English' },
  de: { name: 'Niemiecki', flag: '🇩🇪', nativeName: 'Deutsch' },
  es: { name: 'Hiszpański', flag: '🇪🇸', nativeName: 'Español' },
  fr: { name: 'Francuski', flag: '🇫🇷', nativeName: 'Français' },
  it: { name: 'Włoski', flag: '🇮🇹', nativeName: 'Italiano' },
  uk: { name: 'Ukraiński', flag: '🇺🇦', nativeName: 'Українська' },
};

// Słownik podstawowych terminów dokumentacji i interfejsu (Offline Fallback)
const OFFLINE_DICTIONARY: Record<string, Partial<Record<SupportedLanguage, string>>> = {
  'nowy dokument': { pl: 'Nowy dokument', en: 'New document', de: 'Neues Dokument', es: 'Nuevo documento', fr: 'Nouveau document' },
  'wprowadzenie': { pl: 'Wprowadzenie', en: 'Introduction', de: 'Einführung', es: 'Introducción', fr: 'Introduction' },
  'cele projektu': { pl: 'Cele projektu', en: 'Project Goals', de: 'Projektziele', es: 'Objetivos del proyecto', fr: 'Objectifs du projet' },
  'podsumowanie': { pl: 'Podsumowanie', en: 'Summary', de: 'Zusammenfassung', es: 'Resumen', fr: 'Résumé' },
  'zadania do wykonania': { pl: 'Zadania do wykonania', en: 'Action Items / Tasks', de: 'Aufgaben / To-Dos', es: 'Tareas pendientes', fr: 'Tâches à accomplir' },
  'harmonogram': { pl: 'Harmonogram i kamienie milowe', en: 'Timeline and Milestones', de: 'Zeitplan und Meilensteine', es: 'Cronograma e hitos', fr: 'Calendrier et jalons' },
  'zakres prac': { pl: 'Zakres prac (Scope of Work)', en: 'Scope of Work', de: 'Arbeitsumfang', es: 'Alcance del trabajo', fr: 'Étendue des travaux' },
  'specyfikacja techniczna': { pl: 'Specyfikacja techniczna', en: 'Technical Specification', de: 'Technische Spezifikation', es: 'Especificación técnica', fr: 'Spécification technique' },
  'analiza ryzyka': { pl: 'Analiza ryzyka', en: 'Risk Analysis', de: 'Risikoanalyse', es: 'Análisis de riesgos', fr: 'Analyse des risques' },
  'zespół projektowy': { pl: 'Zespół projektowy', en: 'Project Team', de: 'Projektteam', es: 'Equipo del proyecto', fr: 'Équipe du projet' },
  'kontakt': { pl: 'Kontakt i wsparcie', en: 'Contact and Support', de: 'Kontakt und Unterstützung', es: 'Contacto y soporte', fr: 'Contact et assistance' },
  'przejdź do strony': { pl: 'Przejdź do strony', en: 'Visit page', de: 'Seite besuchen', es: 'Ir a la página', fr: 'Visiter la page' },
  'pobierz plik': { pl: 'Pobierz plik', en: 'Download file', de: 'Datei herunterladen', es: 'Descargar archivo', fr: 'Télécharger le fichier' },
  'akceptuję ofertę': { pl: 'Akceptuję ofertę', en: 'I accept the offer', de: 'Ich nehme das Angebot an', es: 'Acepto la oferta', fr: "J'accepte l'offre" },
  'gotowe': { pl: 'Gotowe', en: 'Done / Completed', de: 'Erledigt', es: 'Completado', fr: 'Terminé' },
  'w trakcie': { pl: 'W trakcie realizacji', en: 'In progress', de: 'In Bearbeitung', es: 'En progreso', fr: 'En cours' },
  'sukces': { pl: 'Sukces', en: 'Success', de: 'Erfolg', es: 'Éxito', fr: 'Succès' },
  'uwaga': { pl: 'Uwaga / Ostrzeżenie', en: 'Notice / Warning', de: 'Hinweis / Warnung', es: 'Aviso / Advertencia', fr: 'Avis / Avertissement' },
  'wskazówka': { pl: 'Wskazówka', en: 'Tip', de: 'Tipp', es: 'Consejo', fr: 'Conseil' },
};

/**
 * Tłumaczy tekst przy użyciu darmowego silnika Google Translate API (gtx)
 */
export async function translateFreeWithGoogle(
  text: string,
  targetLang: string,
  sourceLang: string = 'auto'
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return '';

  try {
    const encoded = encodeURIComponent(trimmed);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encoded}`;

    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0]
          .map((item: any) => (item && item[0] ? String(item[0]) : ''))
          .join('');
        if (translated.trim()) {
          return translated.trim();
        }
      }
    }
  } catch (err) {
    console.warn('Google Free Translate API network error:', err);
  }

  return '';
}

/**
 * Tłumaczy pojedynczy fragment tekstu na docelowy język
 */
export async function translateSingleText(
  text: string,
  targetLang: SupportedLanguage
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return '';

  // 1. Jeśli dostępny jest klucz Gemini, spróbuj Gemini 2.5
  const apiKey = getGeminiApiKey();
  if (apiKey) {
    try {
      const prompt = `Jesteś ekspertem tłumaczeń technicznych i biznesowych. Przetłumacz poniższy tekst na język: ${LANGUAGE_NAMES[targetLang]?.name || targetLang}.
Zachowaj wszelkie formatowanie Markdown, emotikony, linki i nazwy własne. Zwróć WYŁĄCZNIE przetłumaczony tekst bez komentarzy:

${trimmed}`;
      const res = await callGemini(prompt);
      if (res && res.trim()) {
        return res.trim();
      }
    } catch (e) {
      console.warn('Gemini translation failed, switching to free translation API:', e);
    }
  }

  // 2. Darmowe API Google Translate (błyskawiczne i nie wymaga klucza)
  const freeResult = await translateFreeWithGoogle(trimmed, targetLang);
  if (freeResult) {
    return freeResult;
  }

  // 3. Tryb deterministyczny / offline ze słownika
  const lower = trimmed.toLowerCase();
  for (const [key, translations] of Object.entries(OFFLINE_DICTIONARY)) {
    if (lower === key || lower.includes(key)) {
      const match = translations[targetLang];
      if (match) return match;
    }
  }

  // 4. Podstawowe reguły konwersji offline dla typowych nagłówków
  if (targetLang === 'en') {
    return trimmed
      .replace(/Wstęp|Wprowadzenie/gi, 'Introduction')
      .replace(/Podsumowanie/gi, 'Summary')
      .replace(/Zadania/gi, 'Tasks')
      .replace(/Oferta/gi, 'Offer')
      .replace(/Wycena/gi, 'Pricing')
      .replace(/Witaj/gi, 'Welcome')
      .replace(/Przejdź do/gi, 'Go to')
      .replace(/Pobierz/gi, 'Download')
      .replace(/Krok/gi, 'Step');
  }

  if (targetLang === 'de') {
    return trimmed
      .replace(/Wstęp|Wprowadzenie/gi, 'Einführung')
      .replace(/Podsumowanie/gi, 'Zusammenfassung')
      .replace(/Zadania/gi, 'Aufgaben')
      .replace(/Oferta/gi, 'Angebot')
      .replace(/Wycena/gi, 'Preise')
      .replace(/Witaj/gi, 'Willkommen')
      .replace(/Przejdź do/gi, 'Gehe zu')
      .replace(/Pobierz/gi, 'Herunterladen')
      .replace(/Krok/gi, 'Schritt');
  }

  if (targetLang === 'es') {
    return trimmed
      .replace(/Wstęp|Wprowadzenie/gi, 'Introducción')
      .replace(/Podsumowanie/gi, 'Resumen')
      .replace(/Zadania/gi, 'Tareas')
      .replace(/Oferta/gi, 'Oferta')
      .replace(/Wycena/gi, 'Precios')
      .replace(/Witaj/gi, 'Bienvenido')
      .replace(/Przejdź do/gi, 'Ir a')
      .replace(/Pobierz/gi, 'Descargar')
      .replace(/Krok/gi, 'Paso');
  }

  if (targetLang === 'fr') {
    return trimmed
      .replace(/Wstęp|Wprowadzenie/gi, 'Introduction')
      .replace(/Podsumowanie/gi, 'Résumé')
      .replace(/Zadania/gi, 'Tâches')
      .replace(/Oferta/gi, 'Offre')
      .replace(/Wycena/gi, 'Tarification')
      .replace(/Witaj/gi, 'Bienvenue')
      .replace(/Przejdź do/gi, 'Aller à')
      .replace(/Pobierz/gi, 'Télécharger')
      .replace(/Krok/gi, 'Étape');
  }

  return trimmed;
}

/**
 * Tłumaczy całą listę bloków dokumentu na język docelowy
 */
export async function translateDocumentBlocks(
  blocks: DocBlock[],
  targetLang: SupportedLanguage
): Promise<DocBlock[]> {
  const translatedBlocks: DocBlock[] = [];

  for (const b of blocks) {
    const copy = { ...b };
    if (b.content) {
      copy.content = await translateSingleText(b.content, targetLang);
    }
    if (b.fileName) {
      copy.fileName = await translateSingleText(b.fileName, targetLang);
    }
    if (b.imageCaption) {
      copy.imageCaption = await translateSingleText(b.imageCaption, targetLang);
    }
    if (b.timelineDate) {
      copy.timelineDate = await translateSingleText(b.timelineDate, targetLang);
    }
    translatedBlocks.push(copy);
  }

  return translatedBlocks;
}
