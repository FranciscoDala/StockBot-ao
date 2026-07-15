"use client";
import { User, MapPin, Edit, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Ban, AlertTriangle } from "lucide-react";
import { Loja, userread, formatCurrency } from "../../page"; // <- REMOVI fetchComAuth daqui
import { useEffect, useState } from "react";

export function DadosTab({
    loja,
    user,
    lojaId,
    token
}: {
    loja: Loja | null | undefined;
    user: userread | null;
    lojaId?: string;
    token?: string | null;
}) {
    const [kpis, setKpis] = useState({
        vendaDiaria: 0,
        saidaDiaria: 0,
        totalVendasMes: 0,
        totalProdutos: 0,
        estoqueZerado: 0,
        riscoRuptura: 0
    });
    const [loading, setLoading] = useState(true);

    // FUNÇÃO ADICIONADA AQUI PRA NÃO QUEBRAR O BUILD
    const fetchComAuth = async (endpoint: string) => {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            cache: 'no-store'
        });
        if (!res.ok) throw new Error('Erro na requisição');
        return res.json();
    }

    // LIGADO COM API REAL
    useEffect(() => {
        if (!lojaId || !token) return;

        const carregarKPIs = async () => {
            setLoading(true);
            try {
                const resDia = await fetchComAuth(`/lojas/${lojaId}/dashboard/dia`);
                const resMes = await fetchComAuth(`/lojas/${lojaId}/dashboard/mes`);
                const resEstoque = await fetchComAuth(`/lojas/${lojaId}/dashboard/estoque-alertas`);

                setKpis({
                    vendaDiaria: resDia.venda_total || 0,
                    saidaDiaria: resDia.saida_total || 0,
                    totalProdutos: resDia.total_produtos_ativos || 0,
                    totalVendasMes: resMes.venda_total || 0,
                    estoqueZerado: resEstoque.estoque_zerado || 0,
                    riscoRuptura: resEstoque.risco_ruptura || 0
                })
            } catch (error) {
                console.error("Erro ao carregar KPIs", error);
            } finally {
                setLoading(false);
            }
        }
        carregarKPIs();
    }, [lojaId, token])

    const saldoDia = kpis.vendaDiaria - kpis.saidaDiaria;

    return (
        <div className="space-y-6">
            {/* HEADER PADRONIZADO */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold">Dados</h2>
                    <p className="text-xs sm:text-sm text-gray-400">Visão geral da loja</p>
                </div>
                <button className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-xs sm:text-sm font-bold transition">
                    <Edit size={14} />
                    Editar
                </button>
            </div>

            {/* 5 CARDS KPI ESTILO IMAGEM */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">

                {/* Card 1: Venda Diária */}
                <div className="bg-gradient-to-br from-green-950/40 to-neutral-900 p-4 rounded-xl border-green-900/30">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-300 font-medium">Venda Diária</p>
                        <DollarSign size={16} className="text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-green-400">{loading ? "..." : formatCurrency(kpis.vendaDiaria)}</p>
                    <p className="text-xs text-green-400/70 mt-1">Entradas de hoje</p>
                </div>

                {/* Card 2: Saída Diária */}
                <div className="bg-gradient-to-br from-red-950/40 to-neutral-900 p-4 rounded-xl border border-red-900/30"> {/* <- CORRIGI: faltava border */}
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-300 font-medium">Saída Diária</p>
                        <TrendingDown size={16} className="text-red-500" />
                    </div>
                    <p className="text-2xl font-bold text-red-400">{loading ? "..." : formatCurrency(kpis.saidaDiaria)}</p>
                    <p className="text-xs text-red-400/70 mt-1">Despesas + Compras</p>
                </div>

                {/* Card 3: Saldo do Dia */}
                <div className="bg-gradient-to-br from-blue-950/40 to-neutral-900 p-4 rounded-xl border border-blue-900/30">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-300 font-medium">Saldo do Dia</p>
                        <TrendingUp size={16} className={saldoDia >= 0 ? "text-blue-500" : "text-red-500"} />
                    </div>
                    <p className={`text-2xl font-bold ${saldoDia >= 0 ? "text-blue-400" : "text-red-400"}`}>
                        {loading ? "..." : formatCurrency(saldoDia)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Lucro do dia</p>
                </div>

                {/* Card 4: Estoque Zerado */}
                <div className="bg-gradient-to-br from-rose-950/40 to-neutral-900 p-4 rounded-xl border-rose-900/30"> {/* <- CORRIGI: faltava border */}
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-300 font-medium">Estoque Zerado</p>
                        <Ban size={16} className="text-rose-500" />
                    </div>
                    <p className="text-2xl font-bold text-rose-400">{loading ? "..." : kpis.estoqueZerado}</p>
                    <p className="text-xs text-rose-400/70 mt-1">Não consegue vender</p>
                </div>

                {/* Card 5: Risco Ruptura */}
                <div className="bg-gradient-to-br from-amber-950/40 to-neutral-900 p-4 rounded-xl border-amber-900/30">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-300 font-medium">Risco Ruptura</p>
                        <AlertTriangle size={16} className="text-amber-500" />
                    </div>
                    <p className="text-2xl font-bold text-amber-400">{loading ? "..." : kpis.riscoRuptura}</p>
                    <p className="text-xs text-amber-400/70 mt-1">Abaixo do mínimo</p>
                </div>
            </div>

            {/* GRID DE INFORMAÇÕES PADRONIZADO - SEM ALTERAR NADA */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-neutral-900 p-4 sm:p-6 rounded-xl border-neutral-800">
                    <h3 className="font-semibold mb-4 text-sm sm:text-base">Informações Base</h3>
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-gray-400">ID</p>
                            <p className="text-sm text-white break-all">{lojaId || "-"}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Slug</p>
                            <p className="text-sm text-white break-all">{loja?.slug || "-"}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">NIF</p>
                            <p className="text-sm text-white">{loja?.nif || "-"}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Ano Fundação</p>
                            <p className="text-sm text-white">{loja?.ano_fundacao || "-"}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-neutral-900 p-4 sm:p-6 rounded-xl border-neutral-800">
                    <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm sm:text-base">
                        <User size={16} /> Responsável
                    </h3>
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-gray-400">Nome</p>
                            <p className="text-sm text-white truncate">{user?.nome}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Email</p>
                            <p className="text-sm text-white truncate">{user?.email}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Nível</p>
                            <span className="text-xs px-2 py-1 bg-green-600 rounded-full font-medium">{user?.nivel}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-neutral-900 p-4 sm:p-6 rounded-xl border-neutral-800">
                    <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm sm:text-base">
                        <MapPin size={16} /> Localização
                    </h3>
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-gray-400">Endereço</p>
                            <p className="text-sm text-white">{loja?.endereco || "não informada"}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Telefone</p>
                            <p className="text-sm text-white">{loja?.telefone || "-"}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Status</p>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${loja?.is_active ? "bg-green-600" : "bg-gray-600"}`}>
                                {loja?.is_active ? "Ativa" : "Inativa"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* RESUMO MENSAL ESTILO IMAGEM */}
            <div className="bg-gradient-to-br from-amber-950/40 to-neutral-900 p-4 sm:p-6 rounded-xl border-amber-900/30"> {/* <- CORRIGI: faltava border */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-300 font-medium">Resumo do Mês</p>
                        <p className="text-3xl font-bold text-amber-400 mt-1">{loading ? "..." : formatCurrency(kpis.totalVendasMes)}</p>
                        <p className="text-xs text-amber-400/70 mt-1">Total vendido nos últimos 30 dias</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
