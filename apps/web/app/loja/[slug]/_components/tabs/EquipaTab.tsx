"use client";
import { Plus, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UsuarioLoja } from "../modals/UserModal"; // <- type do Modal

// 1. CRIAR TYPE QUE ACEITA NULL DO PAGE
type UsuarioLojaPage = {
    id: string;
    nome: string;
    email: string;
    telefone?: string | null; // <- ACEITA NULL
    role: "DONO" | "GERENTE" | "VENDEDOR" | "CAIXA" | "ESTOQUISTA";
    is_active: boolean;
}

interface Props {
    equipa: UsuarioLojaPage[]; // <- USA O TYPE DO PAGE AQUI
    isAdmin: boolean;
    isDono: boolean;
    onAdd: () => void;
    onEdit: (u: UsuarioLojaPage) => void;
    onDelete: (u: UsuarioLojaPage) => void;
    onView: (u: UsuarioLojaPage) => void;
}

export function EquipaTab({ equipa, isAdmin, isDono, onAdd, onEdit, onDelete, onView }: Props) {
    // 2. CONVERTE NULL PRA UNDEFINED ANTES DE PASSAR PRO MODAL
    const toModalUser = (u: UsuarioLojaPage): UsuarioLoja => ({
        ...u,
        telefone: u.telefone ?? undefined // <- AQUI MATA O ERRO
    })

    return (
        <div className="bg-neutral-900 p-4 sm:p-6 rounded-xl border-neutral-800">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                <h3 className="font-semibold text-base sm:text-lg">Membros da Equipa</h3>
                {isAdmin && (<Button onClick={onAdd} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"><Plus size={16} /> Adicionar</Button>)}
            </div>
            <div className="space-y-3">
                {equipa.length === 0 && <p className="text-gray-500 text-sm text-center py-4">Nenhum membro ainda.</p>}
                {equipa.map(u => (
                    <div key={u.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-neutral-800 rounded-lg gap-3">
                        <div className="min-w-0 flex-1"><p className="font-medium text-sm sm:text-base truncate">{u.nome}</p><p className="text-xs text-gray-400 truncate">{u.email} · {u.role} · {u.is_active? "Ativo" : "Inativo"}</p></div>
                        {isAdmin && (
                            <div className="flex gap-2 flex-wrap">
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => onView(toModalUser(u))}><Eye size={12}/> Ver</Button> {/* <- CONVERTE */}
                                {u.role!== 'DONO' && <Button size="sm" variant="secondary" onClick={() => onEdit(toModalUser(u))}>Editar</Button>} {/* <- CONVERTE */}
                                {isDono && u.role!== 'DONO' && (<Button size="sm" variant="destructive" onClick={() => onDelete(u)}><Trash2 size={12}/> Apagar</Button>)} {/* <- DELETE NÃO PRECISA */}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
