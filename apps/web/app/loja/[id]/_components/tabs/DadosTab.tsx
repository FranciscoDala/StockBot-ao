"use client";
import { DollarSign, AlertTriangle, Wifi, WifiOff, ShoppingBag, TrendingUp, Edit, PlusCircle, ArrowDownCircle, Info, RefreshCw } from "lucide-react";
import { Loja, userread } from "../../page";
import { formatCurrency } from "../utils";
import { useEffect, useState, useRef, useCallback } from "react";
import { SaidaModal } from "../modals/SaidaModal";
import { CaixaModal } from "../modals/CaixaModal";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const WS_URL = process.env.NEXT_PUBLIC_WS_URL;

type ItemVenda = { id: string; produto_id: string; nome_produto: string; quantidade: number; preco_unitario: number; subtotal: number }
type VendaAPI = { id: string | number; total: number; total_itens: number; forma_pagamento: string; data_venda: string; status: string; itens: ItemVenda[] }
type SaidaAPI = { id: string; valor: number; descricao: string; created_at: string; loja_id: string }

type Props = {
    loja: Loja | null | undefined;
    user: userread | null;
    lojaId?: string;
    token?: string | null;
    theme: string;
    cardStyle: string;
    cardSize: string;
}

const getCookie = (name: string): string | undefined => {
    if (typeof window === "undefined") return undefined;
    return document.cookie.split('; ').reduce((r, v) => {
        const parts = v.split('=');
        return parts[0] === name ? decodeURIComponent(parts[1]) : r;
    }, '');
};

const safeFormat = (v: number | null | undefined) => formatCurrency(Number(v) || 0);

export function DadosTab({ loja, user, lojaId: lojaIdProp, token: tokenProp, theme, cardStyle, cardSize }: Props) {
    const [kpis, setKpis] = useState({
        vendaDiaria: 0,
        saidaDiaria: 0,
        totalVendasMes: 0,
        totalSaidasMes: 0,
        estoqueZerado: 0,
        qtdVendasHoje: 0
    });
    const [loading, setLoading] = useState(true);
    const [wsConectado, setWsConectado] = useState(false);
    const [showSaidaModal, setShowSaidaModal] = useState(false);
    const [showCaixaModal, setShowCaixaModal] = useState(false);
    const ws = useRef<WebSocket | null>(null);
    const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

    const lojaId = lojaIdProp || user?.loja_id || '' // <- GARANTE QUE NUNCA É UNDEFINED
    const token = tokenProp || getCookie('token') || '' // <- GARANTE QUE NUNCA É UNDEFINED

    const carregarKPIs = useCallback(async () => {
        if (!lojaId || !token || !API_URL) {
            console.log("FALTANDO DADOS PARA KPI:", { lojaId, token: !!token, API_URL })
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            console.log("BUSCANDO KPIs para loja:", lojaId)

            const [resVendas, resSaidas] = await Promise.all([
                fetch(`${API_URL}/vendas/?loja_id=${lojaId}&limit=5000`, { headers: { "Authorization": `Bearer ${token}` } }),
                fetch(`${API_URL}/saidas?loja_id=${lojaId}`, { headers: { "Authorization": `Bearer ${token}` } })
            ]);

            if (!resVendas.ok) throw new Error(`Erro Vendas: ${resVendas.status}`);
            const dataVendas: VendaAPI[] = await resVendas.json();
            const dataSaidas: SaidaAPI[] = resSaidas.ok ? await resSaidas.json() : [];

            const agora = new Date();
            const hojeStr = agora.toISOString().split('T')[0];
            const inicioMes = new Date(agora);
            inicioMes.setDate(agora.getDate() - 30);
            const inicioMesStr = inicioMes.toISOString().split('T')[0];

            let saidasHoje = 0;
            let saidasMes = 0;
            if (Array.isArray(dataSaidas)) {
                saidasHoje = dataSaidas
                    .filter(s => s.created_at?.startsWith(hojeStr))
                    .reduce((acc, s) => acc + Number(s.valor || 0), 0);

                saidasMes = dataSaidas
                    .filter(s => s.created_at?.split('T')[0] >= inicioMesStr)
                    .reduce((acc, s) => acc + Number(s.valor || 0), 0);
            }

            const statusValidos = ["concluida", "concluido", "paga", "finalizada"]; // <- tirei acento
            const vendas = (Array.isArray(dataVendas) ? dataVendas : [])
                .filter(v => statusValidos.includes(v.status?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")))
                .map(v => ({ ...v, total: Number(v.total) || 0 }));

            const vendasHoje = vendas.filter(v => v.data_venda && v.data_venda.startsWith(hojeStr));
            const vendasMes = vendas.filter(v => v.data_venda && v.data_venda.split('T')[0] >= inicioMesStr);

            setKpis({
                vendaDiaria: vendasHoje.reduce((acc, v) => acc + v.total, 0),
                saidaDiaria: saidasHoje,
                totalVendasMes: vendasMes.reduce((acc, v) => acc + v.total, 0),
                totalSaidasMes: saidasMes,
                estoqueZerado: 0,
                qtdVendasHoje: vendasHoje.length
            })
        } catch (error) {
            console.error("Erro ao carregar KPIs", error);
        }
        finally { setLoading(false); }
    }, [lojaId, token])

    const handleSaidaCriada = () => {
        setShowSaidaModal(false);
        carregarKPIs(); // <- ATUALIZA OS KPIS AO CRIAR SAIDA
    }

    const conectarWebSocket = useCallback(() => {
        if (!token || !lojaId || !WS_URL) return;
        if (ws.current?.readyState === WebSocket.OPEN) return;
        ws.current = new WebSocket(`${WS_URL}/ws/lojas/${lojaId}?token=${token}`);
        ws.current.onopen = () => { setWsConectado(true); if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current); };
        ws.current.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.tipo === 'stats.updated') {
                    carregarKPIs();
                }
            } catch (e) { console.error("Erro ao ler WS", e); }
        };
        ws.current.onclose = () => { setWsConectado(false); reconnectTimeout.current = setTimeout(conectarWebSocket, 3000); };
        ws.current.onerror = () => { ws.current?.close(); };
    }, [token, lojaId, carregarKPIs]);

    useEffect(() => {
        if (token && lojaId) { carregarKPIs(); conectarWebSocket(); }
        return () => { if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current); ws.current?.close() }
    }, [carregarKPIs, conectarWebSocket, token, lojaId])

    const ticketMedio = kpis.qtdVendasHoje > 0 ? kpis.vendaDiaria / kpis.qtdVendasHoje : 0;
    const radius = cardStyle === 'arredondado' ? '16px' : '8px';

    return (
        <>
            <div className="space-y-6">

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--cor-texto)' }}>
                            Dados {wsConectado ? <Wifi size={16} style={{ color: 'var(--cor-sucesso)' }} /> : <WifiOff size={16} style={{ color: 'var(--cor-erro)' }} />}
                        </h2>
                        <p className="text-xs sm:text-sm" style={{ color: 'var(--cor-texto-sec)' }}>Visão geral da loja em tempo real</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">

                        <button
                            onClick={() => setShowSaidaModal(true)}
                            disabled={!token || !lojaId} // <- TRAVA SE NÃO TIVER DADO
                            className="flex-1 sm:flex-none min-w-[140px] h-10 px-4 flex items-center justify-center gap-2 font-semibold transition hover:opacity-90 text-sm whitespace-nowrap disabled:opacity-50"
                            style={{ background: 'var(--cor-erro)', color: '#fff', borderRadius: radius }}
                        >
                            <PlusCircle size={16} /> Fazer Saída
                        </button>

                        <button
                            onClick={carregarKPIs}
                            disabled={loading}
                            className="flex-1 sm:flex-none min-w-[140px] h-10 px-4 flex items-center justify-center gap-2 font-semibold transition hover:opacity-90 text-sm whitespace-nowrap"
                            style={{ background: 'var(--cor-primaria)', color: '#fff', borderRadius: radius }}
                        >
                            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> {loading ? "Atualizando..." : "Atualizar"}
                        </button>

                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <CardStats
                        titulo="Faturamento Hoje"
                        stats={{ total: kpis.vendaDiaria, qtdVendas: kpis.qtdVendasHoje, ticketMedio }}
                        icon={<DollarSign size={16} />}
                        descricao="Clique para abrir o caixa"
                        formatCurrency={safeFormat}
                        cardStyle={cardStyle}
                        cardSize={cardSize}
                        onClick={() => setShowCaixaModal(true)}
                    />
                    <CardStats titulo="Vendas Hoje" stats={{ total: kpis.qtdVendasHoje }} icon={<ShoppingBag size={16} />} descricao="Pedidos concluídos" formatCurrency={(v: number) => String(Number(v) || 0)} cardStyle={cardStyle} cardSize={cardSize} />
                    <CardStats titulo="Ticket Médio" stats={{ total: ticketMedio }} icon={<TrendingUp size={16} />} descricao="Valor por venda" formatCurrency={safeFormat} cardStyle={cardStyle} cardSize={cardSize} />
                    <CardAlertaDanger titulo="Saída do Dia" valor={kpis.saidaDiaria} descricao="Total de saídas/retiradas de hoje" formatCurrency={safeFormat} cardStyle={cardStyle} cardSize={cardSize} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                    <div
                        className="p-4 sm:p-6 transition hover:scale-[1.01]"
                        style={{
                            background: 'color-mix(in srgb, var(--cor-info) 15%, transparent)',
                            backdropFilter: 'blur(16px)',
                            border: '1px solid color-mix(in srgb, var(--cor-info) 40%, transparent)',
                            color: 'var(--cor-info)',
                            padding: cardSize === 'grande' ? '24px' : '16px',
                            borderRadius: radius,
                            boxShadow: '0 0 30px color-mix(in srgb, var(--cor-info) 20%, transparent)'
                        }}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium flex items-center gap-1" style={{ opacity: 0.9, color: 'var(--cor-info)' }}>
                                    <Info size={14} /> Resumo do Mês - Entradas
                                </p>
                                <p className="text-3xl font-bold mt-1" style={{ color: 'var(--cor-info)' }}>{loading ? "..." : safeFormat(kpis.totalVendasMes)}</p>
                                <p className="text-xs mt-1" style={{ opacity: 0.8, color: 'var(--cor-info)' }}>Total vendido nos últimos 30 dias</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 sm:p-6 transition hover:scale-[1.01]" style={{ background: 'color-mix(in srgb, var(--cor-erro) 15%, transparent)', backdropFilter: 'blur(16px)', border: '1px solid color-mix(in srgb, var(--cor-erro) 40%, transparent)', color: 'var(--cor-erro)', padding: cardSize === 'grande' ? '24px' : '16px', borderRadius: radius, boxShadow: '0 0 30px color-mix(in srgb, var(--cor-erro) 20%, transparent)' }}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium flex items-center gap-1" style={{ opacity: 0.9, color: 'var(--cor-erro)' }}><ArrowDownCircle size={14} /> Resumo do Mês - Saídas</p>
                                <p className="text-3xl font-bold mt-1" style={{ color: 'var(--cor-erro)' }}>{loading ? "..." : safeFormat(kpis.totalSaidasMes)}</p>
                                <p className="text-xs mt-1" style={{ opacity: 0.8, color: 'var(--cor-erro)' }}>Total de saídas nos últimos 30 dias</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <SaidaModal
                open={showSaidaModal}
                onOpenChange={setShowSaidaModal}
                onSave={handleSaidaCriada}
                token={token}
                lojaId={lojaId}
                lojaNome={loja?.nome}
            />

            <CaixaModal
                open={showCaixaModal}
                onOpenChange={setShowCaixaModal}
                lojaId={lojaId}
                token={token}
            />
        </>
    )
}

function CardStats({ titulo, stats, icon, descricao, formatCurrency, cardStyle, cardSize, onClick }: any) {
    const padding = cardSize === 'grande' ? '20px' : '16px';
    const radius = cardStyle === 'arredondado' ? '16px' : '8px';
    return (
        <div
            onClick={onClick}
            className="transition hover:scale-[1.02] w-full cursor-pointer"
            style={{ background: 'color-mix(in srgb, var(--cor-card) 75%, transparent)', backdropFilter: 'blur(12px)', color: 'var(--cor-primaria)', padding, borderRadius: radius, border: 'none', boxShadow: '0 0 25px color-mix(in srgb, var(--cor-primaria) 20%, transparent)' }}
        >
            <div className="flex items-center justify-between mb-2">
                <p className="text-xs md:text-sm font-medium truncate" style={{ opacity: 0.9, color: 'var(--cor-primaria)' }}>{titulo}</p>
                <div style={{ color: 'var(--cor-primaria)' }}>{icon}</div>
            </div>
            <p className="text-xl md:text-2xl lg:text-3xl font-bold truncate" style={{ color: 'var(--cor-primaria)' }}>{formatCurrency(stats.total)}</p>
            <p className="text-xs md:text-xs mt-1 truncate" style={{ opacity: 0.8, color: 'var(--cor-primaria)' }}>{descricao}</p>
        </div>
    )
}

function CardAlertaDanger({ titulo, valor, descricao, formatCurrency, cardStyle, cardSize }: any) {
    const padding = cardSize === 'grande' ? '20px' : '16px';
    const radius = cardStyle === 'arredondado' ? '16px' : '8px';
    return (
        <div className="transition hover:scale-[1.02] w-full" style={{ background: 'color-mix(in srgb, var(--cor-erro) 15%, transparent)', backdropFilter: 'blur(12px)', color: 'var(--cor-erro)', padding, borderRadius: radius, border: '1px solid color-mix(in srgb, var(--cor-erro) 40%, transparent)', boxShadow: '0 0 25px color-mix(in srgb, var(--cor-erro) 20%, transparent)' }}>
            <div className="flex items-center justify-between mb-2">
                <p className="text-xs md:text-sm font-medium truncate" style={{ opacity: 0.9, color: 'var(--cor-erro)' }}>{titulo}</p>
                <AlertTriangle size={16} />
            </div>
            <p className="text-xl md:text-2xl lg:text-3xl font-bold truncate" style={{ color: 'var(--cor-erro)' }}>{formatCurrency(valor)}</p>
            <p className="text-xs md:text-xs mt-1 truncate" style={{ opacity: 0.8, color: 'var(--cor-erro)' }}>{descricao}</p>
        </div>
    )
}
