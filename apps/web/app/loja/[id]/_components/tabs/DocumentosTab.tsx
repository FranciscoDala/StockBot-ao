"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Loader2, Calendar, TrendingUp, Wallet, ChevronLeft, ChevronRight, RefreshCw, Package, User } from "lucide-react"
import { RelatorioPDFModal } from "../modals/RelatorioPDFModal" // 1. IMPORTA A MODAL

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

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
    nome_vendedor: string | null
    itens: ItemVenda[]
}

type Venda = {
    id: string
    data: string
    total: number
    formaPagamento: string
    itens: number
    nome_vendedor: string
    detalhes: ItemVenda[]
}

type Props = {
    lojaId: string
    token: string | null
    loja: { nome?: string | null; logo?: string | null; nif?: string | null; endereco?: string | null } | null
    formatCurrency: (v: number) => string
    theme: string;
    cardStyle: string;
}

const PERIODOS = [
    { value: "7dias", label: "Últimos 7 dias" },
    { value: "15dias", label: "Últimos 15 dias" },
    { value: "30dias", label: "Últimos 30 dias" },
    { value: "90dias", label: "Últimos 90 dias" },
    { value: "semana", label: "Esta Semana" },
    { value: "mes", label: "Este Mês" },
    { value: "trimestre", label: "Este Trimestre" },
    { value: "ano", label: "Este Ano" },
    { value: "personalizado", label: "Personalizado" },
]

export function DocumentosTab({ lojaId, token, loja, formatCurrency, theme, cardStyle }: Props) {
    const reportRef = useRef<HTMLDivElement>(null)
    const [loading, setLoading] = useState<string | null>(null)
    const [loadingVendas, setLoadingVendas] = useState(true)
    const [vendas, setVendas] = useState<Venda[]>([])
    const [activeTab, setActiveTab] = useState("7dias")
    const [isModalOpen, setIsModalOpen] = useState(false) // 2. STATE DA MODAL

    const hojeStr = new Date().toISOString().split('T')[0]
    const [dataInicio, setDataInicio] = useState(hojeStr)
    const [dataFim, setDataFim] = useState(hojeStr)

    const [page, setPage] = useState(1)
    const itemsPerPage = 10

    const radius = cardStyle === 'arredondado'? '16px' : '8px';
    const isLight = theme === 'light';

    const nomeLoja = loja?.nome || "StockBot AO"

    const buscarVendas = async () => {
        if (!token ||!lojaId) return;
        setLoadingVendas(true)
        try {
            const res = await fetch(`${API_URL}/vendas/?loja_id=${lojaId}&limit=5000`, {
                headers: { "Authorization": `Bearer ${token}` }
            })
            if (!res.ok) throw new Error("Erro ao buscar vendas")
            const data: VendaAPI[] = await res.json()

            const vendasFormatadas: Venda[] = (Array.isArray(data)? data : [])
               .filter(v => v.status?.toLowerCase().trim() === "concluida")
               .map(v => ({
                    id: String(v.id),
                    data: v.data_venda,
                    total: Number(v.total),
                    formaPagamento: v.forma_pagamento,
                    itens: Number(v.total_itens),
                    nome_vendedor: v.nome_vendedor || "Sem vendedor",
                    detalhes: (v.itens || []).map(item => ({
                       ...item,
                        preco_unitario: Number(item.preco_unitario),
                        subtotal: Number(item.subtotal)
                    }))
                }))
            setVendas(vendasFormatadas)
        } catch (e) {
            console.error("Erro buscar vendas:", e)
            setVendas([])
        } finally {
            setLoadingVendas(false)
        }
    }

    useEffect(() => {
        buscarVendas()
    }, [token, lojaId])

    const { vendasFiltradas, periodoTexto } = useMemo(() => {
        const hoje = new Date()
        hoje.setHours(23, 59, 59, 999)

        let inicio = new Date(hoje)
        let fim = new Date(hoje)
        let texto = "Últimos 7 dias"

        if (activeTab === "7dias") { inicio.setDate(hoje.getDate() - 7); texto = "Últimos 7 dias" }
        if (activeTab === "15dias") { inicio.setDate(hoje.getDate() - 15); texto = "Últimos 15 dias" }
        if (activeTab === "30dias") { inicio.setDate(hoje.getDate() - 30); texto = "Últimos 30 dias" }
        if (activeTab === "90dias") { inicio.setDate(hoje.getDate() - 90); texto = "Últimos 90 dias" }
        if (activeTab === "semana") { inicio.setDate(hoje.getDate() - hoje.getDay()); texto = "Esta Semana" }
        if (activeTab === "mes") { inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1); texto = "Este Mês" }
        if (activeTab === "trimestre") { inicio = new Date(hoje.getFullYear(), Math.floor(hoje.getMonth() / 3) * 3, 1); texto = "Este Trimestre" }
        if (activeTab === "ano") { inicio = new Date(hoje.getFullYear(), 0, 1); texto = "Este Ano" }

        if (activeTab === "personalizado" && dataInicio && dataFim) {
            inicio = new Date(dataInicio)
            inicio.setHours(0, 0, 0, 0)
            fim = new Date(dataFim)
            fim.setHours(23, 59, 59, 999)

            if (inicio > fim) {
                const temp = inicio
                inicio = fim
                fim = temp
            }

            const diffDays = Math.ceil((fim.getTime() - inicio.getTime()) / (1000 * 3600 * 24)) + 1
            texto = `${diffDays} dias personalizados`
        }

        const filtradas = vendas.filter(v => {
            const dataVenda = new Date(v.data)
            return dataVenda >= inicio && dataVenda <= fim
        }).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

        return { vendasFiltradas: filtradas, periodoTexto: texto }
    }, [activeTab, dataInicio, dataFim, vendas])

    useEffect(() => { setPage(1) }, [activeTab, dataInicio, dataFim])

    const totalVendas = vendasFiltradas.reduce((acc, v) => acc + v.total, 0)
    const totalItens = vendasFiltradas.reduce((acc, v) => acc + v.itens, 0)
    const ticketMedio = vendasFiltradas.length > 0? totalVendas / vendasFiltradas.length : 0

    const totalPages = Math.ceil(vendasFiltradas.length / itemsPerPage)
    const vendasPaginadas = vendasFiltradas.slice((page - 1) * itemsPerPage, page * itemsPerPage)

    const dataHoje = new Date().toLocaleDateString('pt-AO')
    const nomeArquivo = `Relatorio-${periodoTexto.replace(/\s/g, '-')}-${dataHoje.replace(/\//g, '-')}`

    // 3. FUNCAO exportarPDFModelo FOI REMOVIDA DAQUI

    return (
        <div className="space-y-4 md:space-y-6 p-0 md:p-0">
            <style jsx global>{`
              .scrollbar-hide::-webkit-scrollbar { display: none; }
              .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            {/* FILTROS COM SELECT */}
            <div
                className="border p-3 md:p-4"
                style={{
                    backgroundColor: 'var(--cor-card)',
                    borderColor: 'var(--cor-borda)',
                    borderRadius: radius
                }}
            >
                <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--cor-texto-sec)' }}>
                    <Calendar size={16} /> <span className="text-sm font-medium">Período do Relatório</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                    <Select value={activeTab} onValueChange={(value) => {
                        setActiveTab(value)
                        if (value === "personalizado") {
                            const hojeStr = new Date().toISOString().split('T')[0]
                            setDataInicio(hojeStr)
                            setDataFim(hojeStr)
                        }
                    }}>
                        <SelectTrigger className="w-full sm:w-[240px]" style={{ backgroundColor: 'var(--cor-card-hover)', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto)', borderRadius: radius }}>
                            <SelectValue placeholder="Selecione o período" />
                        </SelectTrigger>
                        <SelectContent>
                            {PERIODOS.map(p => (
                                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {activeTab === "personalizado" && (
                        <div className="flex gap-2 items-center flex-wrap">
                            <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-auto" style={{ backgroundColor: 'var(--cor-card-hover)', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto)', borderRadius: radius }} />
                            <span style={{ color: 'var(--cor-texto-sec)' }}>até</span>
                            <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-auto" style={{ backgroundColor: 'var(--cor-card-hover)', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto)', borderRadius: radius }} />
                        </div>
                    )}
                </div>

                {/* ABAS SCROLL COM BG PRIMARY */}
                <div className="mt-3 overflow-x-auto scrollbar-hide">
                    <div className="flex gap-2 w-max">
                        {PERIODOS.map(p => (
                            <button
                                key={p.value}
                                onClick={() => {
                                    setActiveTab(p.value)
                                    if (p.value === "personalizado") {
                                        const hojeStr = new Date().toISOString().split('T')[0]
                                        setDataInicio(hojeStr)
                                        setDataFim(hojeStr)
                                    }
                                }}
                                className="px-3 py-1.5 text-xs md:text-sm font-medium whitespace-nowrap transition-all"
                                style={{
                                    backgroundColor: activeTab === p.value? 'var(--cor-primaria)' : 'var(--cor-card-hover)',
                                    color: activeTab === p.value? 'white' : 'var(--cor-texto-sec)',
                                    borderRadius: radius,
                                    border: '1px solid var(--cor-borda)'
                                }}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <div className="p-3 md:p-4 min-w-0 overflow-hidden" style={{ border: '1px solid var(--cor-primaria)40', background: 'color-mix(in srgb, var(--cor-card) 80%, transparent)', backdropFilter: 'blur(12px)', borderRadius: radius, boxShadow: '0 0 25px color-mix(in srgb, var(--cor-primaria) 18%, transparent)' }}>
                    <div className="flex items-center justify-between mb-2 gap-2">
                        <p className="text-xs md:text-sm font-medium truncate" style={{ color: 'var(--cor-texto-sec)' }}>Total Vendido</p>
                        <TrendingUp size={16} style={{ color: 'var(--cor-primaria)', flexShrink: 0 }} />
                    </div>
                    <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold break-words" style={{ color: 'var(--cor-texto)' }}>{formatCurrency(totalVendas)}</p>
                </div>

                <div className="p-3 md:p-4 min-w-0 overflow-hidden" style={{ border: '1px solid var(--cor-primaria)40', background: 'color-mix(in srgb, var(--cor-card) 80%, transparent)', backdropFilter: 'blur(12px)', borderRadius: radius, boxShadow: '0 0 25px color-mix(in srgb, var(--cor-primaria) 18%, transparent)' }}>
                    <div className="flex items-center justify-between mb-2 gap-2">
                        <p className="text-xs md:text-sm font-medium truncate" style={{ color: 'var(--cor-texto-sec)' }}>Nº Transações</p>
                        <Wallet size={16} style={{ color: 'var(--cor-primaria)', flexShrink: 0 }} />
                    </div>
                    <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold break-words" style={{ color: 'var(--cor-texto)' }}>{vendasFiltradas.length}</p>
                </div>

                <div className="p-3 md:p-4 min-w-0 overflow-hidden" style={{ border: '1px solid var(--cor-primaria)40', background: 'color-mix(in srgb, var(--cor-card) 80%, transparent)', backdropFilter: 'blur(12px)', borderRadius: radius, boxShadow: '0 0 25px color-mix(in srgb, var(--cor-primaria) 18%, transparent)' }}>
                    <div className="flex items-center justify-between mb-2 gap-2">
                        <p className="text-xs md:text-sm font-medium truncate" style={{ color: 'var(--cor-texto-sec)' }}>Ticket Médio</p>
                        <TrendingUp size={16} style={{ color: 'var(--cor-primaria)', flexShrink: 0 }} />
                    </div>
                    <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold break-words" style={{ color: 'var(--cor-texto)' }}>{formatCurrency(ticketMedio)}</p>
                </div>

                <div className="p-3 md:p-4 min-w-0 overflow-hidden" style={{ border: '1px solid var(--cor-primaria)40', background: 'color-mix(in srgb, var(--cor-card) 80%, transparent)', backdropFilter: 'blur(12px)', borderRadius: radius, boxShadow: '0 0 25px color-mix(in srgb, var(--cor-primaria) 18%, transparent)' }}>
                    <div className="flex items-center justify-between mb-2 gap-2">
                        <p className="text-xs md:text-sm font-medium truncate" style={{ color: 'var(--cor-texto-sec)' }}>Itens Vendidos</p>
                        <Package size={16} style={{ color: 'var(--cor-primaria)', flexShrink: 0 }} />
                    </div>
                    <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold break-words" style={{ color: 'var(--cor-texto)' }}>{totalItens}</p>
                </div>
            </div>

            {/* TABELA */}
            <div ref={reportRef} className="p-3 md:p-4 border" style={{ backgroundColor: 'var(--cor-card)', borderColor: 'var(--cor-borda)', borderRadius: radius }}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                    <div>
                        <h2 className="text-base font-bold" style={{ color: 'var(--cor-texto)' }}>Relatório: {periodoTexto}</h2>
                        <p className="text-sm" style={{ color: 'var(--cor-texto-sec)' }}>{vendasFiltradas.length} vendas encontradas</p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={buscarVendas} size="sm" variant="outline" disabled={loadingVendas} style={{ borderColor: 'var(--cor-borda)', color: 'var(--cor-texto)', borderRadius: radius }}>
                            {loadingVendas? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />} Atualizar
                        </Button>
                        <Button onClick={() => setIsModalOpen(true)} size="sm" variant="outline" style={{ borderColor: 'var(--cor-borda)', color: 'var(--cor-texto)', borderRadius: radius }}> {/* 4. BOTAO ABRE A MODAL */}
                            <FileText className="mr-2 h-4 w-4" /> Ver Relátorio
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto scrollbar-hide">
                    {loadingVendas? (
                        <div className="flex justify-center py-10"><Loader2 className="animate-spin" style={{ color: 'var(--cor-primaria)' }} /></div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead><tr style={{ backgroundColor: 'var(--cor-primaria)', color: 'white' }}><th className="p-3 text-left">Data</th><th className="p-3 text-left">Funcionário</th><th className="p-3 text-right">Total</th><th className="p-3 text-left">Pagamento</th><th className="p-3 text-center">Itens</th></tr></thead>
                            <tbody>
                                {vendasPaginadas.length > 0? vendasPaginadas.map((v) => (
                                    <tr key={v.id} className="border-b hover:bg-opacity-50" style={{ borderColor: 'var(--cor-borda)' }}>
                                        <td className="p-3" style={{ color: 'var(--cor-texto)' }}>{new Date(v.data).toLocaleDateString('pt-AO')}</td>
                                        <td className="p-3" style={{ color: 'var(--cor-texto)' }}><div className="flex items-center gap-2"><User size={14} />{v.nome_vendedor}</div></td>
                                        <td className="p-3 text-right font-semibold" style={{ color: 'var(--cor-primaria)' }}>{formatCurrency(v.total)}</td>
                                        <td className="p-3" style={{ color: 'var(--cor-texto)' }}>{v.formaPagamento}</td>
                                        <td className="p-3 text-center" style={{ color: 'var(--cor-texto)' }}>{v.itens}</td>
                                    </tr>
                                )) : (<tr><td colSpan={5} className="p-8 text-center" style={{ color: 'var(--cor-texto-sec)' }}>Nenhuma venda neste período</td></tr>)}
                            </tbody>
                        </table>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                        <span className="text-sm" style={{ color: 'var(--cor-texto-sec)' }}>Página {page} de {totalPages}</span>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ borderColor: 'var(--cor-borda)', borderRadius: radius }}><ChevronLeft className="w-4 h-4" /></Button>
                            <Button size="sm" variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ borderColor: 'var(--cor-borda)', borderRadius: radius }}><ChevronRight className="w-4 h-4" /></Button>
                        </div>
                    </div>
                )}
            </div>

            {/* 5. CHAMA A MODAL AQUI */}
            <RelatorioPDFModal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                vendasFiltradas={vendasFiltradas}
                periodoTexto={periodoTexto}
                nomeLoja={nomeLoja}
                loja={loja}
                formatCurrency={formatCurrency}
                nomeArquivo={nomeArquivo}
            />
        </div>
    )
}
