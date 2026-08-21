"use client"
import { useMemo, useState } from "react"
import { FileText, Search, Download, Printer, Ban, CheckCircle2, AlertTriangle, QrCode, Building2 } from "lucide-react"

type ItemVenda = {
    id: string
    nome_produto: string
    quantidade: number
    preco_unitario: number
    subtotal: number
}

type VendaAGT = {
    id: string
    data: string
    total: number
    formaPagamento: string
    detalhes: ItemVenda[]
    status?: string
    cliente_nome?: string
    cliente_nif?: string
    cliente_endereco?: string
    serie?: string
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
}

function CardInfo({ titulo, valor, sub, icon, cor, cardStyle, cardSize }: any) {
    const radius = cardStyle === 'arredondado'? '16px' : '8px';
    const padding = cardSize === 'grande'? '20px' : '16px';
    return (
        <div
            className="transition hover:scale-[1.02]"
            style={{
                background: 'color-mix(in srgb, var(--cor-card) 75%, transparent)',
                backdropFilter: 'blur(12px)',
                border: 'none',
                borderRadius: radius,
                padding,
                boxShadow: `0 0 25px color-mix(in srgb, ${cor} 20%, transparent)`
            }}
        >
            <div className="flex items-center justify-between mb-2">
                <p className="text-xs md:text-sm font-medium" style={{ color: 'var(--cor-texto-sec)' }}>{titulo}</p>
                <div style={{ color: cor }}>{icon}</div>
            </div>
            <p className="text-xl md:text-2xl lg:text-3xl font-bold" style={{ color: 'var(--cor-texto)' }}>{valor}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--cor-texto-sec)' }}>{sub}</p>
        </div>
    )
}

export function FacturacaoTab({ loja, vendas, formatCurrency, theme, cardStyle, cardSize }: Props) {
    const [busca, setBusca] = useState("")
    const [filtro, setFiltro] = useState<"todas" | "agt" | "anuladas">("todas")

    const radius = cardStyle === 'arredondado'? '16px' : '8px';
    const padding = cardSize === 'grande'? '24px' : '16px';

    const vendasFiltradas = useMemo(() => vendas.filter(v => {
        const passaBusca =
            v.id.toLowerCase().includes(busca.toLowerCase()) ||
            v.cliente_nome?.toLowerCase().includes(busca.toLowerCase()) ||
            v.cliente_nif?.includes(busca)
        const passaFiltro =
            filtro === "todas"? true :
            filtro === "agt"?!!v.cliente_nif :
            filtro === "anuladas"? v.status === "anulada" : true
        return passaBusca && passaFiltro
    }), [vendas, busca, filtro])

    const totalFacturado = useMemo(() => vendasFiltradas.filter(v => v.status!== "anulada").reduce((acc, v) => acc + v.total, 0), [vendasFiltradas])
    const totalAGT = useMemo(() => vendasFiltradas.filter(v => v.cliente_nif && v.status!== "anulada").length, [vendasFiltradas])
    const totalAnuladas = useMemo(() => vendasFiltradas.filter(v => v.status === "anulada").length, [vendasFiltradas])

    const exportarLivro = () => {
        const linhas = [
            ["Data", "Nº Factura", "Cliente", "NIF", "Total", "Status"],
           ...vendasFiltradas.map(v => [
                new Date(v.data).toLocaleDateString('pt-AO'),
                v.serie || `FT ${v.id.slice(0,8)}`,
                v.cliente_nome || "Consumidor Final",
                v.cliente_nif || "-",
                v.total,
                v.status || "Emitida"
            ])
        ]
        const csv = linhas.map(l => l.join(",")).join("\n")
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `livro-vendas-agt-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
    }

    const imprimirFactura = (v: VendaAGT) => {
        const w = window.open('', '_blank', 'width=800,height=1000')
        if (!w) return
        const html = `
        <html>
        <head><title>Factura ${v.id}</title>
        <style>
            body{font-family:Arial; padding:20px; color:#000}
           .header{display:flex; justify-content:space-between; border-bottom:2px solid #000; padding-bottom:10px}
           .dados{margin:20px 0}
            table{width:100%; border-collapse:collapse; margin:20px 0}
            th,td{border:1px solid #ccc; padding:8px; text-align:left}
            th{background:#f0f0f0}
           .total{text-align:right; font-weight:bold; font-size:18px}
           .footer{margin-top:30px; font-size:10px; text-align:center}
        </style>
        </head>
        <body>
            <div class="header">
                <div>
                    <h2>${loja?.nome || "MINHA LOJA"}</h2>
                    <p>NIF: ${loja?.nif || ""}</p>
                    <p>${loja?.endereco || ""}</p>
                </div>
                <div>
                    <h3>FACTURA-RECIBO</h3>
                    <p>Nº: ${v.serie || `FT 001/2026/${v.id.slice(0,6)}`}</p>
                    <p>Data: ${new Date(v.data).toLocaleDateString('pt-AO')}</p>
                </div>
            </div>
            <div class="dados">
                <b>Cliente:</b> ${v.cliente_nome || "Consumidor Final"}<br/>
                <b>NIF:</b> ${v.cliente_nif || "-"}<br/>
                <b>Endereço:</b> ${v.cliente_endereco || "-"}
            </div>
            <table>
                <thead><tr><th>Produto</th><th>Qtd</th><th>P.Unit</th><th>Total</th></tr></thead>
                <tbody>
                    ${v.detalhes.map(i => `<tr><td>${i.nome_produto}</td><td>${i.quantidade}</td><td>${formatCurrency(i.preco_unitario)}</td><td>${formatCurrency(i.subtotal)}</td></tr>`).join("")}
                </tbody>
            </table>
            <div class="total">TOTAL: ${formatCurrency(v.total)}</div>
            <div class="total">IVA 14%: ${formatCurrency(v.total * 0.14 / 1.14)}</div>
            <div class="footer">
                Processado por programa certificado StockBot<br/>
                IVA incluído à taxa legal de 14%
            </div>
        </body></html>`
        w.document.write(html)
        w.document.close()
        w.print()
    }

    return (
        <div className="space-y-4 md:space-y-6">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--cor-texto)' }}>
                        Facturação AGT <FileText size={18} style={{ color: 'var(--cor-primaria)' }} />
                    </h2>
                    <p className="text-xs sm:text-sm" style={{ color: 'var(--cor-texto-sec)' }}>Emissão e gestão de facturas conforme AGT</p>
                </div>
                <button
                    onClick={exportarLivro}
                    className="w-full md:w-auto flex items-center justify-center gap-2 font-semibold transition hover:brightness-110 text-sm h-10 px-4"
                    style={{ background: 'var(--cor-primaria)', color: '#fff', borderRadius: radius }}
                >
                    <Download size={16} /> Exportar Livro AGT
                </button>
            </div>

            {/* CARDS RESUMO */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                <CardInfo titulo="Total Facturado" valor={formatCurrency(totalFacturado)} sub="No período" icon={<FileText size={16} />} cor="var(--cor-primaria)" cardStyle={cardStyle} cardSize={cardSize} />
                <CardInfo titulo="Facturas AGT" valor={totalAGT} sub="Com NIF" icon={<Building2 size={16} />} cor="#3b82f6" cardStyle={cardStyle} cardSize={cardSize} />
                <CardInfo titulo="Anuladas" valor={totalAnuladas} sub="Notas de crédito" icon={<Ban size={16} />} cor="#ef4444" cardStyle={cardStyle} cardSize={cardSize} />
            </div>

            {/* FILTROS */}
            <div style={{ backgroundColor: 'var(--cor-card)', border: '1px solid var(--cor-primaria)30', borderRadius: radius, padding }}>
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                        <Search size={14} className="absolute left-3 top-2.5" style={{ color: 'var(--cor-texto-sec)' }} />
                        <input
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            placeholder="Buscar por Nº, Nome ou NIF..."
                            className="w-full rounded-lg pl-9 pr-3 py-2 text-sm outline-none"
                            style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)', border: '1px solid var(--cor-primaria)30', borderRadius: radius }}
                        />
                    </div>
                    <select
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value as any)}
                        className="w-full sm:w-48 rounded-lg px-3 py-2 text-sm outline-none"
                        style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)', border: '1px solid var(--cor-primaria)30', borderRadius: radius }}
                    >
                        <option value="todas">Todas Facturas</option>
                        <option value="agt">Apenas AGT</option>
                        <option value="anuladas">Anuladas</option>
                    </select>
                </div>
            </div>

            {/* TABELA/LISTA */}
            <div style={{ backgroundColor: 'var(--cor-card)', border: '1px solid var(--cor-primaria)30', borderRadius: radius, padding }}>
                <h3 className="font-bold text-base mb-3" style={{ color: 'var(--cor-texto)' }}>Livro de Vendas</h3>

                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--cor-primaria)30' }}>
                                <th className="text-left py-2 px-2">Data</th>
                                <th className="text-left py-2 px-2">Nº Factura</th>
                                <th className="text-left py-2 px-2">Cliente</th>
                                <th className="text-left py-2 px-2">NIF</th>
                                <th className="text-right py-2 px-2">Total</th>
                                <th className="text-center py-2 px-2">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vendasFiltradas.slice(0, 20).map(v => (
                                <tr key={v.id} style={{ borderBottom: '1px solid var(--cor-primaria)15' }}>
                                    <td className="py-2 px-2">{new Date(v.data).toLocaleDateString('pt-AO')}</td>
                                    <td className="py-2 px-2 font-mono text-xs">{v.serie || `FT ${v.id.slice(0,8)}`}</td>
                                    <td className="py-2 px-2">{v.cliente_nome || "Consumidor Final"}</td>
                                    <td className="py-2 px-2">{v.cliente_nif || "-"}</td>
                                    <td className="py-2 px-2 text-right font-bold">{formatCurrency(v.total)}</td>
                                    <td className="py-2 px-2">
                                        <div className="flex gap-2 justify-center">
                                            <button onClick={() => imprimirFactura(v)} className="p-1.5 rounded" style={{ background: 'var(--cor-primaria)20' }}><Printer size={14} /></button>
                                            {v.status!== "anulada" && <button className="p-1.5 rounded" style={{ background: '#ef444420' }}><Ban size={14} color="#ef4444" /></button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden space-y-2 max-h-[500px] overflow-y-auto">
                    {vendasFiltradas.slice(0, 20).map(v => (
                        <div key={v.id} className="p-3" style={{ backgroundColor: 'var(--cor-fundo)', borderRadius: radius }}>
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-bold text-sm">{v.serie || `FT ${v.id.slice(0,8)}`}</p>
                                    <p className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>{new Date(v.data).toLocaleDateString('pt-AO')}</p>
                                </div>
                                <p className="font-bold">{formatCurrency(v.total)}</p>
                            </div>
                            <p className="text-xs font-medium">{v.cliente_nome || "Consumidor Final"}</p>
                            <p className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>NIF: {v.cliente_nif || "-"}</p>
                            <div className="flex gap-2 mt-2">
                                <button onClick={() => imprimirFactura(v)} className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded" style={{ background: 'var(--cor-primaria)' }}>
                                    <Printer size={12} /> Imprimir
                                </button>
                                {v.status!== "anulada" && <button className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded" style={{ background: '#ef4444' }}>
                                    <Ban size={12} /> Anular
                                </button>}
                            </div>
                        </div>
                    ))}
                    {vendasFiltradas.length === 0 && <p className="text-center py-8 text-sm" style={{ color: 'var(--cor-texto-sec)' }}>Nenhuma factura encontrada</p>}
                </div>
            </div>

            <div className="text-xs text-center" style={{ color: 'var(--cor-texto-sec)' }}>
                <QrCode size={12} className="inline mr-1" /> Todas as facturas devem conter QR Code e numeração sequencial conforme AGT
            </div>
        </div>
    )
}
