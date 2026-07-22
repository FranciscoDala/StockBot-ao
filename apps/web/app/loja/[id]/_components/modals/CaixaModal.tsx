"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Wallet, ArrowUpRight, ArrowDownRight, FileText, CheckCircle, Lock, Unlock, Loader2, Inbox, Minus } from "lucide-react";
import { formatCurrency, formatDateTime } from "../utils"; // <- adicionei formatDateTime
import { SangriaModal } from "./SangriaModal";
import { AberturaFechamentoModal } from "./AberturaFechamentoModal";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    lojaId: string;
    token: string;
}

type CaixaResumo = {
    id: string; // <- ADICIONA
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

export function CaixaModal({ open, onOpenChange, lojaId, token }: Props) {
    const [abaAtiva, setAbaAtiva] = useState<'resumo' | 'movimentacoes'>('resumo');
    const [resumo, setResumo] = useState<CaixaResumo | null>(null);
    const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
    const [loading, setLoading] = useState(false);

    const [showSangriaModal, setShowSangriaModal] = useState(false);
    const [showAberturaModal, setShowAberturaModal] = useState(false);

    useEffect(() => {
        if (open && lojaId && token && !showSangriaModal && !showAberturaModal) {
            carregarResumoCaixa();
            if (abaAtiva === 'movimentacoes') carregarMovimentacoes();
        }
        if (open) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; }
    }, [open, lojaId, token, showSangriaModal, showAberturaModal, abaAtiva]);


    const carregarResumoCaixa = async () => {
        if (!API_URL || !lojaId || !token) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/caixas/resumo?loja_id=${lojaId}`, { headers: { "Authorization": `Bearer ${token}` } });
            if (!res.ok) throw new Error("Erro ao buscar caixa");
            const data = await res.json();
            setResumo(data);
        } catch (error) {
            console.error(error);
            setResumo(null); // <- limpa se der 404
        }
        finally { setLoading(false); }
    }

    const carregarMovimentacoes = async () => {
        if (!API_URL || !lojaId || !token || !resumo?.id) return; // <- usa resumo.id direto

        try {
            const res = await fetch(`${API_URL}/caixas/${resumo.id}/movimentacoes`, { // <- ROTA MELHOR
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Erro ao buscar movimentacoes");
            const data = await res.json();
            setMovimentacoes(data);
        } catch (error) { console.error(error); setMovimentacoes([]); }
    }



    const handleAcaoConcluida = () => {
        setShowSangriaModal(false);
        setShowAberturaModal(false);
        carregarResumoCaixa();
        carregarMovimentacoes();
    }

    const isCaixaAberto = resumo?.status === 'aberto';

    return (
        <>
            <Dialog open={open} onOpenChange={(v) => { if (!showSangriaModal && !showAberturaModal) onOpenChange(v) }}>
                <DialogContent
                    className="!fixed !inset-0 !w-screen !h-screen !max-w-none !max-h-none !p-0 !flex !flex-col !border-0 !rounded-none !shadow-none !translate-x-0 !translate-y-0 [&>button]:hidden"
                    style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)' }}
                    onInteractOutside={(e) => { if (showSangriaModal || showAberturaModal) e.preventDefault() }}
                    onEscapeKeyDown={(e) => { if (showSangriaModal || showAberturaModal) e.preventDefault() }}
                >
                    {/* HEADER FIXO */}
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

                    {/* TABS */}
                    <div className="flex gap-1 px-4 sm:px-6 border-b shrink-0" style={{ borderColor: 'color-mix(in srgb, var(--cor-borda) 20%, transparent)', backgroundColor: 'var(--cor-card)' }}>
                        <TabButton label="Resumo" icon={<Wallet size={16} />} active={abaAtiva === 'resumo'} onClick={() => setAbaAtiva('resumo')} />
                        <TabButton label="Movimentações" icon={<FileText size={16} />} active={abaAtiva === 'movimentacoes'} onClick={() => setAbaAtiva('movimentacoes')} />
                    </div>

                    {/* CONTEUDO SCROLL */}
                    <div className="flex-1 overflow-y-auto px-4 sm:p-6 min-h-0">
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
            <AberturaFechamentoModal open={showAberturaModal} onOpenChange={setShowAberturaModal} onSave={handleAcaoConcluida} token={token} lojaId={lojaId} statusAtual={resumo?.status} />
        </>
    )
}

function TabButton({ label, icon, active, onClick }: any) {
    return (
        <button onClick={onClick} className="relative flex items-center gap-2 px-3 sm:px-4 py-3 font-semibold text-sm transition"
            style={{ color: active ? 'var(--cor-primaria)' : 'var(--cor-texto-sec)' }}>
            {icon} {label}
            {active && <div className="absolute -bottom-px left-0 right-0 h-0.5" style={{ background: 'var(--cor-primaria)' }} />}
        </button>
    )
}

// ABAS
function AbaResumo({ resumo, isCaixaAberto, onAbrir, onSangria }: { resumo: CaixaResumo | null, isCaixaAberto: boolean, onAbrir: () => void, onSangria: () => void }) {
    const CardPadrao = ({ titulo, valor, corVar, icon, descricao }: any) => (
        <div className="w-full" style={{ background: 'var(--cor-card)', padding: '16px', borderRadius: 'var(--radius)', border: `1px solid color-mix(in srgb, ${corVar} 30%, transparent)` }}>
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium" style={{ color: 'var(--cor-texto-sec)' }}>{titulo}</p>
                <div style={{ color: corVar }}>{icon}</div>
            </div>
            <p className="text-2xl font-bold" style={{ color: corVar }}>{formatCurrency(valor)}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--cor-texto-sec)' }}>{descricao}</p>
        </div>
    )

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
                <Button
                    onClick={onAbrir}
                    className="w-full sm:w-auto h-11 px-5 flex items-center justify-center gap-2 font-bold text-sm"
                    style={{ background: isCaixaAberto ? 'var(--cor-erro)' : 'var(--cor-sucesso)', color: '#fff', borderRadius: 'var(--radius)' }}
                >
                    {isCaixaAberto ? <Lock size={16} /> : <Unlock size={16} />} {isCaixaAberto ? 'Fechar Caixa' : 'Abrir Caixa'}
                </Button>
                <Button
                    onClick={onSangria}
                    disabled={!isCaixaAberto}
                    className="w-full sm:w-auto h-11 px-5 flex items-center justify-center gap-2 font-bold text-sm disabled:opacity-50"
                    style={{ background: 'var(--cor-aviso)', color: '#fff', borderRadius: 'var(--radius)' }}
                >
                    <Minus size={16} /> Fazer Sangria
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <CardPadrao titulo="Saldo Abertura" valor={resumo?.saldo_abertura || 0} corVar="var(--cor-info)" icon={<Wallet size={16} />} descricao="Valor inicial do caixa" />
                <CardPadrao titulo="Entradas Hoje" valor={resumo?.entradas_hoje || 0} corVar="var(--cor-sucesso)" icon={<ArrowUpRight size={16} />} descricao="Total de vendas em dinheiro" />
                <CardPadrao titulo="Saídas/Sangrias" valor={resumo?.saidas_hoje || 0} corVar="var(--cor-erro)" icon={<ArrowDownRight size={16} />} descricao="Retiradas do dia" />
                <div className="p-5 rounded-xl flex flex-col justify-center" style={{ background: 'color-mix(in srgb, var(--cor-primaria) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--cor-primaria) 30%, transparent)' }}>
                    <p className="text-sm" style={{ color: 'var(--cor-texto-sec)' }}>Saldo Atual</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: 'var(--cor-primaria)' }}>{formatCurrency(resumo?.saldo_atual || 0)}</p>
                </div>
            </div>
        </div>
    )
}

function AbaMovimentacoes({ movimentacoes }: { movimentacoes: Movimentacao[] }) {
    if (movimentacoes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-2 rounded-xl border-dashed" style={{ borderColor: 'var(--cor-borda)', background: 'var(--cor-card)' }}>
                <Inbox size={32} style={{ color: 'var(--cor-texto-sec)' }} />
                <h3 className="font-semibold">Nenhuma movimentação hoje</h3>
            </div>
        )
    }

    const getIcon = (tipo: string) => {
        if (tipo === 'entrada' || tipo === 'abertura') return <ArrowUpRight size={16} className="text-[var(--cor-sucesso)]" />;
        return <ArrowDownRight size={16} className="text-[var(--cor-erro)]" />;
    }

    return (
        <div className="space-y-2">
            {movimentacoes.map(mov => (
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
    )
}
