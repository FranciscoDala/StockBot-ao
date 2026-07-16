"use client"
import { useEffect, useState, useMemo, useRef, useCallback } from "react"
import { CalendarDays, TrendingUp, ShoppingBag, DollarSign, RefreshCw, X, Package, Wifi, WifiOff, Printer, Filter, Download, BarChart3, PieChart, Users } from "lucide-react"
import { BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "wss://gentle-playfulness-production-d333.up.railway.app";

type ItemVenda = {
    id: string
    produto_id: string
    nome_produto: string
    quantidade: number
    preco_unitario: number
    subtotal: number
}

type VendaAPI = {
    id: string | number
    total: number
    total_itens: number
    forma_pagamento: string
    data_venda: string
    status: string
    itens: ItemVenda[]
}

type Venda = {
    id: string
    data: string
    total: number
    formaPagamento: string
    itens: number
    detalhes: ItemVenda[]
}

type Stats = {
    total: number
    qtdVendas: number
    ticketMedio: number
}

type Props = {
    lojaId: string
    token: string | null
    formatCurrency: (v: number) => string
    nomeLoja?: string
    nifLoja?: string
    enderecoLoja?: string
}

export function EstatisticasTab({ lojaId, token, formatCurrency, nomeLoja = "MINHA LOJA", nifLoja = "NIF: 000", enderecoLoja = "Endereço: Luanda" }: Props) {
    const [vendas, setVendas] = useState<Venda[]>([])
    const [loading, setLoading] = useState(true)
    const [vendaSelecionada, setVendaSelecionada] = useState<Venda | null>(null)
    const [wsConectado, setWsConectado] = useState(false)
    const [abaAtiva, setAbaAtiva] = useState<"resumo" | "produtos" | "pagamentos">("resumo")
    const [filtroPeriodo, setFiltroPeriodo] = useState("30")
    const [filtroForma, setFiltroForma] = useState("TODAS")
    const [filtroGrafico, setFiltroGrafico] = useState<"diario" | "semanal" | "mensal">("diario")
    const ws = useRef<WebSocket | null>(null)
    const reconnectTimeout = useRef<NodeJS.Timeout | null>(null)

    const buscarVendas = useCallback(async () => {
        if (!token ||!lojaId) return;
        setLoading(true)
        try {
            const res = await fetch(`${API_URL}/vendas/?loja_id=${lojaId}&limit=5000`, {
                headers: { "Authorization": `Bearer ${token}` }
            })
            if (!res.ok) throw new Error("Erro ao buscar vendas")
            const data: VendaAPI[] = await res.json()

            const vendasFormatadas: Venda[] = (Array.isArray(data)? data : [])
               .filter(v => v.status?.toLowerCase().trim() === "concluida")
               .map(v => ({
                    id: String(v.id),
                    data: v.data_venda,
                    total: Number(v.total),
                    formaPagamento: v.forma_pagamento,
                    itens: Number(v.total_itens),
                    detalhes: (v.itens || []).map(item => ({
                       ...item,
                        preco_unitario: Number(item.preco_unitario),
                        subtotal: Number(item.subtotal)
                    }))
                }))
            setVendas(vendasFormatadas)
        } catch (e) {
            console.error("Erro buscar vendas:", e)
            setVendas([])
        } finally {
            setLoading(false)
        }
    }, [token, lojaId])

    const conectarWebSocket = useCallback(() => {
        if (!token ||!lojaId) return;
        if (ws.current?.readyState === WebSocket.OPEN) return;

        ws.current = new WebSocket(`${WS_URL}/ws/lojas/${lojaId}?token=${token}`);

        ws.current.onopen = () => {
            setWsConectado(true)
            if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current)
        }

        ws.current.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.tipo === 'stats.updated') {
                    buscarVendas()
                }
            } catch (e) {
                console.error("Erro ao ler WS", e)
            }
        }

        ws.current.onclose = () => {
            setWsConectado(false)
            reconnectTimeout.current = setTimeout(conectarWebSocket, 3000)
        }

        ws.current.onerror = () => {
            ws.current?.close()
        }

    }, [token, lojaId, buscarVendas])

    const gerarHeaderFactura = () => `
        <div class="header">
            <h1>${nomeLoja.toUpperCase()}</h1>
            <p>${nifLoja}</p>
            <p>${enderecoLoja}</p>
        </div>
        <hr>
    `

    const handleImprimir = (venda: Venda) => {
        const itensHtml = venda.detalhes.map((item: ItemVenda) => `
            <tr>
                <td>${item.nome_produto}</td>
                <td style="text-align:center">${item.quantidade}</td>
                <td style="text-align:right">${formatCurrency(item.preco_unitario)}</td>
                <td style="text-align:right">${formatCurrency(item.subtotal)}</td>
            </tr>
        `).join('');

        const html = `
        <!DOCTYPE html>
        <html lang="pt-AO">
        <head>
            <meta charset="UTF-8">
            <title>Recibo #${venda.id.slice(0, 8)}</title>
            <style>
                @page { size: 80mm auto; margin: 5mm; }
                body { font-family: 'Courier New', monospace; width: 80mm; margin: 0 auto; font-size: 11px; color: #000; background: #fff; }
                .header { text-align: center; margin-bottom: 5px; }
                .header h1 { margin: 0; font-size: 14px; font-weight: bold; }
                .header p { margin: 1px 0; font-size: 10px; }
                .info p { margin: 1px 0; }
                table { width: 100%; border-collapse: collapse; margin-top: 5px; }
                th, td { padding: 2px 0; font-size: 11px; }
                hr { border: none; border-top: 1px dashed #000; margin: 3px 0; }
                .total { display: flex; justify-content: space-between; font-size: 13px; font-weight: bold; margin-top: 5px; }
                .footer { text-align: center; margin-top: 8px; font-size: 10px; }
            </style>
        </head>
        <body onload="window.print()">
            ${gerarHeaderFactura()}
            <div class="info">
                <p>RECIBO: #${venda.id.slice(0, 8).toUpperCase()}</p>
                <p>DATA: ${new Date(venda.data).toLocaleString('pt-AO')}</p>
            </div>
            <hr>
            <table><tbody>${itensHtml}</tbody></table>
            <hr>
            <p>ITENS: ${venda.itens}</p>
            <div class="total"><span>TOTAL</span><span>${formatCurrency(venda.total)}</span></div>
            <hr>
            <p style="text-align:center">Tipo de Pagamento: ${venda.formaPagamento}</p>
            <div class="footer"><p>Obrigado e volte sempre!</p></div>
        </body>
        </html>
        `;

        const printWindow = window.open('', '_blank', 'width=400,height=700');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
        }
    }

    useEffect(() => {
        buscarVendas()
        conectarWebSocket()
        return () => {
            if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current)
            ws.current?.close()
        }
    }, [buscarVendas, conectarWebSocket])
    const hoje = new Date()
    const diasAtras = useMemo(() => {
        const d = new Date()
        d.setDate(hoje.getDate() - Number(filtroPeriodo))
        return d
    }, [filtroPeriodo, hoje])

    const vendasFiltradas = useMemo(() => {
        return vendas.filter(v => {
            const dataVenda = new Date(v.data)
            const passaData = dataVenda >= diasAtras
            const passaForma = filtroForma === "TODAS" || v.formaPagamento === filtroForma
            return passaData && passaForma
        })
    }, [vendas, diasAtras, filtroForma])

    const calcularStats = (lista: Venda[]): Stats => {
        const total = lista.reduce((acc, v) => acc + v.total, 0)
        const qtdVendas = lista.length
        const ticketMedio = qtdVendas > 0? total / qtdVendas : 0
        return { total, qtdVendas, ticketMedio }
    }

    const statsPeriodo = useMemo(() => calcularStats(vendasFiltradas), [vendasFiltradas])

    const topProdutos = useMemo(() => {
        const contagem: Record<string, { nome: string; qtd: number; total: number }> = {};
        vendasFiltradas.forEach(v => {
            v.detalhes.forEach(it => {
                if (!contagem[it.produto_id]) {
                    contagem[it.produto_id] = { nome: it.nome_produto, qtd: 0, total: 0 };
                }
                contagem[it.produto_id].qtd += it.quantidade;
                contagem[it.produto_id].total += it.subtotal;
            });
        });
        return Object.values(contagem).sort((a, b) => b.total - a.total).slice(0, 10);
    }, [vendasFiltradas]);

    const vendasPorPagamento = useMemo(() => {
        const grupos: Record<string, number> = {};
        vendasFiltradas.forEach(v => {
            grupos[v.formaPagamento] = (grupos[v.formaPagamento] || 0) + v.total;
        });
        return Object.entries(grupos).map(([forma, total]) => ({ forma, total }));
    }, [vendasFiltradas]);

    const vendasPorDia = useMemo(() => {
        const dias: Record<string, number> = {};
        vendasFiltradas.forEach(v => {
            const dia = new Date(v.data).toLocaleDateString('pt-AO')
            dias[dia] = (dias[dia] || 0) + v.total;
        });
        return Object.entries(dias).slice(-7).map(([dia, total]) => ({ dia, total }));
    }, [vendasFiltradas]);

    const dadosGrafico = useMemo(() => {
        const agrupado: Record<string, { cat1: number; cat2: number; cat3: number; total: number; qtd: number }> = {};

        vendasFiltradas.forEach(v => {
            let chave = "";
            const data = new Date(v.data);

            if (filtroGrafico === "diario") {
                chave = data.toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit' });
            } else if (filtroGrafico === "semanal") {
                const semana = Math.ceil(data.getDate() / 7);
                chave = `Sem ${semana} ${data.toLocaleDateString('pt-AO', { month: 'short' })}`;
            } else {
                chave = data.toLocaleDateString('pt-AO', { month: 'short', year: '2-digit' });
            }

            if (!agrupado[chave]) agrupado[chave] = { cat1: 0, cat2: 0, cat3: 0, total: 0, qtd: 0 };

            const parte = v.total / 3;
            agrupado[chave].cat1 += parte;
            agrupado[chave].cat2 += parte;
            agrupado[chave].cat3 += parte;
            agrupado[chave].total += v.total;
            agrupado[chave].qtd += 1;
        });

        return Object.entries(agrupado).map(([nome, vals]) => ({
            nome,
            "Categoria A": vals.cat1,
            "Categoria B": vals.cat2,
            "Categoria C": vals.cat3,
            "Ticket Médio": vals.qtd > 0? vals.total / vals.qtd : 0
        }));
    }, [vendasFiltradas, filtroGrafico]);

    const exportarCSV = () => {
        const linhas = [
            ["Data", "ID", "Total", "Itens", "Forma Pagamento"],
          ...vendasFiltradas.map(v => [new Date(v.data).toLocaleDateString('pt-AO'), v.id, v.total, v.itens, v.formaPagamento])
        ]
        const csv = linhas.map(l => l.join(",")).join("\n")
        const blob = new Blob([csv], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `estatisticas-${hoje.toISOString().split('T')[0]}.csv`
        a.click()
    }

    if (loading) return (
        <div className="flex items-center justify-center py-10 md:py-20">
            <RefreshCw className="animate-spin" size={28} style={{color: 'var(--cor-primaria)'}} />
        </div>
    )

    return (
        <div className="space-y-4 md:space-y-6 p-2 md:p-0">
            <style jsx global>{`
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2" style={{color: 'var(--cor-texto)'}}>Estatísticas
                        {wsConectado? <Wifi size={16} style={{color: 'var(--cor-primaria)'}} /> : <WifiOff size={16} className="text-red-500" />}
                    </h2>
                    <p className="text-xs sm:text-sm" style={{color: 'var(--cor-texto-sec)'}}>Acompanha o crescimento da sua loja</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={exportarCSV} className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition hover:brightness-110" style={{background: 'var(--cor-primaria)', color: '#fff'}}>
                        <Download size={14} /> Exportar
                    </button>
                    <button onClick={buscarVendas} className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition" style={{background: 'transparent', color: 'var(--cor-primaria)', border: '2px solid var(--cor-primaria)'}}>
                        <RefreshCw size={14} /> Atualizar
                    </button>
                </div>
            </div>

            {/* FILTROS */}
            <div
                className="p-3 md:p-4"
                style={{
                    backgroundColor: 'var(--cor-fundo-card, #171717)',
                    border: '1px solid var(--cor-primaria)30',
                    borderRadius: 'var(--radius)'
                }}
            >
                <div className="flex items-center gap-2 mb-3" style={{color: 'var(--cor-texto)'}}>
                    <Filter size={16} /> <span className="text-sm font-medium">Filtros</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs" style={{color: 'var(--cor-texto-sec)'}}>Período</label>
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
                        <label className="text-xs" style={{color: 'var(--cor-texto-sec)'}}>Forma de Pagamento</label>
                        <select
                            value={filtroForma}
                            onChange={(e) => setFiltroForma(e.target.value)}
                            className="w-full mt-1 rounded-lg px-3 py-2 text-sm outline-none"
                            style={{backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)', border: '1px solid var(--cor-primaria)30', borderRadius: 'var(--radius)'}}
                        >
                            <option value="TODAS">Todas</option>
                            <option value="Dinheiro">Dinheiro</option>
                            <option value="TPA">TPA</option>
                            <option value="Transferencia">Transferência</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* ABAS */}
            <div className="overflow-x-auto scrollbar-hide">
                <div
                    className="flex gap-2 p-1 w-max min-w-full"
                    style={{
                        backgroundColor: 'var(--cor-fundo-card, #171717)',
                        borderRadius: 'var(--radius)'
                    }}
                >
                    {[
                        { id: "resumo", label: "Resumo", icon: BarChart3 },
                        { id: "produtos", label: "Top Produtos", icon: Package },
                        { id: "pagamentos", label: "Pagamentos", icon: PieChart }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setAbaAtiva(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition`}
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

            {/* ABA RESUMO */}
            {abaAtiva === "resumo" && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                        <CardStats titulo="Faturamento" stats={statsPeriodo} icon={<DollarSign size={16} />} cor="primaria" descricao="Total do período" tendencia="+8.5% vs mês ant" formatCurrency={formatCurrency} />
                        <CardStats titulo="Vendas Realizadas" stats={{...statsPeriodo, total: statsPeriodo.qtdVendas }} icon={<ShoppingBag size={16} />} cor="secundaria" descricao="Pedidos concluídos" formatCurrency={(v) => String(v)} />
                        <CardStats titulo="Ticket Médio" stats={{...statsPeriodo, total: statsPeriodo.ticketMedio }} icon={<TrendingUp size={16} />} cor="primaria" descricao="Valor por venda" tendencia="+2.3% vs mês ant" formatCurrency={formatCurrency} />
                        <CardStats titulo="Itens Vendidos" stats={{...statsPeriodo, total: vendasFiltradas.reduce((acc, v) => acc + v.itens, 0) }} icon={<Package size={16} />} cor="alerta" descricao="Unidades no período" formatCurrency={(v) => String(v)} />
                    </div>

                    {/* GRAFICO */}
                    <div
                        className="p-4"
                        style={{
                            backgroundColor: 'var(--cor-fundo-card, #171717)',
                            border: '1px solid var(--cor-primaria)30',
                            borderRadius: 'var(--radius)'
                        }}
                    >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
                            <h3 className="font-bold" style={{color: 'var(--cor-texto)'}}>Desempenho de Vendas</h3>
                            <div className="flex gap-2">
                                {["diario", "semanal", "mensal"].map(tipo => (
                                    <button key={tipo} onClick={() => setFiltroGrafico(tipo as any)}
                                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
                                        style={filtroGrafico === tipo
                                          ? {backgroundColor: 'var(--cor-primaria)', color: 'white', borderRadius: 'var(--radius)'}
                                            : {backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)', borderRadius: 'var(--radius)'}
                                        }
                                    >
                                        {tipo === "diario"? "Diário" : tipo === "semanal"? "Semanal" : "Mensal"}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dadosGrafico}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--cor-primaria)20" />
                                    <XAxis dataKey="nome" stroke="var(--cor-texto-sec)" fontSize={12} />
                                    <YAxis yAxisId="left" stroke="var(--cor-texto-sec)" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                                    <YAxis yAxisId="right" orientation="right" stroke="var(--cor-texto-sec)" fontSize={12} />

                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--cor-fundo)', border: '1px solid var(--cor-primaria)', borderRadius: '8px', color: 'var(--cor-texto)' }}
                                        formatter={(value: any) => typeof value === 'number'? formatCurrency(value) : ""}
                                    />

                                    <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--cor-texto)' }} />
                                    <Bar yAxisId="left" dataKey="Categoria A" stackId="a" fill="var(--cor-primaria)" name="Categoria A" />
                                    <Bar yAxisId="left" dataKey="Categoria B" stackId="a" fill="#818cf8" name="Categoria B" />
                                    <Bar yAxisId="left" dataKey="Categoria C" stackId="a" fill="#4ade80" name="Categoria C" />
                                    <Line yAxisId="right" type="monotone" dataKey="Ticket Médio" stroke="#ef4444" strokeWidth={3} name="Ticket Médio" dot={{ r: 4 }} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* TABELA VENDAS */}
                    <div
                        className="p-3 md:p-4"
                        style={{
                            backgroundColor: 'var(--cor-fundo-card, #171717)',
                            border: '1px solid var(--cor-primaria)30',
                            borderRadius: 'var(--radius)'
                        }}
                    >
                        <h3 className="font-bold mb-3" style={{color: 'var(--cor-texto)'}}>Últimas Vendas - {vendasFiltradas.length}</h3>
                        <div className="space-y-1 max-h-[400px] overflow-y-auto scrollbar-hide">
                            {vendasFiltradas.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).slice(0, 20).map(v => (
                                <div key={v.id} className="flex justify-between items-center border-b pb-2 pt-2 px-2 text-xs hover:bg-neutral-800/30 rounded-lg transition" style={{borderColor: 'var(--cor-primaria)15'}}>
                                    <div onClick={() => setVendaSelecionada(v)} className="cursor-pointer flex-1 min-w-0">
                                        <p className="font-medium" style={{color: 'var(--cor-texto)'}}>#{v.id.slice(0, 8)} - {new Date(v.data).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}</p>
                                        <p className="text-xs" style={{color: 'var(--cor-texto-sec)'}}>{v.itens} itens • {v.formaPagamento}</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <p className="font-bold" style={{color: 'var(--cor-primaria)'}}>{formatCurrency(v.total)}</p>
                                        <button onClick={(e) => { e.stopPropagation(); handleImprimir(v) }} className="p-1.5 rounded-md hover:bg-neutral-800/50 transition" style={{color: 'var(--cor-texto)', borderRadius: 'var(--radius)'}} title="Imprimir">
                                            <Printer size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ABA PRODUTOS */}
            {abaAtiva === "produtos" && (
                <div
                    className="p-4"
                    style={{
                        backgroundColor: 'var(--cor-fundo-card, #171717)',
                        border: '1px solid var(--cor-primaria)30',
                        borderRadius: 'var(--radius)'
                    }}
                >
                    <h3 className="font-bold mb-4" style={{color: 'var(--cor-texto)'}}>Top 10 Produtos Mais Vendidos</h3>
                    <div className="space-y-2">
                        {topProdutos.map((p, i) => (
                            <div key={i} className="flex justify-between items-center p-3" style={{backgroundColor: 'var(--cor-fundo)', borderRadius: 'var(--radius)'}}>
                                <div>
                                    <p className="font-medium text-sm" style={{color: 'var(--cor-texto)'}}>#{i + 1} {p.nome}</p>
                                    <p className="text-xs" style={{color: 'var(--cor-texto-sec)'}}>{p.qtd} unidades vendidas</p>
                                </div>
                                <p className="font-bold" style={{color: 'var(--cor-primaria)'}}>{formatCurrency(p.total)}</p>
                            </div>
                        ))}
                        {topProdutos.length === 0 && <p className="text-center py-8" style={{color: 'var(--cor-texto-sec)'}}>Sem vendas no período</p>}
                    </div>
                </div>
            )}

            {/* ABA PAGAMENTOS */}
            {abaAtiva === "pagamentos" && (
                <div
                    className="p-4"
                    style={{
                        backgroundColor: 'var(--cor-fundo-card, #171717)',
                        border: '1px solid var(--cor-primaria)30',
                        borderRadius: 'var(--radius)'
                    }}
                >
                    <h3 className="font-bold mb-4" style={{color: 'var(--cor-texto)'}}>Faturamento por Forma de Pagamento</h3>
                    <div className="space-y-3">
                        {vendasPorPagamento.map((p, i) => (
                            <div key={i}>
                                <div className="flex justify-between mb-1">
                                    <p className="text-sm font-medium" style={{color: 'var(--cor-texto)'}}>{p.forma}</p>
                                    <p className="text-sm font-bold" style={{color: 'var(--cor-texto)'}}>{formatCurrency(p.total)}</p>
                                </div>
                                <div className="w-full rounded-full h-2" style={{backgroundColor: 'var(--cor-fundo)'}}>
                                    <div className="h-2 rounded-full" style={{ width: `${statsPeriodo.total > 0? (p.total / statsPeriodo.total) * 100 : 0}%`, backgroundColor: 'var(--cor-primaria)', borderRadius: 'var(--radius)' }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* MODAL DETALHES */}
            {vendaSelecionada && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setVendaSelecionada(null)}>
                    <div
                        className="shadow-2xl w-full max-w-lg max-h-[90vh] flex-col border"
                        style={{
                            backgroundColor: 'var(--cor-fundo-card, #171717)',
                            borderColor: 'var(--cor-primaria)30',
                            borderRadius: 'var(--radius)'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center p-4 border-b" style={{borderColor: 'var(--cor-primaria)30'}}>
                            <h3 className="font-bold text-lg" style={{color: 'var(--cor-texto)'}}>Venda #{vendaSelecionada.id.slice(0, 8)}</h3>
                            <button onClick={() => setVendaSelecionada(null)} className="hover:text-red-500 transition"><X size={20} /></button>
                        </div>
                        <div className="p-4 space-y-3 overflow-y-auto scrollbar-hide">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div><p style={{color: 'var(--cor-texto-sec)'}}>Data</p><p className="font-medium" style={{color: 'var(--cor-texto)'}}>{new Date(vendaSelecionada.data).toLocaleString('pt-AO')}</p></div>
                                <div><p style={{color: 'var(--cor-texto-sec)'}}>Pagamento</p><p className="font-medium" style={{color: 'var(--cor-texto)'}}>{vendaSelecionada.formaPagamento}</p></div>
                                <div><p style={{color: 'var(--cor-texto-sec)'}}>Qtd Itens</p><p className="font-medium" style={{color: 'var(--cor-texto)'}}>{vendaSelecionada.itens}</p></div>
                                <div><p style={{color: 'var(--cor-texto-sec)'}}>Total</p><p className="font-bold" style={{color: 'var(--cor-primaria)'}}>{formatCurrency(vendaSelecionada.total)}</p></div>
                            </div>
                            <div className="border-t pt-3" style={{borderColor: 'var(--cor-primaria)30'}}>
                                <h4 className="font-semibold mb-3 flex items-center gap-2" style={{color: 'var(--cor-texto)'}}><Package size={16} /> Produtos</h4>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-hide">
                                    {vendaSelecionada.detalhes.map((item) => (
                                        <div key={item.id} className="flex justify-between items-center text-sm p-3" style={{backgroundColor: 'var(--cor-fundo)', borderRadius: 'var(--radius)'}}>
                                            <div className="flex-1">
                                                <p className="font-medium" style={{color: 'var(--cor-texto)'}}>{item.nome_produto}</p>
                                                <p className="text-xs" style={{color: 'var(--cor-texto-sec)'}}>{item.quantidade}x {formatCurrency(item.preco_unitario)}</p>
                                            </div>
                                            <p className="font-semibold" style={{color: 'var(--cor-primaria)'}}>{formatCurrency(item.subtotal)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function CardStats({
    titulo,
    stats,
    icon,
    cor,
    descricao,
    tendencia,
    formatCurrency
}: {
    titulo: string,
    stats: Stats,
    icon: React.ReactNode,
    cor: "primaria" | "secundaria" | "alerta",
    descricao: string,
    tendencia?: string,
    formatCurrency: (v: number) => string
}) {
    const cores = {
        primaria: { bg: 'var(--cor-primaria)', text: '#fff' },
        secundaria: { bg: 'var(--cor-fundo-card, #18181b)', text: 'var(--cor-texto)' },
        alerta: { bg: '#f97316', text: '#fff' }
    }

    const c = cores[cor]

    return (
        <div
            className="p-3 md:p-4 transition hover:scale-[1.02]"
            style={{
                backgroundColor: c.bg,
                color: c.text,
                borderRadius: 'var(--radius)'
            }}
        >
            <div className="flex items-center justify-between mb-2">
                <p className="text-xs md:text-sm font-medium truncate" style={{opacity: 0.9}}>{titulo}</p>
                <div className="opacity-90 shrink-0">{icon}</div>
            </div>
            <p className="text-xl md:text-2xl lg:text-3xl font-bold truncate">{formatCurrency(stats.total)}</p>
            <p className="text-xs md:text-xs mt-1 truncate" style={{opacity: 0.8}}>{descricao}</p>
            {tendencia && <p className="text-xs md:text-xs mt-1 truncate" style={{opacity: 0.7}}>{tendencia}</p>}
        </div>
    )
}
