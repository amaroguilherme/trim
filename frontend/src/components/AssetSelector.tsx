'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, Plus, Lock, LockOpen } from 'lucide-react';

interface AssetSelectorProps {
  options: string[];
  selected: string[];
  onChange: (newSelected: string[]) => void;
  

  locked: string[]; 
  onToggleLock: (asset: string) => void;
  
  placeholder: string;
  emptyMessage: string;

  disabled?: boolean;
}

export default function AssetSelector({ 
  options, 
  selected, 
  onChange, 
  locked, 
  onToggleLock, 
  placeholder,
  emptyMessage,
  disabled = false
}: AssetSelectorProps) {
  
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);


  const filteredOptions = options
    .filter(opt => opt.toLowerCase().includes(query.toLowerCase()))
    .filter(opt => !selected.includes(opt))
    .slice(0, 50);


  const addAsset = (asset: string) => {
    onChange([...selected, asset]);
    setQuery('');
  
    document.getElementById('asset-search-input')?.focus();
  };


  const removeAsset = (assetToRemove: string) => {
    onChange(selected.filter(asset => asset !== assetToRemove));
  };


  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  return (
    <div className={`w-full relative ${disabled ? 'opacity-60 pointer-events-none' : ''}`} ref={wrapperRef}>
      
      <div 
        className={`w-full bg-zinc-950 border transition-all rounded-xl p-2 min-h-[120px] cursor-text
          ${isOpen ? 'border-emerald-500 ring-1 ring-emerald-900' : 'border-zinc-800 hover:border-zinc-700'}
          ${disabled ? 'bg-zinc-900 border-zinc-800 cursor-not-allowed' : ''} 
        `}
        onClick={() => {
            if (disabled) return;
            setIsOpen(true);
            document.getElementById('asset-search-input')?.focus();
        }}
      >
        <div className="flex flex-wrap gap-2">
          {selected.map(asset => {
            const isLocked = locked.includes(asset);

            return (
              <span 
                key={asset} 
                className={`flex items-center gap-1 pl-3 pr-1 py-1 border rounded-lg text-sm font-mono animate-in fade-in zoom-in duration-200 group select-none
                    ${isLocked 
                        ? 'bg-amber-900/20 text-amber-400 border-amber-700/50' 
                        : 'bg-zinc-800 text-emerald-400 border-zinc-700'}`}
              >
                {asset}
                
                <button
                    onClick={(e) => { e.stopPropagation(); onToggleLock(asset); }}
                    disabled={disabled}
                    className={`p-1 rounded hover:bg-white/10 ml-2 transition-colors
                        ${isLocked ? 'text-amber-400' : 'text-zinc-600 hover:text-zinc-300'}`}
                >
                    {isLocked ? <Lock className="w-3 h-3" /> : <LockOpen className="w-3 h-3" />}
                </button>

                <button 
                  onClick={(e) => { e.stopPropagation(); removeAsset(asset); }}
                  disabled={disabled}
                  className="p-1 rounded hover:bg-red-900/30 text-zinc-500 hover:text-red-400 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}

          <div className="flex-1 min-w-[120px] flex items-center">
             <Search className="w-4 h-4 text-zinc-600 mr-2 ml-1" />
             <input
                id="asset-search-input"
                type="text"
                value={query}
                disabled={disabled}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setIsOpen(true);
                }}
                onFocus={() => !disabled && setIsOpen(true)}
                placeholder={selected.length === 0 ? placeholder : ""}
                className="bg-transparent text-zinc-300 text-sm focus:outline-none w-full h-8 font-mono placeholder:text-zinc-600 disabled:cursor-not-allowed"
                autoComplete="off"
             />
          </div>
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto scrollbar-thin">
            {filteredOptions.length > 0 ? (
                filteredOptions.map(opt => (
                    <button
                        key={opt}
                        onClick={() => addAsset(opt)}
                        className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-emerald-400 flex items-center justify-between group transition-colors"
                    >
                        <span className="font-mono">{opt}</span>
                        <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 text-emerald-500" />
                    </button>
                ))
            ) : (
                <div className="px-4 py-4 text-center text-zinc-500 text-sm">
                    {emptyMessage}
                </div>
            )}
        </div>
      )}
    </div>
  );
}