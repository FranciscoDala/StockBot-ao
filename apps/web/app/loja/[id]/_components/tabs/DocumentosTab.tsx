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
                    <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2" style={{color: 'var(--cor-texto)'}}>
                        Documentos
                        <FileText size={16} style={{color: 'var(--cor-primaria)'}} />
                    </h2>
                    <p className="text-xs sm:text-sm" style={{color: 'var(--cor-texto-sec)'}}>Relatórios e faturas da loja</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold transition hover:brightness-110 text-xs"
                        style={{
                            background: 'transparent',
                            color: 'var(--cor-primaria)',
                            border: '2px solid var(--cor-primaria)'
                        }}
                    >
                        <FileSpreadsheet size={14} />
                        Gerar
                    </button>
                    <button
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold transition hover:brightness-110 text-xs"
                        style={{background: 'var(--cor-primaria)', color: '#fff'}}
                    >
                        <Download size={14} />
                        Download
                    </button>
                </div>
            </div>

            {/* LISTA DE DOCUMENTOS */}
            <div
                className="p-4 sm:p-6"
                style={{
                    background: 'var(--cor-primaria)',
                    border: '1px solid var(--cor-primaria)',
                    borderRadius: 'var(--radius)',
                    color: '#fff'
                }}
            >
                <div className="space-y-2">
                    {docs.map((doc, i) => (
                        <div
                            key={i}
                            className="flex justify-between items-center p-3 transition hover:brightness-110"
                            style={{
                                backgroundColor: 'rgba(0,0,0,0.15)',
                                borderRadius: 'var(--radius)'
                            }}
                        >
                            <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{doc.nome}</p>
                                <p className="text-xs truncate" style={{opacity: 0.8}}> {doc.tipo} • Loja: {loja?.nome}</p>
                            </div>
                            <button
                                className="p-2 rounded-lg transition shrink-0 hover:bg-white/20"
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
