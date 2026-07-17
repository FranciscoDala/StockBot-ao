"use client"
import { FileText, Download, FileSpreadsheet } from "lucide-react"

type Props = { // <-- ADICIONEI
    loja: any;
    theme: string;
    cardStyle: string;
    cardSize: string;
}

export function DocumentosTab({ loja, theme, cardStyle, cardSize }: Props) { // <-- RECEBER
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
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 font-semibold transition hover:brightness-110 text-xs"
                        style={{
                            background: 'transparent',
                            color: 'var(--cor-primaria)',
                            border: '2px solid var(--cor-primaria)',
                            padding: cardSize === 'grande'? '12px 20px' : '8px 16px', // <-- USANDO cardSize
                            borderRadius: cardStyle === 'arredondado'? '16px' : '8px' // <-- USANDO cardStyle
                        }}
                    >
                        <FileSpreadsheet size={14} />
                        Gerar
                    </button>
                    <button
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 font-semibold transition hover:brightness-110 text-xs"
                        style={{
                            background: 'var(--cor-primaria)',
                            color: '#fff',
                            padding: cardSize === 'grande'? '12px 20px' : '8px 16px', // <-- USANDO cardSize
                            borderRadius: cardStyle === 'arredondado'? '16px' : '8px' // <-- USANDO cardStyle
                        }}
                    >
                        <Download size={14} />
                        Download
                    </button>
                </div>
            </div>

            {/* LISTA DE DOCUMENTOS */}
            <div
                className="p-4 sm:p-6 transition"
                style={{
                    background: 'var(--cor-primaria)',
                    border: '1px solid var(--cor-primaria)',
                    color: '#fff',
                    padding: cardSize === 'grande'? '24px' : '16px', // <-- USANDO cardSize
                    borderRadius: cardStyle === 'arredondado'? '16px' : '8px' // <-- USANDO cardStyle
                }}
            >
                <div className="space-y-2">
                    {docs.map((doc, i) => (
                        <div
                            key={i}
                            className="flex justify-between items-center p-3 transition hover:brightness-110"
                            style={{
                                backgroundColor: 'rgba(0,0,0,0.15)',
                                borderRadius: cardStyle === 'arredondado'? '12px' : '8px' // <-- USANDO cardStyle
                            }}
                        >
                            <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{doc.nome}</p>
                                <p className="text-xs truncate" style={{opacity: 0.8}}> {doc.tipo} • Loja: {loja?.nome}</p>
                            </div>
                            <button
                                className="p-2 transition shrink-0 hover:bg-white/20"
                                style={{borderRadius: cardStyle === 'arredondado'? '12px' : '8px'}} // <-- USANDO cardStyle
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
