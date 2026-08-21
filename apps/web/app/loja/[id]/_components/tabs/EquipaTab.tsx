"use client";
import { useState, useMemo, useEffect } from "react";
import { Plus, Eye, Trash2, Users, UserCheck, UserX, Shield, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { UsuarioLoja, UsuarioLojaPage } from "../../page";
import { formatCurrency } from "../utils";

type FiltroEquipa = 'ativos' | 'inativos';
const ITENS_POR_PAGINA = 10;

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
                borderRadius: '9999px',
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
    const [filtro, setFiltro] = useState<FiltroEquipa>('ativos');
    const [paginaAtual, setPaginaAtual] = useState(1); // <- estado da paginação

    const toModalUser = (u: UsuarioLojaPage): UsuarioLoja => ({
        ...u,
        telefone: u.telefone ?? undefined
    })

    const totalAtivos = equipa.filter(u => u.is_active).length;
    const totalInativos = equipa.filter(u => !u.is_active).length;

    // ORDENAR POR ORDEM DESC: mais recente primeiro usando ID
    const equipaFiltrada = useMemo(() => {
        const filtrados = equipa.filter(u => {
            if (filtro === 'ativos') return u.is_active;
            return !u.is_active;
        });

        return [...filtrados].sort((a, b) => {
            if (typeof a.id === 'number' && typeof b.id === 'number') {
                return b.id - a.id;
            }
            return String(b.id).localeCompare(String(a.id));
        });
    }, [equipa, filtro]);

    // Resetar pra página 1 quando mudar o filtro
    useEffect(() => {
        setPaginaAtual(1);
    }, [filtro]);

    const totalPaginas = Math.ceil(equipaFiltrada.length / ITENS_POR_PAGINA);
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    const fim = inicio + ITENS_POR_PAGINA;
    const equipaPaginada = equipaFiltrada.slice(inicio, fim); // <- só os 10 da página

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

            <div className="flex gap-3 px-0 sm:px-6 py-0">
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
                                border: '2px dashed var(--cor-primaria)',
                                borderRadius: radius,
                                background: 'rgba(0,0,0,0.02)'
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

                    {/* AGORA MAPEIA A LISTA PAGINADA */}
                    {equipaPaginada.map(u => {
                        let badgeText = "Ativo"; let badgeColor = "#22c55e"; let borderColor = "#22c55e"; let bgColor = 'color-mix(in srgb, #22c55e 5%, transparent)';
                        if (!u.is_active) { badgeText = "Inativo"; badgeColor = "#6b7280"; borderColor = "#6b7280"; bgColor = 'color-mix(in srgb, #6b7280 5%, transparent)'; }
                        if (u.role === 'DONO' || u.role === 'GERENTE') { badgeText = u.role; badgeColor = "var(--cor-primaria)"; borderColor = "var(--cor-primaria)"; bgColor = 'color-mix(in srgb, var(--cor-primaria) 5%, transparent)'; }

                        // LÓGICA DOS BOTÕES
                        const canEdit = u.role !== 'DONO';
                        const canDelete = isDono && u.role !== 'DONO';
                        const botoes = [true, canEdit, canDelete].filter(Boolean).length;

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
                                    <div className="grid w-full pt-2" style={{
                                        gridTemplateColumns: botoes === 1 ? '1fr' : botoes === 2 ? '1fr 1fr' : '1fr 1fr 1fr',
                                        gap: '8px'
                                    }}>
                                        <Button
                                            type="button"
                                            size="sm"
                                            style={{
                                                background: 'var(--cor-primaria)',
                                                color: '#fff',
                                                fontSize: '10px',
                                                height: '32px',
                                                padding: '0 12px',
                                                borderRadius: '8px',
                                                fontWeight: 600,
                                                width: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '4px'
                                            }}
                                            onClick={() => onView(toModalUser(u))}
                                        >
                                            <Eye size={14} /> Detalhes
                                        </Button>
                                        {canEdit && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                style={{
                                                    height: '32px',
                                                    fontSize: '10px',
                                                    padding: '0 12px',
                                                    borderRadius: '8px',
                                                    fontWeight: 600,
                                                    borderColor: 'var(--cor-borda)',
                                                    background: 'var(--cor-card)',
                                                    color: 'var(--cor-texto)',
                                                    width: '100%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '4px'
                                                }}
                                                onClick={() => onEdit(toModalUser(u))}
                                            >
                                                Atualizar
                                            </Button>
                                        )}
                                        {canDelete && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                style={{
                                                    height: '32px',
                                                    fontSize: '10px',
                                                    padding: '0 12px',
                                                    borderRadius: '8px',
                                                    fontWeight: 600,
                                                    background: '#ef4444',
                                                    color: '#fff',
                                                    width: '100%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '4px'
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

                {/* CONTROLES DE PAGINAÇÃO */}
                {totalPaginas > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
                        <p className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>
                            Mostrando {inicio + 1} - {Math.min(fim, equipaFiltrada.length)} de {equipaFiltrada.length}
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={paginaAtual === 1}
                                onClick={() => setPaginaAtual(p => p - 1)}
                                style={{
                                    height: '32px',
                                    padding: '0 12px',
                                    borderRadius: '8px',
                                    borderColor: 'var(--cor-borda)',
                                    background: 'var(--cor-card)',
                                    color: 'var(--cor-texto)',
                                    opacity: paginaAtual === 1 ? 0.5 : 1
                                }}
                            >
                                <ChevronLeft size={14} /> Anterior
                            </Button>

                            <span className="text-xs font-medium px-2" style={{ color: 'var(--cor-texto)' }}>
                                Página {paginaAtual} de {totalPaginas}
                            </span>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={paginaAtual === totalPaginas}
                                onClick={() => setPaginaAtual(p => p + 1)}
                                style={{
                                    height: '32px',
                                    padding: '0 12px',
                                    borderRadius: '8px',
                                    borderColor: 'var(--cor-borda)',
                                    background: 'var(--cor-card)',
                                    color: 'var(--cor-texto)',
                                    opacity: paginaAtual === totalPaginas ? 0.5 : 1
                                }}
                            >
                                Próxima <ChevronRight size={14} />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
