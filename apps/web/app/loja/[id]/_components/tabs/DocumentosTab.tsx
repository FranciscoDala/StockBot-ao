"use client"
import { useMemo, useState } from "react"
import { FileText, Download, FileSpreadsheet, File, Filter, Calendar, BarChart3 } from "lucide-react"
import { formatCurrency } from "../utils";
import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, TextRun } from "docx"
import { saveAs } from "file-saver"

type Venda = { id: string, data: string, total: number, formaPagamento: string, itens: number, status?: string }
type Produto = { id: string, nome: string, estoque: number, preco: number, categoria_id?: any }

type Props = {
    vendas: Venda[];
    produtos: Produto[];
    loja: any;
    theme: string;
    cardStyle: string;
    cardSize: string;
}

export function DocumentosTab({ vendas, produtos, loja, theme, cardStyle, cardSize }: Props) {
    const [periodo, setPeriodo] = useState("30")
    const [tipoRelatorio, setTipoRelatorio] = useState("vendas")
    const radius = cardStyle === 'arredondado'? '16px' : '8px';
    const padding = cardSize === 'grande'? '24px' : '16px';

    const dadosFiltrados = useMemo(() => {
        const diasAtras = new Date()
        diasAtras.setDate(diasAtras.getDate() - Number(periodo))
        const vendasF = vendas.filter(v => new Date(v.data) >= diasAtras && v.status !== 'cancelada')
        const total = vendasF.reduce((acc, v) => acc + v.total, 0)
        const qtd = vendasF.length
        const ticket = qtd > 0 ? total / qtd : 0
        return { vendasF, total, qtd, ticket }
    }, [vendas, periodo])

    const cardBaseStyle = {
        background: 'color-mix(in srgb, var(--cor-card) 85%, transparent)',
        backdropFilter: 'blur(16px)',
        border: '1px solid color-mix(in srgb, var(--cor-primaria) 15%, transparent)',
        borderRadius: radius,
        boxShadow: '0 0 25px color-mix(in srgb, var(--cor-primaria) 12%, transparent)',
        padding
    }

    // 1. EXPORT EXCEL
    const exportarExcel = () => {
        const ws = XLSX.utils.json_to_sheet(dadosFiltrados.vendasF.map(v => ({
            Data: new Date(v.data).toLocaleDateString('pt-AO'),
            Total: v.total,
            "Forma Pagamento": v.formaPagamento,
            Itens: v.itens
        })))
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Vendas")
        XLSX.writeFile(wb, `Relatorio-${tipoRelatorio}-${new Date().toISOString().split('T')[0]}.xlsx`)
    }

    // 2. EXPORT PDF
    const exportarPDF = async () => {
        const doc = new jsPDF()
        doc.setFontSize(18)
        doc.text(loja?.nome || "Relatorio", 14, 22)
        doc.setFontSize(11)
        doc.text(`Periodo: Ultimos ${periodo} dias`, 14, 30)
        doc.text(`Faturamento: ${formatCurrency(dadosFiltrados.total)}`, 14, 38)
        doc.text(`Vendas: ${dadosFiltrados.qtd}`, 14, 46)
        doc.text(`Ticket Medio: ${formatCurrency(dadosFiltrados.ticket)}`, 14, 54)
        doc.save(`Relatorio-${tipoRelatorio}.pdf`)
    }

    // 3. EXPORT WORD
    const exportarWord = async () => {
        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({ children: [new TextRun({ text: loja?.nome || "Relatorio", bold: true, size: 32 })] }),
                    new Paragraph(`Periodo: Ultimos ${periodo} dias`),
                    new Paragraph(`Faturamento: ${formatCurrency(dadosFiltrados.total)}`),
                    new Paragraph(`Vendas: ${dadosFiltrados.qtd}`),
                    new Paragraph(`Ticket Medio: ${formatCurrency(dadosFiltrados.ticket)}`),
                ]
            }]
        })
        const blob = await Packer.toBlob(doc)
        saveAs(blob, `Relatorio-${tipoRelatorio}.docx`)
    }

    return (
        <div className="space-y-4 md:space-y-6 p-2 md:p-0" data-theme={theme}>
            {/* HEADER + ACOES */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2" style={{color: 'var(--cor-texto)'}}>
                        Central de Relatórios
                        <FileText size={16} style={{color: 'var(--cor-primaria)'}} />
                    </h2>
                    <p className="text-xs sm:text-sm" style={{color: 'var(--cor-texto-sec)'}}>Gere e exporte todos os documentos da loja</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button onClick={exportarPDF} className="flex items-center gap-2 font-semibold transition hover:scale-[1.03]" style={{background: 'var(--cor-primaria)', color: '#fff', padding: '10px 16px', borderRadius: radius, fontSize: '12px'}}><File size={14} /> PDF</button>
                    <button onClick={exportarWord} className="flex items-center gap-2 font-semibold transition hover:scale-[1.03]" style={{background: '#2563eb', color: '#fff', padding: '10px 16px', borderRadius: radius, fontSize: '12px'}}><FileText size={14} /> WORD</button>
                    <button onClick={exportarExcel} className="flex items-center gap-2 font-semibold transition hover:scale-[1.03]" style={{background: '#16a34a', color: '#fff', padding: '10px 16px', borderRadius: radius, fontSize: '12px'}}><FileSpreadsheet size={14} /> EXCEL</button>
                </div>
            </div>

            {/* FILTROS GLASS */}
            <div style={cardBaseStyle}>
                <div className="flex items-center gap-2 mb-3" style={{color: 'var(--cor-primaria)'}}>
                    <Filter size={16} /> <span className="text-sm font-semibold">Filtros Inteligentes</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs" style={{color: 'var(--cor-texto-sec)'}}>Período</label>
                        <select value={periodo} onChange={e => setPeriodo(e.target.value)} className="w-full mt-1 rounded-lg px-3 py-2 text-sm outline-none" style={{backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)', border: '1px solid var(--cor-primaria)30', borderRadius: radius}}>
                            <option value="7">Últimos 7 dias</option>
                            <option value="15">Últimos 15 dias</option>
                            <option value="30">Últimos 30 dias</option>
                            <option value="90">Últimos 90 dias</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs" style={{color: 'var(--cor-texto-sec)'}}>Tipo de Relatório</label>
                        <select value={tipoRelatorio} onChange={e => setTipoRelatorio(e.target.value)} className="w-full mt-1 rounded-lg px-3 py-2 text-sm outline-none" style={{backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)', border: '1px solid var(--cor-primaria)30', borderRadius: radius}}>
                            <option value="vendas">Vendas</option>
                            <option value="estoque">Estoque</option>
                            <option value="financeiro">Financeiro</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* CARDS KPI */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {[
                    {titulo: "Faturamento", valor: formatCurrency(dadosFiltrados.total), icon: <BarChart3 size={16}/>},
                    {titulo: "Vendas", valor: dadosFiltrados.qtd, icon: <FileText size={16}/>},
                    {titulo: "Ticket Médio", valor: formatCurrency(dadosFiltrados.ticket), icon: <BarChart3 size={16}/>},
                    {titulo: "Produtos", valor: produtos.length, icon: <FileSpreadsheet size={16}/>}
                ].map(k => (
                    <div key={k.titulo} className="transition hover:scale-[1.02]" style={cardBaseStyle}>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs md:text-sm font-medium" style={{color: 'var(--cor-primaria)'}}>{k.titulo}</p>
                            <div style={{color: 'var(--cor-primaria)'}}>{k.icon}</div>
                        </div>
                        <p className="text-2xl md:text-3xl font-bold" style={{color: 'var(--cor-primaria)'}}>{k.valor}</p>
                    </div>
                ))}
            </div>

            {/* TABELA PREVIEW */}
            <div style={cardBaseStyle}>
                <h3 className="font-bold text-base mb-3" style={{color: 'var(--cor-primaria)'}}>Pré-visualização</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr style={{borderBottom: '1px solid var(--cor-primaria)30'}}>
                                <th className="text-left p-2" style={{color: 'var(--cor-primaria)'}}>Data</th>
                                <th className="text-left p-2" style={{color: 'var(--cor-primaria)'}}>Total</th>
                                <th className="text-left p-2" style={{color: 'var(--cor-primaria)'}}>Pagamento</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dadosFiltrados.vendasF.slice(0, 5).map(v => (
                                <tr key={v.id} style={{borderBottom: '1px solid var(--cor-primaria)10'}}>
                                    <td className="p-2" style={{color: 'var(--cor-texto)'}}>{new Date(v.data).toLocaleDateString('pt-AO')}</td>
                                    <td className="p-2 font-bold" style={{color: 'var(--cor-primaria)'}}>{formatCurrency(v.total)}</td>
                                    <td className="p-2" style={{color: 'var(--cor-texto-sec)'}}>{v.formaPagamento}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
