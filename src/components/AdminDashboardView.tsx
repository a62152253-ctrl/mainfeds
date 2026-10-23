import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Layers,
  AlertTriangle,
  Lock,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Terminal,
  RefreshCw,
  Slash,
  Eye,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { adminService, ManagedUser, AuditLogItem } from '../features/admin/adminService';
import { globalKnowledgeService } from '../features/global-searches/knowledgeCollectionsService';
import { bugReportService } from '../features/global-searches/bugReportService';
import { GlobalKnowledgeCollection, BugReportItem } from '../features/global-searches/types';

export const AdminDashboardView: React.FC = () => {
  const { user } = useAuth();
  const { setActiveView, addNotification } = useWorkspace();

  const isAdmin = adminService.isUserAdmin(user);

  const [activeTab, setActiveTab] = useState<'users' | 'searches' | 'bugs' | 'security'>('users');
  const [usersList, setUsersList] = useState<ManagedUser[]>(() => adminService.getUsers());
  const [collections, setCollections] = useState<GlobalKnowledgeCollection[]>(() =>
    globalKnowledgeService.getAllCollections()
  );
  const [bugReports, setBugReports] = useState<BugReportItem[]>(() =>
    bugReportService.getAllReports()
  );
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(() => adminService.getAuditLogs());
  const [blockedIps, setBlockedIps] = useState<string[]>(() => adminService.getBlockedIps());
  const [newIpToBlock, setNewIpToBlock] = useState('');

  // Access Denied screen if user is not admin
  if (!isAdmin) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center bg-slate-900 text-white p-6 antialiased select-none">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-3xl bg-slate-800/80 border border-slate-700/80 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
            <Lock size={26} />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">403 — Dostęp Zastrzeżony</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Ścieżka <code className="px-1.5 py-0.5 rounded bg-slate-950 font-mono text-rose-300">/sell/sell/admin</code> jest dostępna wyłącznie dla zweryfikowanych administratorów systemu SearchPoint.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setActiveView('home')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs cursor-pointer shadow-sm transition-all"
            >
              Wróć do Workspace
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleToggleUser = (userId: string) => {
    adminService.toggleUserBlock(userId);
    setUsersList(adminService.getUsers());
    addNotification('Zaktualizowano status', 'Status konta użytkownika został pomyślnie zmieniony.', 'info');
  };

  const handleBlockIp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIpToBlock.trim()) return;
    adminService.blockIp(newIpToBlock.trim());
    setBlockedIps(adminService.getBlockedIps());
    setAuditLogs(adminService.getAuditLogs());
    setNewIpToBlock('');
    addNotification('Zablokowano IP', `Adres IP został dodany do czarnej listy.`, 'warning');
  };

  const handleUnblockIp = (ip: string) => {
    adminService.unblockIp(ip);
    setBlockedIps(adminService.getBlockedIps());
    addNotification('Odblokowano IP', `Adres ${ip} usunięty z listy blokad.`, 'info');
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-900 text-slate-100 p-6 lg:p-10 select-none antialiased flex flex-col">
      <div className="max-w-6xl w-full mx-auto space-y-6">
        {/* Top Admin Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shadow-lg">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  Panel Administratora
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 font-mono font-semibold border border-blue-800">
                  /sell/sell/admin
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Centrum zarządzania użytkownikami, zbiorami Global Searches, audytem i zgłoszeniami
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('home')}
              className="px-3.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold cursor-pointer transition-colors"
            >
              Powrót do Workspace
            </button>
          </div>
        </div>

        {/* Quick KPI Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Użytkownicy</span>
              <Users size={14} className="text-blue-400" />
            </div>
            <div className="text-xl font-bold text-white">{usersList.length}</div>
            <p className="text-[10px] text-emerald-400">Wszystkie profile aktywne</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Zbiory Globalne</span>
              <Layers size={14} className="text-indigo-400" />
            </div>
            <div className="text-xl font-bold text-white">{collections.length}</div>
            <p className="text-[10px] text-slate-400">Reuse-First indeks</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Kolejka Zgłoszeń</span>
              <AlertTriangle size={14} className="text-amber-400" />
            </div>
            <div className="text-xl font-bold text-white">{bugReports.length}</div>
            <p className="text-[10px] text-amber-300">Audytowane przez AI</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Blokady IP</span>
              <ShieldAlert size={14} className="text-rose-400" />
            </div>
            <div className="text-xl font-bold text-white">{blockedIps.length}</div>
            <p className="text-[10px] text-slate-400">Aktywne reguły zapory</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-xl font-semibold cursor-pointer transition-colors ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Użytkownicy ({usersList.length})
          </button>
          <button
            onClick={() => setActiveTab('searches')}
            className={`px-3 py-1.5 rounded-xl font-semibold cursor-pointer transition-colors ${
              activeTab === 'searches'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Global Searches ({collections.length})
          </button>
          <button
            onClick={() => setActiveTab('bugs')}
            className={`px-3 py-1.5 rounded-xl font-semibold cursor-pointer transition-colors ${
              activeTab === 'bugs'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Kolejka Błędów ({bugReports.length})
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1.5 rounded-xl font-semibold cursor-pointer transition-colors ${
              activeTab === 'security'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Dziennik Audytowy & IP ({auditLogs.length})
          </button>
        </div>

        {/* TAB 1: USERS */}
        {activeTab === 'users' && (
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-800 text-slate-400 border-b border-slate-700 font-semibold">
                <tr>
                  <th className="p-3">Użytkownik</th>
                  <th className="p-3">Rola</th>
                  <th className="p-3">Profil Workspace</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Działanie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3">
                      <div className="font-semibold text-white">{u.displayName}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold ${
                        u.role === 'admin' ? 'bg-blue-900/60 text-blue-300' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300">{u.profile}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        u.status === 'active'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        <span>{u.status === 'active' ? 'Aktywny' : 'Zablokowany'}</span>
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleToggleUser(u.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors ${
                          u.status === 'active'
                            ? 'bg-rose-900/40 hover:bg-rose-900 text-rose-300 border border-rose-700'
                            : 'bg-emerald-900/40 hover:bg-emerald-900 text-emerald-300 border border-emerald-700'
                        }`}
                      >
                        {u.status === 'active' ? 'Zablokuj' : 'Odblokuj'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: GLOBAL SEARCHES COLLECTIONS */}
        {activeTab === 'searches' && (
          <div className="space-y-3">
            {collections.map((col) => (
              <div
                key={col.id}
                className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-white">{col.topic}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                      {col.category}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      Jakość: {col.qualityScore}%
                    </span>
                  </div>
                  <div className="font-mono text-slate-400 text-[11px]">
                    {col.searchCount} zapytań użytkowników
                  </div>
                </div>

                <p className="text-slate-300 leading-relaxed">{col.summary}</p>

                <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-700/60 flex items-center justify-between">
                  <span>Aliasy: {col.aliases.join(', ')}</span>
                  <span>{col.verifiedClaims.length} zweryfikowanych twierdzeń</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: BUG REPORTS */}
        {activeTab === 'bugs' && (
          <div className="space-y-3">
            {bugReports.length === 0 ? (
              <div className="p-8 text-center text-slate-400 rounded-2xl bg-slate-800/40 border border-slate-800 text-xs">
                Brak oczekujących zgłoszeń błędów.
              </div>
            ) : (
              bugReports.map((report) => (
                <div
                  key={report.id}
                  className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-amber-400">
                      Zgłoszenie: {report.id}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase bg-slate-700 text-slate-300">
                      {report.status}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 italic">
                    „{report.claimText}”
                  </div>

                  <p className="text-slate-400">
                    <strong>Komentarz użytkownika:</strong> {report.userComment}
                  </p>

                  {report.aiVerdict && (
                    <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-900/60 text-blue-200 text-[11px]">
                      <strong>Audytor AI:</strong> {report.aiVerdict}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 4: SECURITY & AUDIT LOGS */}
        {activeTab === 'security' && (
          <div className="space-y-4">
            {/* IP Blocklist Form */}
            <form onSubmit={handleBlockIp} className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center gap-2 text-xs">
              <input
                type="text"
                value={newIpToBlock}
                onChange={(e) => setNewIpToBlock(e.target.value)}
                placeholder="Wpisz adres IP do zablokowania (np. 192.0.2.1)..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!newIpToBlock.trim()}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold cursor-pointer disabled:opacity-40"
              >
                Dodaj blokadę IP
              </button>
            </form>

            {/* Blocked IPs Chips */}
            <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-800 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-semibold text-[11px]">Zablokowane adresy IP:</span>
              {blockedIps.map((ip) => (
                <span
                  key={ip}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950 text-rose-300 border border-rose-800 font-mono text-[11px]"
                >
                  <span>{ip}</span>
                  <button
                    onClick={() => handleUnblockIp(ip)}
                    className="hover:text-white cursor-pointer ml-1"
                    title="Odblokuj"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            {/* Audit Logs Table */}
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-800 text-slate-400 border-b border-slate-700 font-semibold">
                  <tr>
                    <th className="p-3">Czas</th>
                    <th className="p-3">Zdarzenie</th>
                    <th className="p-3">Poziom</th>
                    <th className="p-3">IP źródłowe</th>
                    <th className="p-3">Szczegóły</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40">
                      <td className="p-3 text-slate-400 font-mono text-[11px]">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="p-3 font-semibold text-white">{log.type}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          log.severity === 'critical' || log.severity === 'high'
                            ? 'bg-rose-950 text-rose-300'
                            : log.severity === 'medium'
                            ? 'bg-amber-950 text-amber-300'
                            : 'bg-blue-950 text-blue-300'
                        }`}>
                          {log.severity}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-300 text-[11px]">{log.sourceIp}</td>
                      <td className="p-3 text-slate-300">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
