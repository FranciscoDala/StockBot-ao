"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { FileText, FileSpreadsheet, FileDown, Loader2 } from "lucide-react"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { saveAs } from "file-saver"
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, HeadingLevel, ImageRun, AlignmentType, BorderStyle } from "docx"
import ExcelJS from "exceljs"

interface Venda {
    id: string
    data: string
    total: number
    formaPagamento: string
    itens: number
}

interface DocumentosTabProps {
    dadosFiltrados: { vendasF: Venda[] }
    tipoRelatorio: string
    loja: { nome?: string; logo?: string }
}

export function DocumentosTab({ dadosFiltrados, tipoRelatorio, loja }: DocumentosTabProps) {
    const reportRef = useRef<HTMLDivElement>(null)
    const [loading, setLoading] = useState<string | null>(null)

    const primaryColor = "#6366F1"
    const dataHoje = new Date().toLocaleDateString('pt-AO')
    const nomeArquivo = `Relatorio-${tipoRelatorio}-${dataHoje.replace(/\//g, '-')}`

    const formatarKZ = (valor: number) => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(valor)

    const carregarImagem = async (url: string): Promise<string> => {
        if (!url) return ""
        try {
            const res = await fetch(url)
            const blob = await res.blob()
            return new Promise((resolve) => {
                const reader = new FileReader()
                reader.onloadend = () => resolve(reader.result as string)
                reader.readAsDataURL(blob)
            })
        } catch {
            return ""
        }
    }

    // 1. EXPORT PDF PROFISSIONAL
    const exportarPDF = async () => {
        setLoading('pdf')
        try {
            const input = reportRef.current
            if (!input) return

            const canvas = await html2canvas(input, { scale: 2, backgroundColor: '#ffffff' })
            const imgData = canvas.toDataURL('image/png')

            const pdf = new jsPDF('p', 'mm', 'a4')
            const pdfWidth = pdf.internal.pageSize.getWidth()
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width

            // Cabeçalho
            if (loja?.logo) {
                const logoBase64 = await carregarImagem(loja.logo)
                if(logoBase64) pdf.addImage(logoBase64, 'PNG', 15, 10, 25, 25)
            }
            pdf.setFontSize(16)
            pdf.setTextColor(primaryColor)
            pdf.text(loja?.nome || "StockBot AO", pdfWidth / 2, 20, { align: "center" })
            pdf.setFontSize(10)
            pdf.setTextColor(100)
            pdf.text(`Relatório: ${tipoRelatorio} | Emitido em: ${dataHoje}`, pdfWidth / 2, 27, { align: "center" })
            pdf.line(15, 35, pdfWidth - 15, 35)

            // Corpo
            pdf.addImage(imgData, 'PNG', 15, 40, pdfWidth - 30, pdfHeight > 250 ? 250 : pdfHeight)

            // Rodapé
            pdf.setFontSize(8)
            pdf.text(`Página 1 | StockBot AO - Sistema de Gestão`, pdfWidth / 2, 287, { align: "center" })

            pdf.save(`${nomeArquivo}.pdf`)
        } catch (error) {
            console.error(error)
            alert("Erro ao gerar PDF")
        } finally {
            setLoading(null)
        }
    }

    // 2. EXPORT EXCEL PROFISSIONAL com ExcelJS
    const exportarExcel = async () => {
        setLoading('excel')
        try {
            const workbook = new ExcelJS.Workbook()
            workbook.creator = 'StockBot AO'
            workbook.lastModifiedBy = 'StockBot AO'
            workbook.created = new Date()

            const worksheet = workbook.addWorksheet(tipoRelatorio)

            // Cabeçalho da Empresa
            worksheet.mergeCells('A1:D1')
            worksheet.getCell('A1').value = loja?.nome || "StockBot AO"
            worksheet.getCell('A1').font = { size: 18, bold: true, color: { argb: 'FF6366F1' } }
            worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' }
            worksheet.getRow(1).height = 25

            worksheet.mergeCells('A2:D2')
            worksheet.getCell('A2').value = `Relatório: ${tipoRelatorio} | Data: ${dataHoje}`
            worksheet.getCell('A2').font = { size: 11, italic: true }
            worksheet.getCell('A2').alignment = { horizontal: 'center' }

            // Títulos da Tabela
            worksheet.addRow([])
            const headerRow = worksheet.addRow(['Data', 'Total KZ', 'Forma Pagamento', 'Qtd Itens'])
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 }
            headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } }
            headerRow.alignment = { horizontal: 'center', vertical: 'middle' }
            headerRow.eachCell(cell => {
                cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} }
            })

            // Dados
            let totalGeral = 0
            dadosFiltrados.vendasF.forEach((v) => {
                totalGeral += v.total
                const row = worksheet.addRow([
                    new Date(v.data).toLocaleDateString('pt-AO'),
                    v.total,
                    v.formaPagamento,
                    v.itens
                ])
                row.getCell(2).numFmt = '"KZ" #,##0.00' // Formato moeda
                row.eachCell(cell => {
                    cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} }
                })
            })

            // Linha Total
            const totalRow = worksheet.addRow(['', 'TOTAL GERAL:', totalGeral, ''])
            totalRow.font = { bold: true, size: 12 }
            totalRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }
            totalRow.getCell(3).numFmt = '"KZ" #,##0.00'
            totalRow.eachCell(cell => {
                cell.border = { top: {style:'medium'}, left: {style:'thin'}, bottom: {style:'medium'}, right: {style:'thin'} }
            })

            // Ajustar largura
            worksheet.columns = [
                { width: 15 }, { width: 20 }, { width: 20 }, { width: 12 }
            ]

            const buffer = await workbook.xlsx.writeBuffer()
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            saveAs(blob, `${nomeArquivo}.xlsx`)
        } catch (error) {
            console.error(error)
            alert("Erro ao gerar Excel")
        } finally {
            setLoading(null)
        }
    }

    // 3. EXPORT WORD PROFISSIONAL
    const exportarWord = async () => {
        setLoading('word')
        try {
            const children: any[] = []

            // Cabeçalho
            if (loja?.logo) {
                const logoBase64 = await carregarImagem(loja.logo)
                if(logoBase64) children.push(new Paragraph({
                    children: [new ImageRun({ data: logoBase64, transformation: { width: 90, height: 90 } })],
                    alignment: AlignmentType.CENTER
                }))
            }

            children.push(
                new Paragraph({ text: loja?.nome || "StockBot AO", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
                new Paragraph({ text: `Relatório: ${tipoRelatorio}`, heading: HeadingLevel.HEADING_2, alignment: AlignmentType.CENTER }),
                new Paragraph({ text: `Emitido em: ${dataHoje}`, alignment: AlignmentType.CENTER }),
                new Paragraph({ text: "" })
            )

            // Tabela
            const tableRows = [
                new TableRow({
                    tableHeader: true,
                    children: ['Data', 'Total KZ', 'Forma Pagamento', 'Qtd Itens'].map(text =>
                        new TableCell({
                            children: [new Paragraph({ text, style: "strong" })],
                            shading: { fill: "6366F1" }
                        })
                    ),
                }),
               ...dadosFiltrados.vendasF.map((v) =>
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph(new Date(v.data).toLocaleDateString('pt-AO'))] }),
                            new TableCell({ children: [new Paragraph(formatarKZ(v.total))] }),
                            new TableCell({ children: [new Paragraph(v.formaPagamento)] }),
                            new TableCell({ children: [new Paragraph(String(v.itens))] }),
                        ]
                    })
                )
            ]

            const table = new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                },
                rows: tableRows,
            })

            children.push(table)

            const doc = new Document({
                sections: [{ children }],
            })

            const blob = await Packer.toBlob(doc)
            saveAs(blob, `${nomeArquivo}.docx`)
        } catch (error) {
            console.error(error)
            alert("Erro ao gerar Word")
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex gap-3 mb-4 flex-wrap">
                <Button onClick={exportarPDF} variant="outline" disabled={!!loading}>
                    {loading === 'pdf' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                    PDF
                </Button>
                <Button onClick={exportarExcel} variant="outline" disabled={!!loading}>
                    {loading === 'excel' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}
                    Excel
                </Button>
                <Button onClick={exportarWord} variant="outline" disabled={!!loading}>
                    {loading === 'word' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                    Word
                </Button>
            </div>

            {/* Área que vai pro PDF */}
            <div ref={reportRef} className="p-6 bg-white rounded-lg border">
                <div className="flex items-center justify-between mb-4">
                    {loja?.logo && <img src={loja.logo} alt="logo" className="h-12" />}
                    <div className="text-right">
                        <h2 className="text-2xl font-bold text-primary">Relatório de {tipoRelatorio}</h2>
                        <p className="text-sm text-gray-500">Emitido em: {dataHoje}</p>
                    </div>
                </div>

                {/* Totalizador */}
                <div className="bg-primary/10 p-4 rounded-lg mb-4">
                    <p className="text-sm">Total de Vendas</p>
                    <p className="text-2xl font-bold">{formatarKZ(dadosFiltrados.vendasF.reduce((acc, v) => acc + v.total, 0))}</p>
                </div>

                {/* Tabela */}
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="bg-primary text-white">
                            <th className="p-2 text-left border">Data</th>
                            <th className="p-2 text-right border">Total</th>
                            <th className="p-2 text-left border">Pagamento</th>
                            <th className="p-2 text-center border">Itens</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dadosFiltrados.vendasF.map((v) => (
                            <tr key={v.id} className="border-b">
                                <td className="p-2 border">{new Date(v.data).toLocaleDateString('pt-AO')}</td>
                                <td className="p-2 text-right border">{formatarKZ(v.total)}</td>
                                <td className="p-2 border">{v.formaPagamento}</td>
                                <td className="p-2 text-center border">{v.itens}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
