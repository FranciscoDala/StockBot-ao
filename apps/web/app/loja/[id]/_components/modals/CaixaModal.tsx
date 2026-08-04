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
    cash_hoje: number; // <- ADICIONA
    tpa_hoje: number; // <- ADICIONA
    saidas_hoje: number;
    saldo_atual: number;
    status: 'aberto' | 'fechado'
}

type Movimentacao = {
    id: string;
    tipo: 'entrada' | 'saida' | 'sangria' | 'abertura' | 'suprimento' | 'fechamento' | 'estorno';
    valor: number;
    descricao: string;
    created_at: string;
    forma_pagamento: string | null; // <- MUDA AQUI. Aceita qualquer string
}

export function CaixaModal({ open, onOpenChange, onSave, lojaId, token }: Props) {
    const [abaAtiva, setAbaAtiva] = useState<'resumo' | 'movimentacoes'>('resumo');
    const [resumo, setResumo] = useState<CaixaResumo | null>(null);
    const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
    const [dataSelecionada, setDataSelecionada] = useState(new Date().toISOString().split('T')[0]); // <- ADICIONA AQUI
    const [resumoMes, setResumoMes] = useState<number>(0);


    const carregarResumoMes = async () => {
        if (!API_URL || !lojaId || !token) return;
        try {
            const res = await fetch(`${API_URL}/caixas/resumo-mes?loja_id=${lojaId}`, { headers: { "Authorization": `Bearer ${token}` } });
            if (!res.ok) throw new Error("Erro ao buscar resumo mes");
            const data = await res.json();
            setResumoMes(data.saidas_mes || 0);
        } catch (error) {
            console.error(error);
            setResumoMes(0);
        }
    }


    const [loading, setLoading] = useState(false);

    const [showSangriaModal, setShowSangriaModal] = useState(false);
    const [showAberturaModal, setShowAberturaModal] = useState(false);

    // 1. Carrega resumo + movimentacoes + controla scroll
    useEffect(() => {
        if (open && lojaId && token && !showSangriaModal && !showAberturaModal) {
            setLoading(true);

            Promise.all([
                carregarResumoCaixa(),
                carregarResumoMes() // <- ADICIONA
            ]).finally(() => setLoading(false));
        }
        if (open) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; }
    }, [open, lojaId, token, showSangriaModal, showAberturaModal]);


    // 2. Carrega movimentacoes quando trocar de aba
    useEffect(() => {
        if (open && abaAtiva === 'movimentacoes' && lojaId && token) {
            setLoading(true);
            carregarMovimentacoes(dataSelecionada).finally(() => setLoading(false)); // <- passa a data
        }
    }, [open, abaAtiva, lojaId, token, dataSelecionada]); // <- adiciona dataSelecionada aqui




    const carregarResumoCaixa = async () => {
        if (!API_URL || !lojaId || !token) return;
        try {
            const res = await fetch(`${API_URL}/caixas/resumo-dia?loja_id=${lojaId}`, { headers: { "Authorization": `Bearer ${token}` } });
            if (!res.ok) throw new Error("Erro ao buscar caixa");
            const data = await res.json();

            console.log("=== RESPOSTA /resumo-dia ===", data); // <- LOG 1
            console.log("resumo que vai setar:", data.resumo || data); // <- LOG 2

            setResumo(data.resumo || data);

            if (Array.isArray(data.movimentacoes)) {
                console.log("MOVIMENTACOES QUE VIERAM:", data.movimentacoes); // <- LOG 3
                const ordenadas = data.movimentacoes.sort((a: Movimentacao, b: Movimentacao) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                setMovimentacoes(ordenadas);
            } else {
                console.log("SEM MOVIMENTACOES NO RETORNO"); // <- LOG 4
            }
        } catch (error) {
            console.error("ERRO AO CARREGAR RESUMO:", error);
            setResumo(null);
            setMovimentacoes([]);
        }
    }


    const carregarMovimentacoes = async (dataBusca: string) => {
        if (!API_URL || !lojaId || !token) return;
        try {
            // setLoading(true); <- REMOVE DAQUI
            const res = await fetch(`${API_URL}/caixas/historico?loja_id=${lojaId}&data=${dataBusca}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Erro ao buscar movimentacoes");
            const data = await res.json();
            const movs: Movimentacao[] = Array.isArray(data.movimentacoes) ? data.movimentacoes : [];
            const ordenadas = movs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setMovimentacoes(ordenadas);
        } catch (error) {
            console.error(error);
            setMovimentacoes([]);
        }
        // finally { setLoading(false); } <- REMOVE DAQUI TAMBÉM
    }


    const handleAcaoConcluida = () => {
        setShowSangriaModal(false);
        setShowAberturaModal(false);
        setLoading(true);
        const hoje = new Date().toISOString().split('T')[0];
        Promise.all([
            carregarResumoCaixa(), // esse já busca hoje
            carregarMovimentacoes(hoje) // <- força buscar hoje
        ]).finally(() => setLoading(false));
        onSave();
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
                    <DialogHeader className="p-4 sm:p-6 border-b shrink-0 flex-row items-center justify-between" style={{ borderColor: 'color-mix(in srgb, var(--cor-borda) 20%, transparent)', backgroundColor: 'var(--cor-card)' }}>
                        <div>
                            <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2" style={{ color: 'var(--cor-texto)' }}>
                                Gestão de Caixa
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

                    <div className="flex gap-1 px-4 sm:px-6 border-b shrink-0 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                        style={{ borderColor: 'color-mix(in srgb, var(--cor-borda) 20%, transparent)', backgroundColor: 'transparent' }}>
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
                                {abaAtiva === 'resumo' && <AbaResumo resumo={resumo} resumoMes={resumoMes} movimentacoes={movimentacoes} isCaixaAberto={isCaixaAberto} onAbrir={() => setShowAberturaModal(true)} onSangria={() => setShowSangriaModal(true)} />}

                                {abaAtiva === 'movimentacoes' &&
                                    <AbaMovimentacoes
                                        movimentacoes={movimentacoes}
                                        dataSelecionada={dataSelecionada} // <- TROCA
                                        setDataSelecionada={setDataSelecionada} // <- TROCA
                                        loading={loading}
                                    />
                                }
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
            className="relative flex flex-1 items-center justify-center gap-2 px-3 sm:px-4 py-3 font-semibold text-sm transition rounded-t-lg sm:flex-initial"
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




function AbaResumo({ resumo, resumoMes, movimentacoes, isCaixaAberto, onAbrir, onSangria }: { resumo: CaixaResumo | null, resumoMes: number, movimentacoes: Movimentacao[], isCaixaAberto: boolean, onAbrir: () => void, onSangria: () => void }) {

    const hoje = new Date().toISOString().split('T')[0];

    console.log("=== ABA RESUMO RENDER ==="); // LOG 1
    console.log("1. RESUMO DO BACKEND:", resumo); // LOG 2
    console.log("2. QTD MOVIMENTACOES:", movimentacoes.length); // LOG 3
    console.log("3. MOVIMENTACOES RAW:", movimentacoes); // LOG 4
    console.log("4. DATA HOJE:", hoje); // LOG 5

    const tiposEntrada = ['entrada', 'abertura', 'suprimento'];
    const tiposSaida = ['saida', 'sangria', 'fechamento', 'estorno'];

    // 1. TENTA PEGAR DO BACKEND PRIMEIRO
    let cashHoje = resumo?.cash_hoje ?? 0;
    let tpaHoje = resumo?.tpa_hoje ?? 0;
    let saidasHoje = resumo?.saidas_hoje ?? 0;

    console.log("5. VALORES DO BACKEND:", { cashHoje, tpaHoje, saidasHoje }); // LOG 6

    // 2. FALLBACK: SE BACKEND VEIO 0, CALCULA PELAS MOVIMENTACOES
    if (cashHoje === 0 && tpaHoje === 0) {
        console.log("6. ENTRANDO NO FALLBACK - CALCULANDO PELAS MOV"); // LOG 7

        const movsHoje = movimentacoes.filter(m => m.created_at.startsWith(hoje));
        console.log("7. MOVS DE HOJE:", movsHoje); // LOG 8

        cashHoje = movsHoje
            .filter(m => tiposEntrada.includes(m.tipo) && String(m.forma_pagamento || '').toLowerCase() === 'dinheiro')
            .reduce((acc, m) => acc + Number(m.valor || 0), 0);

        tpaHoje = movsHoje
            .filter(m => tiposEntrada.includes(m.tipo) && ['tpa', 'transferencia', 'pix', 'cartao'].includes(String(m.forma_pagamento || '').toLowerCase()))
            .reduce((acc, m) => acc + Number(m.valor || 0), 0);

        saidasHoje = movsHoje
            .filter(m => tiposSaida.includes(m.tipo))
            .reduce((acc, m) => acc + Number(m.valor || 0), 0);

        console.log("8. VALORES CALCULADOS NO FRONT:", { cashHoje, tpaHoje, saidasHoje }); // LOG 9
    }

    const faturamentoHoje = cashHoje + tpaHoje;
    console.log("9. FATURAMENTO FINAL:", faturamentoHoje); // LOG 10

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
                <div className="p-2 rounded-lg" style={{ background: 'color-mix(in srgb, var(--cor-fundo) 50%, transparent)', color: cor }}>
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
                        <Button onClick={onAbrir} className="w-full sm:w-auto h-10 px-4 flex items-center justify-center gap-2 font-bold text-xs" style={{ background: statusConfig.cor, color: '#fff', borderRadius: 'var(--radius-sm)' }}>
                            {isCaixaAberto ? <Lock size={16} /> : <Unlock size={16} />}
                            {isCaixaAberto ? 'Fechar Caixa' : 'Abrir Caixa'}
                        </Button>
                        <Button onClick={onSangria} disabled={!isCaixaAberto} className="w-full sm:w-auto h-10 px-4 flex items-center justify-center gap-2 font-bold text-xs disabled:opacity-40" style={{ background: 'var(--cor-aviso)', color: '#fff', borderRadius: 'var(--radius-sm)' }}>
                            <Minus size={16} /> Sangria
                        </Button>
                    </div>
                </div>
            </div>

            {/* GRID ATUALIZADA COM 5 CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <CardMetrica titulo="Saldo Abertura" valor={resumo?.saldo_abertura || 0} icon={<Banknote size={18} />} cor="var(--cor-primaria)" bg="color-mix(in srgb, var(--cor-primaria) 6%, transparent)" border="color-mix(in srgb, var(--cor-primaria) 20%, transparent)" />
                <CardMetrica titulo="Cash em Mão" valor={cashHoje} icon={<Banknote size={18} />} cor="var(--cor-sucesso)" bg="color-mix(in srgb, var(--cor-sucesso) 6%, transparent)" border="color-mix(in srgb, var(--cor-sucesso) 20%, transparent)" />
                <CardMetrica titulo="TPA/Transferência" valor={tpaHoje} icon={<TrendingUp size={18} />} cor="var(--cor-primaria)" bg="color-mix(in srgb, var(--cor-primaria) 6%, transparent)" border="color-mix(in srgb, var(--cor-primaria) 20%, transparent)" />
                <CardMetrica titulo="Saídas Hoje" valor={saidasHoje} icon={<TrendingDown size={18} />} cor="var(--cor-erro)" bg="color-mix(in srgb, var(--cor-erro) 6%, transparent)" border="color-mix(in srgb, var(--cor-erro) 20%, transparent)" />
                <CardMetrica titulo="Saídas do Mês" valor={resumoMes} icon={<TrendingDown size={18} />} cor="var(--cor-erro)" bg="color-mix(in srgb, var(--cor-erro) 6%, transparent)" border="color-mix(in srgb, var(--cor-erro) 20%, transparent)" />
            </div>

            {/* GRID COM OS 2 CARDS PRINCIPAIS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                    style={{
                        background: 'color-mix(in srgb, var(--cor-aviso) 8%, transparent)',
                        border: '2px solid var(--cor-aviso)'
                    }}>
                    <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--cor-texto-sec)' }}>Faturamento Total Hoje</p>
                        <p className="text-3xl font-bold mt-1" style={{ color: 'var(--cor-aviso)' }}>{formatCurrency(faturamentoHoje)}</p>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>Cash + TPA/Transferência</p>
                </div>

                <div className="p-5 rounded-xl flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                    style={{
                        background: 'color-mix(in srgb, var(--cor-sucesso) 4%, transparent)',
                        border: '2px solid var(--cor-sucesso)'
                    }}>
                    <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--cor-texto-sec)' }}>Saldo Atual em Caixa</p>
                        <p className="text-3xl font-bold mt-1" style={{ color: 'var(--cor-sucesso)' }}>{formatCurrency(resumo?.saldo_atual || 0)}</p>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>Valor esperado no fechamento</p>
                </div>
            </div>
        </div>
    )
}



function AbaMovimentacoes({
    movimentacoes,
    dataSelecionada, // <- TROCA
    setDataSelecionada, // <- TROCA
    loading
}: {
    movimentacoes: Movimentacao[],
    dataSelecionada: string, // <- TROCA
    setDataSelecionada: (data: string) => void, // <- TROCA
    loading: boolean
}) {

    const tiposEntrada = ['entrada', 'abertura', 'suprimento'];
    const tiposSaida = ['saida', 'sangria', 'fechamento', 'estorno'];

    const getIcon = (tipo: string) => {
        if (tiposEntrada.includes(tipo)) return <ArrowUpRight size={16} className="text-[var(--cor-sucesso)]" />;
        return <ArrowDownRight size={16} className="text-[var(--cor-erro)]" />;
    }

    const isEntrada = (tipo: string) => tiposEntrada.includes(tipo);

    // Busca no backend quando a data mudar
    const handleMudarData = (novaData: string) => {
        setDataSelecionada(novaData); // só atualiza o state do pai. O useEffect do pai já vai buscar
    }

    const movimentacoesFiltradas = movimentacoes.filter(mov => {
        const dataMov = new Date(mov.created_at).toISOString().split('T')[0];
        return dataMov === dataSelecionada;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-2">
                <Loader2 className="animate-spin" size={32} style={{ color: 'var(--cor-primaria)' }} />
            </div>
        )
    }

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
                        <Input type="date" value={dataSelecionada} onChange={(e) => handleMudarData(e.target.value)} className="w-full sm:w-auto h-9" />
                    </div>
                </div>
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
                    <Input type="date" value={dataSelecionada} onChange={(e) => handleMudarData(e.target.value)} className="w-full sm:w-auto h-9" />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <div className="space-y-2 pb-8">
                    {movimentacoesFiltradas.map(mov => (
                        <div key={mov.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--cor-card)', border: '1px solid color-mix(in srgb, var(--cor-borda) 20%, transparent)' }}>
                            <div className="flex items-center gap-3">
                                {getIcon(mov.tipo)}
                                <div>
                                    <p className="font-semibold text-sm flex items-center gap-2 flex-wrap">
                                        {mov.descricao}
                                        {mov.forma_pagamento && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                                style={{
                                                    background: String(mov.forma_pagamento || '').toLowerCase() === 'dinheiro'
                                                        ? 'color-mix(in srgb, var(--cor-sucesso) 15%, transparent)'
                                                        : 'color-mix(in srgb, var(--cor-primaria) 15%, transparent)',
                                                    color: String(mov.forma_pagamento || '').toLowerCase() === 'dinheiro' ? 'var(--cor-sucesso)' : 'var(--cor-primaria)'
                                                }}>
                                                {mov.forma_pagamento}
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>{formatDateTime(mov.created_at)}</p>
                                </div>
                            </div>
                            <p className={`font-bold text-sm ${isEntrada(mov.tipo) ? 'text-[var(--cor-sucesso)]' : 'text-[var(--cor-erro)]'}`}>
                                {isEntrada(mov.tipo) ? '+' : '-'} {formatCurrency(mov.valor)}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
