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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-white">
                        <Users size={22} />
                        Equipa
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-400">Gerencie os membros da loja</p>
                </div>
                {isAdmin && (
                    <button onClick={onAdd} className="btn-primary w-full sm:w-auto">
                        <Plus size={14} /> Adicionar Membro
                    </button>
                )}
            </div>

            {/* CARDS KPI */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div
                    className="p-4 border"
                    style={{
                        backgroundColor: '#171717',
                        borderColor: '#27272a',
                        borderRadius: 'var(--radius)'
                    }}
                >
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-400">Total Membros</p>
                        <Users size={16} style={{color: 'var(--cor-primaria)'}} />
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-white">{equipa.length}</p>
                </div>

                <div
                    className="p-4 border"
                    style={{
                        backgroundColor: '#171717',
                        borderColor: '#27272a',
                        borderRadius: 'var(--radius)'
                    }}
                >
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-400">Ativos</p>
                        <UserCheck size={16} style={{color: 'var(--cor-primaria)'}} />
                    </div>
                    <p className="text-lg sm:text-xl font-bold" style={{color: 'var(--cor-primaria)'}}>{totalAtivos}</p>
                </div>

                <div
                    className="p-4 border"
                    style={{
                        backgroundColor: '#171717',
                        borderColor: '#27272a',
                        borderRadius: 'var(--radius)'
                    }}
                >
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-400">Gerentes/Dono</p>
                        <Shield size={16} style={{color: 'var(--cor-primaria)'}} />
                    </div>
                    <p className="text-lg sm:text-xl font-bold" style={{color: 'var(--cor-primaria)'}}>{totalGerentes}</p>
                </div>
            </div>

            {/* LISTA PROFISSIONAL */}
            <div
                className="p-4 sm:p-6 border"
                style={{
                    backgroundColor: '#171717',
                    borderColor: '#27272a',
                    borderRadius: 'var(--radius)'
                }}
            >
                <div className="space-y-3">
                    {equipa.length === 0 && (
                        <div
                            className="text-center py-16 border-2 border-dashed"
                            style={{borderColor: '#27272a', borderRadius: 'var(--radius)'}}
                        >
                            <Users size={32} className="mx-auto text-gray-600 mb-3" />
                            <p className="text-gray-400 text-sm font-medium">Nenhum membro cadastrado ainda</p>
                            <p className="text-xs text-gray-500">Clique em "Adicionar Membro" para começar</p>
                        </div>
                    )}
                    {equipa.map(u => (
                        <div
                            key={u.id}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 gap-3 hover:opacity-90 transition"
                            style={{
                                backgroundColor: '#262626',
                                borderRadius: 'var(--radius)'
                            }}
                        >
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="font-medium text-sm sm:text-base truncate text-white">{u.nome}</p>
                                    <span
                                        className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
                                        style={{
                                            backgroundColor: u.is_active ? 'var(--cor-primaria)' : '#52525b',
                                            borderRadius: 'var(--radius)'
                                        }}
                                    >
                                        {u.is_active ? "Ativo" : "Inativo"}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 truncate">{u.email}</p>
                                <span
                                    className="text-xs px-2 py-0.5 text-white mt-1 inline-block"
                                    style={{backgroundColor: '#3f3f46', borderRadius: 'var(--radius)'}}
                                >
                                    {u.role}
                                </span>
                            </div>

                            {isAdmin && (
                                <div className="flex gap-2 flex-wrap shrink-0">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-white"
                                        style={{borderColor: '#3f3f46', borderRadius: 'var(--radius)'}}
                                        onClick={() => onView(toModalUser(u))}
                                    >
                                        <Eye size={14}/> Ver
                                    </Button>
                                    {u.role !== 'DONO' && (
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            className="text-white"
                                            style={{backgroundColor: '#3f3f46', borderRadius: 'var(--radius)'}}
                                            onClick={() => onEdit(toModalUser(u))}
                                        >
                                            Editar
                                        </Button>
                                    )}
                                    {isDono && u.role !== 'DONO' && (
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            style={{borderRadius: 'var(--radius)'}}
                                            onClick={() => onDelete(u)}
                                        >
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
