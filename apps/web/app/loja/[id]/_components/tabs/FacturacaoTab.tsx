"use client"
import { useMemo, useState, useEffect } from "react"
import { FileText, Search, Download, Printer, Ban, Building2, ChevronLeft, ChevronRight, X } from "lucide-react"
import { api } from "@/lib/api"

type VendaAGT = {
    id: string
    data_venda: string
    total: number
    subtotal: number
    valor_iva: number
    forma_pagamento: string
    itens: any[]
    status: string
    cliente_nome?: string
    cliente_nif?: string
    cliente_bi?: string
    tipo_documento: string
    numero_fatura?: string
}

type ClienteSugestao = {
    id: string
    nome: string
    nif?: string
    bi?: string
}

export function FacturacaoTab({ lojaId, token, vendas, formatCurrency, cardStyle, cardSize }: any) {
    const [busca, setBusca] = useState("")
    const [filtro, setFiltro] = useState("todas")
    const [faturandoId, setFaturandoId] = useState<string | null>(null)
    const [nifPorVenda, setNifPorVenda] = useState<Record<string, string>>({})
    const [nomePorVenda, setNomePorVenda] = useState<Record<string, string>>({})
    const [paginaAtual, setPaginaAtual] = useState(1)
    const itensPorPagina = 10

    // MODAL
    const [modalAberta, setModalAberta] = useState(false)
    const [vendaModal, setVendaModal] = useState<VendaAGT | null>(null)
    const [nifModal, setNifModal] = useState("")
    const [nomeModal, setNomeModal] = useState("")
    const [clientesBusca, setClientesBusca] = useState<ClienteSugestao[]>([])

    const radius = cardStyle === 'arredondado'? '16px' : '8px';
    const padding = cardSize === 'grande'? '24px' : '16px';

    const vendasFiltradas = useMemo(() => {
        return vendas.filter((v: VendaAGT) => {
            const passaBusca = v.id.toLowerCase().includes(busca.toLowerCase()) ||
                               v.numero_fatura?.toLowerCase().includes(busca.toLowerCase()) ||
                               v.cliente_nome?.toLowerCase().includes(busca.toLowerCase()) ||
                               v.cliente_nif?.includes(busca)
            const passaFiltro = filtro === "todas"? true : filtro === "agt"?!!v.cliente_nif : filtro === "anuladas"? v.status === "anulada" : true
            return passaBusca && passaFiltro
        })
    }, [vendas, busca, filtro])

    useEffect(() => { setPaginaAtual(1) }, [busca, filtro])

    const totalPaginas = Math.ceil(vendasFiltradas.length / itensPorPagina)
    const vendasPaginadas = vendasFiltradas.slice((paginaAtual - 1) * itensPorPagina, paginaAtual * itensPorPagina)

    // 1. BUSCAR CLIENTE QUANDO DIGITAR NO MODAL
    useEffect(() => {
        if (!modalAberta || nifModal.length < 3) {
            setClientesBusca([])
            return
        }
        const buscar = async () => {
            try {
                const res = await api.get(`/lojas/${lojaId}/clientes?search=${nifModal}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                setClientesBusca(res.data)
            } catch {
                setClientesBusca([])
            }
        }
        const timer = setTimeout(buscar, 300) // espera 300ms pra não ficar chamando toda hora
        return () => clearTimeout(timer)
    }, [nifModal, lojaId, token, modalAberta])

    const abrirModal = (v: VendaAGT) => {
        setVendaModal(v)
        setNifModal(v.cliente_nif || v.cliente_bi || "")
        setNomeModal(v.cliente_nome || "")
        setClientesBusca([])
        setModalAberta(true)
    }

    const selecionarCliente = (c: ClienteSugestao) => {
        setNifModal(c.nif || c.bi || "")
        setNomeModal(c.nome)
        setClientesBusca([])
    }

    const imprimir = () => {
        if(!vendaModal ||!token) return;
        const API_URL = process.env.NEXT_PUBLIC_API_URL || ""
        window.open(`${API_URL}/lojas/${lojaId}/vendas/${vendaModal.id}/imprimir?token=${token}`, '_blank')
        setModalAberta(false)
    }

    const faturar = async (vendaId: string) => {
        const nif = nifPorVenda[vendaId]
        if (!nif) return alert("Digite o NIF")
        setFaturandoId(vendaId)
        try {
            await api.post(`/vendas/${vendaId}/faturar`, { nif, nome_cliente: nomePorVenda[vendaId] || "Cliente" })
            alert("Faturado!")
            setNifPorVenda({})
        } catch (err: any) {
            alert(err.response?.data?.detail || "Erro")
        } finally {
            setFaturandoId(null)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Facturação AGT</h2>
                <button onClick={() => {}} className="px-4 py-2 rounded" style={{ background: 'var(--cor-primaria)', color: '#fff' }}>
                    <Download size={16} className="inline mr-2" /> Exportar
                </button>
            </div>

            <div style={{ background: 'var(--cor-card)', padding, borderRadius: radius }}>
                <table className="w-full text-sm">
                    <thead><tr><th>Data</th><th>Nº</th><th>Cliente</th><th>NIF</th><th>Total</th><th>Ações</th></tr></thead>
                    <tbody>
                        {vendasPaginadas.map((v: VendaAGT) => (
                            <tr key={v.id}>
                                <td>{new Date(v.data_venda).toLocaleDateString('pt-AO')}</td>
                                <td>{v.numero_fatura || v.id.slice(0,8)}</td>
                                <td>{v.cliente_nome || "Consumidor"}</td>
                                <td>{v.cliente_nif || v.cliente_bi || "-"}</td>
                                <td>{formatCurrency(v.total)}</td>
                                <td>
                                    <button onClick={() => abrirModal(v)} className="p-2 rounded" style={{ background: 'var(--cor-primaria)20' }}>
                                        <Printer size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL SIMPLES */}
            {modalAberta && vendaModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="w-full max-w-md p-6 space-y-3" style={{ background: 'var(--cor-card)', borderRadius: radius }}>
                        <div className="flex justify-between">
                            <h3 className="text-lg font-bold">Dados para Impressão</h3>
                            <X onClick={() => setModalAberta(false)} className="cursor-pointer" />
                        </div>
                        <p className="text-sm">Venda: {vendaModal.numero_fatura || vendaModal.id.slice(0,8)}</p>

                        <div>
                            <label>NIF ou BI do Cliente</label>
                            <input
                                value={nifModal}
                                onChange={e => setNifModal(e.target.value)}
                                placeholder="Digite 3+ caracteres"
                                className="w-full mt-1 p-2 rounded"
                                style={{ background: 'var(--cor-fundo)', border: '1px solid #ccc' }}
                            />

                            {/* LISTA DE SUGESTÕES */}
                            {clientesBusca.length > 0 && (
                                <div className="mt-1 max-h-40 overflow-y-auto border rounded" style={{ background: 'var(--cor-fundo)' }}>
                                    {clientesBusca.map(c => (
                                        <div key={c.id} onClick={() => selecionarCliente(c)} className="p-2 cursor-pointer hover:bg-gray-200">
                                            <p className="font-semibold">{c.nome}</p>
                                            <p className="text-xs">NIF: {c.nif || "-"} BI: {c.bi || "-"}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <label>Nome do Cliente</label>
                            <input
                                value={nomeModal}
                                onChange={e => setNomeModal(e.target.value)}
                                className="w-full mt-1 p-2 rounded"
                                style={{ background: 'var(--cor-fundo)', border: '1px solid #ccc' }}
                            />
                        </div>

                        <button onClick={imprimir} className="w-full py-2 rounded font-semibold" style={{ background: 'var(--cor-primaria)', color: '#fff' }}>
                            Imprimir
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
