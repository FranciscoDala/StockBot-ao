"use client";
import { useState } from "react";
import { Plus, Eye, Trash2, Users, UserCheck, UserX, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // <- ADICIONADO SÓ ISSO
import type { UsuarioLoja, UsuarioLojaPage } from "../../page";
import { formatCurrency } from "../utils";

type FiltroEquipa = 'ativos' | 'inativos' | 'todos';

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
    const [filtro, setFiltro] = useState<FiltroEquipa>('ativos');

    const toModalUser = (u: UsuarioLojaPage): UsuarioLoja => ({
        ...u,
        telefone: u.telefone ?? undefined
    })

    const totalAtivos = equipa.filter(u => u.is_active).length;
    const totalInativos = equipa.filter(u => !u.is_active).length;
    const totalGerentes = equipa.filter(u => u.role === 'GERENTE' || u.role === 'DONO').length;

    const equipaFiltrada = equipa.filter(u => {
        if (filtro === 'ativos') return u.is_active;
        if (filtro === 'inativos') return !u.is_active;
        return true;
    });

    const radius = cardStyle === 'arredondado' ? '16px' : '8px';
    const padding = cardSize === 'grande' ? '20px' : '16px';

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

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--cor-texto)' }}>
                        Equipa
                        <Users size={16} style={{ color: 'var(--cor-primaria)' }} />
                    </h2>
                    <p className="text-xs sm:text-sm" style={{ color: 'var(--cor-texto-sec)' }}>Gerencie os membros da loja</p>
                </div>
                {isAdmin && (
                    <Button // <- troquei pra Button pra ficar igual ClienteTab
                        type="button"
                        onClick={onAdd}
                        style={{ background: 'var(--cor-primaria)', color: '#fff', borderRadius: radius }}
                    >
                        <Plus size={16} /> Adicionar Membro
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"> {/* <- 1 coluna no mobile igual ClienteTab */}
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
                        background: 'color-mix(in srgb, var(--cor-card) 80%, transparent)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid var(--cor-primaria)40',
                        borderRadius: radius,
                        color: 'var(--cor-texto)',
                        padding: padding,
                        boxShadow: '0 0 20px color-mix(in srgb, var(--cor-primaria) 15%, transparent)'
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
                        background: 'color-mix(in srgb, var(--cor-card) 80%, transparent)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid #ef444430',
                        borderRadius: radius,
                        color: 'var(--cor-texto)',
                        padding: padding,
                        boxShadow: '0 0 20px color-mix(in srgb, #ef4444 15%, transparent)'
                    }}
                >
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>Inativos</p>
                        <UserX size={16} style={{ color: '#ef4444' }} />
                    </div>
                    <p className="text-lg sm:text-xl font-bold" style={{ color: '#ef4444' }}>{totalInativos}</p>
                </div>

                <div
                    className="transition hover:scale-[1.02]"
                    style={{
                        background: 'color-mix(in srgb, var(--cor-card) 80%, transparent)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid var(--cor-primaria)40',
                        borderRadius: radius,
                        color: 'var(--cor-texto)',
                        padding: padding,
                        boxShadow: '0 0 20px color-mix(in srgb, var(--cor-primaria) 15%, transparent)'
                    }}
                >
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>Gerentes/Dono</p>
                        <Shield size={16} style={{ color: 'var(--cor-primaria)' }} />
                    </div>
                    <p className="text-lg sm:text-xl font-bold" style={{ color: 'var(--cor-primaria)' }}>{totalGerentes}</p>
                </div>
            </div>

            <div className="p-1 flex gap-1 overflow-x-auto" style={{ backgroundColor: 'transparent', borderRadius: radius }}> {/* <- fundo transparente igual ClienteTab */}
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

            <div style={{ background: 'transparent', border: 'none', borderRadius: 0, padding: 0 }}> {/* <- container transparente igual ClienteTab */}
                <div className="space-y-3">
                    {equipaFiltrada.length === 0 && (
                        <div className="text-center py-16"> {/* <- sem borda/border igual ClienteTab */}
                            {filtro === 'inativos' ? <UserX size={32} className="mx-auto mb-3 opacity-50" style={{ color: '#ef4444' }} /> : <Users size={32} className="mx-auto mb-3 opacity-50" style={{ color: 'var(--cor-primaria)' }} />}
                            <p className="text-sm font-medium" style={{ color: 'var(--cor-texto)' }}>
                                {filtro === 'ativos' ? "Nenhum membro ativo" : filtro === 'inativos' ? "Nenhum membro inativo" : "Nenhum membro cadastrado"}
                            </p>
                        </div>
                    )}
                    {equipaFiltrada.map(u => {
                        // <- LOGICA DE CORES IGUAL CLIENTETAB
                        let badgeText = "Ativo"; let badgeColor = "#22c55e"; let borderColor = "#22c55e"; let bgColor = 'color-mix(in srgb, #22c55e 5%, transparent)';
                        if (!u.is_active) { badgeText = "Inativo"; badgeColor = "#6b7280"; borderColor = "#6b7280"; bgColor = 'color-mix(in srgb, #6b7280 5%, transparent)'; }
                        if (u.role === 'DONO' || u.role === 'GERENTE') { badgeText = u.role; badgeColor = "var(--cor-primaria)"; borderColor = "var(--cor-primaria)"; bgColor = 'color-mix(in srgb, var(--cor-primaria) 5%, transparent)'; }

                        return (
                            <div
                                key={u.id}
                                className="flex flex-col gap-3 hover:bg-[var(--cor-primaria)5] transition w-full" // <- flex-col + gap igual ClienteTab
                                style={{
                                    border: `1px solid ${borderColor}`,
                                    background: bgColor,
                                    borderRadius: radius,
                                    padding: padding,
                                    opacity: u.is_active ? 1 : 0.7
                                }}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap"> {/* <- flex-wrap igual ClienteTab */}
                                            <p className="font-semibold truncate" style={{ color: 'var(--cor-texto)' }}>{u.nome}</p>
                                            <Badge style={{ background: badgeColor, color: '#fff', fontSize: '11px', padding: '2px 10px', borderRadius: '999px' }}>{badgeText}</Badge> {/* <- Badge igual ClienteTab */}
                                        </div>
                                        <p className="text-xs mt-1" style={{ color: 'var(--cor-texto-sec)' }}>{u.email}</p>
                                        <p className="text-xs mt-1" style={{ color: 'var(--cor-texto-sec)' }}>Cargo: {u.role}</p> {/* <- Cargo embaixo igual "Ultima atividade" */}
                                    </div>
                                </div>

                                {isAdmin && (
                                    <div className="flex items-center justify-center sm:justify-start gap-2 w-full pt-2"> {/* <- BOTÕES CENTRALIZADOS IGUAL CLIENTETAB */}
                                        <Button
                                            type="button"
                                            size="sm"
                                            style={{
                                                background: 'var(--cor-primaria)',
                                                color: '#fff',
                                                fontSize: '10px',
                                                height: '28px',
                                                padding: '0 12px',
                                                borderRadius: '8px',
                                                fontWeight: 600,
                                                flex: 1,
                                                maxWidth: '110px' // <- flex:1 maxWidth igual ClienteTab
                                            }}
                                            onClick={() => onView(toModalUser(u))}
                                        >
                                            <Eye size={14} /> Ver
                                        </Button>
                                        {u.role !== 'DONO' && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                style={{
                                                    height: '28px',
                                                    fontSize: '10px',
                                                    padding: '0 12px',
                                                    borderRadius: '8px',
                                                    fontWeight: 600,
                                                    borderColor: 'var(--cor-borda)',
                                                    background: 'var(--cor-card)',
                                                    color: 'var(--cor-texto)',
                                                    flex: 1,
                                                    maxWidth: '110px'
                                                }}
                                                onClick={() => onEdit(toModalUser(u))}
                                            >
                                                Editar
                                            </Button>
                                        )}
                                        {isDono && u.role !== 'DONO' && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                style={{
                                                    height: '28px',
                                                    fontSize: '10px',
                                                    padding: '0 12px',
                                                    borderRadius: '8px',
                                                    fontWeight: 600,
                                                    background: '#ef4444',
                                                    color: '#fff',
                                                    flex: 1,
                                                    maxWidth: '110px'
                                                }}
                                                onClick={() => onDelete(u)}
                                            >
                                                <Trash2 size={14} /> Apagar
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
