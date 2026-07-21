"use client"
import { Truck, Plus } from "lucide-react"
import { useState } from "react"
import { formatCurrency } from "../utils";

type Props = { // <-- ADICIONEI
    theme: string;
    cardStyle: string;
    cardSize: string;
}

export function FornecedoresTab({ theme, cardStyle, cardSize }: Props) { // <-- RECEBER
    const [fornecedores] = useState([]) // aqui tu vai buscar da API depois

    return (
        <div className="space-y-6">
            {/* HEADER PADRONIZADO */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2" style={{color: 'var(--cor-texto)'}}>
                        Fornecedores
                        <Truck size={16} style={{color: 'var(--cor-primaria)'}} />
                    </h2>
                    <p className="text-xs sm:text-sm" style={{color: 'var(--cor-texto-sec)'}}>Gerencie os fornecedores da loja</p>
                </div>
                <button
                    className="w-full sm:w-auto flex items-center justify-center gap-2 font-semibold transition hover:brightness-110 text-xs"
                    style={{
                        background: 'var(--cor-primaria)',
                        color: '#fff',
                        padding: cardSize === 'grande'? '12px 20px' : '8px 16px', // <-- USANDO cardSize
                        borderRadius: cardStyle === 'arredondado'? '16px' : '8px' // <-- USANDO cardStyle
                    }}
                >
                    <Plus size={14} /> Adicionar Fornecedor
                </button>
            </div>

            {/* CONTEÚDO */}
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
                {fornecedores.length === 0? (
                    <div
                        className="text-center py-16 border-2 border-dashed"
                        style={{
                            borderColor: 'rgba(255,255,255,0.3)',
                            borderRadius: cardStyle === 'arredondado'? '16px' : '8px' // <-- USANDO cardStyle
                        }}
                    >
                        <Truck size={32} className="mx-auto mb-3" style={{opacity: 0.7}} />
                        <p className="text-sm font-medium">Nenhum fornecedor cadastrado ainda</p>
                        <p className="text-xs" style={{opacity: 0.8}}>Clique em "Adicionar Fornecedor" para começar</p>
                    </div>
                ) : (
                    <div>Lista aqui</div>
                )}
            </div>
        </div>
    )
}
