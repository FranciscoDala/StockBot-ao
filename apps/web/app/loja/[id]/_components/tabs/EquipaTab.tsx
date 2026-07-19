"use client";
import { useState } from "react"; // <- ADICIONA
import { Plus, Eye, Trash2, Users, UserCheck, UserX, Shield } from "lucide-react"; // <- ADICIONA UserX
import { Button } from "@/components/ui/button";
import type { UsuarioLoja, UsuarioLojaPage } from "../../page";
import { formatCurrency } from "../utils";

type FiltroEquipa = 'ativos' | 'inativos' | 'todos'; // <- NOVO

interface Props {
    equipa: UsuarioLojaPage[];
    isAdmin: boolean;
    isDono: boolean;
    lojaId?: string;
    onAdd: () => void;
    onEdit: (u: UsuarioLojaPage) => void;
    onDelete: (u: UsuarioLojaPage) => void;
    onView: (u: UsuarioLojaPage) => void;
    theme: string;
    cardStyle: string;
    cardSize: string;
}

export function EquipaTab({
    equipa,
    isAdmin,
    isDono,
    lojaId,
    onAdd,
    onEdit,
    onDelete,
    onView,
    theme,
    cardStyle,
    cardSize
}: Props) {
    const [filtro, setFiltro] = useState<FiltroEquipa>('ativos'); // <- NOVO ESTADO

    const toModalUser = (u: UsuarioLojaPage): UsuarioLoja => ({
        ...u,
        telefone: u.telefone ?? undefined
    })

    const totalAtivos = equipa.filter(u => u.is_active).length;
    const totalInativos = equipa.filter(u => !u.is_active).length; // <- CORRIGIDO
    const totalGerentes = equipa.filter(u => u.role === 'GERENTE' || u.role === 'DONO').length;

    // FILTRA A LISTA BASEADO NA ABA
    const equipaFiltrada = equipa.filter(u => {
        if (filtro === 'ativos') return u.is_active;
        if (filtro === 'inativos') return !u.is_active;
        return true;
    });

    const radius = cardStyle === 'arredondado' ? '16px' : '8px'; // <-- helper
    const padding = cardSize === 'grande' ? '20px' : '16px'; // <-- helper

    const abaStyle = (ativa: boolean) => ({
        background: ativa ? 'var(--cor-primaria)' : 'transparent',
        color: ativa ? '#fff' : 'var(--cor-texto-sec)',
        borderRadius: radius,
        padding: '8px 12px',
        fontSize: '12px',
        fontWeight: 600,
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s'
    })

    return (
        <div className="space-y-6">
            {/* HEADER PADRONIZADO */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--cor-texto)' }}>
                        Equipa
                        <Users size={16} style={{ color: 'var(--cor-primaria)' }} />
                    </h2>
                    <p className="text-xs sm:text-sm" style={{ color: 'var(--cor-texto-sec)' }}>Gerencie os membros da loja</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={onAdd}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 font-semibold transition hover:brightness-110 text-xs"
                        style={{
                            background: 'var(--cor-primaria)',
                            color: '#fff',
                            padding: cardSize === 'grande' ? '12px 20px' : '8px 16px',
                            borderRadius: radius
                        }}
                    >
                        <Plus size={14} /> Adicionar Membro
                    </button>
                )}
            </div>

            {/* CARDS KPI */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"> {/* <- 4 COLUNAS AGORA */}
                <div
                    className="transition hover:scale-[1.02]"
                    style={{
                        background: 'var(--cor-primaria)',
                        borderRadius: radius,
                        color: '#fff',
                        padding: padding
                    }}
                >
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs" style={{ opacity: 0.9 }}>Total Membros</p>
                        <Users size={16} />
                    </div>
                    <p className="text-lg sm:text-xl font-bold">{equipa.length}</p>
                </div>

                <div
                    className="transition hover:scale-[1.02]"
                    style={{
                        background: 'var(--cor-card)',
                        border: '1px solid var(--cor-primaria)30',
                        borderRadius: radius,
                        color: 'var(--cor-texto)',
                        padding: padding
                    }}
                >
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>Ativos</p>
                        <UserCheck size={16} style={{ color: 'var(--cor-primaria)' }} />
                    </div>
                    <p className="text-lg sm:text-xl font-bold" style={{ color: 'var(--cor-primaria)' }}>{totalAtivos}</p>
                </div>

                <div
                    className="transition hover:scale-[1.02]"
                    style={{
                        background: 'var(--cor-card)',
                        border: '1px solid var(--cor-primaria)30',
                        borderRadius: radius,
                        color: 'var(--cor-texto)',
                        padding: padding
                    }}
                >
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>Inativos</p> {/* <- NOVO CARD */}
                        <UserX size={16} style={{ color: '#ef4444' }} />
                    </div>
                    <p className="text-lg sm:text-xl font-bold" style={{ color: '#ef4444' }}>{totalInativos}</p>
                </div>

                <div
                    className="transition hover:scale-[1.02]"
                    style={{
                        background: 'var(--cor-card)',
                        border: '1px solid var(--cor-primaria)30',
                        borderRadius: radius,
                        color: 'var(--cor-texto)',
                        padding: padding
                    }}
                >
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>Gerentes/Dono</p>
                        <Shield size={16} style={{ color: 'var(--cor-primaria)' }} />
                    </div>
                    <p className="text-lg sm:text-xl font-bold" style={{ color: 'var(--cor-primaria)' }}>{totalGerentes}</p>
                </div>
            </div>

            {/* ABAS DE FILTRO */}
            <div className="p-1 flex gap-1 overflow-x-auto" style={{ backgroundColor: 'var(--cor-card)', borderRadius: radius, border: '1px solid var(--cor-primaria)15' }}>
                <button onClick={() => setFiltro('ativos')} style={abaStyle(filtro === 'ativos')}>
                    Ativos ({totalAtivos})
                </button>
                <button onClick={() => setFiltro('inativos')} style={abaStyle(filtro === 'inativos')}>
                    Inativos ({totalInativos})
                </button>
                <button onClick={() => setFiltro('todos')} style={abaStyle(filtro === 'todos')}>
                    Todos ({equipa.length})
                </button>
            </div>

            {/* LISTA PROFISSIONAL */}
            <div
                className="transition"
                style={{
                    background: 'var(--cor-card)',
                    border: '1px solid var(--cor-primaria)30',
                    borderRadius: radius,
                    padding: cardSize === 'grande' ? '24px' : '16px'
                }}
            >
                <div className="space-y-3">
                    {equipaFiltrada.length === 0 && ( // <- USA A LISTA FILTRADA
                        <div
                            className="text-center py-16 border-2 border-dashed"
                            style={{ borderColor: 'var(--cor-primaria)30', borderRadius: radius }}
                        >
                            {filtro === 'inativos' ? <UserX size={32} className="mx-auto mb-3" style={{ color: '#ef4444', opacity: 0.5 }} /> : <Users size={32} className="mx-auto mb-3" style={{ color: 'var(--cor-primaria)', opacity: 0.5 }} />}
                            <p className="text-sm font-medium" style={{ color: 'var(--cor-texto)' }}>
                                {filtro === 'ativos' ? "Nenhum membro ativo" : filtro === 'inativos' ? "Nenhum membro inativo" : "Nenhum membro cadastrado"}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>
                                {filtro === 'ativos' && isAdmin ? 'Clique em "Adicionar Membro" para começar' : ''}
                            </p>
                        </div>
                    )}
                    {equipaFiltrada.map(u => (
                        <div
                            key={u.id}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:brightness-105 transition"
                            style={{
                                backgroundColor: 'var(--cor-card)',
                                border: `1px solid ${u.is_active ? 'var(--cor-primaria)' : 'var(--cor-primaria)40'}`, // <- BORDA PRIMARY AJUSTADA
                                borderRadius: radius,
                                padding: cardSize === 'grande' ? '16px' : '12px',
                                opacity: u.is_active ? 1 : 0.6 // <- INATIVO FICA MAIS APAGADO
                            }}
                        >
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="font-medium text-sm sm:text-base truncate" style={{ color: 'var(--cor-texto)' }}>{u.nome}</p>
                                    <span
                                        className="text-xs px-2 py-0.5 font-medium"
                                        style={{
                                            backgroundColor: u.is_active ? 'var(--cor-primaria)' : '#52525b',
                                            color: '#fff',
                                            borderRadius: radius
                                        }}
                                    >
                                        {u.is_active ? "Ativo" : "Inativo"}
                                    </span>
                                </div>
                                <p className="text-xs truncate" style={{ color: 'var(--cor-texto-sec)' }}>{u.email}</p>
                                <span
                                    className="text-xs px-2 py-0.5 mt-1 inline-block"
                                    style={{ backgroundColor: 'var(--cor-primaria)20', color: 'var(--cor-primaria)', borderRadius: radius }}
                                >
                                    {u.role}
                                </span>
                            </div>

                            {isAdmin && (
                                <div className="flex gap-2 flex-wrap shrink-0">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        style={{
                                            borderColor: 'var(--cor-primaria)',
                                            color: 'var(--cor-primaria)',
                                            borderRadius: radius,
                                            background: 'transparent'
                                        }}
                                        onClick={() => onView(toModalUser(u))}
                                    >
                                        <Eye size={14} /> Ver
                                    </Button>
                                    {u.role !== 'DONO' && (
                                        <Button
                                            size="sm"
                                            style={{
                                                backgroundColor: 'var(--cor-primaria)',
                                                color: '#fff',
                                                borderRadius: radius
                                            }}
                                            onClick={() => onEdit(toModalUser(u))}
                                        >
                                            Editar
                                        </Button>
                                    )}
                                    {isDono && u.role !== 'DONO' && (
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            style={{
                                                backgroundColor: '#ef4444',
                                                color: '#fff',
                                                borderRadius: radius
                                            }}
                                            onClick={() => onDelete(u)}
                                        >
                                            <Trash2 size={14} /> Apagar
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
