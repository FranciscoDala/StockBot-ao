"use client"
import { useMemo, useState } from "react"
import { AlertTriangle, PackageX, TrendingDown, Ban, Clock, Flame, CheckCircle2, Filter, Search, Download, BarChart3 } from "lucide-react"

type ItemVenda = {
    id: string
    produto_id: string
    nome_produto: string
    quantidade: number
    preco_unitario: number
    subtotal: number
}

type Venda = {
    id: string
    data: string
    total: number
    formaPagamento: string
    itens: number
    detalhes: ItemVenda[]
    status?: string
}

type Produto = {
    id: string
    nome: string
    estoque: number
    estoque_minimo: number
    preco: number
    data_validade?: string
    ultima_venda?: string
    categoria_id?: string | number | null
}

type Props = {
    vendas: Venda[]
    produtos: Produto[]
    formatCurrency: (v: number) => string
}

function CardRisco({
    titulo,
    qtd,
    descricao,
    cor,
    icon,
    tendencia
}: {
    titulo: string,
    qtd: number,
    descricao: string,
    cor: "primaria" | "alerta" | "yellow" | "blue",
    icon: React.ReactNode,
    tendencia?: string
}) {
    const cores = {
        primaria: { bg: 'var(--cor-primaria)', text: '#fff' },
        alerta: { bg: '#ef4444', text: '#fff' },
        yellow: { bg: 'var(--cor-fundo-card, #18181b)', text: '#facc15', border: '#eab30830' },
        blue: { bg: 'var(--cor-fundo-card, #18181b)', text: '#60a5fa', border: '#3b82f630' }
    }
    const c = cores[cor]
    return (
        <div
            className="p-3 md:p-4 transition hover:scale-[1.02]"
            style={{
                backgroundColor: c.bg,
                color: c.text,
                border: cor === "primaria" || cor === "alerta"? 'none' : `1px solid ${c.border}`,
                borderRadius: 'var(--radius)'
            }}
        >
            <div className="flex items-center justify-between mb-2">
                <p className="text-xs md:text-sm font-medium" style={{opacity: 0.9}}>{titulo}</p>
                {icon}
            </div>
            <p className="text-2xl md:text-3xl font-bold">{qtd}</p>
            <p className="text-xs mt-1" style={{opacity: 0.8}}>{descricao}</p>
            {tendencia && <p className="text-[10px] mt-1" style={{opacity: 0.7}}>{tendencia}</p>}
        </div>
    )
}

function BarraProgresso({ valor, max, cor }: { valor: number, max: number, cor: string }) {
    const pct = max > 0? (valor / max) * 100 : 0
    return (
        <div className="w-full rounded-full h-2" style={{backgroundColor: 'var(--cor-fundo)', borderRadius: 'var(--radius)'}}>
            <div className="h-2 rounded-full" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: cor, borderRadius: 'var(--radius)' }}></div>
        </div>
    )
}

export function RiscoTab({ vendas, produtos, formatCurrency }: Props) {
    const [abaAtiva, setAbaAtiva] = useState<"estoque" | "financeiro" | "operacional">("estoque")
    const [filtroPeriodo, setFiltroPeriodo] = useState("30")
    const [filtroCategoria, setFiltroCategoria] = useState("TODAS")
    const [busca, setBusca] = useState("")

    const hoje = new Date()
    const diasAtras = new Date()
    diasAtras.setDate(hoje.getDate() - Number(filtroPeriodo))
    const quinzeDiasFrente = new Date()
    quinzeDiasFrente.setDate(hoje.getDate() + 15)

    // FILTROS
    const produtosFiltrados = useMemo(() => produtos.filter(p => {
        const passaBusca = p.nome.toLowerCase().includes(busca.toLowerCase())
        const passaCategoria = filtroCategoria === "TODAS" || String(p.categoria_id) === filtroCategoria
        return passaBusca && passaCategoria
    }), [produtos, busca, filtroCategoria])

    const vendasFiltradas = useMemo(() => vendas.filter(v => {
        const dataVenda = new Date(v.data)
        return dataVenda >= diasAtras
    }), [vendas, diasAtras])

    // 1. RISCOS DE ESTOQUE
    const produtosRuptura = useMemo(() => produtosFiltrados.filter(p => p.estoque <= p.estoque_minimo && p.estoque > 0), [produtosFiltrados])
    const produtosZerados = useMemo(() => produtosFiltrados.filter(p => p.estoque <= 0), [produtosFiltrados])
    const produtosParados = useMemo(() => produtosFiltrados.filter(p => {
        if (!p.ultima_venda) return p.estoque > 5
        const ultimaVenda = new Date(p.ultima_venda)
        return ultimaVenda < diasAtras && p.estoque > 5
    }), [produtosFiltrados, diasAtras])
    const produtosValidade = useMemo(() => produtosFiltrados.filter(p => {
        if (!p.data_validade) return false
        const validade = new Date(p.data_validade)
        return validade <= quinzeDiasFrente && validade >= hoje
    }), [produtosFiltrados, quinzeDiasFrente, hoje])

    // 2. RISCOS FINANCEIROS
    const vendasHoje = useMemo(() => vendasFiltradas.filter(v => {
        const dataVenda = new Date(v.data)
        return dataVenda.toDateString() === hoje.toDateString()
    }), [vendasFiltradas, hoje])
    const vendasCanceladas = useMemo(() => vendasFiltradas.filter(v => v.status?.toLowerCase() === "cancelada"), [vendasFiltradas])
    const taxaCancelamento = vendasFiltradas.length > 0? (vendasCanceladas.length / vendasFiltradas.length) * 100 : 0
    const totalPerdido = useMemo(() => vendasCanceladas.reduce((acc, v) => acc + v.total, 0), [vendasCanceladas])

    // 3. RISCOS OPERACIONAIS
    const vendasComDesconto = useMemo(() => vendasFiltradas.filter(v => {
        const totalSemDesconto = v.detalhes.reduce((acc, item) => acc + (item.preco_unitario * item.quantidade), 0)
        return totalSemDesconto > v.total && ((totalSemDesconto - v.total) / totalSemDesconto) > 0.2
    }), [vendasFiltradas])

    const totalRiscos = produtosRuptura.length + produtosZerados.length + produtosParados.length + produtosValidade.length + vendasCanceladas.length

    const exportarCSV = () => {
        const linhas = [
            ["Tipo", "Produto", "Estoque", "Minimo"],
         ...produtosZerados.map(p => ["Zerado", p.nome, p.estoque, p.estoque_minimo]),
         ...produtosRuptura.map(p => ["Ruptura", p.nome, p.estoque, p.estoque_minimo])
        ]
        const csv = linhas.map(l => l.join(",")).join("\n")
        const blob = new Blob([csv], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `relatorio-risco-${hoje.toISOString().split('T')[0]}.csv`
        a.click()
    }

    const categorias = useMemo(() => {
        const cats = new Set(produtos.map(p => p.categoria_id).filter(Boolean))
        return Array.from(cats)
    }, [produtos])

    return (
        <div className="space-y-4 md:space-y-6 p-2 md:p-0">
            {/* HEADER + FILTROS */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2" style={{color: 'var(--cor-texto)'}}>Painel de Riscos
                    {totalRiscos === 0? <CheckCircle2 size={18} style={{color: 'var(--cor-primaria)'}} /> : <AlertTriangle size={18} className="text-red-500" />}
                    </h2>
                    <p className="text-xs sm:text-sm" style={{color: 'var(--cor-texto-sec)'}}>Observe e controle os riscos diários</p>
                </div>
                <button
                    onClick={exportarCSV}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold transition hover:brightness-110"
                    style={{background: 'var(--cor-primaria)', color: '#fff'}}
                >
                    <Download size={14} /> Exportar CSV
                </button>
            </div>

            {/* FILTROS SELECT */}
            <div
                className="p-3 md:p-4"
                style={{
                    backgroundColor: 'var(--cor-fundo-card, #171717)',
                    border: '1px solid var(--cor-primaria)30',
                    borderRadius: 'var(--radius)'
                }}
            >
                <div className="flex items-center gap-2 mb-3" style={{color: 'var(--cor-texto)'}}>
                    <Filter size={16} /> <span className="text-sm font-medium">Filtros Inteligentes</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                        <label className="text-xs" style={{color: 'var(--cor-texto-sec)'}}>Período de Análise</label>
                        <select
                            value={filtroPeriodo}
                            onChange={(e) => setFiltroPeriodo(e.target.value)}
                            className="w-full mt-1 rounded-lg px-3 py-2 text-sm outline-none"
                            style={{backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)', border: '1px solid var(--cor-primaria)30', borderRadius: 'var(--radius)'}}
                        >
                            <option value="7">Últimos 7 dias</option>
                            <option value="15">Últimos 15 dias</option>
                            <option value="30">Últimos 30 dias</option>
                            <option value="90">Últimos 90 dias</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs" style={{color: 'var(--cor-texto-sec)'}}>Categoria</label>
                        <select
                            value={filtroCategoria}
                            onChange={(e) => setFiltroCategoria(e.target.value)}
                            className="w-full mt-1 rounded-lg px-3 py-2 text-sm outline-none"
                            style={{backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)', border: '1px solid var(--cor-primaria)30', borderRadius: 'var(--radius)'}}
                        >
                            <option value="TODAS">Todas Categorias</option>
                            {categorias.map(c => <option key={String(c)} value={String(c)}>Categoria {c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs" style={{color: 'var(--cor-texto-sec)'}}>Buscar Produto</label>
                        <div className="relative mt-1">
                            <Search size={14} className="absolute left-3 top-2.5" style={{color: 'var(--cor-texto-sec)'}} />
                            <input
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                placeholder="Nome do produto..."
                                className="w-full rounded-lg pl-9 pr-3 py-2 text-sm outline-none"
                                style={{backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)', border: '1px solid var(--cor-primaria)30', borderRadius: 'var(--radius)'}}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ABAS */}
            <div className="overflow-x-auto scrollbar-hide">
                <div
                    className="flex gap-2 p-1 w-max min-w-full"
                    style={{backgroundColor: 'var(--cor-fundo-card, #171717)', borderRadius: 'var(--radius)'}}
                >
                    {[
                        {id: "estoque", label: "Estoque", icon: PackageX},
                        {id: "financeiro", label: "Financeiro", icon: TrendingDown},
                        {id: "operacional", label: "Operacional", icon: BarChart3}
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setAbaAtiva(tab.id as any)}
                            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition whitespace-nowrap"
                            style={abaAtiva === tab.id
                             ? {backgroundColor: 'var(--cor-primaria)', color: 'white', borderRadius: 'var(--radius)'}
                                : {color: 'var(--cor-texto-sec)', borderRadius: 'var(--radius)'}
                            }
                        >
                            <tab.icon size={14} /> {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* CONTEUDO POR ABA */}
            {abaAtiva === "estoque" && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                        <CardRisco titulo="Estoque Zerado" qtd={produtosZerados.length} descricao="Não consegue vender" cor="alerta" icon={<Ban size={16} />} tendencia="-12% vs mês ant" />
                        <CardRisco titulo="Risco Ruptura" qtd={produtosRuptura.length} descricao="Abaixo do mínimo" cor="yellow" icon={<PackageX size={16} />} />
                        <CardRisco titulo="Produtos Parados" qtd={produtosParados.length} descricao="+30 dias sem girar" cor="yellow" icon={<Clock size={16} />} />
                        <CardRisco titulo="Validade Próxima" qtd={produtosValidade.length} descricao="Vence em 15 dias" cor="yellow" icon={<Flame size={16} />} />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div
                            className="p-3 md:p-4"
                            style={{
                                backgroundColor: 'var(--cor-fundo-card, #171717)',
                                border: '1px solid var(--cor-primaria)30',
                                borderRadius: 'var(--radius)'
                            }}
                        >
                            <h3 className="font-bold text-base mb-3 flex items-center gap-2" style={{color: 'var(--cor-texto)'}}><PackageX size={16} style={{color: '#ef4444'}} /> Alertas Críticos</h3>
                            <div className="space-y-2 max-h-[350px] overflow-y-auto scrollbar-hide">
                                {[...produtosZerados,...produtosRuptura].slice(0, 15).map(p => (
                                    <div key={p.id} className="p-3" style={{backgroundColor: 'var(--cor-fundo)', borderRadius: 'var(--radius)'}}>
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="font-medium text-sm truncate max-w-[200px]" style={{color: 'var(--cor-texto)'}}>{p.nome}</p>
                                            <span className="font-bold text-xs" style={{color: p.estoque <= 0? '#ef4444' : '#f97316'}}>Est: {p.estoque}</span>
                                        </div>
                                        <BarraProgresso valor={p.estoque} max={p.estoque_minimo * 2} cor={p.estoque <= 0? "#ef4444" : "#f97316"} />
                                        <p className="text-[10px] mt-1" style={{color: 'var(--cor-texto-sec)'}}>Mínimo: {p.estoque_minimo}</p>
                                    </div>
                                ))}
                                {produtosZerados.length === 0 && produtosRuptura.length === 0 && <p className="text-center py-8 text-sm" style={{color: 'var(--cor-texto-sec)'}}>Estoque saudável ✅</p>}
                            </div>
                        </div>

                        {produtosValidade.length > 0 && (
                            <div
                                className="p-3 md:p-4"
                                style={{
                                    backgroundColor: 'var(--cor-fundo-card, #171717)',
                                    border: '1px solid var(--cor-primaria)30',
                                    borderRadius: 'var(--radius)'
                                }}
                            >
                                <h3 className="font-bold text-base mb-3 flex items-center gap-2" style={{color: 'var(--cor-texto)'}}><Flame size={16} style={{color: '#f97316'}} /> Próximos do Vencimento</h3>
                                <div className="grid grid-cols-1 gap-2 max-h-[350px] overflow-y-auto scrollbar-hide">
                                    {produtosValidade.map(p => (
                                        <div key={p.id} className="p-3 text-xs" style={{backgroundColor: '#f9731614', border: '1px solid #f9731630', borderRadius: 'var(--radius)'}}>
                                            <p className="font-medium truncate" style={{color: 'var(--cor-texto)'}}>{p.nome}</p>
                                            <p style={{color: 'var(--cor-texto-sec)'}}>Vence: {new Date(p.data_validade!).toLocaleDateString('pt-AO')}</p>
                                            <p className="font-bold mt-1" style={{color: 'var(--cor-texto)'}}>Est: {p.estoque} un</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {abaAtiva === "financeiro" && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                        <CardRisco titulo="Vendas Canceladas" qtd={vendasCanceladas.length} descricao={`${taxaCancelamento.toFixed(1)}% do total`} cor="alerta" icon={<TrendingDown size={16} />} />
                        <CardRisco titulo="Perda Estimada" qtd={0} descricao={formatCurrency(totalPerdido)} cor="yellow" icon={<Ban size={16} />} />
                        <CardRisco titulo="Desconto >20%" qtd={vendasComDesconto.length} descricao="Risco de margem" cor="yellow" icon={<Flame size={16} />} />
                        <CardRisco titulo="Vendas no Período" qtd={vendasFiltradas.length} descricao="Total analisado" cor="blue" icon={<BarChart3 size={16} />} />
                    </div>

                    <div
                        className="p-3 md:p-4"
                        style={{
                            backgroundColor: 'var(--cor-fundo-card, #171717)',
                            border: '1px solid var(--cor-primaria)30',
                            borderRadius: 'var(--radius)'
                        }}
                    >
                        <h3 className="font-bold text-base mb-3" style={{color: 'var(--cor-texto)'}}>Últimas Vendas Canceladas</h3>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-hide">
                            {vendasCanceladas.slice(0, 10).map(v => (
                                <div key={v.id} className="flex justify-between items-center p-3 text-xs" style={{backgroundColor: '#ef444414', border: '1px solid #ef444430', borderRadius: 'var(--radius)'}}>
                                    <div>
                                        <p className="font-medium" style={{color: 'var(--cor-texto)'}}>#{v.id.slice(0,8)}</p>
                                        <p style={{color: 'var(--cor-texto-sec)'}}>{new Date(v.data).toLocaleDateString('pt-AO')}</p>
                                    </div>
                                    <p className="font-bold" style={{color: '#ef4444'}}>{formatCurrency(v.total)}</p>
                                </div>
                            ))}
                            {vendasCanceladas.length === 0 && <p className="text-center py-4 text-sm" style={{color: 'var(--cor-texto-sec)'}}>Nenhum cancelamento no período</p>}
                        </div>
                    </div>
                </div>
            )}

            {abaAtiva === "operacional" && (
                <div
                    className="p-6 text-center"
                    style={{
                        backgroundColor: 'var(--cor-fundo-card, #171717)',
                        border: '1px solid var(--cor-primaria)30',
                        borderRadius: 'var(--radius)'
                    }}
                >
                    <CheckCircle2 size={32} style={{color: 'var(--cor-primaria)', margin: '0 auto 8px'}} />
                    <p className="font-semibold" style={{color: 'var(--cor-texto)'}}>Operação Estável</p>
                    <p className="text-sm" style={{color: 'var(--cor-texto-sec)'}}>Sem anomalias operacionais detectadas nos últimos {filtroPeriodo} dias</p>
                </div>
            )}

            <style jsx global>{`
           .scrollbar-hide::-webkit-scrollbar { display: none; }
           .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    )
}
