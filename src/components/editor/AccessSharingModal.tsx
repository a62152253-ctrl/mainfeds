import React, { useState, useId } from 'react';
import {
  Users,
  Shield,
  Check,
  X,
  Copy,
  Globe,
  Trash2,
  ChevronDown,
  Lock,
  Eye,
  MessageSquare,
  Edit3,
  ShieldCheck,
  AlertCircle,
  Link as LinkIcon,
  CornerDownRight,
} from 'lucide-react';
import {
  WorkspacePage,
  NotionAccessRole,
  isValidRfcEmail,
  normalizeAccessRole,
  SharedCollaborator,
} from '../../types/workspace';
import {
  isValidShareTarget,
  isWorkspaceWideShareDirective,
} from '../../features/sharing/sharingService';

interface AccessSharingModalProps {
  page: WorkspacePage;
  parentPage?: WorkspacePage;
  isOpen: boolean;
  onClose: () => void;
  onShareWithEmail: (email: string, role: NotionAccessRole) => Promise<void>;
  onUpdateRole: (email: string, role: NotionAccessRole) => Promise<void>;
  onRemoveCollaborator: (email: string) => Promise<void>;
  onTogglePublic: () => void;
  onToggleInheritPermissions?: (inherit: boolean) => void;
}

const ROLE_DEFINITIONS: Record<
  NotionAccessRole,
  { label: string; description: string; icon: React.ReactNode; badgeClass: string }
> = {
  full_access: {
    label: 'Full access',
    description: 'Pełny dostęp: edycja bloków, zarządzanie podstronami i udostępnianiem',
    icon: <ShieldCheck size={14} className="text-blue-600 dark:text-blue-400" />,
    badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  can_edit: {
    label: 'Can edit',
    description: 'Może edytować treść i dodawać bloki (brak prawa do usuwania i udostępniania)',
    icon: <Edit3 size={14} className="text-emerald-600 dark:text-emerald-400" />,
    badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  can_comment: {
    label: 'Can comment',
    description: 'Może przeglądać stronę i dodawać komentarze do bloków',
    icon: <MessageSquare size={14} className="text-amber-600 dark:text-amber-400" />,
    badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  can_view: {
    label: 'Can view',
    description: 'Tylko odczyt (brak możliwości edycji i komentowania)',
    icon: <Eye size={14} className="text-zinc-600 dark:text-zinc-400" />,
    badgeClass: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
  },
};

export const AccessSharingModal: React.FC<AccessSharingModalProps> = ({
  page,
  parentPage,
  isOpen,
  onClose,
  onShareWithEmail,
  onUpdateRole,
  onRemoveCollaborator,
  onTogglePublic,
  onToggleInheritPermissions,
}) => {
  const emailInputId = useId();
  const [emailInput, setEmailInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<NotionAccessRole>('can_edit');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isRolePickerOpen, setIsRolePickerOpen] = useState(false);
  const [activeEditingEmail, setActiveEditingEmail] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEmailChange = (val: string) => {
    setEmailInput(val);
    if (!val.trim()) {
      setValidationError(null);
      return;
    }
    if (!isValidShareTarget(val.trim())) {
      setValidationError(
        'Niepoprawny format adresu e-mail (np. user@gmail.com lub ALL_USER@GMAIAL.COM)'
      );
    } else {
      setValidationError(null);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase().replace(/^_+/, '');

    if (!cleanEmail) {
      setValidationError('Podaj adres e-mail lub dyrektywę ALL_USER@GMAIAL.COM');
      return;
    }

    if (!isValidShareTarget(cleanEmail)) {
      setValidationError(
        'Podaj poprawny adres e-mail zgodny z RFC 5322 lub ALL_USER@GMAIAL.COM'
      );
      return;
    }

    // Sprawdzenie czy użytkownik już ma uprawnienia
    const alreadyShared = (page.sharedCollaborators || []).some(
      (c) => c.email.toLowerCase() === cleanEmail
    );
    if (alreadyShared && !isWorkspaceWideShareDirective(cleanEmail)) {
      setValidationError('Ten użytkownik posiada już dostęp do tej strony');
      return;
    }

    try {
      setIsSubmitting(true);
      setValidationError(null);
      await onShareWithEmail(cleanEmail, selectedRole);
      setEmailInput('');
    } catch (err: any) {
      setValidationError(err?.message || 'Wystąpił błąd podczas nadawania uprawnień');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/#page=${page.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const collaborators: SharedCollaborator[] = (page.sharedCollaborators || []).map((c) => ({
    ...c,
    role: normalizeAccessRole(c.role),
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white dark:bg-[#202020] border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] rounded-[10px] shadow-[rgba(15,15,15,0.1)_0px_0px_0px_1px,rgba(15,15,15,0.2)_0px_5px_20px] overflow-hidden text-[#37352f] dark:text-[#d4d4d4] font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: Title and Close */}
        <div className="px-5 py-3.5 border-b border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] flex items-center justify-between bg-[#fafafa] dark:bg-[#252525]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-[5px] bg-[#2383e2]/10 text-[#2383e2] flex items-center justify-center font-bold text-xs">
              <Users size={14} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#37352f] dark:text-white leading-tight">
                Access & Sharing (Udostępnianie)
              </h3>
              <p className="text-[11px] text-[#787774] dark:text-[#9b9a97]">
                Strona: <span className="font-semibold">{page.title || 'Bez tytułu'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-[4px] text-[#787774] hover:text-[#37352f] dark:hover:text-white hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.06)] transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Inherited Permissions Banner (if page has parent) */}
        {page.parentPageId && parentPage && (
          <div className="px-5 py-2.5 bg-blue-50/60 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/50 flex items-center justify-between text-xs text-blue-900 dark:text-blue-200">
            <div className="flex items-center gap-2">
              <CornerDownRight size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />
              <span>
                Podstrona dziedziczy dostęp z: <strong className="font-semibold">{parentPage.title}</strong>
              </span>
            </div>
            {onToggleInheritPermissions && (
              <button
                type="button"
                onClick={() => onToggleInheritPermissions(!page.inheritPermissions)}
                className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 underline cursor-pointer"
              >
                {page.inheritPermissions ? 'Nadpisz uprawnienia' : 'Przywróć dziedziczenie'}
              </button>
            )}
          </div>
        )}

        <div className="p-5 space-y-4">
          {/* Email Invite Bar */}
          <form onSubmit={handleInviteSubmit} className="space-y-2">
            <label htmlFor={emailInputId} className="block text-[11px] font-semibold text-[#787774] dark:text-[#9b9a97] uppercase tracking-wider">
              Zaproś użytkownika przez email (RFC 5322):
            </label>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  id={emailInputId}
                  type="text"
                  value={emailInput}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="np. user@gmail.com lub ALL_USER@GMAIAL.COM"
                  className={`w-full px-3 py-1.5 bg-[#f7f6f3] dark:bg-[#191919] border rounded-[6px] text-xs text-[#37352f] dark:text-white placeholder-[#9b9a97] focus:outline-none transition-colors ${
                    validationError
                      ? 'border-rose-400 focus:border-rose-500'
                      : 'border-[rgba(55,53,47,0.14)] dark:border-[rgba(255,255,255,0.14)] focus:border-[#2383e2]'
                  }`}
                />
              </div>

              {/* Role Dropdown Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsRolePickerOpen(!isRolePickerOpen)}
                  className="px-2.5 py-1.5 bg-[#f7f6f3] dark:bg-[#191919] border border-[rgba(55,53,47,0.14)] dark:border-[rgba(255,255,255,0.14)] rounded-[6px] text-xs font-medium flex items-center gap-1.5 hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.06)] cursor-pointer"
                >
                  {ROLE_DEFINITIONS[selectedRole].icon}
                  <span>{ROLE_DEFINITIONS[selectedRole].label}</span>
                  <ChevronDown size={12} className="text-[#787774]" />
                </button>

                {isRolePickerOpen && (
                  <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-[#252525] border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] rounded-[8px] shadow-[rgba(15,15,15,0.1)_0px_0px_0px_1px,rgba(15,15,15,0.2)_0px_5px_15px] p-1 z-50 space-y-0.5">
                    {(Object.keys(ROLE_DEFINITIONS) as NotionAccessRole[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          setSelectedRole(r);
                          setIsRolePickerOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-[5px] text-xs transition-colors flex items-start gap-2 cursor-pointer ${
                          selectedRole === r
                            ? 'bg-[#2383e2]/10 text-[#2383e2] font-semibold'
                            : 'hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.06)] text-[#37352f] dark:text-[#d4d4d4]'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">{ROLE_DEFINITIONS[r].icon}</div>
                        <div>
                          <div className="font-semibold text-xs leading-none mb-0.5">
                            {ROLE_DEFINITIONS[r].label}
                          </div>
                          <div className="text-[10px] text-[#787774] dark:text-[#9b9a97] leading-tight">
                            {ROLE_DEFINITIONS[r].description}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !emailInput.trim()}
                className="px-3.5 py-1.5 bg-[#2383e2] hover:bg-[#1d6fc2] disabled:opacity-50 text-white rounded-[6px] text-xs font-semibold cursor-pointer shrink-0 transition-colors shadow-2xs"
              >
                {isSubmitting ? 'Zapisywanie...' : 'Zaproś'}
              </button>
            </div>

            {validationError && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
                <AlertCircle size={12} />
                <span>{validationError}</span>
              </p>
            )}
          </form>

          {/* Collaborators List (Who has access) */}
          <div className="space-y-2 pt-2 border-t border-[rgba(55,53,47,0.06)] dark:border-[rgba(255,255,255,0.06)]">
            <span className="text-[11px] font-semibold text-[#787774] dark:text-[#9b9a97] uppercase tracking-wider block">
              Osoby z dostępem ({collaborators.length + 1}):
            </span>

            {/* Owner Item */}
            <div className="flex items-center justify-between p-2 rounded-[6px] bg-[#fbfbfa] dark:bg-[#252525]/50 border border-[rgba(55,53,47,0.06)] dark:border-[rgba(255,255,255,0.06)] text-xs">
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-6 h-6 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold flex items-center justify-center text-[11px] shrink-0">
                  Ty
                </div>
                <div className="truncate">
                  <div className="font-semibold text-[#37352f] dark:text-white text-xs truncate">
                    Właściciel Workspace
                  </div>
                  <div className="text-[10px] text-[#787774] dark:text-[#9b9a97]">
                    Pełny zarządca dokumentu
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-[4px] border border-blue-200 dark:border-blue-900">
                Full access
              </span>
            </div>

            {/* Collaborators List */}
            {collaborators.length === 0 ? (
              <div className="p-3 bg-[#f7f6f3] dark:bg-[#1b1b1b] rounded-[6px] text-center text-xs text-[#787774] dark:text-[#9b9a97]">
                Notatka jest prywatna. Nikt poza Tobą nie ma do niej dostępu.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {collaborators.map((c) => {
                  const roleDef = ROLE_DEFINITIONS[normalizeAccessRole(c.role)] || ROLE_DEFINITIONS.can_view;
                  const isEditingThis = activeEditingEmail === c.email;

                  return (
                    <div
                      key={c.email}
                      className="flex items-center justify-between p-2 rounded-[6px] bg-[#fbfbfa] dark:bg-[#252525] border border-[rgba(55,53,47,0.06)] dark:border-[rgba(255,255,255,0.06)] text-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 uppercase">
                          {c.email[0]}
                        </div>
                        <div className="truncate">
                          <span className="font-semibold text-[#37352f] dark:text-white truncate block text-xs">
                            {c.email}
                          </span>
                          <span className="text-[10px] text-[#787774] dark:text-[#9b9a97]">
                            Dodano: {new Date(c.addedAt).toLocaleDateString('pl-PL')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Change Role Selector */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveEditingEmail(isEditingThis ? null : c.email)
                            }
                            className={`px-2 py-0.5 rounded-[4px] text-[11px] font-medium border flex items-center gap-1 cursor-pointer transition-colors ${roleDef.badgeClass}`}
                          >
                            <span>{roleDef.label}</span>
                            <ChevronDown size={10} />
                          </button>

                          {isEditingThis && (
                            <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-[#252525] border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] rounded-[6px] shadow-[rgba(15,15,15,0.1)_0px_0px_0px_1px,rgba(15,15,15,0.2)_0px_5px_15px] p-1 z-50 space-y-0.5">
                              {(Object.keys(ROLE_DEFINITIONS) as NotionAccessRole[]).map((r) => (
                                <button
                                  key={r}
                                  type="button"
                                  onClick={async () => {
                                    await onUpdateRole(c.email, r);
                                    setActiveEditingEmail(null);
                                  }}
                                  className={`w-full text-left px-2 py-1 rounded-[4px] text-[11px] transition-colors flex items-center justify-between cursor-pointer ${
                                    c.role === r
                                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold'
                                      : 'hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.06)]'
                                  }`}
                                >
                                  <span>{ROLE_DEFINITIONS[r].label}</span>
                                  {c.role === r && <Check size={11} />}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Remove Access Button */}
                        <button
                          type="button"
                          onClick={() => onRemoveCollaborator(c.email)}
                          title="Cofnij dostęp (Remove access)"
                          className="p-1 rounded-[4px] text-[#787774] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Web Publishing & Link Copying (Share to Web) */}
          <div className="pt-3 border-t border-[rgba(55,53,47,0.06)] dark:border-[rgba(255,255,255,0.06)] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe size={15} className="text-[#787774] dark:text-[#9b9a97]" />
                <div>
                  <div className="text-xs font-semibold text-[#37352f] dark:text-white">
                    Udostępnij w sieci Web (Public Link)
                  </div>
                  <div className="text-[10px] text-[#787774] dark:text-[#9b9a97]">
                    Każdy z linkiem będzie mógł zobaczyć stronę
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onTogglePublic}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  page.isPublic ? 'bg-[#2383e2]' : 'bg-slate-300 dark:bg-zinc-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    page.isPublic ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-1.5 px-3 bg-[#f7f6f3] dark:bg-[#1b1b1b] hover:bg-[rgba(55,53,47,0.08)] dark:hover:bg-[#252525] border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] rounded-[6px] text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check size={13} className="text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      Skopiowano link do schowka!
                    </span>
                  </>
                ) : (
                  <>
                    <Copy size={13} className="text-[#787774]" />
                    <span>Kopiuj link do strony</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
