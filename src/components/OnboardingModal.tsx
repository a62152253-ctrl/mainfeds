import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Code2,
  Rocket,
  Building2,
  User,
  Zap,
} from 'lucide-react';
import { UserProfileType } from '../types/workspace';
import { USER_PROFILES } from '../features/profile/userProfileConfig';

interface OnboardingModalProps {
  isOpen: boolean;
  currentProfile: UserProfileType | null;
  onSelectProfile: (profile: UserProfileType) => Promise<void>;
  onClose?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  currentProfile,
  onSelectProfile,
  onClose,
}) => {
  const [selected, setSelected] = useState<UserProfileType>(
    currentProfile || 'Developer'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onSelectProfile(selected);
    } finally {
      setIsSubmitting(false);
    }
  };

  const profileIcons: Record<UserProfileType, React.ReactNode> = {
    Student: <GraduationCap size={20} className="text-[#2383e2]" />,
    Developer: <Code2 size={20} className="text-emerald-500" />,
    Founder: <Rocket size={20} className="text-indigo-500" />,
    'Team / Company': <Building2 size={20} className="text-amber-500" />,
    Personal: <User size={20} className="text-rose-500" />,
    Other: <Zap size={20} className="text-purple-500" />,
  };

  const profileKeys: UserProfileType[] = [
    'Student',
    'Developer',
    'Founder',
    'Team / Company',
    'Personal',
    'Other',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150 font-sans select-none">
      <div className="bg-white dark:bg-[#202020] border border-[rgba(55,53,47,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-[8px] shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh] text-[#37352f] dark:text-[#d4d4d4]">
        {/* Header */}
        <div className="p-6 md:p-7 border-b border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] bg-[#fbfbfa] dark:bg-[#1c1c1c] text-center relative">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] bg-[#2383e2]/10 border border-[#2383e2]/20 text-[#2383e2] text-xs font-medium mb-2.5">
            <Sparkles size={12} />
            <span>Personalizacja Przestrzeni Roboczej</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-[#37352f] dark:text-white tracking-tight">
            Jak chcesz korzystać z Workspace?
          </h2>
          <p className="mt-1.5 text-xs text-[#787774] dark:text-[#9b9a97] max-w-xl mx-auto leading-relaxed">
            Wybierz swój profil, aby automatycznie dostosować początkowy układ, szablony stron i sugestie AI.
          </p>
        </div>

        {/* Profile Cards Grid */}
        <div className="p-5 md:p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3">
          {profileKeys.map((key) => {
            const prof = USER_PROFILES[key];
            const isChosen = selected === key;

            return (
              <div
                key={key}
                onClick={() => setSelected(key)}
                className={`p-3.5 rounded-[6px] border transition-all cursor-pointer text-left relative flex flex-col justify-between ${
                  isChosen
                    ? 'bg-[#2383e2]/5 dark:bg-[#2383e2]/10 border-[#2383e2] shadow-2xs'
                    : 'bg-white dark:bg-[#191919] border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] hover:bg-[rgba(55,53,47,0.03)] dark:hover:bg-[rgba(255,255,255,0.04)]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-[4px] bg-[rgba(55,53,47,0.04)] dark:bg-[rgba(255,255,255,0.06)] flex items-center justify-center">
                      {profileIcons[key]}
                    </div>
                    <span
                      className={`text-[9px] font-medium px-1.5 py-0.2 rounded-[3px] uppercase ${
                        isChosen
                          ? 'bg-[#2383e2] text-white'
                          : 'bg-[rgba(55,53,47,0.06)] dark:bg-[rgba(255,255,255,0.08)] text-[#787774] dark:text-[#9b9a97]'
                      }`}
                    >
                      {prof.badge}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-[#37352f] dark:text-white flex items-center gap-1.5">
                    <span>{prof.title}</span>
                    {isChosen && (
                      <Check size={13} className="text-[#2383e2]" />
                    )}
                  </h3>
                  <p className="text-[11px] text-[#787774] dark:text-[#9b9a97] mt-0.5 line-clamp-1 font-medium">
                    {prof.tagline}
                  </p>
                  <p className="text-[11px] text-[#787774] dark:text-[#9b9a97] mt-1.5 leading-relaxed">
                    {prof.description}
                  </p>
                </div>

                {/* Template tags preview */}
                <div className="mt-3 pt-2 border-t border-[rgba(55,53,47,0.06)] dark:border-[rgba(255,255,255,0.06)] flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-[#787774] dark:text-[#9b9a97]">Szablony:</span>
                  {prof.starterPageTemplates.map((tmpl, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] bg-[rgba(55,53,47,0.06)] dark:bg-[rgba(255,255,255,0.08)] text-[#787774] dark:text-[#9b9a97] px-1.5 py-0.2 rounded-[3px]"
                    >
                      {tmpl.icon} {tmpl.title.split(' ')[0]}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info & CTA */}
        <div className="p-4 md:px-6 border-t border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] bg-[#fbfbfa] dark:bg-[#1c1c1c] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex items-center gap-2 text-[#787774] dark:text-[#9b9a97]">
            <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
            <span>Profil możesz zmienić w dowolnym momencie w Ustawieniach.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-[#787774] dark:text-[#9b9a97] hover:text-[#37352f] dark:hover:text-white rounded-[4px] cursor-pointer"
              >
                Pomiń
              </button>
            )}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirm}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 bg-[#2383e2] hover:bg-[#1d6fc2] text-white rounded-[4px] font-medium text-xs transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Dostosowywanie...' : 'Zatwierdź'}</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
