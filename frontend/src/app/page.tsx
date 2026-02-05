'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Cpu, Wallet, ShieldCheck, TrendingUp, Sparkles, RotateCcw, Lightbulb } from 'lucide-react';
import ForceGraph from '@/components/ForceGraph';
import AssetSelector from '@/components/AssetSelector';
import { TICKERS_B3, TICKERS_CRYPTO } from '@/data/tickers';
import { translations } from '@/data/locales';

interface TrimResponse {
  financial_impact: {
    assets_removed: number;
    calculation_logic: string;
    estimated_yearly_savings_usd: number;
  };
  meta: {
    target_requested: number;
    total_input: number;
  };
  recommendation: {
    portfolio_trim: string[];
    sell_list: string[];
    reasoning: string;
  };
}

export default function Home() {
  // --- STATES ---
  const [market, setMarket] = useState<'br_stocks' | 'crypto'>('br_stocks');
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [targetSize, setTargetSize] = useState(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrimResponse | null>(null);
  const [error, setError] = useState('');
  const [lang, setLang] = useState<'en' | 'pt'>('en');

  const count = selectedAssets.length;
  const isTooFew = count > 0 && count < targetSize;
  const isTooMany = count > 10;
  const canOptimize = !loading && !isTooFew && !isTooMany && count > 0;

  const [lockedAssets, setLockedAssets] = useState<string[]>([]);

  const isLockedUI = !!result;

  // Clears the selection when changing markets
  useEffect(() => {
    setSelectedAssets([]);
    setLockedAssets([]);
    setResult(null);
  }, [market]);

  const handleMainAction = () => {
    if (isLockedUI) {
      setResult(null);
      setError('');
    } else {
      handleOptimize();
    }
  };

  const handleToggleLock = (asset: string) => {
    setLockedAssets(prev => {
        if (prev.includes(asset)) {
            return prev.filter(a => a !== asset);
        } else {
            if (prev.length >= targetSize) {
                return prev; 
            }
            return [...prev, asset];
        }
    });
  };

  useEffect(() => {
      setLockedAssets(prev => prev.filter(locked => selectedAssets.includes(locked)));
  }, [selectedAssets]);

  const t = translations[lang];

  const handleOptimize = async () => {
    if (selectedAssets.length === 0) return;
    
    setLoading(true);
    setResult(null);
    setError('');

    const payload = {
      market_context: market,
      source_assets: selectedAssets,
      constraints: { target_size: targetSize,
        locked_assets: lockedAssets
       }
    };

    try {
      const res = await fetch('/api/trim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
          throw new Error(data.error || 'Optimization error');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Error processing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center min-h-screen px-4 py-12 md:py-24 max-w-5xl mx-auto selection:bg-emerald-900 selection:text-white">
      
      <div className="absolute top-6 right-6 z-50">
        <button 
          onClick={() => setLang(lang === 'en' ? 'pt' : 'en')}
          className="bg-zinc-900 border border-zinc-700 text-zinc-300 px-3 py-1 rounded-lg text-xs font-bold hover:bg-zinc-800 transition-colors"
        >
          {lang === 'en' ? '🇺🇸 EN' : '🇧🇷 PT'}
        </button>
      </div>

      {/* --- HEADER --- */}
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
          {t.hero_title}
        </h1>
        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto">
          {t.hero_subtitle} <br/>
          {t.hero_desc}
        </p>
      </div>

      {/* --- CONTEXT SWITCHER --- */}
      <div className={`flex p-1 bg-zinc-900 rounded-full border border-zinc-800 mb-8 transition-opacity ${isLockedUI ? 'opacity-50 pointer-events-none' : ''}`}>
        <button
          onClick={() => setMarket('br_stocks')}
          className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
            market === 'br_stocks' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          {t.btn_br}
        </button>
        <button
          onClick={() => setMarket('crypto')}
          className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
            market === 'crypto' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          {t.btn_crypto}
        </button>
      </div>

      {/* --- MAIN INTERFACE --- */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* LEFL SIDE: INPUTS */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400 ml-1">
                {t.input_label}
            </label>
            
            <AssetSelector 
                options={market === 'br_stocks' ? TICKERS_B3 : TICKERS_CRYPTO}
                selected={selectedAssets}
                onChange={setSelectedAssets}
                locked={lockedAssets}
                onToggleLock={handleToggleLock}
                placeholder={market === 'br_stocks' ? t.input_ph_br : t.input_ph_crypto}
                emptyMessage={t.no_assets}
                disabled={isLockedUI}
            />
          </div>

          <div className={`space-y-4 ${isLockedUI ? 'opacity-50 pointer-events-none' : ''}`}>
             <div className="flex justify-between text-sm text-zinc-400">
                <span>{t.meta_assets} <strong>{targetSize}</strong></span>
                <span>{t.meta_max}</span>
             </div>
             <input 
                type="range" min="3" max="10" step="1"
                value={targetSize}
                onChange={(e) => setTargetSize(parseInt(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                disabled={isLockedUI}
             />
          </div>

          <button
              onClick={handleMainAction}
              disabled={!canOptimize && !isLockedUI} 
              className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300
                  ${isLockedUI
                      ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-600' 
                      : !canOptimize
                          ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'
                          : 'bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                  }`}
          >
              {loading ? (
                  <>
                      <BrainCircuit className="animate-pulse w-5 h-5" />
                      {t.loading_btn}
                  </>
              ) : isLockedUI ? (  
                  <>
                      <RotateCcw className="w-5 h-5" />
                      {lang === 'en' ? 'New Optimization' : 'Nova Otimização'}
                  </>
              ) : (
                  <>
                      <Sparkles className="w-5 h-5" />
                      {t.optimize_btn}
                  </>
              )}
          </button>

          <div className="h-6 text-center">
            {isTooFew && (
                <p className="text-red-400 text-xs font-mono animate-pulse">
                    ⚠️ {t.error_min_assets.replace('{{n}}', targetSize.toString())}
                </p>
            )}
            {isTooMany && (
                <p className="text-red-400 text-xs font-mono animate-pulse">
                    ⚠️ {t.error_max_assets}
                </p>
            )}
        </div>
          
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        </div>

        {/* RIGHT SIDE: VISUALIZATION & RESULTS */}
        <div className="space-y-6">
            
            <div className="relative h-[400px] w-full rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950/50 shadow-inner">
                 <ForceGraph 
                    assets={selectedAssets} 
                    selected={result 
                        ? result.recommendation.portfolio_trim.map(t => t.replace('.SA', '')) 
                        : []
                    }
                    
                    cut={result 
                        ? result.recommendation.sell_list.map(t => t.replace('.SA', '')) 
                        : []
                    }
                 />
                 
                 {loading && (
                     <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
                         <p className="text-emerald-400 font-mono text-sm animate-pulse">{t.graph_loading}</p>
                     </div>
                 )}
                 {!result && !loading && selectedAssets.length === 0 && (
                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                         <p className="text-zinc-600 font-mono text-xs">{t.graph_waiting}</p>
                     </div>
                 )}
                 
                 {result && (
                    <div className="absolute bottom-4 left-4 flex gap-3 bg-black/60 p-2 rounded-lg backdrop-blur-md border border-zinc-800 text-[10px] font-mono uppercase tracking-wider z-20">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                            <span className="text-zinc-300">Trim</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-red-500 opacity-80"></div>
                            <span className="text-zinc-400">Cut</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Final Result (Cards) */}
            {result && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                >
                    {/* CARD 1: SELECTION */}
                    <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
                        <div className="flex items-center gap-2 text-emerald-400 mb-2">
                            <ShieldCheck className="w-5 h-5" />
                            <h3 className="font-bold">{t.selection_title}</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {result.recommendation.portfolio_trim.map(asset => (
                                <span key={asset} className="px-3 py-1 bg-emerald-900/30 text-emerald-400 border border-emerald-900/50 rounded text-sm font-mono">
                                    {asset.split('.')[0].split('-')[0]}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* CARD 2: SAVINGS*/}
                    <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
                        <div className="flex items-center gap-2 text-indigo-400 mb-2">
                            <Wallet className="w-5 h-5" />
                            <h3 className="font-bold">{t.savings_title}</h3>
                        </div>
                        <p className="text-2xl font-bold text-white">
                            $ {result.financial_impact.estimated_yearly_savings_usd.toFixed(2)} <span className="text-sm text-zinc-500 font-normal">{t.savings_unit}</span>
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">
                          {result.financial_impact.calculation_logic}
                        </p>
                    </div>

                    <div className="bg-gradient-to-r from-zinc-900 to-zinc-900/50 border border-zinc-800 p-5 rounded-xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                      <div className="flex items-start gap-3 relative z-10">
                          <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500 mt-1">
                              <Lightbulb className="w-5 h-5" />
                          </div>
                          <div>
                              <h3 className="font-bold text-zinc-200 text-sm uppercase tracking-wider mb-1">
                                  {t.analysis_title}
                              </h3>
                              <p className="text-zinc-400 text-sm leading-relaxed">
                                  {result.recommendation.reasoning || "Optimization completed based on market topology."}
                              </p>
                          </div>
                      </div>
                    </div>
                </motion.div>
            )}
        </div>
      </div>

      <div className="mt-32 w-full border-t border-zinc-900 pt-16">
          <h2 className="text-center text-2xl font-bold mb-12 text-zinc-300">{t.footer_title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-xl hover:border-zinc-700 transition-colors">
                  <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center mb-4 text-white">
                      <BrainCircuit className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{t.tech_1_title}</h3>
                  <p className="text-zinc-500 text-sm">{t.tech_1_desc}</p>
              </div>
              <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-xl hover:border-zinc-700 transition-colors">
                  <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center mb-4 text-orange-500">
                      <Cpu className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{t.tech_2_title}</h3>
                  <p className="text-zinc-500 text-sm">{t.tech_2_desc}</p>
              </div>
              <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-xl hover:border-zinc-700 transition-colors">
                  <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center mb-4 text-emerald-500">
                      <TrendingUp className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{t.tech_3_title}</h3>
                  <p className="text-zinc-500 text-sm">{t.tech_3_desc}</p>
              </div>
          </div>
      </div>
    </main>
  );
}