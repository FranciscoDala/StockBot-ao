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
                    <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                        <FileText size={22} />
                        Documentos
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-400">Relatórios e faturas da loja</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button className="flex items-center justify-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-xs font-bold transition flex-1 sm:flex-initial">
                        <FileSpreadsheet size={14} />
                        Gerar
                    </button>
                    <button className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-bold transition flex-1 sm:flex-initial">
                        <Download size={14} />
                        Download
                    </button>
                </div>
            </div>

            {/* LISTA DE DOCUMENTOS */}
            <div className="bg-neutral-900 rounded-xl p-4 sm:p-6 border border-neutral-800">
                <div className="space-y-2">
                    {docs.map((doc, i) => (
                        <div key={i} className="flex justify-between items-center bg-neutral-800 p-3 rounded-lg hover:bg-neutral-800/80 transition">
                            <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{doc.nome}</p>
                                <p className="text-xs text-gray-400 truncate">{doc.tipo} • Loja: {loja?.nome}</p>
                            </div>
                            <button className="p-2 hover:bg-neutral-700 rounded-lg transition shrink-0">
                                <Download size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
