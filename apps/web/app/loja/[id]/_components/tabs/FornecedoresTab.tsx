"use client"
import { Truck, Plus } from "lucide-react"
import { useState } from "react"

export function FornecedoresTab() {
    const [fornecedores] = useState([]) // aqui tu vai buscar da API depois

    return (
        <div className="space-y-6">
            {/* HEADER PADRONIZADO */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                        <Truck size={22} />
                        Fornecedores
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-400">Gerencie os fornecedores da loja</p>
                </div>
                <button className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-xs sm:text-sm font-bold transition">
                    <Plus size={14} /> Adicionar Fornecedor
                </button>
            </div>

            {/* CONTEÚDO */}
            <div className="bg-neutral-900 rounded-xl p-4 sm:p-6 border-neutral-800">
                {fornecedores.length === 0? (
                    <div className="text-center py-8">
                        <Truck size={32} className="mx-auto text-gray-600 mb-2" />
                        <p className="text-gray-400 text-sm">Nenhum fornecedor cadastrado ainda</p>
                    </div>
                ) : (
                    <div>Lista aqui</div>
                )}
            </div>
        </div>
    )
}
