"use client";
import { User, MapPin, Edit, TrendingUp, TrendingDown, DollarSign, Ban, Wifi, WifiOff, ShoppingBag, Package } from "lucide-react";
import { Loja, userread, formatCurrency } from "../../page";
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

export function DadosTab({
    loja,
    user,
    lojaId,
    token
}: {
    loja: Loja | null | undefined;
    user: userread | null;
    lojaId?: string;
    token?: string | null;
}) {
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
            console.log("Faltando dados:", {lojaId, token, API_URL})
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
                if(resEstoque.ok){
                    const resEstoqueJson = await resEstoque.json();
                    estoqueZerado = resEstoqueJson.estoque_zerado || 0;
                    totalProdutos = resEstoqueJson.total_produtos_ativos || 0;
                }
            } catch {}

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
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                        Dados
                        {wsConectado ? <Wifi size={16} className="text-green-500" /> : <WifiOff size={16} className="text-red-500" />}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-400">Visão geral da loja em tempo real</p>
                </div>
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-bold transition w-full sm:w-auto">
                    <Edit size={14} />
                    Editar
                </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <CardStats
                    titulo="Faturamento Hoje"
                    stats={{ total: kpis.vendaDiaria, qtdVendas: kpis.qtdVendasHoje, ticketMedio: ticketMedio }}
                    icon={<DollarSign size={16} />}
                    cor="green"
                    descricao="Entradas de hoje"
                    formatCurrency={formatCurrency}
                />
                <CardStats
                    titulo="Vendas Hoje"
                    stats={{ total: kpis.qtdVendasHoje, qtdVendas: kpis.qtdVendasHoje, ticketMedio: ticketMedio }}
                    icon={<ShoppingBag size={16} />}
                    cor="blue"
                    descricao="Pedidos concluídos"
                    formatCurrency={(v) => String(v)}
                />
                <CardStats
                    titulo="Ticket Médio"
                    stats={{ total: ticketMedio, qtdVendas: kpis.qtdVendasHoje, ticketMedio: ticketMedio }}
                    icon={<TrendingUp size={16} />}
                    cor="purple"
                    descricao="Valor por venda"
                    formatCurrency={formatCurrency}
                />
                <CardStats
                    titulo="Estoque Zerado"
                    stats={{ total: kpis.estoqueZerado, qtdVendas: 0, ticketMedio: 0 }}
                    icon={<Ban size={16} />}
                    cor="red"
                    descricao="Não consegue vender"
                    formatCurrency={(v) => String(v)}
                />
            </div>

            <div className="bg-gradient-to-br from-amber-950/40 to-neutral-900 p-4 sm:p-6 rounded-xl border-amber-900/30">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-300 font-medium">Resumo do Mês</p>
                        <p className="text-3xl font-bold text-amber-400 mt-1">{loading ? "..." : formatCurrency(kpis.totalVendasMes)}</p>
                        <p className="text-xs text-amber-400/70 mt-1">Total vendido nos últimos 30 dias</p>
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
    cor,
    descricao,
    formatCurrency
}: {
    titulo: string,
    stats: Stats,
    icon: React.ReactNode,
    cor: "red" | "orange" | "yellow" | "blue" | "green" | "purple",
    descricao: string,
    formatCurrency: (v: number) => string
}) {
    const cores = {
        red: "border-red-500/30 bg-red-950/20 text-red-400",
        orange: "border-orange-500/30 bg-orange-950/20 text-orange-400",
        yellow: "border-yellow-500/30 bg-yellow-950/20 text-yellow-400",
        blue: "border-blue-500/30 bg-blue-950/20 text-blue-400",
        green: "border-green-500/30 bg-green-950/20 text-green-400",
        purple: "border-purple-500/30 bg-purple-950/20 text-purple-400"
    }

    return (
        <div className={`border rounded-xl p-3 md:p-4 transition hover:scale-[1.02] ${cores[cor]}`}>
            <div className="flex items-center justify-between mb-2">
                <p className="text-xs md:text-sm font-medium text-gray-300 truncate">{titulo}</p>
                <div className="opacity-80 shrink-0">{icon}</div>
            </div>
            <p className="text-xl md:text-2xl lg:text-3xl font-bold truncate">{formatCurrency(stats.total)}</p>
            <p className="text-xs md:text-xs mt-1 opacity-80 truncate">{descricao}</p>
        </div>
    )
}
