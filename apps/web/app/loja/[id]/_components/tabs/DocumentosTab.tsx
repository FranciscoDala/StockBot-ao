"use client"
import { FileText, Download, FileSpreadsheet } from "lucide-react"

export function DocumentosTab({ loja }: { loja: any }) {
    const docs = [
        { nome: "Relatório de Vendas Mensal", tipo: "PDF" },
        { nome: "Balanço de Estoque", tipo: "XLSX" },
        { nome: "Fatura Fiscal", tipo: "PDF" },
    ]

    return (
        <div className="space-y-6">
            {/* HEADER PADRONIZADO */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-white">
                        <FileText size={22} />
                        Documentos
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-400">Relatórios e faturas da loja</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button className="btn-secondary flex-1 sm:flex-initial">
                        <FileSpreadsheet size={14} />
                        Gerar
                    </button>
                    <button className="btn-primary flex-1 sm:flex-initial">
                        <Download size={14} />
                        Download
                    </button>
                </div>
            </div>

            {/* LISTA DE DOCUMENTOS */}
            <div
                className="p-4 sm:p-6 border"
                style={{
                    backgroundColor: '#171717',
                    borderColor: '#27272a',
                    borderRadius: 'var(--radius)'
                }}
            >
                <div className="space-y-2">
                    {docs.map((doc, i) => (
                        <div
                            key={i}
                            className="flex justify-between items-center p-3 transition hover:opacity-80"
                            style={{
                                backgroundColor: '#262626',
                                borderRadius: 'var(--radius)'
                            }}
                        >
                            <div className="min-w-0">
                                <p className="font-medium text-sm truncate text-white">{doc.nome}</p>
                                <p className="text-xs text-gray-400 truncate"> {doc.tipo} • Loja: {loja?.nome}</p>
                            </div>
                            <button
                                className="p-2 hover:bg-neutral-700 rounded-lg transition shrink-0"
                                style={{borderRadius: 'var(--radius)'}}
                            >
                                <Download size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
