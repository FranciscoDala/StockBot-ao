"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Wallet, ArrowUpRight, ArrowDownRight, FileText, CheckCircle, Lock, Unlock, Loader2, Inbox, Minus, Calendar, Banknote, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency, formatDateTime } from "../utils";
import { SangriaModal } from "./SangriaModal";
import { AberturaFechamentoModal } from "./AberturaFechamentoModal";
import { Input } from "@/components/ui/input";


const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: () => void; // <- ADICIONADO
    lojaId: string;
    token: string;
}

type CaixaResumo = {
    id: string;
    saldo_abertura: number;
    entradas_hoje: number;
    saidas_hoje: number;
    saldo_atual: number;
    status: 'aberto' | 'fechado'
}

type Movimentacao = {
    id: string;
    tipo: 'entrada' | 'saida' | 'sangria' | 'abertura';
    valor: number;
    descricao: string;
    created_at: string;
}

export function CaixaModal({ open, onOpenChange, onSave, lojaId, token }: Props) { // <- ADICIONADO onSave
    const [abaAtiva, setAbaAtiva] = useState<'resumo' | 'movimentacoes'>('resumo');
    const [resumo, setResumo] = useState<CaixaResumo | null>(null);
    const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
    const [loading, setLoading] = useState(false);

    const [showSangriaModal, setShowSangriaModal] = useState(false);
    const [showAberturaModal, setShowAberturaModal] = useState(false);

    // 1. Carrega resumo + controla scroll
    useEffect(() => {
        if (open && lojaId && token && !showSangriaModal && !showAberturaModal) {
            carregarResumoCaixa();
        }
        if (open) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; }
    }, [open, lojaId, token, showSangriaModal, showAberturaModal]);

    // 2. Carrega movimentacoes quando tiver resumo.id e estiver na aba
    useEffect(() => {
        if (open && abaAtiva === 'movimentacoes' && lojaId && token) {
            carregarMovimentacoes();
        }
    }, [open, abaAtiva, lojaId, token]);

    const carregarResumoCaixa = async () => {
        if (!API_URL || !lojaId || !token) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/caixas/resumo-dia?loja_id=${lojaId}`, { headers: { "Authorization": `Bearer ${token}` } });
            if (!res.ok) throw new Error("Erro ao buscar caixa");
            const data = await res.json();
            setResumo(data);
        } catch (error) {
            console.error(error);
            setResumo(null);
        }
        finally { setLoading(false); }
    }



    const carregarMovimentacoes = async () => {
        if (!API_URL || !lojaId || !token) return;
        try {
            const hoje = new Date().toISOString().split('T')[0]; // "2026-07-23"
            const res = await fetch(`${API_URL}/caixas/historico?loja_id=${lojaId}&data=${hoje}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Erro ao buscar movimentacoes");
            const data = await res.json();

            const movs: Movimentacao[] = Array.isArray(data.movimentacoes) ? data.movimentacoes : [];

            // Ordena da mais recente para a mais antiga
            const ordenadas = movs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            setMovimentacoes(ordenadas);
        } catch (error) {
            console.error(error);
            setMovimentacoes([]);
        }
    }

    const handleAcaoConcluida = () => {
        setShowSangriaModal(false);
        setShowAberturaModal(false);
        carregarResumoCaixa(); // só isso. O useEffect de baixo pega e busca as movs
        onSave();
    }

    const isCaixaAberto = resumo?.status === 'aberto';

    return (
        <>
            <Dialog open={open} onOpenChange={(v) => { if (!showSangriaModal && !showAberturaModal) onOpenChange(v) }}>
                <DialogContent
                    className="!fixed!inset-0!w-screen!h-[100dvh]!max-w-none!max-h-none!p-0!flex!flex-col!border-0!rounded-none!shadow-none!translate-x-0!translate-y-0 [&>button]:hidden"
                    style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)' }}
                    onInteractOutside={(e) => { if (showSangriaModal || showAberturaModal) e.preventDefault() }}
                    onEscapeKeyDown={(e) => { if (showSangriaModal || showAberturaModal) e.preventDefault() }}
                >
                    <DialogHeader className="p-4 sm:p-6 border-b shrink-0 flex-row items-center justify-between" style={{ borderColor: 'color-mix(in srgb, var(--cor-borda) 20%, transparent)', backgroundColor: 'var(--cor-card)' }}>
                        <div>
                            <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2" style={{ color: 'var(--cor-texto)' }}>
                                <Wallet size={20} style={{ color: 'var(--cor-primaria)' }} /> Gestão de Caixa
                            </DialogTitle>
                            <DialogDescription className="text-xs sm:text-sm" style={{ color: 'var(--cor-texto-sec)' }}>
                                Controle do dinheiro físico da loja
                            </DialogDescription>
                        </div>

                        <button
                            onClick={() => onOpenChange(false)}
                            className="h-10 w-10 sm:h-11 sm:w-11 flex items-center justify-center rounded-lg transition hover:opacity-90 shrink-0"
                            style={{ background: 'var(--cor-erro)', color: '#fff' }}
                            aria-label="Fechar"
                        >
                            <X size={22} strokeWidth={3} />
                        </button>
                    </DialogHeader>

                    <div className="flex gap-1 px-4 sm:px-6 border-b shrink-0" style={{ borderColor: 'color-mix(in srgb, var(--cor-borda) 20%, transparent)', backgroundColor: 'transparent' }}>
                        <TabButton label="Resumo" icon={<Wallet size={16} />} active={abaAtiva === 'resumo'} onClick={() => setAbaAtiva('resumo')} />
                        <TabButton label="Movimentações" icon={<FileText size={16} />} active={abaAtiva === 'movimentacoes'} onClick={() => setAbaAtiva('movimentacoes')} />
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 sm:p-6 min-h-0 pb-8">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full gap-2">
                                <Loader2 className="animate-spin" size={32} style={{ color: 'var(--cor-primaria)' }} />
                            </div>
                        ) : (
                            <>
                                {abaAtiva === 'resumo' && <AbaResumo resumo={resumo} isCaixaAberto={isCaixaAberto} onAbrir={() => setShowAberturaModal(true)} onSangria={() => setShowSangriaModal(true)} />}
                                {abaAtiva === 'movimentacoes' && <AbaMovimentacoes movimentacoes={movimentacoes} />}
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <SangriaModal open={showSangriaModal} onOpenChange={setShowSangriaModal} onSave={handleAcaoConcluida} token={token} lojaId={lojaId} />

            <AberturaFechamentoModal
                open={showAberturaModal}
                onOpenChange={setShowAberturaModal}
                onSave={handleAcaoConcluida}
                token={token}
                lojaId={lojaId}
                statusAtual={resumo?.status}
                valorEsperado={resumo?.saldo_atual || 0}
                caixaId={resumo?.id}
            />
        </>
    )
}

function TabButton({ label, icon, active, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className="relative flex items-center gap-2 px-3 sm:px-4 py-3 font-semibold text-sm transition rounded-t-lg"
            style={{
                color: active ? 'var(--cor-primaria)' : 'var(--cor-texto-sec)',
                backgroundColor: active ? 'color-mix(in srgb, var(--cor-primaria) 8%, transparent)' : 'transparent'
            }}
            onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--cor-primaria) 8%, transparent)'
            }}
            onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.backgroundColor = 'transparent'
            }}
        >
            {icon} {label}
            {active && <div className="absolute -bottom-px left-0 right-0 h-0.5" style={{ background: 'var(--cor-primaria)' }} />}
        </button>
    )
}

function AbaResumo({ resumo, isCaixaAberto, onAbrir, onSangria }: { resumo: CaixaResumo | null, isCaixaAberto: boolean, onAbrir: () => void, onSangria: () => void }) {

    const statusConfig = isCaixaAberto ? {
        cor: 'var(--cor-sucesso)',
        bg: 'color-mix(in srgb, var(--cor-sucesso) 8%, transparent)',
        border: 'color-mix(in srgb, var(--cor-sucesso) 25%, transparent)',
        icon: <CheckCircle size={22} />,
        titulo: 'Caixa Aberto',
        subtitulo: 'Operações liberadas. Registre vendas e sangrias.'
    } : {
        cor: 'var(--cor-erro)',
        bg: 'color-mix(in srgb, var(--cor-erro) 8%, transparent)',
        border: 'color-mix(in srgb, var(--cor-erro) 25%, transparent)',
        icon: <Lock size={22} />,
        titulo: 'Caixa Fechado',
        subtitulo: 'Abra o caixa para iniciar as operações do dia.'
    }

    const CardMetrica = ({ titulo, valor, cor, bg, border, icon }: any) => (
        <div
            className="w-full transition hover:scale-[1.02]"
            style={{
                background: bg,
                padding: '18px',
                borderRadius: 'var(--radius)',
                border: `1.5px solid ${border}`
            }}
        >
            <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold" style={{ color: 'var(--cor-texto-sec)' }}>{titulo}</p>
                <div
                    className="p-2 rounded-lg"
                    style={{ background: 'color-mix(in srgb, var(--cor-fundo) 50%, transparent)', color: cor }}
                >
                    {icon}
                </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: cor }}>{formatCurrency(valor)}</p>
        </div>
    )

    return (
        <div className="space-y-4 pb-4">
            <div className="p-4 sm:p-5 rounded-xl" style={{ background: statusConfig.bg, border: `1.5px solid ${statusConfig.border}` }}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div style={{ color: statusConfig.cor }}>{statusConfig.icon}</div>
                        <div>
                            <p className="text-lg font-bold" style={{ color: statusConfig.cor }}>{statusConfig.titulo}</p>
                            <p className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>{statusConfig.subtitulo}</p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Button
                            onClick={onAbrir}
                            className="w-full sm:w-auto h-10 px-4 flex items-center justify-center gap-2 font-bold text-xs"
                            style={{ background: statusConfig.cor, color: '#fff', borderRadius: 'var(--radius-sm)' }}
                        >
                            {isCaixaAberto ? <Lock size={16} /> : <Unlock size={16} />}
                            {isCaixaAberto ? 'Fechar Caixa' : 'Abrir Caixa'}
                        </Button>
                        <Button
                            onClick={onSangria}
                            disabled={!isCaixaAberto}
                            className="w-full sm:w-auto h-10 px-4 flex items-center justify-center gap-2 font-bold text-xs disabled:opacity-40"
                            style={{ background: 'var(--cor-aviso)', color: '#fff', borderRadius: 'var(--radius-sm)' }}
                        >
                            <Minus size={16} /> Sangria
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CardMetrica
                    titulo="Saldo Abertura"
                    valor={resumo?.saldo_abertura || 0}
                    icon={<Banknote size={18} />}
                    cor="var(--cor-primaria)"
                    bg="color-mix(in srgb, var(--cor-primaria) 6%, transparent)"
                    border="color-mix(in srgb, var(--cor-primaria) 20%, transparent)"
                />
                <CardMetrica
                    titulo="Entradas Hoje"
                    valor={resumo?.entradas_hoje || 0}
                    icon={<TrendingUp size={18} />}
                    cor="var(--cor-sucesso)"
                    bg="color-mix(in srgb, var(--cor-sucesso) 6%, transparent)"
                    border="color-mix(in srgb, var(--cor-sucesso) 20%, transparent)"
                />
                <CardMetrica
                    titulo="Saídas/Sangrias"
                    valor={resumo?.saidas_hoje || 0}
                    icon={<TrendingDown size={18} />}
                    cor="var(--cor-erro)"
                    bg="color-mix(in srgb, var(--cor-erro) 6%, transparent)"
                    border="color-mix(in srgb, var(--cor-erro) 20%, transparent)"
                />
            </div>

            <div className="p-5 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                style={{
                    background: 'color-mix(in srgb, var(--cor-sucesso) 4%, transparent)',
                    border: '2px solid var(--cor-sucesso)'
                }}
            >
                <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--cor-texto-sec)' }}>Saldo Atual em Caixa</p>
                    <p className="text-3xl font-bold mt-1" style={{ color: 'var(--cor-primaria)' }}>{formatCurrency(resumo?.saldo_atual || 0)}</p>
                </div>
                <p className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>Valor esperado no fechamento</p>
            </div>
        </div>
    )
}


function AbaMovimentacoes({ movimentacoes }: { movimentacoes: Movimentacao[] }) {
    const [dataSelecionada, setDataSelecionada] = useState(new Date().toISOString().split('T')[0]);

    const getIcon = (tipo: string) => {
        if (tipo === 'entrada' || tipo === 'abertura') return <ArrowUpRight size={16} className="text-[var(--cor-sucesso)]" />;
        return <ArrowDownRight size={16} className="text-[var(--cor-erro)]" />;
    }

    const movimentacoesFiltradas = movimentacoes.filter(mov => {
        const dataMov = new Date(mov.created_at).toISOString().split('T')[0];
        return dataMov === dataSelecionada;
    });

    if (movimentacoesFiltradas.length === 0) {
        return (
            <div className="flex flex-col h-full">
                <div className="sticky top-0 z-10 p-3 rounded-lg mb-4"
                    style={{ background: 'var(--cor-card)', border: '1px solid color-mix(in srgb, var(--cor-borda) 20%, transparent)' }}>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="flex items-center gap-2">
                            <Calendar size={18} style={{ color: 'var(--cor-primaria)' }} />
                            <label className="text-sm font-semibold whitespace-nowrap">Ver histórico de:</label>
                        </div>
                        <Input type="date" value={dataSelecionada} onChange={(e) => setDataSelecionada(e.target.value)} className="w-full sm:w-auto h-9" />
                    </div>
                </div>
                {/* AJUSTE 2: Centralizado */}
                <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-6 text-center"
                    style={{ borderColor: 'var(--cor-borda)', background: 'var(--cor-card)' }}>
                    <Inbox size={32} style={{ color: 'var(--cor-texto-sec)' }} />
                    <h3 className="font-semibold">Nenhuma movimentação nesta data</h3>
                    <p className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>Tente selecionar outra data</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            <div className="sticky top-0 z-10 p-3 rounded-lg mb-4"
                style={{ background: 'var(--cor-card)', border: '1px solid color-mix(in srgb, var(--cor-borda) 20%, transparent)' }}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex items-center gap-2">
                        <Calendar size={18} style={{ color: 'var(--cor-primaria)' }} />
                        <label className="text-sm font-semibold whitespace-nowrap">Ver histórico de:</label>
                    </div>
                    <Input type="date" value={dataSelecionada} onChange={(e) => setDataSelecionada(e.target.value)} className="w-full sm:w-auto h-9" />
                </div>
            </div>
            {/* AJUSTE 1: Scroll Y invisível */}
            <div className="flex-1 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <div className="space-y-2 pb-8">
                    {movimentacoesFiltradas.map(mov => (
                        <div key={mov.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--cor-card)', border: '1px solid color-mix(in srgb, var(--cor-borda) 20%, transparent)' }}>
                            <div className="flex items-center gap-3">
                                {getIcon(mov.tipo)}
                                <div>
                                    <p className="font-semibold text-sm">{mov.descricao}</p>
                                    <p className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>{formatDateTime(mov.created_at)}</p>
                                </div>
                            </div>
                            <p className={`font-bold text-sm ${mov.tipo === 'entrada' || mov.tipo === 'abertura' ? 'text-[var(--cor-sucesso)]' : 'text-[var(--cor-erro)]'}`}>
                                {mov.tipo === 'entrada' || mov.tipo === 'abertura' ? '+' : '-'} {formatCurrency(mov.valor)}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
