"use client";
import { useState, useEffect, useMemo } from "react";
import { Users, UserCheck, AlertCircle, DollarSign, ChevronLeft, ChevronRight, Eye, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClienteModal, ClienteForm } from "../modals/clientemodal"; // <- IMPORTA MODAL
import { toast } from "sonner";

type Cliente = {
    id: string;
    nome: string;
    telefone?: string | null;
    email?: string | null;
    total_divida: number;
    ultima_compra: string;
    status: 'com_divida' | 'em_dia';
}

type Props = {
    lojaId: string;
    token: string | null;
    theme: string;
    cardStyle: string;
    cardSize: string;
    formatCurrency: (v: number) => string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://gentle-playfulness-production-d333.up.railway.app/api/v1";
type FiltroCliente = 'todos' | 'com_divida' | 'em_dia';

export function ClientesTab({ lojaId, token, theme, cardStyle, cardSize, formatCurrency }: Props) {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState<FiltroCliente>('com_divida');
    const [pagina, setPagina] = useState(1);
    const ITENS_POR_PAGINA = 8;

    // ESTADOS DA MODAL
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formDataCliente, setFormDataCliente] = useState<ClienteForm>({
        nome: "", nome_empresa: "", bi: "", telefone: "", email: "",
        endereco: "", cidade: "", provincia: "", observacoes: "", is_active: true
    });

    const fetchClientes = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/lojas/id/${lojaId}/clientes`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            setClientes(Array.isArray(data)? data : []);
        } catch (e) { setClientes([]) }
        finally { setLoading(false) }
    }

    useEffect(() => { fetchClientes() }, [lojaId, token]);

    const handleSaveCliente = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        setSaving(true);
        try {
            const payload = {...formDataCliente, loja_id: lojaId };
            const res = await fetch(`${API_URL}/lojas/id/${lojaId}/clientes`, {
                method: 'POST',
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error("Erro ao salvar");
            toast.success("Cliente cadastrado com sucesso!");
            setShowModal(false);
            setFormDataCliente({ nome: "", nome_empresa: "", bi: "", telefone: "", email: "", endereco: "", cidade: "", provincia: "", observacoes: "", is_active: true });
            fetchClientes(); // recarrega lista
        } catch (err: any) {
            toast.error(err.message || "Erro ao cadastrar cliente");
        } finally {
            setSaving(false);
        }
    }

    const totalComDivida = clientes.filter(c => c.total_divida > 0).length;
    const totalEmDia = clientes.filter(c => c.total_divida === 0).length;
    const valorTotalEmDivida = clientes.reduce((acc, c) => acc + c.total_divida, 0);

    const clientesFiltrados = useMemo(() => {
        if (filtro === 'com_divida') return clientes.filter(c => c.total_divida > 0);
        if (filtro === 'em_dia') return clientes.filter(c => c.total_divida === 0);
        return clientes;
    }, [clientes, filtro]);

    const totalPaginas = Math.ceil(clientesFiltrados.length / ITENS_POR_PAGINA);
    const clientesPaginados = clientesFiltrados.slice((pagina - 1) * ITENS_POR_PAGINA, pagina * ITENS_POR_PAGINA);

    useEffect(() => { setPagina(1) }, [filtro]);

    const radius = cardStyle === 'arredondado'? '16px' : '8px';
    const padding = cardSize === 'grande'? '20px' : '16px';

    const abaStyle = (ativa: boolean) => ({
        background: ativa? 'var(--cor-primaria)' : 'transparent',
        color: ativa? '#fff' : 'var(--cor-texto-sec)',
        borderRadius: radius,
        padding: '8px 12px',
        fontSize: '12px',
        fontWeight: 600,
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s'
    })

    if (loading) return <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: 'var(--cor-primaria)' }}></div></div>

    return (
        <div className="space-y-6">
            {/* HEADER COM BOTÃO */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--cor-texto)' }}>
                        Clientes
                        <Users size={16} style={{ color: 'var(--cor-primaria)' }} />
                    </h2>
                    <p className="text-xs sm:text-sm" style={{ color: 'var(--cor-texto-sec)' }}>Controle de dívidas e pagamentos</p>
                </div>
                <Button
                    onClick={() => setShowModal(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 font-semibold transition hover:brightness-110 text-sm h-10 px-4"
                    style={{ background: 'var(--cor-primaria)', color: '#fff', borderRadius: radius }}
                >
                    <Plus size={16} /> Novo Cliente
                </Button>
            </div>

            {/* CARDS KPI */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div style={{ background: 'var(--cor-primaria)', borderRadius: radius, color: '#fff', padding: padding }} className="transition hover:scale-[1.02]">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs" style={{ opacity: 0.9 }}>Total Clientes</p>
                        <Users size={16} />
                    </div>
                    <p className="text-lg sm:text-xl font-bold">{clientes.length}</p>
                </div>

                <div style={{ background: 'color-mix(in srgb, var(--cor-card) 80%, transparent)', backdropFilter: 'blur(12px)', border: '1px solid #ef444430', borderRadius: radius, color: 'var(--cor-texto)', padding: padding, boxShadow: '0 0 20px color-mix(in srgb, #ef4444 15%, transparent)' }} className="transition hover:scale-[1.02]">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>Com Dívida</p>
                        <AlertCircle size={16} style={{ color: '#ef4444' }} />
                    </div>
                    <p className="text-lg sm:text-xl font-bold" style={{ color: '#ef4444' }}>{totalComDivida}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--cor-texto-sec)' }}>{formatCurrency(valorTotalEmDivida)}</p>
                </div>

                <div style={{ background: 'color-mix(in srgb, var(--cor-card) 80%, transparent)', backdropFilter: 'blur(12px)', border: '1px solid var(--cor-primaria)40', borderRadius: radius, color: 'var(--cor-texto)', padding: padding, boxShadow: '0 0 20px color-mix(in srgb, var(--cor-primaria) 15%, transparent)' }} className="transition hover:scale-[1.02]">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>Em Dia</p>
                        <UserCheck size={16} style={{ color: 'var(--cor-primaria)' }} />
                    </div>
                    <p className="text-lg sm:text-xl font-bold" style={{ color: 'var(--cor-primaria)' }}>{totalEmDia}</p>
                </div>
            </div>

            {/* ABAS DE FILTRO */}
            <div className="p-1 flex gap-1 overflow-x-auto" style={{ backgroundColor: 'var(--cor-card)', borderRadius: radius, border: '1px solid var(--cor-primaria)15' }}>
                <button onClick={() => setFiltro('com_divida')} style={abaStyle(filtro === 'com_divida')}>Com Dívida ({totalComDivida})</button>
                <button onClick={() => setFiltro('em_dia')} style={abaStyle(filtro === 'em_dia')}>Em Dia ({totalEmDia})</button>
                <button onClick={() => setFiltro('todos')} style={abaStyle(filtro === 'todos')}>Todos ({clientes.length})</button>
            </div>

            {/* LISTA COM PAGINAÇÃO */}
            <div style={{ background: 'var(--cor-card)', border: '1px solid var(--cor-primaria)30', borderRadius: radius, padding: padding }}>
                <div className="space-y-3">
                    {clientesPaginados.length === 0 && (
                        <div className="text-center py-16 border-2 border-dashed" style={{ borderColor: 'var(--cor-primaria)30', borderRadius: radius }}>
                            <DollarSign size={32} className="mx-auto mb-3" style={{ color: 'var(--cor-primaria)', opacity: 0.5 }} />
                            <p className="text-sm font-medium" style={{ color: 'var(--cor-texto)' }}>
                                {filtro === 'com_divida'? "Nenhum cliente com dívida" : filtro === 'em_dia'? "Nenhum cliente em dia" : "Nenhum cliente cadastrado"}
                            </p>
                        </div>
                    )}

                    {clientesPaginados.map(c => (
                        <div key={c.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:brightness-105 transition"
                            style={{ backgroundColor: 'var(--cor-card)', border: `1px solid ${c.total_divida > 0? '#ef4444' : 'var(--cor-primaria)'}40`, borderRadius: radius, padding: padding }}>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="font-medium text-sm sm:text-base truncate" style={{ color: 'var(--cor-texto)' }}>{c.nome}</p>
                                    <span className="text-xs px-2 py-0.5 font-medium" style={{ backgroundColor: c.total_divida > 0? '#ef4444' : 'var(--cor-primaria)', color: '#fff', borderRadius: radius }}>
                                        {c.total_divida > 0? "Com Dívida" : "Em Dia"}
                                    </span>
                                </div>
                                <p className="text-xs truncate" style={{ color: 'var(--cor-texto-sec)' }}>{c.telefone || c.email}</p>
                                <p className="text-xs mt-1" style={{ color: 'var(--cor-texto-sec)' }}>Última compra: {new Date(c.ultima_compra).toLocaleDateString('pt-AO')}</p>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                {c.total_divida > 0 && (
                                    <div className="text-right">
                                        <p className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>Dívida</p>
                                        <p className="text-lg font-bold" style={{ color: '#ef4444' }}>{formatCurrency(c.total_divida)}</p>
                                    </div>
                                )}
                                <Button size="sm" variant="outline" style={{ borderColor: 'var(--cor-primaria)', color: 'var(--cor-primaria)', borderRadius: radius, background: 'transparent' }}>
                                    <Eye size={14} /> Detalhes
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* PAGINAÇÃO */}
                {totalPaginas > 1 && (
                    <div className="flex items-center justify-between mt-4">
                        <p className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>Página {pagina} de {totalPaginas}</p>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" disabled={pagina === 1} onClick={() => setPagina(p => p - 1)} style={{ borderColor: 'var(--cor-primaria)', borderRadius: radius }}>
                                <ChevronLeft size={14} />
                            </Button>
                            <Button size="sm" variant="outline" disabled={pagina === totalPaginas} onClick={() => setPagina(p => p + 1)} style={{ borderColor: 'var(--cor-primaria)', borderRadius: radius }}>
                                <ChevronRight size={14} />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL */}
            <ClienteModal
                open={showModal}
                onOpenChange={setShowModal}
                editingCliente={null}
                formData={formDataCliente}
                setFormData={setFormDataCliente}
                onSave={handleSaveCliente}
                saving={saving}
                handleChange={(field, value) => setFormDataCliente(prev => ({...prev, [field]: value}))}
            />
        </div>
    )
}
