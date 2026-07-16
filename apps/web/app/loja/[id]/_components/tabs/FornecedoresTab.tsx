"use client"
import { Truck, Plus } from "lucide-react"
import { useState } from "react"

export function FornecedoresTab() {
    const [fornecedores] = useState([]) // aqui tu vai buscar da API depois

    return (
        <div className="space-y-6">
            {/* HEADER PADRONIZADO */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2" style={{color: 'var(--cor-texto)'}}>
                        <Truck size={22} style={{color: 'var(--cor-primaria)'}} />
                        Fornecedores
                    </h2>
                    <p className="text-xs sm:text-sm" style={{color: 'var(--cor-texto-sec)'}}>Gerencie os fornecedores da loja</p>
                </div>
                <button
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold transition hover:brightness-110"
                    style={{background: 'var(--cor-primaria)', color: '#fff'}}
                >
                    <Plus size={14} /> Adicionar Fornecedor
                </button>
            </div>

            {/* CONTEÚDO */}
            <div
                className="p-4 sm:p-6"
                style={{
                    background: 'var(--cor-primaria)',
                    border: '1px solid var(--cor-primaria)',
                    borderRadius: 'var(--radius)',
                    color: '#fff'
                }}
            >
                {fornecedores.length === 0? (
                    <div
                        className="text-center py-16 border-2 border-dashed"
                        style={{borderColor: 'rgba(255,255,255,0.3)', borderRadius: 'var(--radius)'}}
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
