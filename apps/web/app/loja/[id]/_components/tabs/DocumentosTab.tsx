"use client"
import { FileText, Download } from "lucide-react"

export function DocumentosTab({ loja }: { loja: any }) {
    const docs = [
        { nome: "Relatório de Vendas Mensal", tipo: "PDF" },
        { nome: "Balanço de Estoque", tipo: "XLSX" },
        { nome: "Fatura Fiscal", tipo: "PDF" },
    ]

    return (
        <div className="bg-neutral-900 rounded-xl p-4">
            <h3 className="font-bold mb-4 flex items-center gap-2"><FileText size={18}/> Documentos</h3>
            <div className="space-y-2">
                {docs.map((doc, i) => (
                    <div key={i} className="flex justify-between items-center bg-neutral-800 p-3 rounded-lg">
                        <div>
                            <p className="font-medium text-sm">{doc.nome}</p>
                            <p className="text-xs text-gray-400">{doc.tipo} • Loja: {loja?.nome}</p>
                        </div>
                        <button className="p-2 hover:bg-neutral-700 rounded-lg">
                            <Download size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}
