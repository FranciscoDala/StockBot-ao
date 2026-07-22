"use client";
import { useState, useEffect } from "react";
import { X, Wallet, ArrowUpRight, ArrowDownRight, FileText, Plus, Minus, CheckCircle } from "lucide-react";
import { formatCurrency } from "../utils";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    lojaId: string;
    token: string;
}

export function CaixaModal({ open, onOpenChange, lojaId, token }: Props) {
    const [abaAtiva, setAbaAtiva] = useState<'resumo' | 'movimentacoes' | 'fechamento'>('resumo');
    const [caixa, setCaixa] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Fecha com ESC
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onOpenChange(false) };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onOpenChange]);

    if (!open) return null;

    const radius = '16px';
    const bgCard = 'color-mix(in srgb, var(--cor-card) 85%, transparent)';

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in"
            onClick={() => onOpenChange(false)}
        >
            <div
                className="w-full h-full sm:w-[95%] sm:h-[95%] sm:rounded-2xl flex-col"
                style={{
                    background: 'var(--cor-fundo)',
                    boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* HEADER */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b" style={{ borderColor: 'color-mix(in srgb, var(--cor-borda) 30%, transparent)' }}>
                    <div className="flex items-center gap-3">
                        <Wallet size={24} style={{ color: 'var(--cor-primaria)' }} />
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--cor-texto)' }}>Gestão de Caixa</h2>
                            <p className="text-xs sm:text-sm" style={{ color: 'var(--cor-texto-sec)' }}>Controle do dinheiro físico da loja</p>
                        </div>
                    </div>
                    <button onClick={() => onOpenChange(false)} className="p-2 rounded-full hover:bg-white/10 transition">
                        <X size={20} />
                    </button>
                </div>

                {/* TABS */}
                <div className="flex gap-2 p-4 sm:p-6 border-b" style={{ borderColor: 'color-mix(in srgb, var(--cor-borda) 30%, transparent)' }}>
                    <TabButton label="Resumo" icon={<Wallet size={16}/>} active={abaAtiva === 'resumo'} onClick={() => setAbaAtiva('resumo')} />
                    <TabButton label="Movimentações" icon={<FileText size={16}/>} active={abaAtiva === 'movimentacoes'} onClick={() => setAbaAtiva('movimentacoes')} />
                    <TabButton label="Fechamento" icon={<CheckCircle size={16}/>} active={abaAtiva === 'fechamento'} onClick={() => setAbaAtiva('fechamento')} />
                </div>

                {/* CONTEUDO */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    {abaAtiva === 'resumo' && <AbaResumo />}
                    {abaAtiva === 'movimentacoes' && <AbaMovimentacoes />}
                    {abaAtiva === 'fechamento' && <AbaFechamento />}
                </div>
            </div>
        </div>
    )
}

function TabButton({ label, icon, active, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition"
            style={{
                background: active? 'var(--cor-primaria)' : 'transparent',
                color: active? '#fff' : 'var(--cor-texto-sec)',
                border: `1px solid ${active? 'var(--cor-primaria)' : 'color-mix(in srgb, var(--cor-borda) 40%, transparent)'}`
            }}
        >
            {icon} {label}
        </button>
    )
}

// ABAS
function AbaResumo() {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CardValor titulo="Saldo Abertura" valor={5000} cor="#3b82f6" />
                <CardValor titulo="Entradas Hoje" valor={13000} cor="#22c55e" icon={<ArrowUpRight size={16}/>} />
                <CardValor titulo="Saídas/Sangrias" valor={7000} cor="#ef4444" icon={<ArrowDownRight size={16}/>} />
            </div>

            <div className="p-6 rounded-2xl" style={{ background: 'color-mix(in srgb, var(--cor-primaria) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--cor-primaria) 40%, transparent)' }}>
                <p className="text-sm opacity-80">Saldo Atual em Caixa</p>
                <p className="text-5xl font-bold mt-1" style={{ color: 'var(--cor-primaria)' }}>{formatCurrency(11000)}</p>
            </div>

            <div className="flex gap-3 pt-4">
                <button className="flex-1 h-12 bg-green-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:opacity-90"><Plus size={18}/> Abrir Caixa</button>
                <button className="flex-1 h-12 bg-red-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:opacity-90"><Minus size={18}/> Fazer Sangria</button>
                <button className="flex-1 h-12 bg-gray-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:opacity-90"><CheckCircle size={18}/> Fechar Caixa</button>
            </div>
        </div>
    )
}

function AbaMovimentacoes() {
    return (
        <div className="p-4 rounded-xl" style={{ background: 'color-mix(in srgb, var(--cor-card) 85%, transparent)' }}>
            <h3 className="font-bold mb-3">Histórico de Hoje</h3>
            {/* Aqui vai a tabela de movimentacoes */}
            <p className="text-sm opacity-70">Venda Dinheiro #A1B2C3 + 10.000 KZ</p>
            <p className="text-sm opacity-70">Saída Manual - 2.000 KZ</p>
        </div>
    )
}

function AbaFechamento() {
    return (
        <div className="p-4 rounded-xl" style={{ background: 'color-mix(in srgb, var(--cor-card) 85%, transparent)' }}>
            <h3 className="font-bold mb-3">Fechar Caixa do Dia</h3>
            <p className="text-sm opacity-70">Saldo esperado: {formatCurrency(11000)}</p>
            {/* Aqui vai o input de Saldo Contado + Divergência */}
        </div>
    )
}

function CardValor({ titulo, valor, cor, icon }: any) {
    return (
        <div className="p-4 rounded-xl" style={{ background: `color-mix(in srgb, ${cor} 15%, transparent)`, border: `1px solid color-mix(in srgb, ${cor} 40%, transparent)` }}>
            <p className="text-xs font-medium flex items-center gap-1" style={{ color: cor }}>{icon} {titulo}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: cor }}>{formatCurrency(valor)}</p>
        </div>
    )
}
