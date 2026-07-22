"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Wallet, ArrowUpRight, ArrowDownRight, FileText, CheckCircle, Lock, Unlock, Loader2, Inbox } from "lucide-react";
import { formatCurrency } from "../utils";
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
    saldo_abertura: number;
    entradas_hoje: number;
    saidas_hoje: number;
    saldo_atual: number;
    status: 'aberto' | 'fechado'
}

export function CaixaModal({ open, onOpenChange, lojaId, token }: Props) {
    const [abaAtiva, setAbaAtiva] = useState<'resumo' | 'movimentacoes' | 'fechamento'>('resumo');
    const [resumo, setResumo] = useState<CaixaResumo | null>(null);
    const [loading, setLoading] = useState(false);

    const [showSangriaModal, setShowSangriaModal] = useState(false);
    const [showAberturaModal, setShowAberturaModal] = useState(false);

    useEffect(() => {
        if (open && lojaId && token && !showSangriaModal && !showAberturaModal) {
            carregarResumoCaixa();
        }
        if (open) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; }
    }, [open, lojaId, token, showSangriaModal, showAberturaModal]);

    const carregarResumoCaixa = async () => {
        if (!API_URL || !lojaId || !token) return; // <- PROTEÇÃO
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/caixa/resumo?loja_id=${lojaId}`, { headers: { "Authorization": `Bearer ${token}` } });
            if (!res.ok) throw new Error("Erro ao buscar caixa");
            const data = await res.json();
            setResumo(data);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    }

    const handleAcaoConcluida = () => {
        setShowSangriaModal(false);
        setShowAberturaModal(false);
        carregarResumoCaixa();
    }

    const isCaixaAberto = resumo?.status === 'aberto';

    return (
        <>
            <Dialog open={open} onOpenChange={(v) => { if(!showSangriaModal && !showAberturaModal) onOpenChange(v) }}>
                <DialogContent
                    className="!fixed !inset-0 !w-screen !h-screen !max-w-none !max-h-none !p-0 !flex !flex-col !border-0 !rounded-none !shadow-none !translate-x-0 !translate-y-0" // <- AQUI É O SEGREDO
                    style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)' }}
                    onInteractOutside={(e) => { if(showSangriaModal || showAberturaModal) e.preventDefault() }}
                    onEscapeKeyDown={(e) => { if(showSangriaModal || showAberturaModal) e.preventDefault() }}
                >
                    {/* HEADER FIXO */}
                    <DialogHeader className="p-4 sm:p-6 pb-4 border-b shrink-0" style={{ borderColor: 'color-mix(in srgb, var(--cor-borda) 20%, transparent)', backgroundColor: 'var(--cor-card)' }}>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2" style={{ color: 'var(--cor-texto)' }}>
                                    <Wallet size={20} style={{ color: 'var(--cor-primaria)' }} /> Gestão de Caixa
                                </DialogTitle>
                                <DialogDescription className="text-xs sm:text-sm" style={{ color: 'var(--cor-texto-sec)' }}>
                                    Controle do dinheiro físico da loja
                                </DialogDescription>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <Button
                                    onClick={() => setShowAberturaModal(true)}
                                    className="flex-1 sm:flex-none min-w-[160px] h-10 px-4 flex items-center justify-center gap-2 font-semibold text-sm whitespace-nowrap"
                                    style={{ background: isCaixaAberto ? 'var(--cor-erro)' : 'var(--cor-sucesso)', color: '#fff', borderRadius: 'var(--radius)' }}
                                >
                                    {isCaixaAberto ? <Lock size={16} /> : <Unlock size={16} />} {isCaixaAberto ? 'Fechar Caixa' : 'Abrir Caixa'}
                                </Button>
                                <Button
                                    onClick={() => setShowSangriaModal(true)}
                                    disabled={!isCaixaAberto}
                                    className="flex-1 sm:flex-none min-w-[140px] h-10 px-4 flex items-center justify-center gap-2 font-semibold text-sm whitespace-nowrap disabled:opacity-50"
                                    style={{ background: 'var(--cor-aviso)', color: '#fff', borderRadius: 'var(--radius)' }}
                                >
                                    <Minus size={16} /> Fazer Sangria
                                </Button>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* TABS */}
                    <div className="flex gap-1 p-2 px-4 sm:px-6 border-b shrink-0" style={{ borderColor: 'color-mix(in srgb, var(--cor-borda) 20%, transparent)', backgroundColor: 'var(--cor-card)' }}>
                        <TabButton label="Resumo" icon={<Wallet size={16} />} active={abaAtiva === 'resumo'} onClick={() => setAbaAtiva('resumo')} />
                        <TabButton label="Movimentações" icon={<FileText size={16} />} active={abaAtiva === 'movimentacoes'} onClick={() => setAbaAtiva('movimentacoes')} />
                        <TabButton label="Fechamento" icon={<CheckCircle size={16} />} active={abaAtiva === 'fechamento'} onClick={() => setAbaAtiva('fechamento')} />
                    </div>

                    {/* CONTEUDO SCROLL */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full gap-2">
                                <Loader2 className="animate-spin" size={32} style={{ color: 'var(--cor-primaria)' }} />
                            </div>
                        ) : (
                            <>
                                {abaAtiva === 'resumo' && <AbaResumo resumo={resumo} />}
                                {abaAtiva === 'movimentacoes' && <AbaMovimentacoes />}
                                {abaAtiva === 'fechamento' && <AbaFechamento resumo={resumo} />}
                            </>
                        )}
                    </div>

                    {/* RODAPÉ FIXO */}
                    <DialogFooter className="p-4 sm:p-6 pt-4 border-t shrink-0 flex-row justify-between" style={{ backgroundColor: 'var(--cor-card)', borderColor: 'color-mix(in srgb, var(--cor-borda) 20%, transparent)' }}>
                        <p className="text-xs self-center" style={{ color: 'var(--cor-texto-sec)' }}>
                            Status: <span className="font-semibold" style={{ color: isCaixaAberto? 'var(--cor-sucesso)' : 'var(--cor-erro)' }}>{isCaixaAberto? 'CAIXA ABERTO' : 'CAIXA FECHADO'}</span>
                        </p>
                        <DialogClose asChild>
                            <Button type="button" variant="outline" className="h-10 px-6 flex items-center justify-center gap-2 font-semibold text-sm">
                                <X size={18} /> Fechar
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <SangriaModal open={showSangriaModal} onOpenChange={setShowSangriaModal} onSave={handleAcaoConcluida} token={token} lojaId={lojaId} />
            <AberturaFechamentoModal open={showAberturaModal} onOpenChange={setShowAberturaModal} onSave={handleAcaoConcluida} token={token} lojaId={lojaId} statusAtual={resumo?.status} />
        </>
    )
}

function TabButton({ label, icon, active, onClick }: any) {
    return (
        <button onClick={onClick} className="relative flex items-center gap-2 px-4 py-2 rounded-md font-semibold text-sm transition"
        style={{ color: active ? 'var(--cor-primaria)' : 'var(--cor-texto-sec)' }}>
            {icon} {label}
            {active && <div className="absolute -bottom-2 left-0 right-0 h-0.5" style={{ background: 'var(--cor-primaria)' }} />}
        </button>
    )
}

function AbaResumo({ resumo }: { resumo: CaixaResumo | null }) {
    const CardPadrao = ({titulo, valor, corVar, icon, descricao}: any) => (
        <div className="transition hover:-translate-y-1 w-full" style={{ background: 'color-mix(in srgb, var(--cor-card) 80%, transparent)', backdropFilter: 'blur(12px)', padding: '16px', borderRadius: 'var(--radius)', border: `1px solid color-mix(in srgb, ${corVar} 30%, transparent)` }}>
            <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium" style={{ color: 'var(--cor-texto-sec)' }}>{titulo}</p>
                <div style={{ color: corVar }}>{icon}</div>
            </div>
            <p className="text-2xl font-bold" style={{ color: corVar }}>{formatCurrency(valor)}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--cor-texto-sec)' }}>{descricao}</p>
        </div>
    )

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CardPadrao titulo="Saldo Abertura" valor={resumo?.saldo_abertura || 0} corVar="var(--cor-info)" icon={<Wallet size={16}/>} descricao="Valor inicial do caixa" />
                <CardPadrao titulo="Entradas Hoje" valor={resumo?.entradas_hoje || 0} corVar="var(--cor-sucesso)" icon={<ArrowUpRight size={16}/>} descricao="Total de vendas em dinheiro" />
                <CardPadrao titulo="Saídas/Sangrias" valor={resumo?.saidas_hoje || 0} corVar="var(--cor-erro)" icon={<ArrowDownRight size={16}/>} descricao="Retiradas do dia" />
            </div>
            <div className="p-6 rounded-xl" style={{ background: 'color-mix(in srgb, var(--cor-primaria) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--cor-primaria) 30%, transparent)' }}>
                <p className="text-sm" style={{ color: 'var(--cor-texto-sec)' }}>Saldo Atual em Caixa</p>
                <p className="text-3xl font-bold mt-1" style={{ color: 'var(--cor-primaria)' }}>{formatCurrency(resumo?.saldo_atual || 0)}</p>
            </div>
        </div>
    )
}

function AbaMovimentacoes() {
    return (
        <div className="flex flex-col items-center justify-center h-96 gap-2 rounded-xl border-dashed" style={{ borderColor: 'var(--cor-borda)', background: 'color-mix(in srgb, var(--cor-card) 80%, transparent)' }}>
            <Inbox size={32} style={{ color: 'var(--cor-texto-sec)' }} />
            <h3 className="font-semibold">Nenhuma movimentação hoje</h3>
        </div>
    )
}
function AbaFechamento({ resumo }: { resumo: CaixaResumo | null }) {
    return (
        <div className="p-6 rounded-xl space-y-3" style={{ background: 'color-mix(in srgb, var(--cor-card) 80%, transparent)', border: '1px solid var(--cor-borda)' }}>
            <h3 className="font-bold text-lg">Fechamento do Caixa</h3>
            <div className="flex justify-between"><p style={{ color: 'var(--cor-texto-sec)' }}>Saldo Esperado:</p><p className="font-bold">{formatCurrency(resumo?.saldo_atual || 0)}</p></div>
        </div>
    )
}
