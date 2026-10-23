/**
 * Moduł Bezpiecznego Udostępniania Notatek, Kontroli Dostępu (RBAC) oraz Wzmianek (@ping / #PING#)
 *
 * Spełnia wymagania:
 * 1. Jawna kontrola dostępu oparta o adresy e-mail (RFC 5322):
 *    - Zwykłe wystąpienie adresu e-mail w tekście notatki (np. w cytacie, bibliografii, przykładowym zdaniu)
 *      NIE nadaje automatycznie dostępu!
 *    - Dostęp nadawany jest wyłącznie przez:
 *      a) Okno "Access & Sharing" (Modal udostępniania),
 *      b) Jawną komendę / dyrektywę udostępniania w tekście lub czacie AI:
 *         - `_user@gmail.com` (prefiks podkreślnika przed adresem email)
 *         - `@share user@gmail.com` / `@udostepnij user@gmail.com`
 *         - `#SHARE:user@gmail.com#` lub `#SHARE:user@gmail.com:can_edit#`
 * 2. Specjalna dyrektywa workspace-wide:
 *    - `ALL_USER@GMAIAL.COM` oraz `ALL_USER@GMAIL.COM` (obsługuje również z prefiksem `_ALL_USER@GMAIAL.COM` lub w `#SHARE#`)
 *    - Może zostać użyta wyłącznie przez właściciela (Owner) lub administratora (Admin / full_access).
 *    - Nadaje dostęp na poziomie workspace do wszystkich nieprywatnych notatek w bieżącym workspace,
 *      z możliwością wycofania (revoke) oraz z poszanowaniem stron oznaczonych jako ściśle prywatne (`accessLevel === 'private'`).
 * 3. Wzmianki i pingowanie użytkowników (`@ping user@gmail.com`, `#PING:user@gmail.com#`, `@mention user@gmail.com`):
 *    - Sprawdza, czy wskazany użytkownik ma dostęp do strony (lub czy strona jest współdzielona).
 *    - Tworzy trwałe powiadomienie z linkiem do strony (`pageId`), kategorią `'doc'`, statusem `read: false`
 *      oraz opcjonalnym identyfikatorem bloku.
 */

import {
  WorkspacePage,
  NotionAccessRole,
  SharedCollaborator,
  WorkspaceNotification,
  isValidRfcEmail,
  normalizeAccessRole,
} from '../../types/workspace';

export const WORKSPACE_WIDE_SHARE_DIRECTIVES = [
  'all_user@gmaial.com',
  'all_user@gmail.com',
] as const;

export interface ParsedShareDirective {
  rawMatch: string;
  targetEmail: string;
  isWorkspaceWide: boolean;
  role: NotionAccessRole;
  sourceSyntax: 'underscore_prefix' | 'share_tag' | 'at_share_command' | 'modal';
}

export interface ParsedPingDirective {
  rawMatch: string;
  targetEmail: string;
  message: string;
}

export interface AccessEvaluation {
  hasAccess: boolean;
  effectiveRole: NotionAccessRole | 'owner' | 'none';
  canView: boolean;
  canComment: boolean;
  canEdit: boolean;
  canManageSharing: boolean;
  canDelete: boolean;
  reason: string;
}

/**
 * Sprawdza, czy podany ciąg jest specjalną dyrektywą `ALL_USER@GMAIAL.COM` lub `ALL_USER@GMAIL.COM`
 */
export function isWorkspaceWideShareDirective(emailOrToken: string): boolean {
  if (!emailOrToken || typeof emailOrToken !== 'string') return false;
  const cleaned = emailOrToken.trim().toLowerCase().replace(/^_+/, '');
  return (WORKSPACE_WIDE_SHARE_DIRECTIVES as readonly string[]).includes(cleaned);
}

/**
 * Waliduje cel udostępniania: akceptuje poprawny adres RFC 5322 LUB dyrektywę ALL_USER@GMAIAL.COM
 */
export function isValidShareTarget(emailOrToken: string): boolean {
  if (!emailOrToken || typeof emailOrToken !== 'string') return false;
  const cleaned = emailOrToken.trim().toLowerCase().replace(/^_+/, '');
  if (isWorkspaceWideShareDirective(cleaned)) return true;
  return isValidRfcEmail(cleaned);
}

/**
 * Parsuje JAWNE dyrektywy udostępniania z tekstu bloku lub polecenia AI.
 *
 * UWAGA BEZPIECZEŃSTWA:
 * Zwykły adres e-mail w zdaniu (np. "Kontakt do autora: jan@gmail.com" lub "Źródło: anna@firma.pl")
 * NIE JEST traktowany jako dyrektywa udostępniania!
 *
 * Obsługiwane jawne formaty:
 * 1. `_user@gmail.com` lub `_ALL_USER@GMAIAL.COM` (podkreślnik bezpośrednio przed adresem)
 * 2. `ALL_USER@GMAIAL.COM` / `ALL_USER@GMAIL.COM` (jawny token dyrektywy globalnej)
 * 3. `#SHARE:user@gmail.com#` lub `#SHARE:user@gmail.com:can_edit#` lub `#SHARE#user@gmail.com#SHARE#`
 * 4. `@share user@gmail.com [can_edit|can_view|can_comment|full_access]` lub `@udostepnij user@gmail.com`
 */
export function extractExplicitShareDirectives(text: string): ParsedShareDirective[] {
  if (!text || typeof text !== 'string') return [];

  const results: ParsedShareDirective[] = [];
  const seenTargets = new Set<string>();

  const addDirective = (
    rawMatch: string,
    rawEmail: string,
    role: NotionAccessRole,
    sourceSyntax: ParsedShareDirective['sourceSyntax']
  ) => {
    const cleanEmail = rawEmail.trim().toLowerCase().replace(/^_+/, '');
    const isGlobal = isWorkspaceWideShareDirective(cleanEmail);
    if (!isGlobal && !isValidRfcEmail(cleanEmail)) return;
    if (seenTargets.has(cleanEmail)) return;
    seenTargets.add(cleanEmail);

    results.push({
      rawMatch,
      targetEmail: cleanEmail,
      isWorkspaceWide: isGlobal,
      role,
      sourceSyntax,
    });
  };

  // 1. Tag #SHARE:email:role# lub #SHARE#email|role#SHARE#
  const shareTagInlineRegex =
    /#SHARE:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(?::([a-zA-Z_]+))?#/gi;
  let match: RegExpExecArray | null;
  while ((match = shareTagInlineRegex.exec(text)) !== null) {
    const email = match[1];
    const role = normalizeAccessRole(match[2] || 'can_edit');
    addDirective(match[0], email, role, 'share_tag');
  }

  const shareTagBlockRegex = /#SHARE(?::([a-zA-Z_]+))?#([\s\S]*?)#\/?SHARE#/gi;
  while ((match = shareTagBlockRegex.exec(text)) !== null) {
    const paramRole = match[1];
    const body = (match[2] || '').trim();
    const parts = body.split(/[|\s,]+/).filter(Boolean);
    const email = parts[0] || '';
    const role = normalizeAccessRole(paramRole || parts[1] || 'can_edit');
    addDirective(match[0], email, role, 'share_tag');
  }

  // 2. Komenda @share / @udostepnij / @udostępnij <email> [rola]
  const atShareRegex =
    /(?:^|\s)@(?:share|udostepnij|udostępnij)\s+_?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(?:\s+(full_access|can_edit|can_comment|can_view|admin|editor|viewer))?/gi;
  while ((match = atShareRegex.exec(text)) !== null) {
    const email = match[1];
    const role = normalizeAccessRole(match[2] || 'can_edit');
    addDirective(match[0].trim(), email, role, 'at_share_command');
  }

  // 3. Jawna składnia z prefiksem podkreślnika: `_user@gmail.com` lub `_ALL_USER@GMAIAL.COM`
  // (nie dopasowuje środka innego słowa, np. foo_user@gmail.com)
  const underscoreRegex = /(?:^|[\s([{"'])_([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g;
  while ((match = underscoreRegex.exec(text)) !== null) {
    const email = match[1];
    addDirective(`_${email}`, email, 'can_edit', 'underscore_prefix');
  }

  // 4. Jawna dyrektywa ALL_USER@GMAIAL.COM lub ALL_USER@GMAIL.COM wpisana wielkimi literami / wprost
  const allUserRegex = /\b_?(ALL_USER@GMAIAL\.COM|ALL_USER@GMAIL\.COM)\b/gi;
  while ((match = allUserRegex.exec(text)) !== null) {
    const email = match[1];
    addDirective(match[0], email, 'can_edit', 'underscore_prefix');
  }

  return results;
}

/**
 * Parsuje jawne wzmianki / pingi do współpracowników:
 * - `@ping user@gmail.com [wiadomość]`
 * - `@mention user@gmail.com [wiadomość]`
 * - `#PING:user@gmail.com#wiadomość#PING#` lub `#PING#user@gmail.com | wiadomość#PING#`
 */
export function extractPingDirectives(text: string): ParsedPingDirective[] {
  if (!text || typeof text !== 'string') return [];

  const pings: ParsedPingDirective[] = [];
  const seen = new Set<string>();

  // 1. #PING:email#message#PING# lub #PING#email | message#PING#
  const pingTagRegex = /#PING(?::([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}))?#([\s\S]*?)#\/?PING#/gi;
  let match: RegExpExecArray | null;
  while ((match = pingTagRegex.exec(text)) !== null) {
    const paramEmail = (match[1] || '').trim().toLowerCase();
    const body = (match[2] || '').trim();
    let email = paramEmail;
    let message = body;

    if (!email) {
      const parts = body.split(/\s*\|\s*|\s+—\s+/);
      email = (parts[0] || '').trim().toLowerCase().replace(/^@/, '');
      message = (parts.slice(1).join(' — ') || 'Wspomniano Cię w dokumencie').trim();
    }

    if (isValidRfcEmail(email) && !seen.has(`${email}:${message}`)) {
      seen.add(`${email}:${message}`);
      pings.push({
        rawMatch: match[0],
        targetEmail: email,
        message: message || 'Wspomniano Cię w dokumencie',
      });
    }
  }

  // 2. @ping user@gmail.com [opcjonalna treść do końca linii]
  const atPingRegex =
    /(?:^|\s)@(?:ping|mention|oznacz)\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(?:[ \t]+([^\n#]+))?/gi;
  while ((match = atPingRegex.exec(text)) !== null) {
    const email = (match[1] || '').trim().toLowerCase();
    const message = (match[2] || 'Wspomniano Cię w notatce').trim();
    if (isValidRfcEmail(email) && !seen.has(`${email}:${message}`)) {
      seen.add(`${email}:${message}`);
      pings.push({
        rawMatch: match[0].trim(),
        targetEmail: email,
        message,
      });
    }
  }

  return pings;
}

/**
 * Oblicza efektywne uprawnienia użytkownika (po `userId` i `userEmail`) względem strony `page`
 * z uwzględnieniem dziedziczenia z rodzica (`parentPage`) oraz dyrektywy `ALL_USER@GMAIAL.COM`.
 */
export function evaluatePageAccess(
  page: WorkspacePage,
  user: { uid?: string; email?: string | null } | null,
  allPages?: WorkspacePage[]
): AccessEvaluation {
  const userUid = user?.uid || '';
  const userEmail = (user?.email || '').trim().toLowerCase();

  // 1. Właściciel strony ma zawsze pełny dostęp
  if (
    !page.ownerId ||
    page.ownerId === 'local-user' ||
    (userUid && page.ownerId === userUid)
  ) {
    return {
      hasAccess: true,
      effectiveRole: 'owner',
      canView: true,
      canComment: true,
      canEdit: true,
      canManageSharing: true,
      canDelete: true,
      reason: 'Właściciel dokumentu (Owner)',
    };
  }

  // 2. Sprawdzenie jawnej listy współpracowników na tej stronie
  const collabs = page.sharedCollaborators || [];
  const sharedEmails = (page.sharedWith || []).map((e) => e.toLowerCase());

  if (userEmail) {
    const directCollab = collabs.find((c) => c.email.toLowerCase() === userEmail);
    if (directCollab) {
      const role = normalizeAccessRole(directCollab.role);
      return buildEvaluationFromRole(role, `Bezpośrednie udostępnienie dla ${userEmail}`);
    }

    if (sharedEmails.includes(userEmail)) {
      return buildEvaluationFromRole('can_edit', `Lista współdzielenia dla ${userEmail}`);
    }
  }

  // 3. Sprawdzenie globalnej dyrektywy workspace-wide (ALL_USER@GMAIAL.COM / ALL_USER@GMAIL.COM)
  // Strony ściśle prywatne (permissions.accessLevel === 'private' bez jawnego udostępnienia) nie są otwierane obcym
  const hasWorkspaceWideDirective =
    sharedEmails.some((e) => isWorkspaceWideShareDirective(e)) ||
    collabs.some((c) => isWorkspaceWideShareDirective(c.email));

  if (hasWorkspaceWideDirective && page.permissions?.accessLevel !== 'private') {
    const globalCollab = collabs.find((c) => isWorkspaceWideShareDirective(c.email));
    const role = globalCollab ? normalizeAccessRole(globalCollab.role) : 'can_edit';
    return buildEvaluationFromRole(role, 'Dostęp Workspace-Wide (ALL_USER@GMAIAL.COM)');
  }

  // 4. Dziedziczenie uprawnień ze strony nadrzędnej (jeśli inheritPermissions !== false)
  if (page.parentPageId && page.inheritPermissions !== false && allPages) {
    const parent = allPages.find((p) => p.id === page.parentPageId);
    if (parent) {
      const parentEval = evaluatePageAccess(parent, user, allPages);
      if (parentEval.hasAccess) {
        return {
          ...parentEval,
          reason: `Odziedziczono z "${parent.title}" (${parentEval.reason})`,
        };
      }
    }
  }

  // 5. Strona publiczna (Tylko odczyt dla niezaproszonych użytkowników)
  if (page.isPublic || page.permissions?.accessLevel === 'public') {
    return buildEvaluationFromRole('can_view', 'Strona publiczna (Tylko odczyt)');
  }

  // 6. Brak dostępu
  return {
    hasAccess: false,
    effectiveRole: 'none',
    canView: false,
    canComment: false,
    canEdit: false,
    canManageSharing: false,
    canDelete: false,
    reason: 'Brak uprawnień do tego dokumentu',
  };
}

function buildEvaluationFromRole(role: NotionAccessRole, reason: string): AccessEvaluation {
  switch (role) {
    case 'full_access':
      return {
        hasAccess: true,
        effectiveRole: 'full_access',
        canView: true,
        canComment: true,
        canEdit: true,
        canManageSharing: true,
        canDelete: true,
        reason,
      };
    case 'can_edit':
      return {
        hasAccess: true,
        effectiveRole: 'can_edit',
        canView: true,
        canComment: true,
        canEdit: true,
        canManageSharing: false,
        canDelete: false,
        reason,
      };
    case 'can_comment':
      return {
        hasAccess: true,
        effectiveRole: 'can_comment',
        canView: true,
        canComment: true,
        canEdit: false,
        canManageSharing: false,
        canDelete: false,
        reason,
      };
    case 'can_view':
    default:
      return {
        hasAccess: true,
        effectiveRole: 'can_view',
        canView: true,
        canComment: false,
        canEdit: false,
        canManageSharing: false,
        canDelete: false,
        reason,
      };
  }
}

/**
 * Aplikuje udostępnienie dla pojedynczej strony (lub zestawu stron w przypadku `ALL_USER@GMAIAL.COM`).
 * Weryfikuje, czy użytkownik wykonujący akcję ma prawo zarządzać udostępnianiem (`canManageSharing`).
 */
export function applyShareToWorkspacePages(params: {
  pages: WorkspacePage[];
  targetPageId: string;
  targetEmail: string;
  role?: NotionAccessRole;
  actor: { uid?: string; email?: string | null } | null;
}): {
  updatedPages: WorkspacePage[];
  affectedPageIds: string[];
  isWorkspaceWide: boolean;
  normalizedEmail: string;
  appliedRole: NotionAccessRole;
} {
  const { pages, targetPageId, targetEmail, role = 'can_edit', actor } = params;
  const cleanEmail = targetEmail.trim().toLowerCase().replace(/^_+/, '');
  const isGlobal = isWorkspaceWideShareDirective(cleanEmail);

  if (!isGlobal && !isValidRfcEmail(cleanEmail)) {
    throw new Error(`Niepoprawny adres e-mail lub dyrektywa: "${targetEmail}"`);
  }

  const targetPage = pages.find((p) => p.id === targetPageId);
  if (!targetPage) {
    throw new Error(`Strona o ID "${targetPageId}" nie istnieje.`);
  }

  // Sprawdzenie autoryzacji aktora
  const actorAccess = evaluatePageAccess(targetPage, actor, pages);
  if (!actorAccess.canManageSharing) {
    throw new Error(
      `Brak uprawnień do zarządzania udostępnianiem strony "${targetPage.title}". Wymagana rola Owner lub Full access.`
    );
  }

  const appliedRole = normalizeAccessRole(role);
  const affectedPageIds: string[] = [];
  const now = Date.now();

  const updateSinglePage = (page: WorkspacePage): WorkspacePage => {
    const existingShared = new Set((page.sharedWith || []).map((e) => e.toLowerCase()));
    const finalSharedWith = existingShared.has(cleanEmail)
      ? page.sharedWith || []
      : [...(page.sharedWith || []), cleanEmail];

    const existingCollabs = page.sharedCollaborators || [];
    const alreadyIdx = existingCollabs.findIndex((c) => c.email.toLowerCase() === cleanEmail);

    let finalCollaborators: SharedCollaborator[];
    if (alreadyIdx >= 0) {
      finalCollaborators = existingCollabs.map((c, idx) =>
        idx === alreadyIdx ? { ...c, role: appliedRole } : c
      );
    } else {
      finalCollaborators = [
        ...existingCollabs,
        {
          email: cleanEmail,
          name: isGlobal ? 'Wszyscy członkowie Workspace (ALL_USER)' : cleanEmail.split('@')[0],
          role: appliedRole,
          addedAt: now,
        },
      ];
    }

    affectedPageIds.push(page.id);
    return {
      ...page,
      sharedWith: finalSharedWith,
      sharedCollaborators: finalCollaborators,
      permissions: {
        accessLevel: 'workspace',
        role: page.permissions?.role || 'Owner',
      },
      updatedAt: now,
    };
  };

  const updatedPages = pages.map((page) => {
    if (page.isDeleted) return page;

    if (isGlobal) {
      // ALL_USER@GMAIAL.COM obejmuje stronę docelową oraz wszystkie nieprywatne notatki w tym samym workspace
      const sameWorkspace = (page.workspaceId || 'ws-personal') === (targetPage.workspaceId || 'ws-personal');
      const isStrictlyPrivate =
        page.id !== targetPageId &&
        page.permissions?.accessLevel === 'private' &&
        (page.sharedWith || []).length === 0;

      if (sameWorkspace && !isStrictlyPrivate) {
        return updateSinglePage(page);
      }
      return page;
    }

    if (page.id === targetPageId) {
      return updateSinglePage(page);
    }

    return page;
  });

  return {
    updatedPages,
    affectedPageIds,
    isWorkspaceWide: isGlobal,
    normalizedEmail: cleanEmail,
    appliedRole,
  };
}

/**
 * Wycofuje (revoke) dostęp użytkownika lub dyrektywy `ALL_USER@GMAIAL.COM`.
 */
export function revokeShareFromWorkspacePages(params: {
  pages: WorkspacePage[];
  targetPageId: string;
  targetEmail: string;
  actor: { uid?: string; email?: string | null } | null;
}): {
  updatedPages: WorkspacePage[];
  affectedPageIds: string[];
} {
  const { pages, targetPageId, targetEmail, actor } = params;
  const cleanEmail = targetEmail.trim().toLowerCase().replace(/^_+/, '');
  const isGlobal = isWorkspaceWideShareDirective(cleanEmail);

  const targetPage = pages.find((p) => p.id === targetPageId);
  if (!targetPage) {
    throw new Error(`Strona o ID "${targetPageId}" nie istnieje.`);
  }

  const actorAccess = evaluatePageAccess(targetPage, actor, pages);
  if (!actorAccess.canManageSharing) {
    throw new Error('Brak uprawnień do wycofania udostępnienia tej strony.');
  }

  const affectedPageIds: string[] = [];
  const now = Date.now();

  const updatedPages = pages.map((page) => {
    const shouldRevokeHere = isGlobal
      ? (page.workspaceId || 'ws-personal') === (targetPage.workspaceId || 'ws-personal')
      : page.id === targetPageId;

    if (!shouldRevokeHere) return page;

    const hadEmail =
      (page.sharedWith || []).some((e) => e.toLowerCase() === cleanEmail) ||
      (page.sharedCollaborators || []).some((c) => c.email.toLowerCase() === cleanEmail);

    if (!hadEmail) return page;

    affectedPageIds.push(page.id);
    return {
      ...page,
      sharedWith: (page.sharedWith || []).filter((e) => e.toLowerCase() !== cleanEmail),
      sharedCollaborators: (page.sharedCollaborators || []).filter(
        (c) => c.email.toLowerCase() !== cleanEmail
      ),
      updatedAt: now,
    };
  });

  return {
    updatedPages,
    affectedPageIds,
  };
}

/**
 * Tworzy powiadomienie o wzmiance / pingu dla współpracownika, który ma dostęp do dokumentu.
 */
export function createPingNotification(params: {
  page: WorkspacePage;
  targetEmail: string;
  message?: string;
  senderName?: string;
  allPages?: WorkspacePage[];
}): {
  allowed: boolean;
  notification?: WorkspaceNotification;
  reason?: string;
} {
  const { page, targetEmail, message, senderName = 'Współpracownik', allPages } = params;
  const cleanEmail = targetEmail.trim().toLowerCase();

  if (!isValidRfcEmail(cleanEmail)) {
    return { allowed: false, reason: `Niepoprawny adres e-mail: ${targetEmail}` };
  }

  const targetAccess = evaluatePageAccess(page, { email: cleanEmail }, allPages);
  if (!targetAccess.hasAccess) {
    return {
      allowed: false,
      reason: `Użytkownik ${cleanEmail} nie ma jeszcze dostępu do strony "${page.title}". Udostępnij najpierw stronę (np. _${cleanEmail}).`,
    };
  }

  const notification: WorkspaceNotification = {
    id: `notif-ping-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: `🔔 Wzmianka dla ${cleanEmail} w "${page.title}"`,
    message: `${senderName}: ${message || 'Oznaczono Cię w dokumencie — kliknij, aby otworzyć sekcję.'}`,
    timestamp: Date.now(),
    read: false,
    type: 'info',
    category: 'doc',
    pageId: page.id,
    actionLabel: 'Otwórz dokument',
  };

  return {
    allowed: true,
    notification,
  };
}
