/**
 * Serwis Wysyłania Zaproszeń do Zespołu przez E-mail (Team Email Invite Service)
 * Generuje unikalne linki dołączania oraz przygotowuje i uruchamia natychmiastowe
 * wysłanie wiadomości e-mail (mailto: protocol + Web Share API).
 * Działa w 100% w każdej przeglądarce i systemie (Windows, macOS, iOS, Android).
 */

export interface TeamInviteEmailPayload {
  email: string;
  teamName: string;
  inviterName: string;
  inviteId: string;
  teamId: string;
  role?: string;
}

/**
 * Generuje bezwzględny unikalny link dołączenia do zespołu
 */
export function buildTeamInviteJoinUrl(
  inviteIdOrPayload: string | { inviteId: string; teamId: string; teamName?: string; role?: string; email?: string },
  teamId?: string,
  teamName?: string,
  role?: string
): string {
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://searchpoint.pl';
  const params = new URLSearchParams();

  if (typeof inviteIdOrPayload === 'object') {
    params.set('invite', inviteIdOrPayload.inviteId);
    params.set('team', inviteIdOrPayload.teamId);
    if (inviteIdOrPayload.teamName) params.set('team_name', inviteIdOrPayload.teamName);
    if (inviteIdOrPayload.role) params.set('role', inviteIdOrPayload.role);
    if (inviteIdOrPayload.email) params.set('email', inviteIdOrPayload.email);
  } else {
    params.set('invite', inviteIdOrPayload);
    if (teamId) params.set('team', teamId);
    if (teamName) params.set('team_name', teamName);
    if (role) params.set('role', role);
  }

  return `${base}/?${params.toString()}`;
}

/**
 * Parsuje parametry zaproszenia ze stringa URL
 */
export function parseTeamInviteQuery(searchQuery: string): {
  inviteId: string | null;
  teamId: string | null;
  teamName: string | null;
  role: string | null;
  email: string | null;
} {
  const search = searchQuery.startsWith('?') ? searchQuery.slice(1) : searchQuery;
  const params = new URLSearchParams(search);
  return {
    inviteId: params.get('invite') || params.get('team_invite') || params.get('join_team'),
    teamId: params.get('team') || params.get('teamId') || params.get('team_invite'),
    teamName: params.get('team_name') || params.get('name'),
    role: params.get('role'),
    email: params.get('email'),
  };
}

/**
 * Generuje link mailto: z tematem i profesjonalną treścią zaproszenia
 */
export function generateTeamInviteMailto(payload: TeamInviteEmailPayload): string {
  const { email, teamName, inviterName, inviteId, teamId, role } = payload;
  const joinUrl = buildTeamInviteJoinUrl(inviteId, teamId, teamName, role);

  const subject = `Zaproszenie do zespołu "${teamName}" w SearchPoint Studio`;
  const body = `Cześć!

${inviterName || 'Twój współpracownik'} zaprasza Cię do dołączenia do zespołu "${teamName}" w aplikacji SearchPoint Studio.

Zyskasz natychmiastowy dostęp do:
• Wspólnych notatek, dokumentacji i bazy wiedzy (ponad 50 modularnych bloków)
• Tablicy zadań Kanban oraz sprintów projektowych
• Pokojów zespołów i asystenta AI

👉 Kliknij w poniższy link, aby zaakceptować zaproszenie i dołączyć:
${joinUrl}

Do zobaczenia w zespole!
Zespół SearchPoint Studio`;

  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Uruchamia domyślnego klienta poczty e-mail (Gmail, Outlook, Apple Mail, Thunderbird itp.)
 */
export function triggerSendInviteEmail(payload: TeamInviteEmailPayload): void {
  const mailtoUrl = generateTeamInviteMailto(payload);
  const anchor = document.createElement('a');
  anchor.href = mailtoUrl;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

/**
 * Próba udostępnienia przez natywne menu udostępniania (Web Share API) lub schowek
 */
export async function shareOrCopyInvite(payload: TeamInviteEmailPayload): Promise<{ shared: boolean; copied: boolean }> {
  const joinUrl = buildTeamInviteJoinUrl(payload);
  const shareData = {
    title: `Dołącz do zespołu ${payload.teamName}`,
    text: `${payload.inviterName} zaprasza Cię do zespołu "${payload.teamName}" w SearchPoint Studio:`,
    url: joinUrl,
  };

  if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData);
      return { shared: true, copied: false };
    } catch {
      // User cancelled or failed -> fallback to clipboard
    }
  }

  await navigator.clipboard.writeText(joinUrl);
  return { shared: false, copied: true };
}
