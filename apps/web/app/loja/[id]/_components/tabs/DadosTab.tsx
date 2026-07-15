"use client";
import { User, MapPin, Edit, TrendingUp, TrendingDown, DollarSign, ShoppingCart } from "lucide-react";
import { Loja, userread, formatCurrency } from "../../page";
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
        totalProdutos: 0
    });

    // TODO: depois tu liga isso com a API real
    useEffect(() => {
        // mock pra já ver como fica. Troca pelo fetchComAuth quando quiser
        setKpis({
            vendaDiaria: 45230.50,
            saidaDiaria: 12800.00,
            totalVendasMes: 890450.00,
            totalProdutos: 342
        })
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

            {/* CARDS KPI ESTILO RISCOTAB */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-neutral-900 p-4 rounded-xl border-neutral-800">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-400">Venda Diária</p>
                        <DollarSign size={16} className="text-green-500" />
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-green-500">{formatCurrency(kpis.vendaDiaria)}</p>
                    <p className="text-xs text-gray-500 mt-1">Hoje</p>
                </div>

                <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-400">Saída Diária</p>
                        <TrendingDown size={16} className="text-red-500" />
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-red-500">{formatCurrency(kpis.saidaDiaria)}</p>
                    <p className="text-xs text-gray-500 mt-1">Despesas + Compras</p>
                </div>

                <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-400">Saldo do Dia</p>
                        <TrendingUp size={16} className={saldoDia >= 0 ? "text-green-500" : "text-red-500"} />
                    </div>
                    <p className={`text-lg sm:text-xl font-bold ${saldoDia >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {formatCurrency(saldoDia)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Lucro do dia</p>
                </div>

                <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-400">Produtos Ativos</p>
                        <ShoppingCart size={16} className="text-blue-500" />
                    </div>
                    <p className="text-lg sm:text-xl font-bold">{kpis.totalProdutos}</p>
                    <p className="text-xs text-gray-500 mt-1">Em estoque</p>
                </div>
            </div>

            {/* GRID DE INFORMAÇÕES PADRONIZADO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-neutral-900 p-4 sm:p-6 rounded-xl border border-neutral-800">
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

                <div className="bg-neutral-900 p-4 sm:p-6 rounded-xl border border-neutral-800">
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

            {/* RESUMO MENSAL */}
            <div className="bg-neutral-900 p-4 sm:p-6 rounded-xl border-neutral-800">
                <h3 className="font-semibold mb-4 text-sm sm:text-base">Resumo do Mês</h3>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-400">Total Vendido</p>
                        <p className="text-xl sm:text-2xl font-bold text-green-500">{formatCurrency(kpis.totalVendasMes)}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
