'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, Check, Plus } from 'lucide-react';

interface AssetSelectorProps {
  options: string[];
  selected: string[];
  onChange: (newSelected: string[]) => void;
  placeholder: string;
  emptyMessage: string;
}

export default function AssetSelector({ options, selected, onChange, placeholder, emptyMessage }: AssetSelectorProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Filter the options based on what the user types and remove those that have already been selected.
  const filteredOptions = options
    .filter(opt => opt.toLowerCase().includes(query.toLowerCase()))
    .filter(opt => !selected.includes(opt))
    .slice(0, 50); // Limit to 50 results to avoid crashing the rendering process

  const addAsset = (asset: string) => {
    onChange([...selected, asset]);
    setQuery('');
    // Keep the dropdown open for faster adding
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
    <div className="w-full relative" ref={wrapperRef}>
      
      {/* Main Container (Input + Tags) */}
      <div 
        className={`w-full bg-zinc-950 border transition-all rounded-xl p-2 min-h-[160px] cursor-text
          ${isOpen ? 'border-emerald-500 ring-1 ring-emerald-900' : 'border-zinc-800 hover:border-zinc-700'}`}
        onClick={() => {
            setIsOpen(true);
            document.getElementById('asset-search-input')?.focus();
        }}
      >
        <div className="flex flex-wrap gap-2">
          {/* Selected Tags */}
          {selected.map(asset => (
            <span key={asset} className="flex items-center gap-1 px-3 py-1 bg-zinc-800 text-emerald-400 border border-zinc-700 rounded-lg text-sm font-mono animate-in fade-in zoom-in duration-200">
              {asset}
              <button 
                onClick={(e) => { e.stopPropagation(); removeAsset(asset); }}
                className="hover:text-red-400 transition-colors ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          <div className="flex-1 min-w-[120px] flex items-center">
             <Search className="w-4 h-4 text-zinc-600 mr-2" />
             <input
                id="asset-search-input"
                type="text"
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                placeholder={selected.length === 0 ? placeholder : ""}
                className="bg-transparent text-zinc-300 text-sm focus:outline-none w-full h-8 font-mono"
                autoComplete="off"
             />
          </div>
        </div>
      </div>

      {/* Floating Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto scrollbar-thin">
            {filteredOptions.length > 0 ? (
                filteredOptions.map(opt => (
                    <button
                        key={opt}
                        onClick={() => addAsset(opt)}
                        className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-emerald-400 flex items-center justify-between group transition-colors"
                    >
                        <span className="font-mono">{opt}</span>
                        <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100" />
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