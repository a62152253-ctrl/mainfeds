import React, { useState } from 'react';
import {
  LayoutTemplate,
  X,
  CheckCircle2,
  Rocket,
  Briefcase,
  Building2,
  Clock,
  Layers,
  Sparkles,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { ADVANCED_TEMPLATES, AdvancedTemplate } from '../features/templates/advancedTemplates';
import { DocBlock } from '../types/workspace';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: AdvancedTemplate, mode: 'replace' | 'append') => void;
  currentBlocksCount: number;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  currentBlocksCount,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('saas_prd_2026');
  const [previewOpen, setPreviewOpen] = useState(false);

  if (!isOpen) return null;

  const templatesList = Object.values(ADVANCED_TEMPLATES);
  const activeTemplate = ADVANCED_TEMPLATES[selectedTemplateId] || templatesList[0];

  const getTemplateIcon = (id: string) => {
    if (id === 'saas_prd_2026') return <Rocket size={18} className="text-[#2383e2]" />;
    if (id === 'b2b_agency_offer') return <Briefcase size={18} className="text-emerald-600" />;
    return <Building2 size={18} className="text-purple-600" />;
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-150 font-sans"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-white dark:bg-[#202020] rounded-[8px] border border-[rgba(55,53,47,0.12)] dark:border-[rgba(255,255,255,0.12)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[#37352f] dark:text-[#d4d4d4]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] flex items-center justify-between bg-[#fbfbfa] dark:bg-[#1c1c1c]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[4px] bg-[rgba(55,53,47,0.06)] dark:bg-[rgba(255,255,255,0.08)] text-[#37352f] dark:text-white flex items-center justify-center">
              <LayoutTemplate size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#37352f] dark:text-white flex items-center gap-2">
                <span>Szablony Dokumentów</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-[3px] bg-[rgba(55,53,47,0.06)] dark:bg-[rgba(255,255,255,0.08)] text-[#787774] dark:text-[#9b9a97] font-medium">
                  Gotowe szablony
                </span>
              </h2>
              <p className="text-xs text-[#787774] dark:text-[#9b9a97]">
                Wybierz gotową strukturę dokumentu z tabelami, blokami callout i wskaźnikami
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-[4px] text-[#787774] hover:text-[#37352f] dark:hover:text-white hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.08)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Left: Template Cards */}
          <div className="md:col-span-5 space-y-2.5">
            <div className="text-[11px] font-semibold text-[#787774] dark:text-[#9b9a97] uppercase tracking-wider mb-1">
              Dostępne szablony:
            </div>

            {templatesList.map((tpl) => {
              const isSelected = tpl.id === selectedTemplateId;
              return (
                <div
                  key={tpl.id}
                  onClick={() => setSelectedTemplateId(tpl.id)}
                  className={`p-3 rounded-[6px] border transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'border-[#2383e2] bg-[#2383e2]/5 dark:bg-[#2383e2]/10'
                      : 'border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] bg-white dark:bg-[#191919] hover:bg-[rgba(55,53,47,0.03)] dark:hover:bg-[rgba(255,255,255,0.04)]'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-[4px] bg-[rgba(55,53,47,0.04)] dark:bg-[rgba(255,255,255,0.06)] border border-[rgba(55,53,47,0.08)] dark:border-[rgba(255,255,255,0.08)] flex items-center justify-center shrink-0">
                      {getTemplateIcon(tpl.id)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-medium uppercase text-[#787774] dark:text-[#9b9a97] bg-[rgba(55,53,47,0.06)] dark:bg-[rgba(255,255,255,0.08)] px-1.5 py-0.2 rounded-[3px]">
                          {tpl.category}
                        </span>
                        <span className="text-[9px] font-medium text-[#2383e2] bg-[#2383e2]/10 px-1.5 py-0.2 rounded-[3px]">
                          {tpl.badge}
                        </span>
                      </div>
                      <h3 className="font-semibold text-[#37352f] dark:text-white text-xs mt-1 leading-snug">
                        {tpl.shortTitle}
                      </h3>
                      <div className="flex items-center gap-3 text-[10px] text-[#787774] dark:text-[#9b9a97] mt-1.5">
                        <span className="flex items-center gap-1">
                          <Layers size={10} />
                          <span>{tpl.blocksCount} bloków</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          <span>{tpl.estimatedReadingTime}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Active Template Preview & Actions */}
          <div className="md:col-span-7 flex flex-col justify-between bg-[#fbfbfa] dark:bg-[#191919] rounded-[6px] border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] p-4">
            <div className="space-y-3.5">
              <div>
                <span className="text-[10px] font-medium text-[#2383e2] bg-[#2383e2]/10 px-2 py-0.5 rounded-[3px] uppercase">
                  {activeTemplate.category}
                </span>
                <h3 className="text-sm font-bold text-[#37352f] dark:text-white mt-1.5">
                  {activeTemplate.name}
                </h3>
                <p className="text-xs text-[#787774] dark:text-[#9b9a97] mt-1 leading-relaxed">
                  {activeTemplate.description}
                </p>
              </div>

              {/* Cover gradient preview pill */}
              <div
                className="h-8 rounded-[4px] w-full flex items-center px-3 text-white text-xs font-medium shadow-2xs"
                style={{ background: activeTemplate.coverGradient }}
              >
                <span>Motyw okładki: {activeTemplate.icon} {activeTemplate.shortTitle}</span>
              </div>

              {/* Blocks breakdown */}
              <div className="p-3 bg-white dark:bg-[#202020] rounded-[4px] border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] space-y-2">
                <div className="text-[11px] font-semibold text-[#37352f] dark:text-white flex items-center justify-between">
                  <span>Składniki struktury ({activeTemplate.blocksCount} bloków):</span>
                  <span className="text-[#2383e2] text-[10px] font-medium">100% Edytowalne</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-[#787774] dark:text-[#9b9a97]">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    <span>Executive Summary & Callout</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    <span>Wskaźniki KPI & Pasek postępu</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    <span>Bloki kodu & Tabele wycen</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    <span>Harmonogram Timeline & CTA</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 mt-4 border-t border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] flex flex-col sm:flex-row items-center gap-2">
              <button
                onClick={() => onSelectTemplate(activeTemplate, 'append')}
                className="w-full sm:flex-1 py-1.5 px-3 rounded-[4px] border border-[rgba(55,53,47,0.12)] dark:border-[rgba(255,255,255,0.12)] bg-white dark:bg-[#202020] hover:bg-[rgba(55,53,47,0.04)] text-[#37352f] dark:text-[#d4d4d4] font-medium text-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Dopisz na koniec notatki</span>
              </button>

              <button
                onClick={() => onSelectTemplate(activeTemplate, 'replace')}
                className="w-full sm:flex-1 py-1.5 px-3 rounded-[4px] bg-[#2383e2] hover:bg-[#1d6fc2] text-white font-medium text-xs cursor-pointer transition-all shadow-2xs flex items-center justify-center gap-1.5"
              >
                <Sparkles size={13} />
                <span>{currentBlocksCount > 1 ? 'Zastąp treść dokumentu' : 'Wstaw ten szablon'}</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
