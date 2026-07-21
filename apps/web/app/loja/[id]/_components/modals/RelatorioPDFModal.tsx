"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Download, X } from "lucide-react"
import { useState, useEffect } from "react" // 1. adiciona useEffect
import jsPDF from "jspdf"
import { saveAs } from "file-saver"
import { zalandoLightBase64, zalandoBoldBase64, zalandoItalicBase64 } from '../tabs/font/fonts'

type Props = {
    open: boolean
    onClose: () => void
    vendasFiltradas: any[]
    periodoTexto: string
    nomeLoja: string
    loja: any
    formatCurrency: (v: number) => string
    nomeArquivo: string
}

export function RelatorioPDFModal({
    open,
    onClose,
    vendasFiltradas,
    periodoTexto,
    nomeLoja,
    loja,
    formatCurrency,
    nomeArquivo
}: Props) {
    const [loading, setLoading] = useState(false)
    const [pdfUrl, setPdfUrl] = useState<string | null>(null) // 2. state pra url do preview

    // 3. FUNCAO QUE GERA O PDF E RETORNA O jsPDF. NAO MEXI EM NADA
    const gerarPDF = (): jsPDF => {
        const pdf = new jsPDF('p', 'mm', 'a4')
        const pageWidth = pdf.internal.pageSize.getWidth()

        // 1. REGISTRAR FONTE - 3 PESOS
        pdf.addFileToVFS('ZalandoLight.ttf', zalandoLightBase64)
        pdf.addFont('ZalandoLight.ttf', 'Zalando', 'normal')
        pdf.addFileToVFS('ZalandoBold.ttf', zalandoBoldBase64)
        pdf.addFont('ZalandoBold.ttf', 'Zalando', 'bold')
        pdf.addFileToVFS('ZalandoItalic.ttf', zalandoItalicBase64)
        pdf.addFont('ZalandoItalic.ttf', 'Zalando', 'italic')

        const setZalando = (style: 'normal' | 'bold' | 'italic' = 'normal') => {
            pdf.setFont('Zalando', style)
        }
        setZalando()

        const corHeader = [220, 228, 235]
        const corBorda = [200, 210, 220]
        const corTextoCinza = [100, 100, 100]

        // 2. CABEÇALHO
        pdf.setDrawColor(corBorda[0], corBorda[1], corBorda[2])
        pdf.setLineWidth(0.3)
        pdf.rect(15, 15, 50, 20, "D")
        setZalando('normal')
        pdf.setFontSize(9)
        pdf.text("Logo", 40, 26, { align: "center" })

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
        pdf.text(loja?.nif || "***************", 115, yDireita)

        yDireita += 6
        setZalando('normal')
        pdf.setTextColor(corTextoCinza[0], corTextoCinza[1], corTextoCinza[2])
        pdf.text("Endereço", 110, yDireita, { align: "right" })
        setZalando('bold')
        pdf.setTextColor(0)
        pdf.text(loja?.endereco || "***************", 115, yDireita)

        yDireita += 6
        setZalando('normal')
        pdf.setTextColor(corTextoCinza[0], corTextoCinza[1], corTextoCinza[2])
        pdf.text("Telefone", 110, yDireita, { align: "right" })
        setZalando('bold')
        pdf.setTextColor(0)
        pdf.text("(+244) xxx-xxx-xxx", 115, yDireita)

        yDireita += 6
        setZalando('normal')
        pdf.setTextColor(corTextoCinza[0], corTextoCinza[1], corTextoCinza[2])
        pdf.text("E-mail", 110, yDireita, { align: "right" })
        setZalando('bold')
        pdf.setTextColor(0)
        pdf.text("email@empresa.com", 115, yDireita)

        let y = 55

        // 3. AGRUPAR VENDAS POR DIA - DATA FORMATO 20/Julho/2026
        const mesesMap: Record<number, string> = {
            0: 'Janeiro', 1: 'Fevereiro', 2: 'Março', 3: 'Abril', 4: 'Maio', 5: 'Junho',
            6: 'Julho', 7: 'Agosto', 8: 'Setembro', 9: 'Outubro', 10: 'Novembro', 11: 'Dezembro'
        }

        type VendaPorDia = { total: number, timestamp: number }

        const vendasPorDia = vendasFiltradas.reduce<Record<string, VendaPorDia>>((acc, venda) => {
            const dataObj = new Date(venda.data)
            const dia = String(dataObj.getDate()).padStart(2, '0')
            const mes = mesesMap[dataObj.getMonth()]
            const ano = dataObj.getFullYear()
            const data = `${dia}/${mes}/${ano}`
            if (!acc[data]) acc[data] = { total: 0, timestamp: dataObj.getTime() }
            acc[data].total += venda.total
            return acc
        }, {})

        const dadosAgrupados = Object.entries(vendasPorDia)
            .sort((a, b) => b[1].timestamp - a[1].timestamp) as [string, VendaPorDia][]

        const formatNumber = (value: number) => {
            return new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
        };

        // 4. TABELA - 5 COLUNAS E LARGURA DINAMICA COM GARANTIA PRA DATA
        const headers = ["Data", "Entrada", "Saida", "Lucro", "Total"]
        const startX = 15
        const pageUsableWidth = pageWidth - 30
        const rowHeight = 8
        const padding = 3

        const calcularLargura = (texto: string, bold = false) => {
            setZalando(bold ? 'bold' : 'normal')
            pdf.setFontSize(8.5)
            return pdf.getTextWidth(texto) + padding * 2
        }

        setZalando('bold')
        pdf.setFontSize(8.5)
        const maiorDataExemplo = `30/${mesesMap[8]}/2026`
        let dataMinWidth = pdf.getTextWidth(maiorDataExemplo) + padding * 4

        let colWidths = headers.map(h => calcularLargura(h, true))
        colWidths[0] = Math.max(colWidths[0], dataMinWidth)

        dadosAgrupados.forEach(([data, info]) => {
            const totalStr = formatNumber(info.total)
            const zeroStr = formatNumber(0)
            colWidths[0] = Math.max(colWidths[0], calcularLargura(data, true))
            colWidths[1] = Math.max(colWidths[1], calcularLargura(totalStr, true))
            colWidths[2] = Math.max(colWidths[2], calcularLargura(zeroStr, true))
            colWidths[3] = Math.max(colWidths[3], calcularLargura(totalStr, true))
            colWidths[4] = Math.max(colWidths[4], calcularLargura(totalStr, true))
        })

        const somaAtual = colWidths.reduce((a, b) => a + b, 0)
        const fator = pageUsableWidth / somaAtual
        colWidths = colWidths.map(w => w * fator)
        const totalTableWidth = colWidths.reduce((a, b) => a + b, 0)

        // HEADER
        pdf.setFillColor(corHeader[0], corHeader[1], corHeader[2])
        pdf.setDrawColor(corBorda[0], corBorda[1], corBorda[2])
        pdf.rect(startX, y - 4, totalTableWidth, rowHeight, "F")

        setZalando('bold')
        pdf.setTextColor(0)
        pdf.setFontSize(9)
        headers.forEach((h, i) => {
            const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0)
            pdf.rect(x, y - 4, colWidths[i], rowHeight, "D")
            const textY = y - 4 + rowHeight / 2 + 1
            pdf.text(h, x + padding, textY)
        })
        y += rowHeight

        // LINHA DE SIMBOLO AOA
        pdf.setDrawColor(corBorda[0], corBorda[1], corBorda[2])
        pdf.rect(startX, y - 4, totalTableWidth - colWidths[4], rowHeight, "D")
        pdf.rect(startX + totalTableWidth - colWidths[4], y - 4, colWidths[4], rowHeight, "D")
        setZalando('normal')
        pdf.setFontSize(8)
        const textYHeader = y - 4 + rowHeight / 2 + 1
        pdf.text("AOA", startX + padding, textYHeader)
        pdf.text("-", startX + totalTableWidth - padding - 1, textYHeader, { align: "right" })
        y += rowHeight

        // DADOS
        pdf.setFontSize(8.5)
        dadosAgrupados.forEach(([data, info], index) => {
            if (y > 270) {
                pdf.addPage()
                y = 20
            }

            const x = startX
            const total = info.total
            const textY = y - 4 + rowHeight / 2 + 1

            if (index % 2 === 0) {
                pdf.setFillColor(248, 250, 252)
                pdf.rect(startX, y - 4, totalTableWidth, rowHeight, "F")
            }

            headers.forEach((_, i) => {
                const cellX = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0)
                pdf.rect(cellX, y - 4, colWidths[i], rowHeight, "D")
            })

            let currentX = x
            setZalando('bold')
            pdf.text(data, currentX + padding, textY)

            currentX += colWidths[0]
            pdf.text(formatNumber(total), currentX + colWidths[1] - padding, textY, { align: "right" })

            currentX += colWidths[1]
            pdf.text(formatNumber(0), currentX + colWidths[2] - padding, textY, { align: "right" })

            currentX += colWidths[2]
            pdf.text(formatNumber(total), currentX + colWidths[3] - padding, textY, { align: "right" })

            currentX += colWidths[3]
            pdf.text(formatNumber(total), currentX + colWidths[4] - padding, textY, { align: "right" })

            y += rowHeight
        })
        y += 8

        // 6. TABELA "BALANÇO GERAL"
        const totalGeral = dadosAgrupados.reduce((sum, [, info]) => sum + info.total, 0)
        const resumoWidth = 90

        pdf.setFillColor(corHeader[0], corHeader[1], corHeader[2])
        pdf.setDrawColor(corBorda[0], corBorda[1], corBorda[2])
        pdf.rect(15, y - 4, resumoWidth, rowHeight, "F")
        setZalando('bold')
        pdf.setTextColor(0)
        pdf.setFontSize(9)
        pdf.rect(15, y - 4, resumoWidth, rowHeight, "D")
        pdf.text("Balanço Geral", 17, y - 4 + rowHeight / 2 + 1)
        y += rowHeight

        const resumoMes = [
            ["Entrada", formatNumber(totalGeral)],
            ["Saida", formatNumber(0)],
            ["Lucro", formatNumber(totalGeral)],
            ["Diferenca", formatNumber(totalGeral)],
        ]

        resumoMes.forEach(([label, valor]) => {
            pdf.rect(15, y - 4, resumoWidth, rowHeight, "D")
            setZalando('normal')
            pdf.setTextColor(corTextoCinza[0], corTextoCinza[1], corTextoCinza[2])
            pdf.text(label, 17, y - 4 + rowHeight / 2 + 1)
            setZalando('bold')
            pdf.setTextColor(0)
            pdf.text(valor, 15 + resumoWidth - 3, y - 4 + rowHeight / 2 + 1, { align: "right" })
            y += rowHeight
        })

        // RODAPÉ
        const totalPages = pdf.internal.getNumberOfPages()
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i)
            setZalando('normal')
            pdf.setFontSize(8)
            pdf.setTextColor(150)
            pdf.text(`Pagina ${i} de ${totalPages}`, pageWidth / 2, 287, { align: "center" })
        }

        return pdf // 4. RETORNA O PDF
    }

    // 5. GERA O PREVIEW QUANDO A MODAL ABRE
    useEffect(() => {
        if (open) {
            const pdf = gerarPDF()
            const url = pdf.output('bloburl')
            setPdfUrl(url)
        } else {
            setPdfUrl(null) // limpa quando fecha
        }
    }, [open, vendasFiltradas, periodoTexto])

    // 6. BAIXAR USA A MESMA FUNCAO
    const exportarPDFModelo = async () => {
        setLoading(true)
        try {
            const pdf = gerarPDF()
            pdf.save(`Relatorio-Modelo-${nomeArquivo}.pdf`)
        } catch (error) {
            console.error(error)
            alert("Erro ao gerar PDF.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                className="!max-w-none !w-screen !h-screen !rounded-none !p-0 !m-0 gap-0 flex-col"
                style={{ backgroundColor: 'var(--cor-card)' }}
            >
                {/* HEADER FIXO EM CIMA */}
                <div
                    className="fixed top-0 left-0 right-0 px-3 pt-[calc(0.375rem+env(safe-area-inset-top))] pb-1.5 border-b flex flex-row gap-2 z-50"
                    style={{
                        backgroundColor: 'var(--cor-card)',
                        borderColor: 'var(--cor-borda)'
                    }}
                >
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1 h-8 text-sm"
                        style={{ borderRadius: '6px' }}
                    >
                        <X className="mr-1.5 h-3.5 w-3.5" /> Fechar
                    </Button>
                    <Button
                        onClick={exportarPDFModelo}
                        disabled={loading}
                        className="flex-1 h-8 text-sm"
                        style={{ backgroundColor: 'var(--cor-primaria)', color: 'white', borderRadius: '6px' }}
                    >
                        {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Download className="mr-1.5 h-3.5 w-3.5" />}
                        Baixar PDF
                    </Button>
                </div>

                {/* PDF PREVIEW */}
                <div className="flex-1 w-full overflow-hidden pt-[calc(3.5rem+env(safe-area-inset-top))]">
                    {pdfUrl ? (
                        <iframe src={pdfUrl} width="100%" height="100%" style={{ border: 'none', display: 'block' }} />
                    ) : (
                        <div className="flex items-center justify-center h-full w-full" style={{ color: 'var(--cor-texto-sec)' }}>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando pré-visualização...
                        </div>
                    )}
                </div>

            </DialogContent>
        </Dialog>
    )
}
