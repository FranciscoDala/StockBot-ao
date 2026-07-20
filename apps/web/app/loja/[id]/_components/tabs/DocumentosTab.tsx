"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, FileDown, Loader2, Calendar, TrendingUp, Wallet, ChevronLeft, ChevronRight, RefreshCw, Package, User } from "lucide-react"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { saveAs } from "file-saver"
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, HeadingLevel, AlignmentType, TextRun } from "docx"
import { zalandoBase64 } from './font/fonts'

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
    nome_vendedor: string | null // <-- ADICIONA ESSA LINHA
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

    const hojeStr = new Date().toISOString().split('T')[0]
    const [dataInicio, setDataInicio] = useState(hojeStr)
    const [dataFim, setDataFim] = useState(hojeStr)


    const [page, setPage] = useState(1)
    const itemsPerPage = 10 // <-- MUDADO PRA 10

    const radius = cardStyle === 'arredondado' ? '16px' : '8px';
    const isLight = theme === 'light';

    const nomeLoja = loja?.nome || "StockBot AO"

    const buscarVendas = async () => {
        if (!token || !lojaId) return;
        setLoadingVendas(true) // <-- SÓ SPINNER NA TABELA
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
        hoje.setHours(23, 59, 59, 999) // garante que pega o dia todo

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
            inicio.setHours(0, 0, 0, 0) // começo do dia
            fim = new Date(dataFim)
            fim.setHours(23, 59, 59, 999) // fim do dia

            // se usuario inverteu as datas
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
            return dataVenda >= inicio && dataVenda <= fim // <-- MUDOU AQUI: era <= hoje
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



    const exportarPDFModelo = async () => {
        setLoading('pdf')
        try {
            const pdf = new jsPDF('p', 'mm', 'a4')
            const pageWidth = pdf.internal.pageSize.getWidth()

            // 1. REGISTRAR FONTE
            pdf.addFileToVFS('ZalandoSansExpanded-Light.ttf', zalandoBase64)
            pdf.addFont('ZalandoSansExpanded-Light.ttf', 'Zalando', 'normal')

            const setZalando = (style: 'normal' | 'bold' | 'italic' = 'normal') => {
                pdf.setFont('Zalando', style)
            }
            setZalando()

            const corHeader = [220, 228, 235]
            const corBorda = [200, 210, 220]
            const corTextoCinza = [100, 100, 100]

            // 2. CABEÇALHO
            pdf.setDrawColor(0)
            pdf.setLineWidth(0.5)
            pdf.rect(15, 15, 80, 25, "D")
            setZalando('normal')
            pdf.setFontSize(10)
            pdf.text("Logo", 55, 28, { align: "center" })

            let yDireita = 18
            setZalando('normal')
            pdf.setFontSize(9)
            pdf.setTextColor(corTextoCinza[0], corTextoCinza[1], corTextoCinza[2])
            pdf.text("Empresa", 110, yDireita, { align: "right" })
            setZalando('bold')
            pdf.setTextColor(0)
            pdf.text(nomeLoja, 115, yDireita)

            yDireita += 6
            setZalando('normal')
            pdf.setTextColor(corTextoCinza[0], corTextoCinza[1], corTextoCinza[2])
            pdf.text("NIF", 110, yDireita, { align: "right" })
            setZalando('bold')
            pdf.setTextColor(0)
            pdf.text(loja?.nif || "XXXXX", 115, yDireita)

            yDireita += 6
            setZalando('normal')
            pdf.setTextColor(corTextoCinza[0], corTextoCinza[1], corTextoCinza[2])
            pdf.text("Endereço", 110, yDireita, { align: "right" })
            setZalando('bold')
            pdf.setTextColor(0)
            pdf.text(loja?.endereco || "XXXXX", 115, yDireita)

            yDireita += 6
            setZalando('normal')
            pdf.setTextColor(corTextoCinza[0], corTextoCinza[1], corTextoCinza[2])
            pdf.text("Phone", 110, yDireita, { align: "right" })
            setZalando('bold')
            pdf.setTextColor(0)
            pdf.text("(xxx) xxx-xxxx", 115, yDireita)

            yDireita += 6
            setZalando('normal')
            pdf.setTextColor(corTextoCinza[0], corTextoCinza[1], corTextoCinza[2])
            pdf.text("E-mail", 110, yDireita, { align: "right" })
            setZalando('bold')
            pdf.setTextColor(0)
            pdf.text("email@empresa.com", 115, yDireita)

            let y = 55

            // 3. AGRUPAR VENDAS POR DIA
            const vendasPorDia = vendasFiltradas.reduce((acc, venda) => {
                const data = new Date(venda.data).toLocaleDateString('pt-AO')
                if (!acc[data]) acc[data] = { total: 0 }
                acc[data].total += venda.total
                return acc
            }, {} as Record<string, { total: number }>)

            const dadosAgrupados = Object.entries(vendasPorDia).sort((a, b) =>
                new Date(b[0].split('/').reverse().join('-')).getTime() - new Date(a[0].split('/').reverse().join('-')).getTime()
            )

            // 4. TABELA
            const headers = ["Data", "Venda", "Entrada", "Saida", "Subtotal", "Lucro", "Total Geral"]
            const colWidths = [20, 30, 20, 20, 25, 25, 30]
            const startX = 15
            const rowHeight = 8
            const totalTableWidth = colWidths.reduce((a, b) => a + b)

            pdf.setFillColor(corHeader[0], corHeader[1], corHeader[2])
            pdf.setDrawColor(corBorda[0], corBorda[1], corBorda[2])
            pdf.rect(startX, y - 4, totalTableWidth, rowHeight, "F")

            setZalando('bold')
            pdf.setTextColor(0)
            pdf.setFontSize(9)
            headers.forEach((h, i) => {
                const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0)
                pdf.rect(x, y - 4, colWidths[i], rowHeight, "D")
                pdf.text(h, x + 2, y)
            })
            y += rowHeight

            pdf.setDrawColor(corBorda[0], corBorda[1], corBorda[2])
            pdf.rect(startX, y - 4, totalTableWidth - colWidths[6], rowHeight, "D")
            pdf.rect(startX + totalTableWidth - colWidths[6], y - 4, colWidths[6], rowHeight, "D")
            setZalando('normal')
            pdf.setFontSize(8)
            pdf.text("$", startX + totalTableWidth - colWidths[6] + 2, y)
            pdf.text("-", startX + totalTableWidth - 5, y)
            y += rowHeight

            setZalando('normal')
            pdf.setFontSize(8.5)
            dadosAgrupados.forEach(([data, info], index) => {
                if (y > 270) {
                    pdf.addPage()
                    y = 20
                    setZalando() // reforça fonte na nova pagina
                }

                const x = startX
                const total = info.total

                if (index % 2 === 0) {
                    pdf.setFillColor(248, 250, 252)
                    pdf.rect(startX, y - 4, totalTableWidth, rowHeight, "F")
                }

                headers.forEach((_, i) => {
                    const cellX = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0)
                    pdf.rect(cellX, y - 4, colWidths[i], rowHeight, "D")
                })

                let currentX = x + 2
                setZalando('bold')
                pdf.text(data, currentX, y)

                currentX = x + colWidths[0] + 2
                setZalando('normal')
                pdf.text("-", currentX, y)

                currentX = x + colWidths[0] + colWidths[1] + 2
                setZalando('bold')
                pdf.text(formatCurrency(total), currentX, y)

                currentX = x + colWidths[0] + colWidths[1] + colWidths[2] + 2
                setZalando('normal')
                pdf.text(formatCurrency(0), currentX, y)

                currentX = x + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 2
                setZalando('bold')
                pdf.text(formatCurrency(total), currentX, y)

                currentX = x + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + 2
                setZalando('bold')
                pdf.text(formatCurrency(total), currentX, y)

                currentX = x + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5] + 2
                setZalando('bold')
                pdf.text(formatCurrency(total), currentX, y)

                y += rowHeight
            })
            y += 8

            // 5. REMINDER
            setZalando('normal')
            pdf.setFontSize(8)
            pdf.setTextColor(corTextoCinza[0], corTextoCinza[1], corTextoCinza[2])
            pdf.text("Reminder: Please include the statement number on your check.", 15, y)
            y += 5
            pdf.text("Terms: Balance due in 30 days.", 15, y)
            y += 10

            // 6. TABELA "ESTE MÊS"
            const totalGeral = dadosAgrupados.reduce((sum, [, info]) => sum + info.total, 0)
            const resumoWidth = 90

            pdf.setFillColor(corHeader[0], corHeader[1], corHeader[2])
            pdf.setDrawColor(corBorda[0], corBorda[1], corBorda[2])
            pdf.rect(15, y - 4, resumoWidth, rowHeight, "F")
            setZalando('bold')
            pdf.setTextColor(0)
            pdf.setFontSize(9)
            pdf.rect(15, y - 4, resumoWidth, rowHeight, "D")
            pdf.text("Este mês", 17, y)
            y += rowHeight

            const resumoMes = [
                ["Entrada", formatCurrency(totalGeral)],
                ["Saida", formatCurrency(0)],
                ["Lucro", formatCurrency(totalGeral)],
                ["Diferença", formatCurrency(totalGeral)],
            ]

            resumoMes.forEach(([label, valor]) => {
                pdf.rect(15, y - 4, resumoWidth, rowHeight, "D")
                setZalando('italic')
                pdf.setTextColor(corTextoCinza[0], corTextoCinza[1], corTextoCinza[2])
                pdf.text(label, 17, y)
                setZalando('bold')
                pdf.setTextColor(0)
                pdf.text(valor, 15 + resumoWidth - 3, y, { align: "right" })
                y += rowHeight
            })

            // RODAPÉ
            const totalPages = pdf.internal.getNumberOfPages()
            for (let i = 1; i <= totalPages; i++) {
                pdf.setPage(i)
                setZalando('normal')
                pdf.setFontSize(8)
                pdf.setTextColor(150)
                pdf.text(`Página ${i} de ${totalPages}`, pageWidth / 2, 287, { align: "center" })
            }

            pdf.save(`Relatorio-Modelo-${nomeArquivo}.pdf`)
        } catch (error) {
            console.error(error)
            alert("Erro ao gerar PDF.")
        } finally {
            setLoading(null)
        }
    }

    const exportarWord = async () => {
        setLoading('word')
        try {
            const children: any[] = [
                new Paragraph({
                    children: [new TextRun({ text: nomeLoja, bold: true, size: 36, color: "6366F1" })],
                    heading: HeadingLevel.HEADING_1,
                    alignment: AlignmentType.CENTER
                }),
                new Paragraph({ text: `Período: ${periodoTexto}`, alignment: AlignmentType.CENTER }),
                new Paragraph({ text: `Emitido em: ${dataHoje}`, alignment: AlignmentType.CENTER }),
                new Paragraph({ text: "" }),
                new Paragraph({ text: "" }),

                new Paragraph({ children: [new TextRun({ text: "Resumo do Período", bold: true, size: 28 })], heading: HeadingLevel.HEADING_2 }),
                new Paragraph({ children: [new TextRun({ text: "Total Vendido: ", bold: true }), new TextRun({ text: formatCurrency(totalVendas) })] }),
                new Paragraph({ children: [new TextRun({ text: "Nº Vendas: ", bold: true }), new TextRun({ text: `${vendasFiltradas.length}` })] }),
                new Paragraph({ children: [new TextRun({ text: "Ticket Médio: ", bold: true }), new TextRun({ text: formatCurrency(ticketMedio) })] }),
                new Paragraph({ children: [new TextRun({ text: "Itens Vendidos: ", bold: true }), new TextRun({ text: `${totalItens}` })] }),
                new Paragraph({ text: "" }),
                new Paragraph({ text: "" }),

                new Paragraph({ children: [new TextRun({ text: "Detalhe das Vendas", bold: true, size: 28 })], heading: HeadingLevel.HEADING_2 }),
            ]

            const table = new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({
                        tableHeader: true,
                        children: ['Data', 'Funcionário', 'Total KZ', 'Pagamento', 'Itens'].map(text =>
                            new TableCell({
                                children: [new Paragraph({
                                    children: [new TextRun({ text, bold: true, color: "FFFFFF" })],
                                    alignment: AlignmentType.CENTER // <-- CORRIGIDO: vai aqui
                                })],
                                shading: { fill: "6366F1" },
                            })
                        )
                    }),
                    ...vendasFiltradas.map((v) => new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph(new Date(v.data).toLocaleDateString('pt-AO'))] }),
                            new TableCell({ children: [new Paragraph(v.nome_vendedor)] }),
                            new TableCell({ children: [new Paragraph(formatCurrency(v.total))] }),
                            new TableCell({ children: [new Paragraph(v.formaPagamento)] }),
                            new TableCell({
                                children: [new Paragraph({
                                    text: String(v.itens),
                                    alignment: AlignmentType.CENTER // <-- CORRIGIDO: vai aqui
                                })]
                            }),
                        ]
                    }))
                ],
            })

            children.push(table)
            children.push(new Paragraph({ text: "" }))
            children.push(new Paragraph({ text: `Relatório gerado pelo ${nomeLoja}`, alignment: AlignmentType.CENTER }))

            const doc = new Document({ sections: [{ children }] })
            saveAs(await Packer.toBlob(doc), `${nomeArquivo}.docx`)
        } catch (error) {
            console.error(error);
            alert("Erro ao gerar Word")
        } finally {
            setLoading(null)
        }
    }

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
                                    backgroundColor: activeTab === p.value ? 'var(--cor-primaria)' : 'var(--cor-card-hover)',
                                    color: activeTab === p.value ? 'white' : 'var(--cor-texto-sec)',
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
                            {loadingVendas ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />} Atualizar
                        </Button>
                        <Button onClick={exportarPDFModelo} size="sm" variant="outline" disabled={!!loading} style={{ borderColor: 'var(--cor-borda)', color: 'var(--cor-texto)', borderRadius: radius }}>{loading === 'pdf' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />} PDF</Button>
                        <Button onClick={exportarWord} size="sm" variant="outline" disabled={!!loading} style={{ borderColor: 'var(--cor-borda)', color: 'var(--cor-texto)', borderRadius: radius }}>{loading === 'word' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />} Word</Button>
                    </div>
                </div>

                <div className="overflow-x-auto scrollbar-hide">
                    {loadingVendas ? (
                        <div className="flex justify-center py-10"><Loader2 className="animate-spin" style={{ color: 'var(--cor-primaria)' }} /></div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead><tr style={{ backgroundColor: 'var(--cor-primaria)', color: 'white' }}><th className="p-3 text-left">Data</th><th className="p-3 text-left">Funcionário</th><th className="p-3 text-right">Total</th><th className="p-3 text-left">Pagamento</th><th className="p-3 text-center">Itens</th></tr></thead>
                            <tbody>
                                {vendasPaginadas.length > 0 ? vendasPaginadas.map((v) => (
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
        </div>
    )
}
