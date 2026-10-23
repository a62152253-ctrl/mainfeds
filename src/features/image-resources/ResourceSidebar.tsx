import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, Trash2, PlusCircle, Check } from 'lucide-react';
import { ImageResource } from './types';
import { loadResources, saveResources } from './storage';
import { formatBytes, compressImage, createEditorImageMarkup } from './imageUtils';

interface ResourceSidebarProps {
  onInsertImage: (htmlMarkup: string) => void;
}

export const ResourceSidebar: React.FC<ResourceSidebarProps> = ({ onInsertImage }) => {
  const [resources, setResources] = useState<ImageResource[]>(() => loadResources());
  const [justInsertedId, setJustInsertedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    saveResources(resources);
  }, [resources]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      try {
        const dataUrl = await compressImage(file);
        const newResource: ImageResource = {
          id: 'img-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          name: file.name,
          dataUrl,
          size: file.size,
          type: file.type,
          createdAt: Date.now(),
        };
        setResources((prev) => [newResource, ...prev]);
      } catch (err) {
        console.error('Error uploading file:', err);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setResources((prev) => prev.filter((item) => item.id !== id));
  };

  const handleInsert = (res: ImageResource) => {
    const markup = createEditorImageMarkup(res.dataUrl, res.name);
    onInsertImage(markup);
    setJustInsertedId(res.id);
    setTimeout(() => setJustInsertedId(null), 1500);
  };

  return (
    <div className="flex flex-col h-full text-xs">
      {/* Upload button area */}
      <div className="p-2 border-b border-[#2d2d2d]">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
          multiple
          className="hidden"
          onChange={handleFileUpload}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-2 px-2.5 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 flex items-center justify-center gap-1.5 font-medium transition-colors cursor-pointer"
        >
          <UploadCloud size={14} />
          <span>Wgraj plik .png / foto</span>
        </button>
      </div>

      {/* Gallery list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {resources.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            <ImageIcon size={24} className="mx-auto mb-2 opacity-40" />
            <p className="text-[11px]">Brak plików .png</p>
            <p className="text-[10px] text-zinc-600 mt-1">Wgraj grafikę i wstaw do edytora</p>
          </div>
        ) : (
          resources.map((item) => (
            <div
              key={item.id}
              onClick={() => handleInsert(item)}
              className="group relative bg-[#1c1c1c] border border-[#2c2c2c] hover:border-blue-500/50 rounded p-1.5 transition-all cursor-pointer shadow-sm flex flex-col gap-1"
            >
              <div className="h-20 w-full rounded bg-[#111] overflow-hidden flex items-center justify-center border border-[#252525]">
                <img
                  src={item.dataUrl}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-300 px-0.5">
                <span className="truncate max-w-[120px] font-medium">{item.name}</span>
                <span className="text-[9px] text-zinc-500 font-mono">{formatBytes(item.size)}</span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-[#252525] text-[10px]">
                <span className="text-blue-400 flex items-center gap-1 group-hover:underline">
                  {justInsertedId === item.id ? (
                    <>
                      <Check size={11} className="text-emerald-400" />
                      <span className="text-emerald-400">Wstawiono!</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle size={11} />
                      <span>Wstaw do tekstu</span>
                    </>
                  )}
                </span>
                <button
                  onClick={(e) => handleDelete(item.id, e)}
                  title="Usuń grafikę"
                  className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
