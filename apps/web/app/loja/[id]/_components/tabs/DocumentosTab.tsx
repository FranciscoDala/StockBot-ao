"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { FileText, FileSpreadsheet, FileDown, Loader2 } from "lucide-react"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { saveAs } from "file-saver"
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, HeadingLevel, ImageRun, AlignmentType, BorderStyle, ShadingType } from "docx"
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
    loja: { nome?: string; logo?: string } | null // aceita null
}

export function DocumentosTab({ dadosFiltrados, tipoRelatorio, loja }: DocumentosTabProps) {
    const reportRef = useRef<HTMLDivElement>(null)
    const [loading, setLoading] = useState<string | null>(null)

    const primaryColor = "#6366F1"
    const dataHoje = new Date().toLocaleDateString('pt-AO')
    const nomeLoja = loja?.nome || "StockBot AO"
    const nomeArquivo = `Relatorio-${tipoRelatorio}-${dataHoje.replace(/\//g, '-')}`
    const vendas = dadosFiltrados?.vendasF || [] // fallback
    const totalGeral = vendas.reduce((acc, v) => acc + v.total, 0)

    const formatarKZ = (valor: number) => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', minimumFractionDigits: 2 }).format(valor)

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

    // 1. EXPORT PDF PROFISSIONAL COM PAGINAÇÃO
    const exportarPDF = async () => {
        setLoading('pdf')
        try {
            const input = reportRef.current
            if (!input) return

            const canvas = await html2canvas(input, { scale: 2, backgroundColor: '#ffffff', useCORS: true })
            const imgData = canvas.toDataURL('image/png')

            const pdf = new jsPDF('p', 'mm', 'a4')
            const pdfWidth = pdf.internal.pageSize.getWidth()
            const pdfHeight = pdf.internal.pageSize.getHeight()
            const imgWidth = pdfWidth - 30
            const imgHeight = (canvas.height * imgWidth) / canvas.width

            let heightLeft = imgHeight
            let position = 40

            // Cabeçalho
            if (loja?.logo) {
                const logoBase64 = await carregarImagem(loja.logo)
                if(logoBase64) pdf.addImage(logoBase64, 'PNG', 15, 10, 25, 25)
            }
            pdf.setFontSize(16)
            pdf.setTextColor(primaryColor)
            pdf.text(nomeLoja, pdfWidth / 2, 20, { align: "center" })
            pdf.setFontSize(10)
            pdf.setTextColor(100)
            pdf.text(`Relatório: ${tipoRelatorio} | Emitido em: ${dataHoje}`, pdfWidth / 2, 27, { align: "center" })
            pdf.line(15, 35, pdfWidth - 15, 35)

            // Corpo com paginação
            pdf.addImage(imgData, 'PNG', 15, position, imgWidth, imgHeight)
            heightLeft -= pdfHeight - 40;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight + 40;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 15, position, imgWidth, imgHeight);
                heightLeft -= pdfHeight - 40;
            }

            // Rodapé
            const pageCount = pdf.internal.pages.length - 1;
            for(let i = 1; i <= pageCount; i++) {
                pdf.setPage(i);
                pdf.setFontSize(8)
                pdf.text(`Página ${i} de ${pageCount} | StockBot AO - Sistema de Gestão`, pdfWidth / 2, 287, { align: "center" })
            }

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
            const worksheet = workbook.addWorksheet(tipoRelatorio)

            // Cabeçalho
            worksheet.mergeCells('A1:D1')
            worksheet.getCell('A1').value = nomeLoja
            worksheet.getCell('A1').font = { size: 18, bold: true, color: { argb: 'FF6366F1' } }
            worksheet.getCell('A1').alignment = { horizontal: 'center' }

            worksheet.mergeCells('A2:D2')
            worksheet.getCell('A2').value = `Relatório: ${tipoRelatorio} | Data: ${dataHoje}`
            worksheet.getCell('A2').alignment = { horizontal: 'center' }

            worksheet.addRow([])
            const headerRow = worksheet.addRow(['Data', 'Total KZ', 'Forma Pagamento', 'Qtd Itens'])
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
            headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } }
            headerRow.eachCell(cell => { cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} } })

            // Dados
            vendas.forEach((v) => {
                const row = worksheet.addRow([ new Date(v.data).toLocaleDateString('pt-AO'), v.total, v.formaPagamento, v.itens ])
                row.getCell(2).numFmt = '"KZ" #,##0.00'
                row.eachCell(cell => { cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} } })
            })

            // Total
            const totalRow = worksheet.addRow(['', 'TOTAL GERAL:', totalGeral, ''])
            totalRow.font = { bold: true }
            totalRow.getCell(3).numFmt = '"KZ" #,##0.00'
            totalRow.eachCell(cell => { cell.border = { top: {style:'medium'}, bottom: {style:'medium'} } })

            worksheet.columns = [{ width: 15 }, { width: 20 }, { width: 20 }, { width: 12 }]
            const buffer = await workbook.xlsx.writeBuffer()
            saveAs(new Blob([buffer]), `${nomeArquivo}.xlsx`)
        } catch (error) {
            console.error(error)
            alert("Erro ao gerar Excel")
        } finally {
            setLoading(null)
        }
    }

    // 3. EXPORT WORD PROFISSIONAL COM TOTAL
    const exportarWord = async () => {
        setLoading('word')
        try {
            const children: any[] = []
            if (loja?.logo) {
                const logoBase64 = await carregarImagem(loja.logo)
                if(logoBase64) children.push(new Paragraph({ children: [new ImageRun({ data: logoBase64, transformation: { width: 90, height: 90 } })], alignment: AlignmentType.CENTER }))
            }
            children.push(
                new Paragraph({ text: nomeLoja, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
                new Paragraph({ text: `Relatório: ${tipoRelatorio}`, heading: HeadingLevel.HEADING_2, alignment: AlignmentType.CENTER }),
                new Paragraph({ text: `Emitido em: ${dataHoje}`, alignment: AlignmentType.CENTER }),
                new Paragraph({ text: `Total Geral: ${formatarKZ(totalGeral)}`, heading: HeadingLevel.HEADING_3 }),
                new Paragraph({ text: "" })
            )

            const table = new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } },
                rows: [
                    new TableRow({
                        tableHeader: true,
                        children: ['Data', 'Total KZ', 'Forma Pagamento', 'Qtd Itens'].map(text => new TableCell({ children: [new Paragraph({ text, bold: true })], shading: { type: ShadingType.CLEAR, fill: "6366F1" } })),
                    }),
                    ...vendas.map((v) => new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph(new Date(v.data).toLocaleDateString('pt-AO'))] }),
                            new TableCell({ children: [new Paragraph(formatarKZ(v.total))] }),
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
                    {loading === 'pdf' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />} PDF
                </Button>
                <Button onClick={exportarExcel} variant="outline" disabled={!!loading}>
                    {loading === 'excel' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />} Excel
                </Button>
                <Button onClick={exportarWord} variant="outline" disabled={!!loading}>
                    {loading === 'word' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />} Word
                </Button>
            </div>

            {/* Área que vai pro PDF */}
            <div ref={reportRef} className="p-6 bg-white rounded-lg border">
                <div className="flex items-center justify-between mb-4">
                    {loja?.logo && <img src={loja.logo} alt="logo" className="h-12 object-contain" />}
                    <div className="text-right">
                        <h2 className="text-2xl font-bold text-[#6366F1]">Relatório de {tipoRelatorio}</h2>
                        <p className="text-sm text-gray-500">Emitido em: {dataHoje}</p>
                    </div>
                </div>

                <div className="bg-[#6366F1]/10 p-4 rounded-lg mb-4 grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-600">Total de Vendas</p>
                        <p className="text-2xl font-bold">{formatarKZ(totalGeral)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Qtd. Transações</p>
                        <p className="text-2xl font-bold">{vendas.length}</p>
                    </div>
                </div>

                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="bg-[#6366F1] text-white">
                            <th className="p-2 text-left border">Data</th>
                            <th className="p-2 text-right border">Total</th>
                            <th className="p-2 text-left border">Pagamento</th>
                            <th className="p-2 text-center border">Itens</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vendas.length > 0 ? vendas.map((v) => (
                            <tr key={v.id} className="border-b hover:bg-gray-50">
                                <td className="p-2 border">{new Date(v.data).toLocaleDateString('pt-AO')}</td>
                                <td className="p-2 text-right border font-medium">{formatarKZ(v.total)}</td>
                                <td className="p-2 border">{v.formaPagamento}</td>
                                <td className="p-2 text-center border">{v.itens}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan={4} className="p-4 text-center text-gray-500">Nenhuma venda encontrada</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
