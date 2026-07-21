"use client";
import { DollarSign, Ban, Wifi, WifiOff, ShoppingBag, TrendingUp, Edit } from "lucide-react";
import { Loja, userread } from "../../page";
import { formatCurrency } from "../utils";
import { useEffect, useState, useRef, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const WS_URL = process.env.NEXT_PUBLIC_WS_URL;

type ItemVenda = { id: string; produto_id: string; nome_produto: string; quantidade: number; preco_unitario: number; subtotal: number }
type VendaAPI = { id: string | number; total: number; total_itens: number; forma_pagamento: string; data_venda: string; status: string; itens: ItemVenda[] }

type Props = {
    loja: Loja | null | undefined;
    user: userread | null;
    lojaId?: string;
    token?: string | null;
    theme: string;
    cardStyle: string;
    cardSize: string;
}

const getCookie = (name: string): string | undefined => { if (typeof window === "undefined") return undefined; return document.cookie.split('; ').reduce((r, v) => { const parts = v.split('='); return parts[0] === name ? decodeURIComponent(parts[1]) : r; }, ''); };

export function DadosTab({ loja, user, lojaId: lojaIdProp, token: tokenProp, theme, cardStyle, cardSize }: Props) {
    const [kpis, setKpis] = useState({ vendaDiaria: 0, saidaDiaria: 0, totalVendasMes: 0, totalProdutos: 0, estoqueZerado: 0, qtdVendasHoje: 0 });
    const [loading, setLoading] = useState(true);
    const [wsConectado, setWsConectado] = useState(false);
    const ws = useRef<WebSocket | null>(null);
    const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

    const lojaId = lojaIdProp || getCookie('lojaId')
    const token = tokenProp || getCookie('token')

    const carregarKPIs = useCallback(async () => {
        if (!lojaId || !token || !API_URL) { setLoading(false); return; }
        setLoading(true);
        try {
            const resVendas = await fetch(`${API_URL}/vendas/?loja_id=${lojaId}&limit=5000`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!resVendas.ok) throw new Error("Erro ao buscar vendas: " + resVendas.status);
            const data: VendaAPI[] = await resVendas.json();

            const vendas = (Array.isArray(data) ? data : [])
                .filter(v => v.status?.toLowerCase().trim() === "concluida")
                .map(v => ({ ...v, total: Number(v.total) || 0, data_venda: new Date(v.data_venda) }));

            const agora = new Date();
            const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 0, 0, 0);
            const fimHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 23, 59, 59);
            const vendasHoje = vendas.filter(v => v.data_venda >= inicioHoje && v.data_venda <= fimHoje);

            const inicioMes = new Date(agora);
            inicioMes.setDate(agora.getDate() - 30);
            const vendasMes = vendas.filter(v => v.data_venda >= inicioMes);

            let estoqueZerado = 0;
            let totalProdutos = 0;
            try {
                const resEstoque = await fetch(`${API_URL}/lojas/${lojaId}/dashboard/estoque-alertas`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (resEstoque.ok) {
                    const resEstoqueJson = await resEstoque.json();
                    estoqueZerado = resEstoqueJson.estoque_zerado || 0;
                    totalProdutos = resEstoqueJson.total_produtos_ativos || 0;
                }
            } catch { }

            setKpis({
                vendaDiaria: vendasHoje.reduce((acc, v) => acc + v.total, 0),
                saidaDiaria: 0,
                totalProdutos: totalProdutos,
                totalVendasMes: vendasMes.reduce((acc, v) => acc + v.total, 0),
                estoqueZerado: estoqueZerado,
                qtdVendasHoje: vendasHoje.length
            })
        } catch (error) { console.error("Erro ao carregar KPIs", error); }
        finally { setLoading(false); }
    }, [lojaId, token])

    const conectarWebSocket = useCallback(() => {
        if (!token || !lojaId || !WS_URL) return;
        if (ws.current?.readyState === WebSocket.OPEN) return;

        ws.current = new WebSocket(`${WS_URL}/ws/lojas/${lojaId}?token=${token}`);

        ws.current.onopen = () => {
            setWsConectado(true);
            if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
        };

        ws.current.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.tipo === 'stats.updated') {
                    carregarKPIs();
                }
            } catch (e) {
                console.error("Erro ao ler WS", e);
            }
        };

        ws.current.onclose = () => {
            setWsConectado(false);
            reconnectTimeout.current = setTimeout(conectarWebSocket, 3000);
        };

        ws.current.onerror = () => {
            ws.current?.close();
        };

    }, [token, lojaId, carregarKPIs]);


    useEffect(() => { if (token && lojaId) { carregarKPIs(); conectarWebSocket(); } return () => { if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current); ws.current?.close() } }, [carregarKPIs, conectarWebSocket, token, lojaId])

    const ticketMedio = kpis.qtdVendasHoje > 0 ? kpis.vendaDiaria / kpis.qtdVendasHoje : 0;
    const radius = cardStyle === 'arredondado' ? '16px' : '8px';

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--cor-texto)' }}>
                        Dados {wsConectado ? <Wifi size={16} style={{ color: 'var(--cor-primaria)' }} /> : <WifiOff size={16} className="text-red-500" />}
                    </h2>
                    <p className="text-xs sm:text-sm" style={{ color: 'var(--cor-texto-sec)' }}>Visão geral da loja em tempo real</p>
                </div>
                <button onClick={carregarKPIs} disabled={loading} className="w-full sm:w-auto flex items-center justify-center gap-2 font-semibold transition hover:brightness-110 text-sm h-10 px-4" style={{ background: 'var(--cor-primaria)', color: '#fff', borderRadius: radius }}>
                    <Edit size={16} /> {loading ? "Atualizando..." : "Atualizar"}
                </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <CardStats titulo="Faturamento Hoje" stats={{ total: kpis.vendaDiaria, qtdVendas: kpis.qtdVendasHoje, ticketMedio }} icon={<DollarSign size={16} />} descricao="Entradas de hoje" formatCurrency={formatCurrency} cardStyle={cardStyle} cardSize={cardSize} />
                <CardStats titulo="Vendas Hoje" stats={{ total: kpis.qtdVendasHoje, qtdVendas: kpis.qtdVendasHoje, ticketMedio }} icon={<ShoppingBag size={16} />} descricao="Pedidos concluídos" formatCurrency={(v: number) => String(v)} cardStyle={cardStyle} cardSize={cardSize} />
                <CardStats titulo="Ticket Médio" stats={{ total: ticketMedio, qtdVendas: kpis.qtdVendasHoje, ticketMedio }} icon={<TrendingUp size={16} />} descricao="Valor por venda" formatCurrency={formatCurrency} cardStyle={cardStyle} cardSize={cardSize} />
                <CardStats titulo="Estoque Zerado" stats={{ total: kpis.estoqueZerado, qtdVendas: 0, ticketMedio: 0 }} icon={<Ban size={16} />} descricao="Não consegue vender" formatCurrency={(v: number) => String(v)} cardStyle={cardStyle} cardSize={cardSize} />
            </div>

            <div className="p-4 sm:p-6 transition hover:scale-[1.01]" style={{ background: 'color-mix(in srgb, var(--cor-card) 70%, transparent)', backdropFilter: 'blur(16px)', border: 'none', color: 'var(--cor-primaria)', padding: cardSize === 'grande' ? '24px' : '16px', borderRadius: radius, boxShadow: '0 0 30px color-mix(in srgb, var(--cor-primaria) 25%, transparent)' }}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium" style={{ opacity: 0.9, color: 'var(--cor-primaria)' }}>Resumo do Mês</p>
                        <p className="text-3xl font-bold mt-1" style={{ color: 'var(--cor-primaria)' }}>{loading ? "..." : formatCurrency(kpis.totalVendasMes)}</p>
                        <p className="text-xs mt-1" style={{ opacity: 0.8, color: 'var(--cor-primaria)' }}>Total vendido nos últimos 30 dias</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

function CardStats({ titulo, stats, icon, descricao, formatCurrency, cardStyle, cardSize }: any) {
    const padding = cardSize === 'grande' ? '20px' : '16px';
    const radius = cardStyle === 'arredondado' ? '16px' : '8px';
    return (
        <div className="transition hover:scale-[1.02]" style={{ background: 'color-mix(in srgb, var(--cor-card) 75%, transparent)', backdropFilter: 'blur(12px)', color: 'var(--cor-primaria)', padding, borderRadius: radius, border: 'none', boxShadow: '0 0 25px color-mix(in srgb, var(--cor-primaria) 20%, transparent)' }}>
            <div className="flex items-center justify-between mb-2">
                <p className="text-xs md:text-sm font-medium truncate" style={{ opacity: 0.9, color: 'var(--cor-primaria)' }}>{titulo}</p>
                <div style={{ color: 'var(--cor-primaria)' }}>{icon}</div>
            </div>
            <p className="text-xl md:text-2xl lg:text-3xl font-bold truncate" style={{ color: 'var(--cor-primaria)' }}>{formatCurrency(stats.total)}</p>
            <p className="text-xs md:text-xs mt-1 truncate" style={{ opacity: 0.8, color: 'var(--cor-primaria)' }}>{descricao}</p>
        </div>
    )
}
