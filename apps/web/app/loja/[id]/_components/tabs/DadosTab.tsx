"use client";
import { User, MapPin, Edit, TrendingUp, TrendingDown, DollarSign, Ban, Wifi, WifiOff, ShoppingBag, Package } from "lucide-react";
import { Loja, userread } from "../../page";
import { formatCurrency } from "../utils";

import { useEffect, useState, useRef, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const WS_URL = process.env.NEXT_PUBLIC_WS_URL;

type ItemVenda = {
    id: string
    produto_id: string
    nome_produto: string
    quantidade: number
    preco_unitario: number
    subtotal: number
}

type VendaAPI = {
    id: string | number
    total: number
    total_itens: number
    forma_pagamento: string
    data_venda: string
    status: string
    itens: ItemVenda[]
}

type Stats = {
    total: number
    qtdVendas: number
    ticketMedio: number
}

type Props = { // <-- ADICIONEI ISSO
    loja: Loja | null | undefined;
    user: userread | null;
    lojaId?: string;
    token?: string | null;
    theme: string; // <-- NOVO
    cardStyle: string; // <-- NOVO
    cardSize: string; // <-- NOVO
}

export function DadosTab({
    loja,
    user,
    lojaId,
    token,
    theme, // <-- RECEBER
    cardStyle, // <-- RECEBER
    cardSize // <-- RECEBER
}: Props) {
    const [kpis, setKpis] = useState({
        vendaDiaria: 0,
        saidaDiaria: 0,
        totalVendasMes: 0,
        totalProdutos: 0,
        estoqueZerado: 0,
        qtdVendasHoje: 0
    });
    const [loading, setLoading] = useState(true);
    const [wsConectado, setWsConectado] = useState(false);
    const ws = useRef<WebSocket | null>(null);
    const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

    const carregarKPIs = useCallback(async () => {
        if (!lojaId || !token || !API_URL) {
            console.log("Faltando dados:", { lojaId, token, API_URL })
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const resVendas = await fetch(`${API_URL}/vendas/?loja_id=${lojaId}&limit=5000`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!resVendas.ok) throw new Error("Erro ao buscar vendas: " + resVendas.status);
            const data: VendaAPI[] = await resVendas.json();

            const vendas = (Array.isArray(data) ? data : [])
                .filter(v => v.status?.toLowerCase().trim() === "concluida")
                .map(v => ({
                    ...v,
                    total: Number(v.total) || 0,
                    data_venda: new Date(v.data_venda)
                }));

            const hoje = new Date();
            const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
            const vendasHoje = vendas.filter(v => v.data_venda >= inicioHoje);

            const inicioMes = new Date();
            inicioMes.setDate(hoje.getDate() - 30);
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

            const vendaDiaria = vendasHoje.reduce((acc, v) => acc + v.total, 0);
            const totalVendasMes = vendasMes.reduce((acc, v) => acc + v.total, 0);
            const qtdVendasHoje = vendasHoje.length;
            const ticketMedio = qtdVendasHoje > 0 ? vendaDiaria / qtdVendasHoje : 0;

            setKpis({
                vendaDiaria: vendaDiaria,
                saidaDiaria: 0,
                totalProdutos: totalProdutos,
                totalVendasMes: totalVendasMes,
                estoqueZerado: estoqueZerado,
                qtdVendasHoje: qtdVendasHoje
            })
        } catch (error) {
            console.error("Erro ao carregar KPIs", error);
        } finally {
            setLoading(false);
        }
    }, [lojaId, token])

    const conectarWebSocket = useCallback(() => {
        if (!token || !lojaId || !WS_URL) return;
        if (ws.current?.readyState === WebSocket.OPEN) return;

        ws.current = new WebSocket(`${WS_URL}/ws/lojas/${lojaId}?token=${token}`);

        ws.current.onopen = () => {
            setWsConectado(true)
            if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current)
        }

        ws.current.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.tipo === 'stats.updated') {
                    carregarKPIs()
                }
            } catch (e) {
                console.error("Erro ao ler WS", e)
            }
        }

        ws.current.onclose = () => {
            setWsConectado(false)
            reconnectTimeout.current = setTimeout(conectarWebSocket, 3000)
        }

        ws.current.onerror = () => {
            ws.current?.close()
        }

    }, [token, lojaId, carregarKPIs])

    useEffect(() => {
        carregarKPIs()
        conectarWebSocket()
        return () => {
            if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current)
            ws.current?.close()
        }
    }, [carregarKPIs, conectarWebSocket])

    const saldoDia = kpis.vendaDiaria - kpis.saidaDiaria;
    const ticketMedio = kpis.qtdVendasHoje > 0 ? kpis.vendaDiaria / kpis.qtdVendasHoje : 0;

    return (
        <div className="space-y-6">

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--cor-texto)' }}>
                        Dados
                        {wsConectado ? <Wifi size={16} style={{ color: 'var(--cor-primaria)' }} /> : <WifiOff size={16} className="text-red-500" />}
                    </h2>
                    <p className="text-base sm:text-sm" style={{ color: 'var(--cor-texto-sec)' }}>Visão geral da loja em tempo real</p>
                </div>
                <button
                    onClick={carregarKPIs}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition hover:brightness-110 text-base"
                    style={{
                        background: 'var(--cor-primaria)',
                        color: '#fff',
                        padding: cardSize === 'grande' ? '12px 20px' : '8px 16px', // <-- USANDO cardSize
                        borderRadius: cardStyle === 'arredondado' ? '16px' : '8px' // <-- USANDO cardStyle
                    }}
                >
                    <Edit size={14} />
                    Atualizar
                </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <CardStats
                    titulo="Faturamento Hoje"
                    stats={{ total: kpis.vendaDiaria, qtdVendas: kpis.qtdVendasHoje, ticketMedio: ticketMedio }}
                    cor="primaria"
                    icon={<DollarSign size={16} />}
                    descricao="Entradas de hoje"
                    formatCurrency={formatCurrency}
                    theme={theme} cardStyle={cardStyle} cardSize={cardSize}
                />
                <CardStats
                    titulo="Vendas Hoje"
                    stats={{ total: kpis.qtdVendasHoje, qtdVendas: kpis.qtdVendasHoje, ticketMedio: ticketMedio }}
                    cor="primaria" // 👈 troquei
                    icon={<ShoppingBag size={16} />}
                    descricao="Pedidos concluídos"
                    formatCurrency={(v) => String(v)}
                    theme={theme} cardStyle={cardStyle} cardSize={cardSize}
                />
                <CardStats
                    titulo="Ticket Médio"
                    stats={{ total: ticketMedio, qtdVendas: kpis.qtdVendasHoje, ticketMedio: ticketMedio }}
                    cor="primaria" // 👈 troquei
                    icon={<TrendingUp size={16} />}
                    descricao="Valor por venda"
                    formatCurrency={formatCurrency}
                    theme={theme} cardStyle={cardStyle} cardSize={cardSize}
                />
                <CardStats
                    titulo="Estoque Zerado"
                    stats={{ total: kpis.estoqueZerado, qtdVendas: 0, ticketMedio: 0 }}
                    cor="primaria" // 👈 troquei
                    icon={<Ban size={16} />}
                    descricao="Não consegue vender"
                    formatCurrency={(v) => String(v)}
                    theme={theme} cardStyle={cardStyle} cardSize={cardSize}
                />
            </div>

            <div
                className="p-4 sm:p-6 transition hover:scale-[1.01]"
                style={{
                    background: 'color-mix(in srgb, var(--cor-card) 70%, transparent)', // 👈 glass
                    backdropFilter: 'blur(16px)',
                    border: 'none', // 👈 remove borda
                    color: 'var(--cor-primaria)', // 👈 texto primary
                    padding: cardSize === 'grande' ? '24px' : '16px',
                    borderRadius: cardStyle === 'arredondado' ? '16px' : '8px',
                    boxShadow: '0 0 30px color-mix(in srgb, var(--cor-primaria) 25%, transparent)' // 👈 shadow mais forte
                }}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-base font-medium" style={{ opacity: 0.9, color: 'var(--cor-primaria)' }}>Resumo do Mês</p>
                        <p className="text-3xl font-bold mt-1" style={{ color: 'var(--cor-primaria)' }}>{loading ? "..." : formatCurrency(kpis.totalVendasMes)}</p>
                        <p className="text-base mt-1" style={{ opacity: 0.8, color: 'var(--cor-primaria)' }}>Total vendido nos últimos 30 dias</p>
                    </div>
                </div>
            </div>


        </div>
    )
}

function CardStats({
    titulo,
    stats,
    icon,
    cor, // vamos ignorar e forçar primary
    descricao,
    formatCurrency,
    theme,
    cardStyle,
    cardSize
}: {
    titulo: string,
    stats: Stats,
    icon: React.ReactNode,
    cor: "primaria" | "secundaria" | "alerta",
    descricao: string,
    formatCurrency: (v: number) => string
    theme: string;
    cardStyle: string;
    cardSize: string;
}) {
    const padding = cardSize === 'grande' ? '20px' : '16px';
    const radius = cardStyle === 'arredondado' ? '16px' : '8px';

    return (
        <div
            className="transition hover:scale-[1.02]"
            style={{
                background: 'color-mix(in srgb, var(--cor-card) 75%, transparent)', // 👈 glass
                backdropFilter: 'blur(12px)',
                color: 'var(--cor-primaria)', // 👈 letras primary
                padding,
                borderRadius: radius,
                border: 'none', // 👈 sem borda
                boxShadow: '0 0 25px color-mix(in srgb, var(--cor-primaria) 20%, transparent)' // 👈 shadow
            }}
        >
            <div className="flex items-center justify-between mb-2">
                <p className="text-base md:text-sm font-medium truncate" style={{ opacity: 0.9, color: 'var(--cor-primaria)' }}>{titulo}</p>
                <div style={{ color: 'var(--cor-primaria)' }}>{icon}</div>
            </div>
            <p className="text-xl md:text-2xl lg:text-3xl font-bold truncate" style={{ color: 'var(--cor-primaria)' }}>{formatCurrency(stats.total)}</p>
            <p className="text-base md:text-base mt-1 truncate" style={{ opacity: 0.8, color: 'var(--cor-primaria)' }}>{descricao}</p>
        </div>
    )
}
