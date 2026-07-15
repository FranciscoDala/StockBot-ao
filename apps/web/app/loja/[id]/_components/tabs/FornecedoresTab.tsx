"use client"
import { Truck, Plus } from "lucide-react"
import { useState } from "react"

export function FornecedoresTab() {
    const [fornecedores] = useState([]) // aqui tu vai buscar da API depois

    return (
        <div className="bg-neutral-900 rounded-xl p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold flex items-center gap-2"><Truck size={18}/> Fornecedores</h3>
                <button className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-bold">
                    <Plus size={14}/> Adicionar
                </button>
            </div>
            {fornecedores.length === 0? (
                <p className="text-gray-400 text-center py-8">Nenhum fornecedor cadastrado ainda</p>
            ) : (
                <div>Lista aqui</div>
            )}
        </div>
    )
}
