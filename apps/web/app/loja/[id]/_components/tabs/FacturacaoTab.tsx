"use client"
import { useMemo, useState, useEffect } from "react"
import { FileText, Search, Download, Printer, Ban, Building2, ChevronLeft, ChevronRight, X, Loader2 } from "lucide-react"
import { api } from "@/lib/api"

type ItemVenda = {
    id: string
    nome_produto: string
    quantidade: number
    preco_unitario: number
    subtotal: number
}

type VendaAGT = {
    id: string
    data_venda: string // pode vir como created_at do backend
    total: number
    subtotal: number
    valor_iva: number
    forma_pagamento: string
    itens: ItemVenda[]
    status: string
    cliente_nome?: string
    cliente_nif?: string
    cliente_bi?: string
    tipo_documento: string
    serie?: string
    numero_fatura?: string
}

type ClienteSugestao = {
    id: string
    nome: string
    nif?: string
    bi?: string
}

type Props = {
    lojaId: string
    token: string | null
    loja: any
    vendas: VendaAGT[]
    formatCurrency: (v: number) => string
    theme: string
    cardStyle: string
    cardSize: string
    onVendaFaturada?: () => void
}

function formatData(data: string | null | undefined) {
    if (!data) return "Sem data"
    const d = new Date(data)
    if (isNaN(d.getTime())) return "Data inválida"
    return d.toLocaleString('pt-AO', {
        timeZone: 'Africa/Luanda',
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    })
}

function CardInfo({ titulo, valor, sub, icon, cor, cardStyle, cardSize }: any) {
    const radius = cardStyle === 'arredondado'? '16px' : '8px';
    const padding = cardSize === 'grande'? '20px' : '16px';
    return (
        <div className="transition hover:scale-[1.02]" style={{ background: 'color-mix(in srgb, var(--cor-card) 75%, transparent)', backdropFilter: 'blur(12px)', border: 'none', borderRadius: radius, padding, boxShadow: `0 0 25px color-mix(in srgb, ${cor} 20%, transparent)` }}>
            <div className="flex items-center justify-between mb-2">
                <p className="text-xs md:text-sm font-medium" style={{ color: 'var(--cor-texto-sec)' }}>{titulo}</p>
                <div style={{ color: cor }}>{icon}</div>
            </div>
            <p className="text-xl md:text-2xl lg:text-3xl font-bold" style={{ color: 'var(--cor-texto)' }}>{valor}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--cor-texto-sec)' }}>{sub}</p>
        </div>
    )
}

export function FacturacaoTab({ lojaId, token, loja, vendas, formatCurrency, theme, cardStyle, cardSize, onVendaFaturada }: Props) {
    const [busca, setBusca] = useState("")
    const [filtro, setFiltro] = useState<"todas" | "agt" | "anuladas">("todas")
    const [faturandoId, setFaturandoId] = useState<string | null>(null)
    const [nifPorVenda, setNifPorVenda] = useState<Record<string, string>>({})
    const [nomePorVenda, setNomePorVenda] = useState<Record<string, string>>({})
    const [paginaAtual, setPaginaAtual] = useState(1)
    const itensPorPagina = 10

    const [modalImprimirAberta, setModalImprimirAberta] = useState(false)
    const [vendaParaImprimir, setVendaParaImprimir] = useState<VendaAGT | null>(null)
    const [nifModal, setNifModal] = useState("")
    const [nomeModal, setNomeModal] = useState("")
    const [sugestoes, setSugestoes] = useState<ClienteSugestao[]>([])
    const [buscandoCliente, setBuscandoCliente] = useState(false)

    const radius = cardStyle === 'arredondado'? '16px' : '8px';
    const padding = cardSize === 'grande'? '24px' : '16px';
    const API_URL = process.env.NEXT_PUBLIC_API_URL || ""

    const vendasFiltradas = useMemo(() => {
        return vendas.filter(v => {
            const dataBusca = v.data_venda || v.id // fallback
            const passaBusca = v.id.toLowerCase().includes(busca.toLowerCase()) ||
                v.numero_fatura?.toLowerCase().includes(busca.toLowerCase()) ||
                v.cliente_nome?.toLowerCase().includes(busca.toLowerCase()) ||
                v.cliente_nif?.includes(busca)
            const passaFiltro = filtro === "todas"? true : filtro === "agt"? v.tipo_documento === "FACTURA" : filtro === "anuladas"? v.status === "anulada" : true
            return passaBusca && passaFiltro
        })
    }, [vendas, busca, filtro])

    useEffect(() => { setPaginaAtual(1) }, [busca, filtro])

    const totalPaginas = Math.ceil(vendasFiltradas.length / itensPorPagina)
    const vendasPaginadas = useMemo(() => {
        const inicio = (paginaAtual - 1) * itensPorPagina
        return vendasFiltradas.slice(inicio, inicio + itensPorPagina)
    }, [vendasFiltradas, paginaAtual])

    const totalFacturado = useMemo(() => vendasFiltradas.filter(v => v.status!== "anulada").reduce((acc, v) => acc + v.total, 0), [vendasFiltradas])
    const totalAGT = useMemo(() => vendasFiltradas.filter(v => v.tipo_documento === "FACTURA" && v.status!== "anulada").length, [vendasFiltradas])
    const totalAnuladas = useMemo(() => vendasFiltradas.filter(v => v.status === "anulada").length, [vendasFiltradas])

    const exportarLivro = () => {
        const linhas = [["Data", "Nº Factura", "Cliente", "NIF", "Subtotal", "IVA", "Total", "Status"],...vendasFiltradas.map(v => [formatData(v.data_venda), v.numero_fatura || v.id.slice(0, 8), v.cliente_nome || "Consumidor Final", v.cliente_nif || "-", v.subtotal || 0, v.valor_iva || 0, v.total, v.status])]
        const csv = linhas.map(l => l.join(",")).join("\n")
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `livro-vendas-agt-${new Date().toISOString().split('T')[0]}.csv`; a.click()
    }

    const handleFaturar = async (vendaId: string) => {
        const nif = nifPorVenda[vendaId]
        const nome = nomePorVenda[vendaId] || "Cliente AGT"
        if (!nif) return alert("Digite o NIF do cliente")
        if (!token) return alert("Token não encontrado")
        setFaturandoId(vendaId)
        try {
            await api.post(`/vendas/${vendaId}/faturar`, { nif, nome_cliente: nome }, {
                headers: { Authorization: `Bearer ${token}` } // <- CORRIGIDO
            })
            alert("Venda faturada com sucesso!")
            setNifPorVenda(prev => ({...prev, [vendaId]: "" })); setNomePorVenda(prev => ({...prev, [vendaId]: "" }))
            onVendaFaturada?.()
        } catch (err: any) {
            alert(err.response?.data?.detail || "Erro ao faturar")
        } finally {
            setFaturandoId(null)
        }
    }

    const abrirModalImprimir = (v: VendaAGT) => {
        setVendaParaImprimir(v)
        setNifModal(v.cliente_nif || v.cliente_bi || "")
        setNomeModal(v.cliente_nome || "")
        setSugestoes([])
        setModalImprimirAberta(true)
    }

    // BUSCAR CLIENTE COM PING PRA ACORDAR O RENDER
    useEffect(() => {
        if (!modalImprimirAberta || nifModal.length < 3 ||!token) {
            setSugestoes([])
            return
        }

        const controller = new AbortController();
        setBuscandoCliente(true)
        const timer = setTimeout(async () => {
            try {
                await fetch(`${API_URL}/health`).catch(()=>{}) // PING

                const res = await api.get(`/lojas/${lojaId}/clientes?search=${encodeURIComponent(nifModal)}`, {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: controller.signal
                })
                setSugestoes(res.data)
            } catch (e: any) {
                if (e.name!== 'CanceledError' && e.name!== 'AbortError') {
                    console.error("Erro ao buscar cliente:", e)
                    setSugestoes([])
                }
            } finally {
                setBuscandoCliente(false)
            }
        }, 800)
        return () => { clearTimeout(timer); controller.abort() }
    }, [nifModal, lojaId, token, modalImprimirAberta, API_URL])

    const selecionarCliente = (cliente: ClienteSugestao) => {
        setNifModal(cliente.nif || cliente.bi || "")
        setNomeModal(cliente.nome)
        setSugestoes([])
    }

    const confirmarImpressao = () => {
        if (!vendaParaImprimir ||!token) return;
        const url = `${API_URL}/lojas/${lojaId}/vendas/${vendaParaImprimir.id}/imprimir?token=${token}`

        const novaAba = window.open(url, '_blank', 'noopener,noreferrer');
        if (!novaAba) {
            alert("Bloqueador de pop-up ativado. Permita pop-ups para imprimir.")
        }
        setModalImprimirAberta(false)
    }

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div><h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--cor-texto)' }}>Facturação AGT <FileText size={18} style={{ color: 'var(--cor-primaria)' }} /></h2><p className="text-xs sm:text-sm" style={{ color: 'var(--cor-texto-sec)' }}>Emissão e gestão de facturas conforme AGT</p></div>
                <button onClick={exportarLivro} className="w-full md:w-auto flex items-center justify-center gap-2 font-semibold transition hover:brightness-110 text-sm h-10 px-4" style={{ background: 'var(--cor-primaria)', color: '#fff', borderRadius: radius }}><Download size={16} /> Exportar Livro AGT</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                <CardInfo titulo="Total Facturado" valor={formatCurrency(totalFacturado)} sub="No período" icon={<FileText size={16} />} cor="var(--cor-primaria)" cardStyle={cardStyle} cardSize={cardSize} />
                <CardInfo titulo="Facturas AGT" valor={totalAGT} sub="Com NIF" icon={<Building2 size={16} />} cor="#3b82f6" cardStyle={cardStyle} cardSize={cardSize} />
                <CardInfo titulo="Anuladas" valor={totalAnuladas} sub="Notas de crédito" icon={<Ban size={16} />} cor="#ef4444" cardStyle={cardStyle} cardSize={cardSize} />
            </div>

            <div style={{ backgroundColor: 'var(--cor-card)', border: '1px solid var(--cor-primaria)30', borderRadius: radius, padding }}>
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative"><Search size={14} className="absolute left-3 top-2.5" style={{ color: 'var(--cor-texto-sec)' }} /><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por Nº, Nome ou NIF..." className="w-full rounded-lg pl-9 pr-3 py-2 text-sm outline-none" style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)', border: '1px solid var(--cor-primaria)30', borderRadius: radius }} /></div>
                    <select value={filtro} onChange={(e) => setFiltro(e.target.value as any)} className="w-full sm:w-48 rounded-lg px-3 py-2 text-sm outline-none" style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)', border: '1px solid var(--cor-primaria)30', borderRadius: radius }}><option value="todas">Todas Facturas</option><option value="agt">Apenas AGT</option><option value="anuladas">Anuladas</option></select>
                </div>
            </div>

            <div style={{ backgroundColor: 'var(--cor-card)', border: '1px solid var(--cor-primaria)30', borderRadius: radius, padding }}>
                <h3 className="font-bold text-base mb-3" style={{ color: 'var(--cor-texto)' }}>Livro de Vendas</h3>

                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-sm"><thead><tr style={{ borderBottom: '1px solid var(--cor-primaria)30' }}><th className="text-left py-2 px-2">Data</th><th className="text-left py-2 px-2">Nº Factura</th><th className="text-left py-2 px-2">Cliente</th><th className="text-left py-2 px-2">NIF/BI</th><th className="text-right py-2 px-2">Total</th><th className="text-center py-2 px-2">Ações</th></tr></thead><tbody>
                        {vendasPaginadas.map(v => (
                            <tr key={v.id} style={{ borderBottom: '1px solid var(--cor-primaria)15' }}>
                                <td className="py-2 px-2">{formatData(v.data_venda)}</td>
                                <td className="py-2 px-2 font-mono text-xs">{v.numero_fatura || `REC ${v.id.slice(0, 8)}`}</td>
                                <td className="py-2 px-2">{v.cliente_nome || "Consumidor Final"}</td>
                                <td className="py-2 px-2">{v.cliente_nif || v.cliente_bi || "-"}</td>
                                <td className="py-2 px-2 text-right font-bold">{formatCurrency(v.total)}</td>
                                <td className="py-2 px-2">
                                    <div className="flex gap-2 justify-center">
                                        {v.tipo_documento === "RECIBO" &&
                                            <div className="flex gap-1">
                                                <input
                                                    value={nifPorVenda[v.id] || ''}
                                                    onChange={e => setNifPorVenda(prev => ({...prev, [v.id]: e.target.value }))}
                                                    placeholder="NIF/BI"
                                                    className="w-24 text-xs p-1 rounded"
                                                    style={{ border: '1px solid #ccc', background: 'var(--cor-fundo)', color: 'var(--cor-texto)' }}
                                                />
                                                <button
                                                    onClick={() => handleFaturar(v.id)}
                                                    disabled={faturandoId === v.id}
                                                    className="px-2 py-1 rounded text-xs font-semibold disabled:opacity-50"
                                                    style={{ background: '#22c55e', color: '#fff' }}
                                                >
                                                    {faturandoId === v.id? '...' : 'Faturar'}
                                                </button>
                                            </div>
                                        }
                                        <button onClick={() => abrirModalImprimir(v)} className="p-1.5 rounded" style={{ background: 'var(--cor-primaria)20' }}><Printer size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody></table>
                </div>

                <div className="lg:hidden space-y-2 max-h-[500px] overflow-y-auto">
                    {vendasPaginadas.map(v => (
                        <div key={v.id} className="p-3" style={{ backgroundColor: 'var(--cor-fundo)', borderRadius: radius }}>
                            <div className="flex justify-between items-start mb-2"><div><p className="font-bold text-sm">{v.numero_fatura || `REC ${v.id.slice(0, 8)}`}</p><p className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>{formatData(v.data_venda)}</p></div><p className="font-bold">{formatCurrency(v.total)}</p></div>
                            <p className="text-xs font-medium">{v.cliente_nome || "Consumidor Final"}</p><p className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>NIF/BI: {v.cliente_nif || v.cliente_bi || "-"}</p>
                            <div className="flex gap-2 mt-2">
                                {v.tipo_documento === "RECIBO" &&
                                    <div className="flex-1 flex gap-1">
                                        <input
                                            value={nifPorVenda[v.id] || ''}
                                            onChange={e => setNifPorVenda(prev => ({...prev, [v.id]: e.target.value }))}
                                            placeholder="NIF/BI"
                                            className="w-full text-xs p-1 rounded"
                                            style={{ border: '1px solid #ccc', background: 'var(--cor-card)', color: 'var(--cor-texto)' }}
                                        />
                                        <button
                                            onClick={() => handleFaturar(v.id)}
                                            disabled={faturandoId === v.id}
                                            className="px-2 text-xs rounded font-semibold disabled:opacity-50"
                                            style={{ background: '#22c55e', color: '#fff' }}
                                        >
                                            {faturandoId === v.id? '...' : 'Faturar'}
                                        </button>
                                    </div>
                                }
                                <button onClick={() => abrirModalImprimir(v)} className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded font-semibold" style={{ background: 'var(--cor-primaria)', color: '#fff' }}><Printer size={12} /> Imprimir</button>
                            </div>
                        </div>
                    ))}
                    {vendasPaginadas.length === 0 && <p className="text-center py-8 text-sm" style={{ color: 'var(--cor-texto-sec)' }}>Nenhuma factura encontrada</p>}
                </div>

                {totalPaginas > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: '1px solid var(--cor-primaria)30' }}>
                        <p className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>
                            Mostrando {((paginaAtual - 1) * itensPorPagina) + 1} a {Math.min(paginaAtual * itensPorPagina, vendasFiltradas.length)} de {vendasFiltradas.length}
                        </p>
                        <div className="flex gap-2">
                            <button onClick={() => setPaginaAtual(p => Math.max(1, p - 1))} disabled={paginaAtual === 1} className="p-2 rounded disabled:opacity-40" style={{ background: 'var(--cor-primaria)20' }}><ChevronLeft size={16} /></button>
                            <span className="text-sm font-semibold px-2" style={{ color: 'var(--cor-texto)' }}>{paginaAtual} / {totalPaginas}</span>
                            <button onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))} disabled={paginaAtual === totalPaginas} className="p-2 rounded disabled:opacity-40" style={{ background: 'var(--cor-primaria)20' }}><ChevronRight size={16} /></button>
                        </div>
                    </div>
                )}
            </div>

            {modalImprimirAberta && vendaParaImprimir && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="w-full max-w-md p-6 space-y-4" style={{ background: 'var(--cor-card)', borderRadius: radius }}>
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold" style={{ color: 'var(--cor-texto)' }}>Dados para Impressão</h3>
                            <button onClick={() => setModalImprimirAberta(false)}><X size={20} /></button>
                        </div>
                        <p className="text-sm" style={{ color: 'var(--cor-texto-sec)' }}>Venda: {vendaParaImprimir.numero_fatura || `REC ${vendaParaImprimir.id.slice(0, 8)}`}</p>

                        <div>
                            <label className="text-sm font-medium">NIF ou BI do Cliente</label>
                            <div className="relative">
                                <input
                                    value={nifModal}
                                    onChange={e => setNifModal(e.target.value)}
                                    placeholder="Digite 3+ caracteres"
                                    className="w-full mt-1 p-2 rounded pr-8"
                                    style={{ background: 'var(--cor-fundo)', border: '1px solid var(--cor-primaria)30', color: 'var(--cor-texto)' }}
                                />
                                {buscandoCliente && <Loader2 size={14} className="absolute right-2 top-3 animate-spin" />}
                            </div>
                            {sugestoes.length > 0 && (
                                <div className="mt-1 max-h-40 overflow-y-auto rounded border z-10" style={{ background: 'var(--cor-fundo)', borderColor: 'var(--cor-primaria)30' }}>
                                    {sugestoes.map(c => (
                                        <div key={c.id} onClick={() => selecionarCliente(c)} className="p-2 text-sm cursor-pointer hover:bg-[var(--cor-primaria)20]">
                                            <p className="font-semibold">{c.nome}</p>
                                            <p className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>NIF: {c.nif || "-"} | BI: {c.bi || "-"}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="text-sm font-medium">Nome do Cliente</label>
                            <input
                                value={nomeModal}
                                onChange={e => setNomeModal(e.target.value)}
                                placeholder="Nome aparecerá aqui"
                                className="w-full mt-1 p-2 rounded"
                                style={{ background: 'var(--cor-fundo)', border: '1px solid var(--cor-primaria)30', color: 'var(--cor-texto)' }}
                            />
                        </div>
                        <button onClick={confirmarImpressao} className="w-full py-2 rounded font-semibold" style={{ background: 'var(--cor-primaria)', color: '#fff' }}>Imprimir</button>
                    </div>
                </div>
            )}
        </div>
    )
}
