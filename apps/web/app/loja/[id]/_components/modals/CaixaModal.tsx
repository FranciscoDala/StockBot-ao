"use client";
import { useState, useEffect } from "react";
import { X, Wallet, ArrowUpRight, ArrowDownRight, FileText, Plus, Minus, CheckCircle, Lock, Unlock, Loader2 } from "lucide-react";
import { formatCurrency } from "../utils";
import { SangriaModal } from "./SangriaModal"; // <- NOVO
import { AberturaFechamentoModal } from "./AberturaFechamentoModal"; // <- NOVO

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
    status: 'aberto' | 'fechado' // <- pra saber o botão
}

export function CaixaModal({ open, onOpenChange, lojaId, token }: Props) {
    const [abaAtiva, setAbaAtiva] = useState<'resumo' | 'movimentacoes' | 'fechamento'>('resumo');
    const [resumo, setResumo] = useState<CaixaResumo | null>(null);
    const [loading, setLoading] = useState(false);

    // STATES DAS SUB-MODAIS
    const [showSangriaModal, setShowSangriaModal] = useState(false);
    const [showAberturaModal, setShowAberturaModal] = useState(false);

    useEffect(() => {
        if (open && lojaId && token && !showSangriaModal && !showAberturaModal) { // <- SÓ RECARREGA SE AS OUTRAS ESTIVEREM FECHADAS
            carregarResumoCaixa();
        }
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape' && !showSangriaModal && !showAberturaModal) onOpenChange(false) }; // <- SÓ FECHA SE NENHUMA FILHA ESTIVER ABERTA
        window.addEventListener('keydown', handleEsc);
        return () => {
            window.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        }
    }, [open, lojaId, token, showSangriaModal, showAberturaModal]);

    const carregarResumoCaixa = async () => {
        if (!API_URL) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/caixa/resumo?loja_id=${lojaId}`, { headers: { "Authorization": `Bearer ${token}` } });
            if (!res.ok) throw new Error("Erro ao buscar caixa");
            const data = await res.json();
            setResumo(data);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    }

    const handleAcaoConcluida = () => { // <- PRA ATUALIZAR QUANDO FECHAR AS FILHAS
        setShowSangriaModal(false);
        setShowAberturaModal(false);
        carregarResumoCaixa();
    }

    if (!open) return null;
    const radius = '16px';

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in" onClick={() => { if(!showSangriaModal && !showAberturaModal) onOpenChange(false) }}> {/* <- TRAVA */}
                <div className="w-full h-full flex flex-col" style={{ background: 'var(--cor-fundo)' }} onClick={(e) => e.stopPropagation()}>

                    {/* HEADER PADRONIZADO IGUAL PRINT */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 sm:p-6 border-b" style={{ borderColor: 'color-mix(in srgb, var(--cor-borda) 30%, transparent)' }}>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--cor-texto)' }}>
                                Gestão de Caixa <Wallet size={16} style={{ color: 'var(--cor-primaria)' }} />
                            </h2>
                            <p className="text-xs sm:text-sm" style={{ color: 'var(--cor-texto-sec)' }}>Controle do dinheiro físico da loja</p>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button onClick={() => setShowAberturaModal(true)} className="flex-1 sm:flex-none min-w-[160px] h-10 px-4 flex items-center justify-center gap-2 font-semibold transition hover:opacity-90 text-sm whitespace-nowrap" style={{ background: resumo?.status === 'aberto' ? '#ef4444' : '#22c55e', color: '#fff', borderRadius: radius }}>
                                {resumo?.status === 'aberto' ? <Lock size={16} /> : <Unlock size={16} />} {resumo?.status === 'aberto' ? 'Fechar Caixa' : 'Abrir Caixa'}
                            </button>
                            <button onClick={() => setShowSangriaModal(true)} className="flex-1 sm:flex-none min-w-[140px] h-10 px-4 flex items-center justify-center gap-2 font-semibold transition hover:opacity-90 text-sm whitespace-nowrap" style={{ background: '#f97316', color: '#fff', borderRadius: radius }}>
                                <Minus size={16} /> Fazer Sangria
                            </button>
                        </div>
                    </div>

                    {/* TABS */}
                    <div className="flex gap-2 p-4 sm:p-6 border-b overflow-x-auto whitespace-nowrap scrollbar-none" style={{ borderColor: 'color-mix(in srgb, var(--cor-borda) 30%, transparent)' }}>
                        <TabButton label="Resumo" icon={<Wallet size={16} />} active={abaAtiva === 'resumo'} onClick={() => setAbaAtiva('resumo')} />
                        <TabButton label="Movimentações" icon={<FileText size={16} />} active={abaAtiva === 'movimentacoes'} onClick={() => setAbaAtiva('movimentacoes')} />
                        <TabButton label="Fechamento" icon={<CheckCircle size={16} />} active={abaAtiva === 'fechamento'} onClick={() => setAbaAtiva('fechamento')} />
                    </div>

                    {/* CONTEUDO */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                        {loading ? (<div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" size={32} /></div>) : (
                            <>
                                {abaAtiva === 'resumo' && <AbaResumo resumo={resumo} cardStyle="padrao" cardSize="normal" />} {/* <- PADRAO */}
                                {abaAtiva === 'movimentacoes' && <AbaMovimentacoes />}
                                {abaAtiva === 'fechamento' && <AbaFechamento resumo={resumo} />}
                            </>
                        )}
                    </div>

                    {/* RODAPÉ */}
                    <div className="py-2 px-4 sm:p-6 border-t flex justify-end" style={{ borderColor: 'color-mix(in srgb, var(--cor-borda) 30%, transparent)', background: 'color-mix(in srgb, var(--cor-card) 90%, transparent)' }}>
                        <button onClick={() => onOpenChange(false)} className="h-11 px-6 flex items-center justify-center gap-2 font-semibold transition hover:opacity-90 text-sm w-full sm:w-auto" style={{ background: 'transparent', color: 'var(--cor-texto)', borderRadius: radius, border: '1px solid color-mix(in srgb, var(--cor-borda) 50%, transparent)' }}>
                            <X size={18} /> Fechar
                        </button>
                    </div>
                </div>
                <style jsx>{`.scrollbar-none::-webkit-scrollbar { display: none; } .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
            </div>

            {/* SUB-MODAIS - FICAM POR CIMA E NÃO FECHAM A PAI */}
            <SangriaModal open={showSangriaModal} onOpenChange={setShowSangriaModal} onSave={handleAcaoConcluida} token={token} lojaId={lojaId} />
            <AberturaFechamentoModal open={showAberturaModal} onOpenChange={setShowAberturaModal} onSave={handleAcaoConcluida} token={token} lojaId={lojaId} statusAtual={resumo?.status} />
        </>
    )
}

function TabButton({ label, icon, active, onClick }: any) {
    return (<button onClick={onClick} className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition flex-shrink-0" style={{ background: active ? 'var(--cor-primaria)' : 'transparent', color: active ? '#fff' : 'var(--cor-texto-sec)', border: `1px solid ${active ? 'var(--cor-primaria)' : 'color-mix(in srgb, var(--cor-borda) 40%, transparent)'}` }}>{icon} {label}</button>)
}

// ABAS COM CARDS PADRAO IGUAL PRINT
function AbaResumo({ resumo, cardStyle, cardSize }: { resumo: CaixaResumo | null, cardStyle: string, cardSize: string }) {
    const radius = cardStyle === 'arredondado'? '16px' : '8px';
    const padding = cardSize === 'grande'? '20px' : '16px';

    const CardPadrao = ({titulo, valor, cor, icon, descricao}: any) => (
        <div className="transition hover:scale-[1.02] w-full" style={{ background: 'color-mix(in srgb, var(--cor-card) 75%, transparent)', backdropFilter: 'blur(12px)', color: cor, padding, borderRadius: radius, border: `1px solid color-mix(in srgb, ${cor} 30%, transparent)`, boxShadow: `0 0 25px color-mix(in srgb, ${cor} 15%, transparent)` }}>
            <div className="flex items-center justify-between mb-2">
                <p className="text-xs md:text-sm font-medium truncate" style={{ opacity: 0.9, color: cor }}>{titulo}</p>
                <div style={{ color: cor }}>{icon}</div>
            </div>
            <p className="text-xl md:text-2xl font-bold truncate" style={{ color: cor }}>{formatCurrency(valor)}</p> {/* <- TAMANHO NORMAL */}
            <p className="text-xs md:text-xs mt-1 truncate" style={{ opacity: 0.8, color: cor }}>{descricao}</p>
        </div>
    )

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CardPadrao titulo="Saldo Abertura" valor={resumo?.saldo_abertura || 0} cor="#3b82f6" icon={<Wallet size={16}/>} descricao="Valor inicial do caixa" />
                <CardPadrao titulo="Entradas Hoje" valor={resumo?.entradas_hoje || 0} cor="#22c55e" icon={<ArrowUpRight size={16}/>} descricao="Total de vendas em dinheiro" />
                <CardPadrao titulo="Saídas/Sangrias" valor={resumo?.saidas_hoje || 0} cor="#ef4444" icon={<ArrowDownRight size={16}/>} descricao="Retiradas do dia" />
            </div>
            <div className="p-6 rounded-2xl" style={{ background: 'color-mix(in srgb, var(--cor-primaria) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--cor-primaria) 40%, transparent)' }}>
                <p className="text-sm opacity-80">Saldo Atual em Caixa</p>
                <p className="text-2xl font-bold mt-1" style={{ color: 'var(--cor-primaria)' }}>{formatCurrency(resumo?.saldo_atual || 0)}</p>
            </div>
        </div>
    )
}

function AbaMovimentacoes() { return (<div className="p-4 rounded-xl" style={{ background: 'color-mix(in srgb, var(--cor-card) 85%, transparent)' }}><h3 className="font-bold mb-3">Histórico de Hoje</h3><p className="text-sm opacity-70">Venda Dinheiro #A1B2C3 + 10.000 KZ</p></div>) }
function AbaFechamento({ resumo }: { resumo: CaixaResumo | null }) { return (<div className="p-4 rounded-xl" style={{ background: 'color-mix(in srgb, var(--cor-card) 85%, transparent)' }}><h3 className="font-bold mb-3">Fechar Caixa do Dia</h3><p className="text-sm opacity-70">Saldo esperado: {formatCurrency(resumo?.saldo_atual || 0)}</p></div>) }
