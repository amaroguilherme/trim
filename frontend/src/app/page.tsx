'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Cpu, Wallet, ShieldCheck, TrendingUp, Sparkles } from 'lucide-react';
import ForceGraph from '@/components/ForceGraph';
import AssetSelector from '@/components/AssetSelector';
import { TICKERS_B3, TICKERS_CRYPTO } from '@/data/tickers';

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

  // Clears the selection when changing markets
  useEffect(() => {
    setSelectedAssets([]);
    setResult(null);
  }, [market]);

  const handleOptimize = async () => {
    if (selectedAssets.length === 0) return;
    
    setLoading(true);
    setResult(null);
    setError('');

    const payload = {
      market_context: market,
      source_assets: selectedAssets,
      constraints: { target_size: targetSize }
    };

    try {
      const res = await fetch('http://127.0.0.1:5001/api/v1/trim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to connect to the Trim server.');

      const data = await res.json();
      
      setTimeout(() => {
        setResult(data);
        setLoading(false);
      }, 1500);

    } catch (err) {
      setError('Error processing the request. Please check if the backend server is running.');
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center min-h-screen px-4 py-12 md:py-24 max-w-5xl mx-auto selection:bg-emerald-900 selection:text-white">
      
      {/* --- HEADER --- */}
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
          Trim.
        </h1>
        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto">
          Pare de acumular. Comece a otimizar. <br/>
          Use IA para limpar sua carteira e cortar custos.
        </p>
      </div>

      {/* --- CONTEXT SWITCHER --- */}
      <div className="flex p-1 bg-zinc-900 rounded-full border border-zinc-800 mb-8">
        <button
          onClick={() => setMarket('br_stocks')}
          className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
            market === 'br_stocks' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          🇧🇷 Ações B3
        </button>
        <button
          onClick={() => setMarket('crypto')}
          className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
            market === 'crypto' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          ₿ Cripto
        </button>
      </div>

      {/* --- MAIN INTERFACE --- */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* LEFL SIDE: INPUTS */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400 ml-1">
                Selecione seus ativos
            </label>
            
            <AssetSelector 
                options={market === 'br_stocks' ? TICKERS_B3 : TICKERS_CRYPTO}
                selected={selectedAssets}
                onChange={setSelectedAssets}
                placeholder={market === 'br_stocks' ? "Busque por PETR4, VALE3..." : "Busque por BTC, ETH..."}
            />
          </div>

          <div className="space-y-4">
             <div className="flex justify-between text-sm text-zinc-400">
                <span>Meta de Ativos: <strong>{targetSize}</strong></span>
                <span>Max: 10</span>
             </div>
             <input 
                type="range" min="3" max="10" step="1"
                value={targetSize}
                onChange={(e) => setTargetSize(parseInt(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
             />
          </div>

          <button
            onClick={handleOptimize}
            disabled={loading || selectedAssets.length < 3}
            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                loading 
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                : 'bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.3)]'
            }`}
          >
            {loading ? (
                <>
                    <BrainCircuit className="animate-pulse w-5 h-5" />
                    Processando...
                </>
            ) : (
                <>
                    <Sparkles className="w-5 h-5" />
                    Otimizar
                </>
            )}
          </button>
          
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        </div>

        {/* RIGHT SIDE: VISUALIZATION & RESULTS */}
        <div className="space-y-6">
            
            <div className="relative">
                {result ? (
                    <ForceGraph 
                        assets={selectedAssets}
                        selected={result.recommendation.portfolio_trim.map(t => t.split('.')[0].split('-')[0])}
                    />
                ) : (
                    <div className="h-[400px] w-full border border-zinc-800 rounded-xl bg-black/50 flex flex-col items-center justify-center text-zinc-600 space-y-4">
                         <BrainCircuit className={`w-12 h-12 ${loading ? 'animate-pulse text-emerald-500' : ''}`} />
                         <p className="text-sm font-mono">
                             {loading ? "Calculando Topologia..." : "Aguardando Input..."}
                         </p>
                    </div>
                )}
            </div>

            {/* Final Result (Cards) */}
            {result && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                    {/* CARD 1: SELECTION */}
                    <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
                        <div className="flex items-center gap-2 text-emerald-400 mb-2">
                            <ShieldCheck className="w-5 h-5" />
                            <h3 className="font-bold">Seleção Trim</h3>
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
                            <h3 className="font-bold">Economia Projetada</h3>
                        </div>
                        <p className="text-2xl font-bold text-white">
                            $ {result.financial_impact.estimated_yearly_savings_usd.toFixed(2)} <span className="text-sm text-zinc-500 font-normal">/ano</span>
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">
                          {result.financial_impact.calculation_logic}
                        </p>
                    </div>
                </motion.div>
            )}
        </div>
      </div>

      <div className="mt-32 w-full border-t border-zinc-900 pt-16">
          <h2 className="text-center text-2xl font-bold mb-12 text-zinc-300">O que fazemos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-xl hover:border-zinc-700 transition-colors">
                  <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center mb-4 text-white">
                      <BrainCircuit className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Rede Neural em Grafos</h3>
                  <p className="text-zinc-500 text-sm">Não usamos correlação simples. Aprendemos a topologia do mercado para detectar riscos ocultos que planilhas não veem.</p>
              </div>
              <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-xl hover:border-zinc-700 transition-colors">
                  <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center mb-4 text-orange-500">
                      <Cpu className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Engine de análise</h3>
                  <p className="text-zinc-500 text-sm">Otimização combinatória de alta performance. Testamos milhares de cenários em milissegundos.</p>
              </div>
              <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-xl hover:border-zinc-700 transition-colors">
                  <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center mb-4 text-emerald-500">
                      <TrendingUp className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Foco em Resultado</h3>
                  <p className="text-zinc-500 text-sm">Treinado com anos de dados históricos para priorizar consistência e dividendos, ignorando ruído de curto prazo.</p>
              </div>
          </div>
      </div>
    </main>
  );
}