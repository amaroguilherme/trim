'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BrainCircuit, Cpu, Wallet, ShieldCheck, TrendingUp, Sparkles } from 'lucide-react';
import ForceGraph from '@/components/ForceGraph';

export default function Home() {
  // --- ESTADOS ---
  const [market, setMarket] = useState<'br_stocks' | 'crypto'>('br_stocks');
  const [inputText, setInputText] = useState('');
  const [targetSize, setTargetSize] = useState(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string[] | null>(null);
  const [error, setError] = useState('');

  // --- LÓGICA ---
  const handleOptimize = async () => {
    if (!inputText.trim()) return;
    
    setLoading(true);
    setResult(null);
    setError('');

    // Prepara lista de ativos (separa por vírgula ou quebra de linha)
    const assets = inputText
      .split(/[\n,]+/)
      .map(s => s.trim().toUpperCase())
      .filter(s => s.length > 0);

    // Payload para o Backend
    const payload = {
      market_context: market,
      source_assets: assets,
      constraints: { target_size: targetSize }
    };

    try {
      // IMPORTANTE: Certifique-se que o backend (Flask) está rodando na porta 5000
      const res = await fetch('http://127.0.0.1:5000/api/v1/trim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Falha ao conectar com o servidor Trim.');

      const data = await res.json();
      
      // Simula um delay pequeno para mostrar a animação de loading (UX)
      setTimeout(() => {
        setResult(data); // O backend retorna a lista de strings
        setLoading(false);
      }, 1500);

    } catch (err) {
      setError('Erro ao processar. Verifique se o servidor backend está rodando.');
      setLoading(false);
    }
  };

  // Cálculos de "Economia Fictícia" para o MVP
  const calculateSavings = () => {
    const originalCount = inputText.split(/[\n,]+/).filter(s=>s.trim()).length;
    const newCount = result?.length || 0;
    const costPerAsset = market === 'crypto' ? 2.50 : 0.50; // USD approx
    const savings = (originalCount - newCount) * 12 * costPerAsset;
    return savings.toFixed(2);
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
        
        {/* LADO ESQUERDO: INPUTS */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400 ml-1">Cole seus ativos</label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={market === 'br_stocks' ? "PETR4, VALE3, WEGE3, ITUB4..." : "BTC, ETH, SOL, LINK, UNI..."}
              className="w-full h-40 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-900 resize-none font-mono text-sm"
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
            disabled={loading || !inputText}
            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                loading 
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                : 'bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.3)]'
            }`}
          >
            {loading ? (
                <>
                    <BrainCircuit className="animate-pulse w-5 h-5" />
                    Processando Neuro-Grafo...
                </>
            ) : (
                <>
                    <Sparkles className="w-5 h-5" />
                    Otimizar Agora
                </>
            )}
          </button>
          
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        </div>

        {/* LADO DIREITO: VISUALIZAÇÃO & RESULTADOS */}
        <div className="space-y-6">
            
            {/* Visualizador de Grafo (Sempre visível para dar o visual "Tech") */}
            <div className="relative">
                {result ? (
                    // Grafo com resultado
                    <ForceGraph 
                        assets={inputText.split(/[\n,]+/).filter(s=>s.trim())} 
                        selected={result} 
                    />
                ) : (
                    // Placeholder Animado
                    <div className="h-[400px] w-full border border-zinc-800 rounded-xl bg-black/50 flex flex-col items-center justify-center text-zinc-600 space-y-4">
                         <BrainCircuit className={`w-12 h-12 ${loading ? 'animate-pulse text-emerald-500' : ''}`} />
                         <p className="text-sm font-mono">
                             {loading ? "Calculando Topologia..." : "Aguardando Input..."}
                         </p>
                    </div>
                )}
            </div>

            {/* Resultado Final (Cards) */}
            {result && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                    <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
                        <div className="flex items-center gap-2 text-emerald-400 mb-2">
                            <ShieldCheck className="w-5 h-5" />
                            <h3 className="font-bold">Seleção Trim</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {result.map(asset => (
                                <span key={asset} className="px-3 py-1 bg-emerald-900/30 text-emerald-400 border border-emerald-900/50 rounded text-sm font-mono">
                                    {asset}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
                        <div className="flex items-center gap-2 text-indigo-400 mb-2">
                            <Wallet className="w-5 h-5" />
                            <h3 className="font-bold">Economia Estimada</h3>
                        </div>
                        <p className="text-2xl font-bold text-white">
                            $ {calculateSavings()} <span className="text-sm text-zinc-500 font-normal">/ano</span>
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">Em taxas de manutenção & gas.</p>
                    </div>
                </motion.div>
            )}
        </div>
      </div>

      {/* --- HOW IT WORKS (Footer) --- */}
      <div className="mt-32 w-full border-t border-zinc-900 pt-16">
          <h2 className="text-center text-2xl font-bold mb-12 text-zinc-300">Tecnologia por trás do corte</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-xl hover:border-zinc-700 transition-colors">
                  <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center mb-4 text-white">
                      <BrainCircuit className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">IA Neural em Grafos</h3>
                  <p className="text-zinc-500 text-sm">Não usamos correlação simples. Nossa GNN aprende a topologia do mercado para detectar riscos ocultos que planilhas não veem.</p>
              </div>
              <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-xl hover:border-zinc-700 transition-colors">
                  <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center mb-4 text-orange-500">
                      <Cpu className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Motor Rust</h3>
                  <p className="text-zinc-500 text-sm">Otimização combinatória de alta performance. Nosso solver proprietário testa milhares de cenários em milissegundos.</p>
              </div>
              <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-xl hover:border-zinc-700 transition-colors">
                  <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center mb-4 text-emerald-500">
                      <TrendingUp className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Foco em Resultado</h3>
                  <p className="text-zinc-500 text-sm">Treinado em 5 anos de histórico da B3 para priorizar consistência e dividendos, ignorando ruído de curto prazo.</p>
              </div>
          </div>
      </div>
    </main>
  );
}