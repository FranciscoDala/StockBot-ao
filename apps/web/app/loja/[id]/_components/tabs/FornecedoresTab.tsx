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
                    <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                        <Truck size={22} />
                        Fornecedores
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-400">Gerencie os fornecedores da loja</p>
                </div>
                <button className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-bold transition w-full sm:w-auto">
                    <Plus size={14} /> Adicionar Fornecedor
                </button>
            </div>

            {/* CONTEÚDO */}
            <div className="bg-neutral-900 rounded-xl p-4 sm:p-6 border border-neutral-800">
                {fornecedores.length === 0? (
                    <div className="text-center py-16 border-2 border-dashed border-neutral-800 rounded-xl">
                        <Truck size={32} className="mx-auto text-gray-600 mb-3" />
                        <p className="text-gray-400 text-sm font-medium">Nenhum fornecedor cadastrado ainda</p>
                        <p className="text-xs text-gray-500">Clique em "Adicionar Fornecedor" para começar</p>
                    </div>
                ) : (
                    <div>Lista aqui</div>
                )}
            </div>
        </div>
    )
}
