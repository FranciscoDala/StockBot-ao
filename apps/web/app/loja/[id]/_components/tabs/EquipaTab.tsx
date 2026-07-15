"use client";
import { Plus, Eye, Trash2, Users, UserCheck, UserX, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UsuarioLoja, UsuarioLojaPage } from "../../page";

interface Props {
    equipa: UsuarioLojaPage[];
    isAdmin: boolean;
    isDono: boolean;
    lojaId?: string;
    onAdd: () => void;
    onEdit: (u: UsuarioLojaPage) => void;
    onDelete: (u: UsuarioLojaPage) => void;
    onView: (u: UsuarioLojaPage) => void;
}

export function EquipaTab({ equipa, isAdmin, isDono, lojaId, onAdd, onEdit, onDelete, onView }: Props) {
    const toModalUser = (u: UsuarioLojaPage): UsuarioLoja => ({
       ...u,
        telefone: u.telefone?? undefined
    })

    const totalAtivos = equipa.filter(u => u.is_active).length;
    const totalInativos = equipa.length - totalAtivos;
    const totalGerentes = equipa.filter(u => u.role === 'GERENTE' || u.role === 'DONO').length;

    return (
        <div className="space-y-6">
            {/* HEADER PADRONIZADO */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                        <Users size={22} />
                        Equipa
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-400">Gerencie os membros da loja</p>
                </div>
                {isAdmin && (
                    <Button onClick={onAdd} className="bg-green-600 hover:bg-green-700 flex items-center gap-2">
                        <Plus size={16} /> Adicionar Membro
                    </Button>
                )}
            </div>

            {/* CARDS KPI */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-neutral-900 p-4 rounded-xl border-neutral-800">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-400">Total Membros</p>
                        <Users size={16} className="text-blue-500" />
                    </div>
                    <p className="text-lg sm:text-xl font-bold">{equipa.length}</p>
                </div>

                <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-400">Ativos</p>
                        <UserCheck size={16} className="text-green-500" />
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-green-500">{totalAtivos}</p>
                </div>

                <div className="bg-neutral-900 p-4 rounded-xl border-neutral-800">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-400">Gerentes/Dono</p>
                        <Shield size={16} className="text-purple-500" />
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-purple-500">{totalGerentes}</p>
                </div>
            </div>

            {/* LISTA PROFISSIONAL */}
            <div className="bg-neutral-900 p-4 sm:p-6 rounded-xl border-neutral-800">
                <div className="space-y-3">
                    {equipa.length === 0 && (
                        <div className="text-center py-8">
                            <Users size={32} className="mx-auto text-gray-600 mb-2" />
                            <p className="text-gray-500 text-sm">Nenhum membro cadastrado ainda</p>
                        </div>
                    )}
                    {equipa.map(u => (
                        <div key={u.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-neutral-800 rounded-lg gap-3 hover:bg-neutral-800/80 transition">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="font-medium text-sm sm:text-base truncate">{u.nome}</p>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.is_active ? "bg-green-600" : "bg-gray-600"}`}>
                                        {u.is_active ? "Ativo" : "Inativo"}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 truncate">{u.email}</p>
                                <span className="text-xs px-2 py-0.5 bg-neutral-700 rounded mt-1 inline-block">{u.role}</span>
                            </div>

                            {isAdmin && (
                                <div className="flex gap-2 flex-wrap shrink-0">
                                    <Button size="sm" variant="outline" className="border-neutral-700 hover:bg-neutral-700" onClick={() => onView(toModalUser(u))}>
                                        <Eye size={14}/> Ver
                                    </Button>
                                    {u.role !== 'DONO' && (
                                        <Button size="sm" variant="secondary" onClick={() => onEdit(toModalUser(u))}>
                                            Editar
                                        </Button>
                                    )}
                                    {isDono && u.role !== 'DONO' && (
                                        <Button size="sm" variant="destructive" onClick={() => onDelete(u)}>
                                            <Trash2 size={14}/> Apagar
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
