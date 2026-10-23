import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  CheckCircle2,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Send,
} from 'lucide-react';
import { TeamMember, TeamInvite, TeamRole } from '../../types/workspace';
import {
  triggerSendInviteEmail,
  buildTeamInviteJoinUrl,
} from '../../features/team/teamEmailService';

interface MiniTeamSidecarProps {
  workspaceName: string;
  members: TeamMember[];
  invites: TeamInvite[];
  highlightedEmail?: string;
  onSendInvite?: (email: string, role?: TeamRole) => Promise<void>;
  onNavigateToTeams?: () => void;
}

export const MiniTeamSidecar: React.FC<MiniTeamSidecarProps> = ({
  workspaceName,
  members,
  invites,
  highlightedEmail,
  onSendInvite,
  onNavigateToTeams,
}) => {
  const [newEmail, setNewEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<TeamRole>('Editor');
  const [isSending, setIsSending] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !onSendInvite) return;
    setIsSending(true);
    try {
      await onSendInvite(newEmail.trim(), selectedRole);
      setNewEmail('');
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyInviteLink = () => {
    const firstInv = invites[0];
    const link = firstInv
      ? buildTeamInviteJoinUrl(firstInv.id, firstInv.teamId, workspaceName, firstInv.role)
      : buildTeamInviteJoinUrl(`quick-team`, 'team-searchpoint-core', workspaceName || 'SearchPoint Core Team', 'Editor');
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-slate-200/90 shadow-lg">
      {/* Mini Team Header */}
      <div className="p-3.5 border-b border-slate-200/80 bg-slate-50/70 backdrop-blur-xs flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
            <Users size={14} />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-slate-800 truncate">
              {workspaceName || 'Pokoje Zespołów'}
            </h3>
            <p className="text-[10px] text-slate-400 truncate">
              Live Team Inspector · Komenda @add
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleCopyInviteLink}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Kopiuj link zaproszenia do schowka"
          >
            {copiedLink ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
          </button>
          {onNavigateToTeams && (
            <button
              onClick={onNavigateToTeams}
              className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-semibold cursor-pointer transition-colors shadow-2xs"
              title="Przejdź do pełnego modułu Pokojów Zespołowych"
            >
              <ExternalLink size={11} />
              <span>Widok Teams</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Invite Form */}
      <div className="p-3 border-b border-slate-100 bg-indigo-50/40">
        <form onSubmit={handleInviteSubmit} className="space-y-2">
          <label className="text-[10px] font-bold text-indigo-900 block">
            Szybkie zaproszenie nowego współpracownika (@add):
          </label>
          <div className="flex gap-1.5">
            <div className="relative flex-1">
              <Mail size={12} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="np. kamil@searchpoint.pl"
                className="w-full pl-7 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-400"
              />
            </div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as TeamRole)}
              className="bg-white border border-slate-200 rounded-lg px-2 text-[11px] text-slate-700 font-medium focus:outline-none focus:border-indigo-500"
            >
              <option value="Editor">Edytor</option>
              <option value="Admin">Admin</option>
              <option value="Viewer">Podgląd</option>
            </select>
            <button
              type="submit"
              disabled={isSending || !newEmail.trim()}
              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 shrink-0 shadow-2xs"
            >
              <Send size={11} />
            </button>
          </div>
        </form>
      </div>

      {/* Main Lists: Invites & Members */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Pending Invites Section */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Clock size={11} className="text-amber-500" />
              <span>Oczekujące zaproszenia ({invites.length})</span>
            </span>
          </div>

          {invites.length === 0 && !highlightedEmail ? (
            <p className="text-[11px] text-slate-400 italic py-1">
              Brak oczekujących zaproszeń. Wpisz @add &lt;email&gt; w czacie AI!
            </p>
          ) : (
            <div className="space-y-1.5">
              {/* Highlighted Email if just invited via prompt */}
              {highlightedEmail && !invites.some((i) => i.inviteeEmail.toLowerCase() === highlightedEmail.toLowerCase()) && (
                <div className="p-2.5 bg-amber-50/80 border border-amber-300/80 rounded-xl flex items-center justify-between text-xs animate-in zoom-in-95 duration-150">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                      @
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-[11px] truncate">
                        {highlightedEmail}
                      </p>
                      <p className="text-[9px] text-amber-700">
                        Wysyłanie zaproszenia z AI...
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full shrink-0">
                    Pending
                  </span>
                </div>
              )}

              {invites.map((inv) => {
                const isTarget = highlightedEmail && inv.inviteeEmail.toLowerCase() === highlightedEmail.toLowerCase();
                return (
                  <div
                    key={inv.id}
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                      isTarget
                        ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-400/20 shadow-xs'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                        {inv.inviteeEmail[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 text-[11px] truncate">
                          {inv.inviteeEmail}
                        </p>
                        <p className="text-[9px] text-slate-400">
                          Rola: <span className="font-medium text-slate-600">{inv.role}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          triggerSendInviteEmail({
                            email: inv.inviteeEmail,
                            teamName: workspaceName,
                            inviterName: inv.inviterEmail,
                            inviteId: inv.id,
                            teamId: inv.teamId,
                          })
                        }
                        className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Otwórz klienta poczty i wyślij e-mail z zaproszeniem"
                      >
                        <Mail size={11} />
                        <span>E-mail</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const url = buildTeamInviteJoinUrl(inv.id, inv.teamId);
                          navigator.clipboard.writeText(url);
                        }}
                        className="p-1 hover:bg-slate-100 text-slate-500 rounded-lg text-[10px] transition-colors cursor-pointer"
                        title="Kopiuj link zaproszenia"
                      >
                        <Copy size={11} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Current Members Section */}
        <div>
          <div className="flex items-center justify-between mb-1.5 pt-2 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 size={11} className="text-emerald-500" />
              <span>Członkowie zespołu ({members.length})</span>
            </span>
          </div>

          <div className="space-y-1.5">
            {members.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">Brak członków w tym pokoju.</p>
            ) : (
              members.map((m, idx) => (
                <div
                  key={m.userId || idx}
                  className="p-2 bg-slate-50/80 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                      {(m.name || m.email || 'U')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 text-[11px] truncate">
                        {m.name || m.email.split('@')[0]}
                      </p>
                      <p className="text-[9px] text-slate-400 truncate">{m.email}</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-semibold bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shrink-0">
                    <Shield size={9} className="text-indigo-500" />
                    <span>{m.role}</span>
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Mini Team Footer */}
      <div className="p-2.5 border-t border-slate-200/80 bg-slate-50/70 text-[10px] text-slate-400 flex items-center justify-between shrink-0">
        <span>Uprawnienia oparte na rolach RBAC</span>
        <span>Bezpieczna autoryzacja</span>
      </div>
    </div>
  );
};
