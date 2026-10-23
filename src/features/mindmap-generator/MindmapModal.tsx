import React, { useMemo, useState, useRef } from 'react';
import {
  GitBranch,
  X,
  Share2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Search,
  Layers,
  Palette,
  Maximize2,
  ListTree,
  Network,
} from 'lucide-react';
import { parseDocumentStructure, parseBlocksToMindmap } from './mindmapParser';
import { getNodeBadgeColor, calculateTreeLayout, THEME_CONFIG, exportToMarkdownOutline } from './mindmapRenderer';
import { MindmapNode, MindmapTheme, MindmapLayoutMode } from './types';
import { DocBlock } from '../../types/workspace';

interface MindmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  htmlContent?: string;
  docTitle: string;
  blocks?: DocBlock[];
}

export const MindmapModal: React.FC<MindmapModalProps> = ({
  isOpen,
  onClose,
  htmlContent = '',
  docTitle,
  blocks,
}) => {
  const [theme, setTheme] = useState<MindmapTheme>('modern');
  const [layoutMode, setLayoutMode] = useState<MindmapLayoutMode>('tree');
  const [zoom, setZoom] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Generate tree from structured blocks or fallback to htmlContent
  const tree = useMemo(() => {
    if (blocks && blocks.length > 0) {
      return parseBlocksToMindmap(blocks, docTitle);
    }
    return parseDocumentStructure(htmlContent, docTitle);
  }, [blocks, htmlContent, docTitle]);

  // Spatial layout for SVG rendering
  const treeLayout = useMemo(() => {
    return calculateTreeLayout(tree);
  }, [tree]);

  if (!isOpen) return null;

  const currentTheme = THEME_CONFIG[theme];

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.15, 2.5));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.15, 0.4));
  const handleResetZoom = () => setZoom(1);

  const handleExportMarkdown = () => {
    const md = exportToMarkdownOutline(tree);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(docTitle || 'mapa-mysli').toLowerCase().replace(/\s+/g, '-')}-outline.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportSvg = () => {
    const svgEl = document.getElementById('mindmap-svg-canvas');
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(docTitle || 'mapa-mysli').toLowerCase().replace(/\s+/g, '-')}-mindmap.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderOutlineBranch = (node: MindmapNode) => {
    const isMatched = searchQuery && node.text.toLowerCase().includes(searchQuery.toLowerCase());
    const isSelected = selectedNodeId === node.id;

    return (
      <div key={node.id} className="flex flex-col gap-2 relative pl-4 border-l border-slate-700/60 my-1.5">
        <div
          onClick={() => setSelectedNodeId(node.id)}
          className={`inline-block px-3 py-1.5 rounded-lg border text-xs max-w-md truncate shadow-sm transition-all cursor-pointer ${
            isSelected
              ? 'ring-2 ring-blue-400 font-bold scale-105'
              : isMatched
              ? 'ring-2 ring-amber-400 bg-amber-500/20 text-amber-200'
              : getNodeBadgeColor(node.level)
          }`}
        >
          {node.type === 'todo' && (
            <span className="mr-1.5 text-blue-400">{node.checked ? '☑' : '☐'}</span>
          )}
          {node.text}
        </div>

        {node.children.length > 0 && (
          <div className="flex flex-col gap-1.5 pl-2">
            {node.children.map((child) => renderOutlineBranch(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-[#12161f] border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col text-xs text-slate-200 overflow-hidden">
        {/* Top Control Header */}
        <div className="p-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-[#0d1017]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30 flex items-center justify-center shadow-xs">
              <GitBranch size={16} />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <span>Interaktywna Mapa Myśli & Graf Wiedzy</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                  {treeLayout.nodes.length} węzłów
                </span>
              </h2>
              <p className="text-[10px] text-slate-400">
                Wizualizacja semantyczna generowana na żywo ze struktury klocków
              </p>
            </div>
          </div>

          {/* Center search & layout mode */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Szukaj w mapie..."
                className="bg-slate-900 border border-slate-700 rounded-xl pl-7 pr-3 py-1 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500 w-36 sm:w-48"
              />
            </div>

            <div className="flex bg-slate-900 border border-slate-700 rounded-xl p-0.5">
              <button
                onClick={() => setLayoutMode('tree')}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1 font-medium transition-colors cursor-pointer ${
                  layoutMode === 'tree' ? 'bg-violet-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Wizualny graf SVG"
              >
                <Network size={12} />
                <span className="hidden sm:inline">Graf 2D</span>
              </button>
              <button
                onClick={() => setLayoutMode('outline')}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1 font-medium transition-colors cursor-pointer ${
                  layoutMode === 'outline' ? 'bg-violet-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Struktura konspektowa"
              >
                <ListTree size={12} />
                <span className="hidden sm:inline">Konspekt</span>
              </button>
            </div>

            {/* Themes */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-xl p-1">
              <Palette size={12} className="text-slate-400 ml-1" />
              {(['modern', 'cyberpunk', 'emerald', 'amber'] as MindmapTheme[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`w-4 h-4 rounded-full border transition-all ${
                    t === 'modern'
                      ? 'bg-blue-500'
                      : t === 'cyberpunk'
                      ? 'bg-fuchsia-500'
                      : t === 'emerald'
                      ? 'bg-emerald-500'
                      : 'bg-amber-500'
                  } ${theme === t ? 'scale-125 border-white ring-1 ring-white/40' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  title={`Motyw: ${t}`}
                />
              ))}
            </div>
          </div>

          {/* Right Export & Close buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleExportSvg}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl flex items-center gap-1 text-[11px] font-semibold cursor-pointer transition-colors"
              title="Pobierz plik SVG"
            >
              <Download size={13} />
              <span className="hidden sm:inline">SVG</span>
            </button>
            <button
              onClick={handleExportMarkdown}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl flex items-center gap-1 text-[11px] font-semibold cursor-pointer transition-colors"
              title="Pobierz konspekt Markdown"
            >
              <Download size={13} />
              <span className="hidden sm:inline">MD</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Canvas or Outline Container */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto relative select-none"
          style={{ backgroundColor: currentTheme.bg }}
        >
          {layoutMode === 'tree' ? (
            <div
              className="p-10 min-w-full min-h-full transition-transform duration-100 origin-top-left"
              style={{ transform: `scale(${zoom})` }}
            >
              <svg
                id="mindmap-svg-canvas"
                width={treeLayout.width}
                height={treeLayout.height}
                className="overflow-visible"
              >
                {/* Bezier Links */}
                {treeLayout.links.map((link, idx) => {
                  const dx = link.targetX - link.sourceX;
                  const curve = Math.max(dx * 0.5, 40);
                  const pathData = `M ${link.sourceX} ${link.sourceY} C ${link.sourceX + curve} ${link.sourceY}, ${link.targetX - curve} ${link.targetY}, ${link.targetX} ${link.targetY}`;

                  return (
                    <path
                      key={`link-${idx}`}
                      d={pathData}
                      fill="none"
                      stroke={currentTheme.line}
                      strokeWidth={1.8}
                      strokeOpacity={0.6}
                      className="transition-all hover:stroke-opacity-100"
                    />
                  );
                })}

                {/* Nodes */}
                {treeLayout.nodes.map((node) => {
                  const isRoot = node.level === 0;
                  const isH1 = node.level === 1;
                  const isH2 = node.level === 2;
                  const isMatched = searchQuery && node.text.toLowerCase().includes(searchQuery.toLowerCase());
                  const isSelected = selectedNodeId === node.id;

                  const colors = isRoot
                    ? currentTheme.root
                    : isH1
                    ? currentTheme.h1
                    : isH2
                    ? currentTheme.h2
                    : currentTheme.item;

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x}, ${node.y})`}
                      onClick={() => setSelectedNodeId(node.id)}
                      className="cursor-pointer group"
                    >
                      {/* Node background rect */}
                      <rect
                        width={node.width || 180}
                        height={node.height || 44}
                        rx={12}
                        fill={colors.bg}
                        stroke={isSelected ? '#60a5fa' : isMatched ? '#f59e0b' : colors.border}
                        strokeWidth={isSelected || isMatched ? 2.5 : 1.2}
                        className="transition-all shadow-md group-hover:filter group-hover:brightness-125"
                      />

                      {/* Node text */}
                      <text
                        x={14}
                        y={26}
                        fill={colors.text}
                        fontSize={isRoot ? 12 : 11}
                        fontWeight={isRoot ? 'bold' : isH1 ? '600' : '500'}
                        fontFamily="system-ui, -apple-system, sans-serif"
                        className="select-none pointer-events-none"
                      >
                        {node.text.length > 22 ? `${node.text.slice(0, 20)}…` : node.text}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          ) : (
            /* Outline mode */
            <div className="p-8 max-w-3xl mx-auto space-y-4">
              <div className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-sm inline-block shadow-lg">
                {tree.text}
              </div>

              {tree.children.length === 0 ? (
                <div className="text-slate-500 py-8">
                  Dodaj nagłówki H1, H2, H3 lub listy do dokumentu, aby zobaczyć gałęzie.
                </div>
              ) : (
                <div className="pl-4 flex flex-col gap-2">
                  {tree.children.map((branch) => renderOutlineBranch(branch))}
                </div>
              )}
            </div>
          )}

          {/* Floating Canvas Controls */}
          {layoutMode === 'tree' && (
            <div className="absolute bottom-5 right-5 flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl p-1.5 shadow-2xl backdrop-blur-xs">
              <button
                onClick={handleZoomIn}
                className="p-2 hover:bg-slate-800 text-slate-300 rounded-xl transition-colors cursor-pointer"
                title="Przybliż (+)"
              >
                <ZoomIn size={14} />
              </button>
              <span className="font-mono text-[10px] text-slate-400 px-1 select-none">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomOut}
                className="p-2 hover:bg-slate-800 text-slate-300 rounded-xl transition-colors cursor-pointer"
                title="Oddal (-)"
              >
                <ZoomOut size={14} />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-2 hover:bg-slate-800 text-slate-300 rounded-xl transition-colors cursor-pointer"
                title="Reset widoku"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-[#0d1017] flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Wskazówka: Kliknij dowolny węzeł na wykresie, aby go zaznaczyć i podświetlić relacje.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold cursor-pointer transition-colors shadow-sm"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
};
