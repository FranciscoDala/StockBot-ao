"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, FileDown, Loader2, Calendar, TrendingUp, Wallet, ChevronLeft, ChevronRight, RefreshCw, Package } from "lucide-react"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { saveAs } from "file-saver"
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, HeadingLevel, AlignmentType, TextRun } from "docx"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
    itens: ItemVenda[]
}

type Venda = {
    id: string
    data: string
    total: number
    formaPagamento: string
    itens: number
    detalhes: ItemVenda[]
}

type Props = {
    lojaId: string
    token: string | null
    loja: { nome?: string | null; logo?: string | null; nif?: string | null; endereco?: string | null } | null // <-- ACEITA NULL AGORA
    formatCurrency: (v: number) => string
    theme: string; // <-- ADICIONADO
    cardStyle: string; // <-- ADICIONADO
}

export function DocumentosTab({ lojaId, token, loja, formatCurrency, theme, cardStyle }: Props) {
    const reportRef = useRef<HTMLDivElement>(null)
    const [loading, setLoading] = useState<string | null>(null)
    const [loadingVendas, setLoadingVendas] = useState(true)
    const [vendas, setVendas] = useState<Venda[]>([])
    const [activeTab, setActiveTab] = useState("7dias")
    const [dataInicio, setDataInicio] = useState("")
    const [dataFim, setDataFim] = useState("")
    const [page, setPage] = useState(1)
    const itemsPerPage = 20

    const radius = cardStyle === 'arredondado' ? '16px' : '8px';
    const isLight = theme === 'light';

    const nomeLoja = loja?.nome || "StockBot AO"

    const buscarVendas = async () => {
        if (!token || !lojaId) return;
        setLoadingVendas(true)
        try {
            const res = await fetch(`${API_URL}/vendas/?loja_id=${lojaId}&limit=5000`, {
                headers: { "Authorization": `Bearer ${token}` }
            })
            if (!res.ok) throw new Error("Erro ao buscar vendas")
            const data: VendaAPI[] = await res.json()

            const vendasFormatadas: Venda[] = (Array.isArray(data) ? data : [])
                .filter(v => v.status?.toLowerCase().trim() === "concluida")
                .map(v => ({
                    id: String(v.id),
                    data: v.data_venda,
                    total: Number(v.total),
                    formaPagamento: v.forma_pagamento,
                    itens: Number(v.total_itens),
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
        let inicio = new Date(hoje)
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
            const fim = new Date(dataFim)
            const diffDays = Math.ceil((fim.getTime() - inicio.getTime()) / (1000 * 3600 * 24))
            texto = `${diffDays} dias personalizados`
        }

        const filtradas = vendas.filter(v => {
            const dataVenda = new Date(v.data)
            return dataVenda >= inicio && dataVenda <= hoje
        }).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

        return { vendasFiltradas: filtradas, periodoTexto: texto }
    }, [activeTab, dataInicio, dataFim, vendas])

    useEffect(() => { setPage(1) }, [activeTab, dataInicio, dataFim])

    const totalVendas = vendasFiltradas.reduce((acc, v) => acc + v.total, 0)
    const totalItens = vendasFiltradas.reduce((acc, v) => acc + v.itens, 0)
    const ticketMedio = vendasFiltradas.length > 0 ? totalVendas / vendasFiltradas.length : 0

    const totalPages = Math.ceil(vendasFiltradas.length / itemsPerPage)
    const vendasPaginadas = vendasFiltradas.slice((page - 1) * itemsPerPage, page * itemsPerPage)

    const dataHoje = new Date().toLocaleDateString('pt-AO')
    const nomeArquivo = `Relatorio-${periodoTexto.replace(/\s/g, '-')}-${dataHoje.replace(/\//g, '-')}`

    const exportarPDF = async () => {
        setLoading('pdf')
        try {
            const input = reportRef.current
            if (!input) return
            const canvas = await html2canvas(input, { scale: 2, backgroundColor: isLight ? '#ffffff' : '#1f2937' })
            const imgData = canvas.toDataURL('image/png')
            const pdf = new jsPDF('p', 'mm', 'a4')
            const pdfWidth = pdf.internal.pageSize.getWidth()
            const imgWidth = pdfWidth - 30
            const imgHeight = (canvas.height * imgWidth) / canvas.width
            pdf.setFontSize(16).setTextColor("#6366F1").text(nomeLoja, pdfWidth / 2, 20, { align: "center" })
            pdf.setFontSize(10).setTextColor(100).text(`Período: ${periodoTexto} | ${dataHoje}`, pdfWidth / 2, 27, { align: "center" })
            pdf.line(15, 35, pdfWidth - 15, 35)
            pdf.addImage(imgData, 'PNG', 15, 40, imgWidth, imgHeight)
            pdf.save(`${nomeArquivo}.pdf`)
        } catch (error) {
            console.error(error);
            alert("Erro ao gerar PDF")
        } finally {
            setLoading(null)
        }
    }

    const exportarWord = async () => {
        setLoading('word')
        try {
            const children: any[] = [
                new Paragraph({ children: [new TextRun({ text: `${nomeLoja} - ${periodoTexto}`, bold: true, size: 32 })], heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
                new Paragraph({ text: `Emitido em: ${dataHoje}`, alignment: AlignmentType.CENTER }),
                new Paragraph({ children: [new TextRun({ text: `Total Vendido: ${formatCurrency(totalVendas)}`, bold: true })] }),
                new Paragraph({ text: `Nº Vendas: ${vendasFiltradas.length}` }),
                new Paragraph({ text: `Ticket Médio: ${formatCurrency(ticketMedio)}` }),
                new Paragraph({ text: "" })
            ]
            const table = new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({ tableHeader: true, children: ['Data', 'Total KZ', 'Pagamento', 'Itens'].map(text => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: "FFFFFF" })] })], shading: { fill: "6366F1" } })) }),
                    ...vendasFiltradas.map((v) => new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph(new Date(v.data).toLocaleDateString('pt-AO'))] }),
                            new TableCell({ children: [new Paragraph(formatCurrency(v.total))] }),
                            new TableCell({ children: [new Paragraph(v.formaPagamento)] }),
                            new TableCell({ children: [new Paragraph(String(v.itens))] }),
                        ]
                    }))
                ],
            })
            children.push(table)
            const doc = new Document({ sections: [{ children }] })
            saveAs(await Packer.toBlob(doc), `${nomeArquivo}.docx`)
        } catch (error) {
            console.error(error);
            alert("Erro ao gerar Word")
        } finally {
            setLoading(null)
        }
    }

    if(loadingVendas) return <div className="flex justify-center py-10"><Loader2 className="animate-spin" style={{ color: 'var(--cor-primaria)' }}/></div>

    return (
        <div className="space-y-4 md:space-y-6 p-2 md:p-0">
            <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            {/* FILTROS */}
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
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 lg:grid-cols-9" style={{ backgroundColor: 'var(--cor-card-hover)', borderRadius: radius }}>
                        {["7dias","15dias","30dias","90dias","semana","mes","trimestre","ano","personalizado"].map(tab => (
                            <TabsTrigger key={tab} value={tab} style={{ borderRadius: radius, color: 'var(--cor-texto-sec)' }}>
                                {tab === "7dias" ? "7 Dias" : tab === "15dias" ? "15 Dias" : tab === "30dias" ? "30 Dias" : tab === "90dias" ? "90 Dias" : tab === "semana" ? "Semana" : tab === "mes" ? "Mês" : tab === "trimestre" ? "Trimestre" : tab === "ano" ? "Ano" : "Personalizado"}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
                {activeTab === "personalizado" && (
                    <div className="flex gap-2 mt-4 items-center flex-wrap">
                        <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-auto" style={{ backgroundColor: 'var(--cor-card-hover)', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto)', borderRadius: radius }}/>
                        <span style={{ color: 'var(--cor-texto-sec)' }}>até</span>
                        <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-auto" style={{ backgroundColor: 'var(--cor-card-hover)', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto)', borderRadius: radius }}/>
                    </div>
                )}
            </div>

            {/* CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <div className="p-3 md:p-4" style={{ border: '1px solid var(--cor-primaria)40', background: 'color-mix(in srgb, var(--cor-card) 80%, transparent)', backdropFilter: 'blur(12px)', borderRadius: radius, boxShadow: '0 0 25px color-mix(in srgb, var(--cor-primaria) 18%, transparent)' }}>
                    <div className="flex items-center justify-between mb-2"><p className="text-xs md:text-sm font-medium" style={{ color: 'var(--cor-texto-sec)' }}>Total Vendido</p><TrendingUp size={16} style={{ color: 'var(--cor-primaria)' }}/></div>
                    <p className="text-xl md:text-2xl lg:text-3xl font-bold" style={{ color: 'var(--cor-texto)' }}>{formatCurrency(totalVendas)}</p>
                </div>
                <div className="p-3 md:p-4" style={{ border: '1px solid var(--cor-primaria)40', background: 'color-mix(in srgb, var(--cor-card) 80%, transparent)', backdropFilter: 'blur(12px)', borderRadius: radius, boxShadow: '0 0 25px color-mix(in srgb, var(--cor-primaria) 18%, transparent)' }}>
                    <div className="flex items-center justify-between mb-2"><p className="text-xs md:text-sm font-medium" style={{ color: 'var(--cor-texto-sec)' }}>Nº Transações</p><Wallet size={16} style={{ color: 'var(--cor-primaria)' }}/></div>
                    <p className="text-xl md:text-2xl lg:text-3xl font-bold" style={{ color: 'var(--cor-texto)' }}>{vendasFiltradas.length}</p>
                </div>
                <div className="p-3 md:p-4" style={{ border: '1px solid var(--cor-primaria)40', background: 'color-mix(in srgb, var(--cor-card) 80%, transparent)', backdropFilter: 'blur(12px)', borderRadius: radius, boxShadow: '0 0 25px color-mix(in srgb, var(--cor-primaria) 18%, transparent)' }}>
                    <div className="flex items-center justify-between mb-2"><p className="text-xs md:text-sm font-medium" style={{ color: 'var(--cor-texto-sec)' }}>Ticket Médio</p><TrendingUp size={16} style={{ color: 'var(--cor-primaria)' }}/></div>
                    <p className="text-xl md:text-2xl lg:text-3xl font-bold" style={{ color: 'var(--cor-texto)' }}>{formatCurrency(ticketMedio)}</p>
                </div>
                <div className="p-3 md:p-4" style={{ border: '1px solid var(--cor-primaria)40', background: 'color-mix(in srgb, var(--cor-card) 80%, transparent)', backdropFilter: 'blur(12px)', borderRadius: radius, boxShadow: '0 0 25px color-mix(in srgb, var(--cor-primaria) 18%, transparent)' }}>
                    <div className="flex items-center justify-between mb-2"><p className="text-xs md:text-sm font-medium" style={{ color: 'var(--cor-texto-sec)' }}>Itens Vendidos</p><Package size={16} style={{ color: 'var(--cor-primaria)' }}/></div>
                    <p className="text-xl md:text-2xl lg:text-3xl font-bold" style={{ color: 'var(--cor-texto)' }}>{totalItens}</p>
                </div>
            </div>

            {/* TABELA */}
            <div ref={reportRef} className="p-3 md:p-4 border" style={{ backgroundColor: 'var(--cor-card)', borderColor: 'var(--cor-borda)', borderRadius: radius }}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                    <div>
                        <h2 className="text-xl font-bold" style={{ color: 'var(--cor-texto)' }}>Relatório: {periodoTexto}</h2>
                        <p className="text-sm" style={{ color: 'var(--cor-texto-sec)' }}>{vendasFiltradas.length} vendas encontradas</p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={buscarVendas} size="sm" variant="outline" style={{ borderColor: 'var(--cor-borda)', color: 'var(--cor-texto)', borderRadius: radius }}><RefreshCw className="mr-2 h-4 w-4" /> Atualizar</Button>
                        <Button onClick={exportarPDF} size="sm" variant="outline" disabled={!!loading} style={{ borderColor: 'var(--cor-borda)', color: 'var(--cor-texto)', borderRadius: radius }}>{loading === 'pdf'? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />} PDF</Button>
                        <Button onClick={exportarWord} size="sm" variant="outline" disabled={!!loading} style={{ borderColor: 'var(--cor-borda)', color: 'var(--cor-texto)', borderRadius: radius }}>{loading === 'word'? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />} Word</Button>
                    </div>
                </div>

                <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full text-sm">
                        <thead><tr style={{ backgroundColor: 'var(--cor-primaria)', color: 'white' }}><th className="p-3 text-left">Data</th><th className="p-3 text-right">Total</th><th className="p-3 text-left">Pagamento</th><th className="p-3 text-center">Itens</th></tr></thead>
                        <tbody>
                            {vendasPaginadas.length > 0? vendasPaginadas.map((v) => (
                                <tr key={v.id} className="border-b hover:bg-opacity-50" style={{ borderColor: 'var(--cor-borda)' }}>
                                    <td className="p-3" style={{ color: 'var(--cor-texto)' }}>{new Date(v.data).toLocaleDateString('pt-AO')}</td>
                                    <td className="p-3 text-right font-semibold" style={{ color: 'var(--cor-primaria)' }}>{formatCurrency(v.total)}</td>
                                    <td className="p-3" style={{ color: 'var(--cor-texto)' }}>{v.formaPagamento}</td>
                                    <td className="p-3 text-center" style={{ color: 'var(--cor-texto)' }}>{v.itens}</td>
                                </tr>
                            )) : (<tr><td colSpan={4} className="p-8 text-center" style={{ color: 'var(--cor-texto-sec)' }}>Nenhuma venda neste período</td></tr>)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
