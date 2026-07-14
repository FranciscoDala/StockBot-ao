"use client"
import { useEffect, useState, useMemo } from "react"
import { CalendarDays, TrendingUp, ShoppingBag, DollarSign, RefreshCw } from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

type VendaAPI = {
    id: string | number
    total: number
    total_itens: number
    forma_pagamento: string
    data_venda: string
    status: string
}

type Venda = {
    id: string
    data: string
    total: number
    formaPagamento: string
    itens: number
}

type Stats = {
    total: number
    qtdVendas: number
    ticketMedio: number
}

type Props = {
    lojaId: string
    token: string | null
    formatCurrency: (v: number) => string
}

export function EstatisticasTab({ lojaId, token, formatCurrency }: Props) {
    const [vendas, setVendas] = useState<Venda[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!token || !lojaId) return;
        buscarVendas()
    }, [token, lojaId])

    const buscarVendas = async () => {
        setLoading(true)
        try {
            const res = await fetch(`${API_URL}/vendas/?loja_id=${lojaId}&limit=5000`, { // <- / ADICIONADA AQUI
                headers: { "Authorization": `Bearer ${token}` }
            })
            if (!res.ok) throw new Error("Erro ao buscar vendas")
            const data: VendaAPI[] = await res.json()

            const vendasFormatadas: Venda[] = (Array.isArray(data) ? data : [])
                .filter(v => v.status?.toLowerCase().trim() === "concluida") // <- FILTRO MAIS SEGURO
                .map(v => ({
                    id: String(v.id),
                    data: v.data_venda,
                    total: Number(v.total),
                    formaPagamento: v.forma_pagamento,
                    itens: Number(v.total_itens)
                }))
            setVendas(vendasFormatadas)
        } catch (e) {
            console.error(e)
            setVendas([])
        } finally {
            setLoading(false)
        }
    }

    const hoje = new Date()
    const inicioSemana = useMemo(() => {
        const d = new Date(hoje)
        d.setDate(hoje.getDate() - hoje.getDay())
        d.setHours(0, 0, 0, 0)
        return d
    }, [])
    const inicioMes = useMemo(() => new Date(hoje.getFullYear(), hoje.getMonth(), 1), [])

    const filtrarPorPeriodo = (inicio: Date, fim: Date) => {
        return vendas.filter(v => {
            const dataVenda = new Date(v.data)
            return dataVenda >= inicio && dataVenda <= fim
        })
    }

    const calcularStats = (lista: Venda[]): Stats => {
        const total = lista.reduce((acc, v) => acc + v.total, 0)
        const qtdVendas = lista.length
        const ticketMedio = qtdVendas > 0 ? total / qtdVendas : 0
        return { total, qtdVendas, ticketMedio }
    }

    const vendasHoje = useMemo(() => filtrarPorPeriodo(
        new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()),
        new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59)
    ), [vendas, hoje])

    const vendasSemana = useMemo(() => filtrarPorPeriodo(inicioSemana, hoje), [vendas, inicioSemana, hoje])
    const vendasMes = useMemo(() => filtrarPorPeriodo(inicioMes, hoje), [vendas, inicioMes, hoje])

    const statsHoje = useMemo(() => calcularStats(vendasHoje), [vendasHoje])
    const statsSemana = useMemo(() => calcularStats(vendasSemana), [vendasSemana])
    const statsMes = useMemo(() => calcularStats(vendasMes), [vendasMes])

    if (loading) return (
        <div className="flex items-center justify-center py-10 md:py-20">
            <RefreshCw className="animate-spin text-green-500" size={28} />
        </div>
    )

    return (
        <div className="space-y-4 md:space-y-6 p-2 md:p-0">
            <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg md:text-xl font-bold">Estatísticas</h2>
                <button onClick={buscarVendas} className="flex items-center gap-1.5 px-2.5 py-1.5 md:px-3 md:py-2 bg-neutral-800 rounded-lg text-xs md:text-sm hover:bg-neutral-700 transition">
                    <RefreshCw size={14} /> Atualizar
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                <CardStats titulo="Hoje" stats={statsHoje} icon={<CalendarDays size={18} />} color="green" formatCurrency={formatCurrency} />
                <CardStats titulo="Semana" stats={statsSemana} icon={<TrendingUp size={18} />} color="blue" formatCurrency={formatCurrency} />
                <CardStats titulo="Mês" stats={statsMes} icon={<DollarSign size={18} />} color="purple" formatCurrency={formatCurrency} />
            </div>

            <div className="bg-neutral-900 rounded-xl shadow p-3 md:p-4">
                <div className="flex items-center gap-2 mb-3">
                    <ShoppingBag size={16} className="text-green-500" />
                    <h3 className="font-bold text-base md:text-lg">Vendas Hoje - {vendasHoje.length}</h3>
                </div>
                {vendasHoje.length === 0 ? (
                    <p className="text-gray-400 text-center py-6 text-sm">Nenhuma venda hoje ainda</p>
                ) : (
                    <div className="space-y-2 max-h-[350px] md:max-h-[400px] overflow-y-auto">
                        {vendasHoje.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).map(v => (
                            <div key={v.id} className="flex justify-between items-center border-b border-neutral-800 pb-2 text-sm">
                                <div>
                                    <p className="font-medium text-sm">{new Date(v.data).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}</p>
                                    <p className="text-xs text-gray-400">{v.itens} itens • {v.formaPagamento}</p>
                                </div>
                                <p className="font-bold text-green-500 text-sm md:text-base">{formatCurrency(v.total)}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function CardStats({
    titulo,
    stats,
    icon,
    color,
    formatCurrency
}: {
    titulo: string,
    stats: Stats,
    icon: React.ReactNode,
    color: "green" | "blue" | "purple",
    formatCurrency: (v: number) => string
}) {
    const colors = {
        green: "text-green-500",
        blue: "text-blue-500",
        purple: "text-purple-500"
    }

    return (
        <div className="bg-neutral-900 rounded-xl shadow p-3 md:p-4">
            <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs md:text-sm text-gray-400">{titulo}</p>
                <div className={colors[color]}>{icon}</div>
            </div>
            <p className={`text-xl md:text-2xl font-bold ${colors[color]}`}>{formatCurrency(stats.total)}</p>
            <div className="text-xs md:text-sm mt-2 space-y-1 text-gray-300">
                <p>Vendas: <span className="font-semibold text-white">{stats.qtdVendas}</span></p>
                <p>Ticket: <span className="font-semibold text-white">{formatCurrency(stats.ticketMedio)}</span></p>
            </div>
        </div>
    )
}
