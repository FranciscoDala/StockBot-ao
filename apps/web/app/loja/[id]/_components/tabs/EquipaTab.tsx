"use client";
import { useState } from "react";
import { Plus, Eye, Trash2, Users, UserCheck, UserX, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { UsuarioLoja, UsuarioLojaPage } from "../../page";
import { formatCurrency } from "../utils";

type FiltroEquipa = 'ativos' | 'inativos'; // <- REMOVIDO 'todos'

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

function AbaButton({ label, active, onClick }: {
    label: string,
    active: boolean,
    onClick: () => void
}) {
    return (
        <button
            onClick={onClick}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 font-semibold text-sm transition-all"
            style={{
                borderRadius: '9999px', // <- pill igual DetalhesModal
                border: `1px solid ${active ? '#000' : 'var(--cor-borda)'}`,
                background: active ? '#000' : 'transparent',
                color: active ? '#fff' : 'var(--cor-texto)',
                fontWeight: 600
            }}
        >
            {label}
        </button>
    )
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
    const [filtro, setFiltro] = useState<FiltroEquipa>('ativos'); // <- default continua ativos

    const toModalUser = (u: UsuarioLojaPage): UsuarioLoja => ({
        ...u,
        telefone: u.telefone ?? undefined
    })

    const totalAtivos = equipa.filter(u => u.is_active).length;
    const totalInativos = equipa.filter(u => !u.is_active).length;
    const totalGerentes = equipa.filter(u => u.role === 'GERENTE' || u.role === 'DONO').length;

    const equipaFiltrada = equipa.filter(u => {
        if (filtro === 'ativos') return u.is_active;
        return !u.is_active; // <- só tem 2 casos agora
    });

    const radius = cardStyle === 'arredondado' ? '16px' : '8px';
    const padding = cardSize === 'grande' ? '20px' : '16px';

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
                    <Button
                        type="button"
                        onClick={onAdd}
                        style={{ background: 'var(--cor-primaria)', color: '#fff', borderRadius: radius }}
                    >
                        <Plus size={16} /> Adicionar Membro
                    </Button>
                )}
            </div>

            <div className="flex gap-3 px-0 sm:px-6 py-0"> {/* <- agora só 2 abas */}
                <AbaButton
                    label={`Ativos (${totalAtivos})`}
                    active={filtro === 'ativos'}
                    onClick={() => setFiltro('ativos')}
                />
                <AbaButton
                    label={`Inativos (${totalInativos})`}
                    active={filtro === 'inativos'}
                    onClick={() => setFiltro('inativos')}
                />
            </div>

            <div style={{ background: 'transparent', border: 'none', borderRadius: 0, padding: 0 }}>
                <div className="space-y-3">
                    {equipaFiltrada.length === 0 && (
                        <div
                            className="text-center py-16"
                            style={{
                                border: '2px dashed var(--cor-primaria)', // <- 2px dashed pra destacar
                                borderRadius: radius,
                                background: 'rgba(0,0,0,0.02)' // <- fundo neutro pra não conflitar com tema
                            }}
                        >
                            {filtro === 'inativos'
                                ? <UserX size={32} className="mx-auto mb-3" style={{ color: 'var(--cor-primaria)' }} />
                                : <Users size={32} className="mx-auto mb-3" style={{ color: 'var(--cor-primaria)' }} />
                            }
                            <p className="text-sm font-medium" style={{ color: 'var(--cor-texto)' }}>
                                {filtro === 'ativos' ? "Nenhum membro ativo" : "Nenhum membro inativo"}
                            </p>
                        </div>
                    )}
                    {equipaFiltrada.map(u => {
                        let badgeText = "Ativo"; let badgeColor = "#22c55e"; let borderColor = "#22c55e"; let bgColor = 'color-mix(in srgb, #22c55e 5%, transparent)';
                        if (!u.is_active) { badgeText = "Inativo"; badgeColor = "#6b7280"; borderColor = "#6b7280"; bgColor = 'color-mix(in srgb, #6b7280 5%, transparent)'; }
                        if (u.role === 'DONO' || u.role === 'GERENTE') { badgeText = u.role; badgeColor = "var(--cor-primaria)"; borderColor = "var(--cor-primaria)"; bgColor = 'color-mix(in srgb, var(--cor-primaria) 5%, transparent)'; }

                        return (
                            <div
                                key={u.id}
                                className="flex flex-col gap-3 hover:bg-[var(--cor-primaria)5] transition w-full"
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
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-semibold truncate" style={{ color: 'var(--cor-texto)' }}>{u.nome}</p>
                                            <Badge style={{ background: badgeColor, color: '#fff', fontSize: '11px', padding: '2px 10px', borderRadius: '999px' }}>{badgeText}</Badge>
                                        </div>
                                        <p className="text-xs mt-1" style={{ color: 'var(--cor-texto-sec)' }}>{u.email}</p>
                                        <p className="text-xs mt-1" style={{ color: 'var(--cor-texto-sec)' }}>Cargo: {u.role}</p>
                                    </div>
                                </div>

                                {isAdmin && (
                                    <div className="flex items-center justify-center sm:justify-start gap-2 w-full pt-2">
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
                                                maxWidth: '110px'
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
