"use client"
import { useMemo } from "react"
import { AlertTriangle, PackageX, TrendingDown, Ban, Clock, Flame, CheckCircle2 } from "lucide-react"

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
    icon
}: {
    titulo: string,
    qtd: number,
    descricao: string,
    cor: "red" | "yellow" | "orange" | "green",
    icon: React.ReactNode
}) {
    const cores = {
        red: "border-red-500/30 bg-red-950/20 text-red-400",
        yellow: "border-yellow-500/30 bg-yellow-950/20 text-yellow-400",
        orange: "border-orange-500/30 bg-orange-950/20 text-orange-400",
        green: "border-green-500/30 bg-green-950/20 text-green-400"
    }
    return (
        <div className={`border rounded-xl p-3 md:p-4 ${cores[cor]}`}>
            <div className="flex items-center justify-between mb-2">
                <p className="text-xs md:text-sm font-medium text-gray-300">{titulo}</p>
                {icon}
            </div>
            <p className="text-2xl md:text-3xl font-bold">{qtd}</p>
            <p className="text-xs mt-1 opacity-80">{descricao}</p>
        </div>
    )
}

export function RiscoTab({ vendas, produtos, formatCurrency }: Props) {
    const hoje = new Date()
    const trintaDiasAtras = new Date()
    trintaDiasAtras.setDate(hoje.getDate() - 30)
    const quinzeDiasFrente = new Date()
    quinzeDiasFrente.setDate(hoje.getDate() + 15)

    // 1. RISCOS DE ESTOQUE
    const produtosRuptura = useMemo(() =>
        produtos.filter(p => p.estoque <= p.estoque_minimo && p.estoque > 0),
    [produtos])

    const produtosZerados = useMemo(() =>
        produtos.filter(p => p.estoque <= 0),
    [produtos])

    const produtosParados = useMemo(() =>
        produtos.filter(p => {
            if (!p.ultima_venda) return p.estoque > 5
            const ultimaVenda = new Date(p.ultima_venda)
            return ultimaVenda < trintaDiasAtras && p.estoque > 5
        }),
    [produtos, trintaDiasAtras])

    const produtosValidade = useMemo(() =>
        produtos.filter(p => {
            if (!p.data_validade) return false
            const validade = new Date(p.data_validade)
            return validade <= quinzeDiasFrente && validade >= hoje
        }),
    [produtos, quinzeDiasFrente, hoje])

    // 2. RISCOS FINANCEIROS
    const vendasHoje = useMemo(() => vendas.filter(v => {
        const dataVenda = new Date(v.data)
        return dataVenda.toDateString() === hoje.toDateString()
    }), [vendas, hoje])

    const vendasCanceladas = useMemo(() =>
        vendasHoje.filter(v => v.status?.toLowerCase() === "cancelada"),
    [vendasHoje])

    const taxaCancelamento = vendasHoje.length > 0
        ? (vendasCanceladas.length / vendasHoje.length) * 100
        : 0

    // 3. RISCOS OPERACIONAIS
    const vendasComDesconto = useMemo(() =>
        vendasHoje.filter(v => {
            const totalSemDesconto = v.detalhes.reduce((acc, item) => acc + (item.preco_unitario * item.quantidade), 0)
            return totalSemDesconto > v.total && ((totalSemDesconto - v.total) / totalSemDesconto) > 0.2
        }),
    [vendasHoje])

    const totalRiscos = produtosRuptura.length + produtosZerados.length + produtosParados.length + produtosValidade.length + vendasCanceladas.length

    return (
        <div className="space-y-4 md:space-y-6 p-2 md:p-0">
            <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-bold">Painel de Riscos</h2>
                {totalRiscos === 0
                    ? <CheckCircle2 size={18} className="text-green-500" />
                    : <AlertTriangle size={18} className="text-red-500" />
                }
            </div>

            {totalRiscos === 0 ? (
                <div className="bg-green-950/20 border-green-500/30 rounded-xl p-6 text-center">
                    <CheckCircle2 size={32} className="text-green-500 mx-auto mb-2" />
                    <p className="font-semibold text-green-400">Tudo OK</p>
                    <p className="text-sm text-gray-400">Nenhum risco crítico detectado no momento</p>
                </div>
            ) : (
                <>
                    {/* LINHA 1: CARDS PRINCIPAIS */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                        <CardRisco
                            titulo="Estoque Zerado"
                            qtd={produtosZerados.length}
                            descricao="Não consegue vender"
                            cor="red"
                            icon={<Ban size={16} />}
                        />
                        <CardRisco
                            titulo="Risco Ruptura"
                            qtd={produtosRuptura.length}
                            descricao="Abaixo do mínimo"
                            cor="orange"
                            icon={<PackageX size={16} />}
                        />
                        <CardRisco
                            titulo="Produtos Parados"
                            qtd={produtosParados.length}
                            descricao="+30 dias sem girar"
                            cor="yellow"
                            icon={<Clock size={16} />}
                        />
                        <CardRisco
                            titulo="Validade Próxima"
                            qtd={produtosValidade.length}
                            descricao="Vence em 15 dias"
                            cor="orange"
                            icon={<Flame size={16} />}
                        />
                    </div>

                    {/* LINHA 2: ALERTAS DETALHADOS */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                        {/* Alertas de Estoque */}
                        <div className="bg-neutral-900 rounded-xl p-3 md:p-4">
                            <h3 className="font-bold text-base mb-3 flex items-center gap-2">
                                <PackageX size={16} className="text-red-500" /> Alertas de Estoque
                            </h3>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-hide">
                                {[...produtosZerados, ...produtosRuptura].slice(0, 10).map(p => (
                                    <div key={p.id} className="flex justify-between items-center bg-neutral-800 p-2 rounded-lg text-xs">
                                        <div>
                                            <p className="font-medium truncate max-w-[180px]">{p.nome}</p>
                                            <p className="text-gray-400">Mín: {p.estoque_minimo}</p>
                                        </div>
                                        <span className={`font-bold ${p.estoque <= 0 ? 'text-red-500' : 'text-orange-500'}`}>
                                            Est: {p.estoque}
                                        </span>
                                    </div>
                                ))}
                                {produtosZerados.length === 0 && produtosRuptura.length === 0 && (
                                    <p className="text-gray-400 text-center py-4 text-sm">Nenhum problema de estoque</p>
                                )}
                            </div>
                        </div>

                        {/* Alertas Financeiros e Operacionais */}
                        <div className="bg-neutral-900 rounded-xl p-3 md:p-4">
                            <h3 className="font-bold text-base mb-3 flex items-center gap-2">
                                <TrendingDown size={16} className="text-yellow-500" /> Alertas Financeiros
                            </h3>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center bg-neutral-800 p-3 rounded-lg">
                                    <div>
                                        <p className="font-medium text-sm">Taxa de Cancelamento Hoje</p>
                                        <p className="text-xs text-gray-400">{vendasHoje.length} vendas totais</p>
                                    </div>
                                    <span className={`font-bold text-lg ${taxaCancelamento > 5 ? 'text-red-500' : 'text-green-500'}`}>
                                        {taxaCancelamento.toFixed(1)}%
                                    </span>
                                </div>

                                <div className="flex justify-between items-center bg-neutral-800 p-3 rounded-lg">
                                    <div>
                                        <p className="font-medium text-sm">Vendas com Desconto &gt;20%</p>
                                        <p className="text-xs text-gray-400">Risco de margem</p>
                                    </div>
                                    <span className="font-bold text-lg text-orange-500">{vendasComDesconto.length}</span>
                                </div>

                                {vendasCanceladas.slice(0, 3).map(v => (
                                    <div key={v.id} className="flex justify-between items-center bg-red-950/20 p-2 rounded-lg text-xs border-red-500/20">
                                        <p>#{v.id.slice(0,8)} Cancelada</p>
                                        <p className="font-bold text-red-400">{formatCurrency(v.total)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* LINHA 3: PRODUTOS COM VALIDADE */}
                    {produtosValidade.length > 0 && (
                        <div className="bg-neutral-900 rounded-xl p-3 md:p-4">
                            <h3 className="font-bold text-base mb-3 flex items-center gap-2">
                                <Flame size={16} className="text-orange-500" /> Produtos Próximos do Vencimento
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {produtosValidade.map(p => (
                                    <div key={p.id} className="bg-orange-950/20 border-orange-500/20 p-2 rounded-lg text-xs">
                                        <p className="font-medium truncate">{p.nome}</p>
                                        <p className="text-gray-400">Vence: {new Date(p.data_validade!).toLocaleDateString('pt-AO')}</p>
                                        <p className="font-bold">Est: {p.estoque}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    )
}
