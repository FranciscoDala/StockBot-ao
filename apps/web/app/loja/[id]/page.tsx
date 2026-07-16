"use client";
import { useEffect, useState, FormEvent, useMemo, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { LogOut, FileText, BarChart3, ShieldAlert, Store, Users, Package, Truck, ShoppingCart, Menu, X, Settings } from "lucide-react";
import { toast, Toaster } from "sonner";
import { z } from "zod";
import { DadosTab } from "./_components/tabs/DadosTab";
import { ProdutosTab } from "./_components/tabs/ProdutosTab";
import { EquipaTab } from "./_components/tabs/EquipaTab";
import { VendaTab } from "./_components/tabs/VendaTab";
import { EstatisticasTab } from "./_components/tabs/EstatisticasTab";
import { RiscoTab } from "./_components/tabs/RiscoTab";
import { FornecedoresTab } from "./_components/tabs/FornecedoresTab";
import { DocumentosTab } from "./_components/tabs/DocumentosTab";
import { DefinicoesTab } from "./_components/tabs/DefinicoesTab";
import { PermissaoModal } from "./_components/modals/PermissaoModal";
import { ErroModal } from "./_components/modals/ErroModal";
import { DetalhesModal } from "./_components/modals/DetalhesModal";
import { UserModal } from "./_components/modals/UserModal";
import { ProdutoModal, Produto } from "./_components/modals/ProdutoModal";
import { ConfirmarModal } from "./_components/modals/ConfirmacaoModal"; // <-- corrigi nome
import { VendaSucessoModal } from "./_components/modals/VendaSucessoModal";

const ItemVendaSchema = z.object({ produto_id: z.union([z.string(), z.number()]), quantidade: z.number().int().positive(), preco_unitario: z.number(), subtotal: z.number(), nome: z.string().optional() });
const VendaSchema = z.object({ id: z.union([z.string(), z.number()]), total: z.number(), total_itens: z.number(), forma_pagamento: z.string(), valor_pago: z.number().optional(), troco: z.number().optional(), data_venda: z.string().optional(), itens: z.array(ItemVendaSchema).optional(), loja_id: z.string().optional() });
const ProdutoSchema = z.object({ id: z.union([z.string(), z.number()]).transform(String), nome: z.string(), sku: z.string(), preco: z.number(), preco_custo: z.number(), preco_venda: z.number().optional(), estoque: z.number(), estoque_minimo: z.number(), is_active: z.boolean(), loja_id: z.string(), descricao: z.string().optional(), codigo_barras: z.string().optional().nullable(), marca: z.string().optional(), categoria_id: z.union([z.string(), z.number()]).optional().nullable(), unidade: z.string(), localizacao: z.string().optional(), fornecedor_id: z.union([z.string(), z.number()]).optional().nullable(), data_validade: z.string().optional(), ncm: z.string().optional(), peso_kg: z.number().optional().nullable(), imagem_url: z.string().optional() });

export type ItemVenda = z.infer<typeof ItemVendaSchema>;
export type Venda = z.infer<typeof VendaSchema>;
export type ProdutoType = z.infer<typeof ProdutoSchema>;
export type CarrinhoItem = ProdutoType & { quantidade: number };
export type UserRole = "DONO" | "GERENTE" | "VENDEDOR" | "CAIXA" | "ESTOQUISTA" | "ADMIN";

export type UsuarioLojaPage = { id: string; nome: string; email: string; telefone?: string | null; role: UserRole; is_active: boolean; }
export type UsuarioLoja = { id: string; nome: string; email: string; telefone?: string; role: UserRole; is_active: boolean; }
export type userread = { id: string; nome: string; email: string; nivel: UserRole; loja?: Loja | null; loja_id?: string | null; }
export type Loja = { id: string; nome: string; slug: string; is_active: boolean; created_at: string; endereco?: string | null; logo_url?: string | null; nif?: string | null; telefone?: string | null; ano_fundacao?: number | null; }

const formatError = (data: any): string => { if (!data) return "Erro desconhecido"; if (typeof data.detail === 'string') return data.detail; if (Array.isArray(data.detail)) return data.detail.map((d: any) => d.msg).join(", "); return "Erro ao processar requisição"; }
export const formatCurrency = (value: number) => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);
const getCookie = (name: string): string | undefined => { if (typeof window === "undefined") return undefined; return document.cookie.split('; ').reduce((r, v) => { const parts = v.split('='); return parts[0] === name? decodeURIComponent(parts[1]) : r; }, ''); };
const deleteCookie = (name: string) => { if (typeof window === "undefined") return; document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; Secure; SameSite=None`; };
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
const fetchComAuth = async (url: string, token: string, options: RequestInit = {}) => {
    const res = await fetch(url, {...options, headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}`,...options.headers }, credentials: 'include', cache: "no-store" });
    if (!res.ok) { if (res.status === 401) throw new Error("UNAUTHORIZED"); const errorData = await res.json().catch(() => ({})); console.error("API ERROR:", res.status, errorData); throw new Error(errorData.detail || res.statusText); }
    if (res.status === 204) { return true; } return await res.json();
}

export default function LojaPage() {
    const router = useRouter(); const params = useParams(); const lojaId = params.id as string;
    const [isClient, setIsClient] = useState(false); const [user, setUser] = useState<userread | null>(null); const [token, setToken] = useState<string | null>(null); const [loading, setLoading] = useState(true); const [loja, setLoja] = useState<Loja | null>(null);
    const [menuMobileOpen, setMenuMobileOpen] = useState(false);

    const podeEditarApagar = ["DONO", "GERENTE"].includes(user?.nivel!);
    const podeVerTudo = ["ADMIN", "DONO", "GERENTE"].includes(user?.nivel!);
    const podeVerVendas = ["DONO", "GERENTE", "VENDEDOR", "CAIXA"].includes(user?.nivel!);
    const podeVerEstoque = ["DONO", "GERENTE", "ESTOQUISTA"].includes(user?.nivel!);

    const allTabs = [
        { id: "dados", label: "Dados", icon: FileText, show: true },
        { id: "venda", label: "Venda", icon: ShoppingCart, show: podeVerVendas },
        { id: "produtos", label: "Produtos", icon: Package, show: podeVerVendas || podeVerEstoque },
        { id: "equipa", label: "Equipa", icon: Users, show: true },
        { id: "fornecedores", label: "Fornecedores", icon: Truck, show: podeVerTudo },
        { id: "documentos", label: "Documentos", icon: FileText, show: podeVerTudo },
        { id: "estatisticas", label: "Estatisticas", icon: BarChart3, show: true },
        { id: "risco", label: "Risco", icon: ShieldAlert, show: podeVerTudo },
        { id: "definicoes", label: "Definições", icon: Settings, show: podeVerTudo },
    ];
    const initialTabs = allTabs.filter(t => t.show);
    const [activeTab, setActiveTab] = useState(initialTabs[0]?.id || "dados");

        const [equipa, setEquipa] = useState<UsuarioLojaPage[]>([]); const [editingUser, setEditingUser] = useState<UsuarioLoja | null>(null);
    const [formDataUser, setFormDataUser] = useState({ nome: "", email: "", senha: "", telefone: "", role: "VENDEDOR" as UserRole, is_active: true });
    const [detalhesUser, setDetalhesUser] = useState<any>(null); const [produtos, setProdutos] = useState<ProdutoType[]>([]); const [vendas, setVendas] = useState<Venda[]>([]); const [carrinho, setCarrinho] = useState<CarrinhoItem[]>([]); const [editingProduto, setEditingProduto] = useState<ProdutoType | null>(null);
    const [formDataProduto, setFormDataProduto] = useState<any>({ nome: "", sku: "", preco: 0, preco_custo: 0, estoque: 0, estoque_minimo: 5, is_active: true, loja_id: "", descricao: "", codigo_barras: null, marca: "", categoria_id: null, unidade: "UN", localizacao: "", fornecedor_id: null, data_validade: "", ncm: "", peso_kg: 0, imagem_url: "" });
    const [showModal, setShowModal] = useState(false); const [modalType, setModalType] = useState<'user' | 'produto'>('user'); const [saving, setSaving] = useState(false); const [errorMsg, setErrorMsg] = useState("");
    const [showPermissaoModal, setShowPermissaoModal] = useState(false); const [showErroModal, setShowErroModal] = useState(false); const [erroMsgPermissao, setErroMsgPermissao] = useState(""); const [showDetalhesModal, setShowDetalhesModal] = useState(false);
    const [showConfirmarModal, setShowConfirmarModal] = useState(false); const [itemParaRemover, setItemParaRemover] = useState<CarrinhoItem | null>(null); const [busca, setBusca] = useState(""); const [formaPagamento, setFormaPagamento] = useState("Dinheiro"); const [valorRecebido, setValorRecebido] = useState(""); const [showConfirmarFinalizar, setShowConfirmarFinalizar] = useState(false); const [loadingVenda, setLoadingVenda] = useState(false);

    const [acaoPendente, setAcaoPendente] = useState<{
        tipo: 'editar' | 'apagar' | 'adicionar';
        entidade: 'user' | 'produto';
        descricao: string;
        data?: UsuarioLojaPage | ProdutoType;
    } | null>(null);

    const [showVendaSucessoModal, setShowVendaSucessoModal] = useState(false); const [vendaConcluida, setVendaConcluida] = useState<Venda | null>(null); const [ws, setWs] = useState<WebSocket | null>(null);

    //... todas as funções fetch, handle, etc continuam iguais...

    if (!isClient || loading) return (
        <div className="flex items-center justify-center min-h-screen bg-black">
            <div
                className="animate-spin rounded-full h-12 w-12 border-b-2"
                style={{borderColor: 'var(--cor-primaria)'}}
            ></div>
        </div>
    );

    return <>
        <style jsx global>{`
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>

        <Toaster position="top-center" richColors theme="dark" />
        {activeTab === "venda"? <div className="fixed inset-0 z-40 bg-black"><VendaTab {...{ produtos, carrinho, busca, setBusca, formaPagamento, setFormaPagamento, valorRecebido, setValorRecebido, subtotal, totalItens, troco, podeFinalizar, adicionarAoCarrinho, confirmarRemoverItem, handleFinalizar, showConfirmarModal, setShowConfirmarModal, itemParaRemover, handleConfirmarRemocao, showConfirmarFinalizar, setShowConfirmarFinalizar, executarFinalizarVenda, loadingVenda, formatCurrency, onClose: () => { setActiveTab(initialTabs[0].id); setCarrinho([]) }, token, lojaId, nomeLoja: loja?.nome || "PDV", nifLoja: `NIF: ${loja?.nif || ""}`, enderecoLoja: loja?.endereco || "" }} /></div> :
            <div className="min-h-screen bg-black text-white">
                <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-6">

                    <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            <div
                                className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-neutral-800 flex items-center justify-center text-lg sm:text-xl font-bold shrink-0"
                                style={{color: 'var(--cor-primaria)'}}
                            >
                                <Store />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold truncate">{loja?.nome || "Sem loja"}</h1>
                                <p className="text-xs sm:text-xs text-gray-400 truncate">{loja?.endereco}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <span
                                className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-xs font-medium"
                                style={{
                                    backgroundColor: loja?.is_active? 'var(--cor-primaria)' : '#4b5563'
                                }}
                            >
                                {loja?.is_active? "ativa" : "inativa"}
                            </span>
                            <button
                                onClick={handleSair}
                                className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-red-600 rounded-lg text-xs sm:text-xs font-bold flex items-center gap-1.5 hover:bg-red-700 transition"
                                style={{borderRadius: 'var(--radius)'}}
                            >
                                <LogOut size={14} className="sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">Sair</span>
                            </button>
                        </div>
                    </div>

                    <div className="mb-4 sm:mb-6">
                        <div
                            className="bg-neutral-900 p-1 overflow-x-auto scrollbar-hide touch-pan-x"
                            style={{borderRadius: 'var(--radius)'}}
                        >
                            <div className="flex gap-1 w-max min-w-full">
                                {initialTabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => { setActiveTab(tab.id); setMenuMobileOpen(false) }}
                                        className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 text-xs sm:text-sm font-medium whitespace-nowrap transition"
                                        style={{
                                            backgroundColor: activeTab === tab.id? 'var(--cor-primaria)' : 'transparent',
                                            color: activeTab === tab.id? 'white' : '#9ca3af',
                                            borderRadius: 'var(--radius)'
                                        }}
                                    >
                                        <tab.icon size={14} className="sm:w-4 sm:h-4" />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pb-8">
                        {activeTab === "dados" && <DadosTab loja={loja} user={user} />}
                        {activeTab === "produtos" && (podeVerVendas || podeVerEstoque) && <ProdutosTab produtos={produtos} isAdmin={podeEditarApagar} isDono={["DONO"].includes(user?.nivel!)} lojaId={lojaId} onAdd={podeEditarApagar? handleAddProdutoClick : () => toast.error("Apenas Dono/Gerente")} onEdit={podeEditarApagar? handleEditProdutoClick : () => toast.error("Apenas Dono/Gerente")} onDelete={podeEditarApagar? handleDeleteProdutoClick : () => toast.error("Apenas Dono/Gerente")} formatCurrency={formatCurrency} />}
                        {activeTab === "equipa" && <EquipaTab equipa={equipa} isAdmin={podeEditarApagar} isDono={["DONO"].includes(user?.nivel!)} lojaId={lojaId} onAdd={podeEditarApagar? handleAddUserClick : () => toast.error("Apenas Dono/Gerente")} onEdit={podeEditarApagar? handleEditUserClick : () => toast.error("Apenas Dono/Gerente")} onDelete={podeEditarApagar? handleDeleteUserClick : () => toast.error("Apenas Dono/Gerente")} onView={handleViewUserClick} />}
                        {activeTab === "estatisticas" && <EstatisticasTab lojaId={lojaId} token={token} formatCurrency={formatCurrency} nomeLoja={loja?.nome || "MINHA LOJA"} nifLoja={`NIF: ${loja?.nif || ""}`} enderecoLoja={loja?.endereco || ""} />}

                        {activeTab === "risco" && podeVerTudo && <RiscoTab vendas={vendasParaRisco as any} produtos={produtos} formatCurrency={formatCurrency} />}

                        {activeTab === "fornecedores" && podeVerTudo && <FornecedoresTab />}
                        {activeTab === "documentos" && podeVerTudo && <DocumentosTab loja={loja} />}
                        {activeTab === "definicoes" && podeVerTudo && <DefinicoesTab />}

                        {!["dados", "venda", "produtos", "equipa", "estatisticas", "risco", "fornecedores", "documentos", "definicoes"].includes(activeTab) && <div className="bg-neutral-900 p-4 sm:p-6 rounded-xl text-center text-gray-400 text-sm">Em breve: {allTabs.find(t => t.id === activeTab)?.label}</div>}
                    </div>

                </div>

                <UserModal open={showModal && modalType === 'user'} onOpenChange={(v) => { if (!saving) setShowModal(v) }} editingUser={editingUser} formData={formDataUser} setFormData={setFormDataUser} onSave={handleSave} saving={saving} errorMsg={errorMsg} lojaNome={loja?.nome} />
                <ProdutoModal open={showModal && modalType === 'produto'} onOpenChange={(v) => { if (!saving) setShowModal(v) }} editingProduto={editingProduto} formData={formDataProduto} setFormData={setFormDataProduto} onSave={handleSave} saving={saving} errorMsg={errorMsg} />
                <PermissaoModal open={showPermissaoModal} onClose={() => { setShowPermissaoModal(false); setAcaoPendente(null) }} onConfirm={executarAcaoComSenha} titulo={acaoPendente?.tipo === 'editar'? "Confirmar Edição" : "Confirmar Exclusão"} loading={saving} />
                <ErroModal open={showErroModal} onClose={() => setShowErroModal(false)} mensagem={erroMsgPermissao} />
                <DetalhesModal open={showDetalhesModal} onClose={() => setShowDetalhesModal(false)} dados={detalhesUser} />

                <ConfirmarModal
                    open={showConfirmarModal}
                    onClose={() => { setShowConfirmarModal(false); setItemParaRemover(null) }}
                    onConfirm={handleConfirmarRemocao}
                    titulo="Remover do Carrinho"
                    descricao={`Deseja remover ${itemParaRemover?.nome} do carrinho?`}
                    loading={false}
                    tipo="venda"
                />

            </div>
        }

        <VendaSucessoModal open={showVendaSucessoModal} onClose={() => { setShowVendaSucessoModal(false); setVendaConcluida(null) }} venda={vendaConcluida} formatCurrency={formatCurrency} loja_nome={loja?.nome || ""} loja_nif={loja?.nif || ""} loja_endereco={loja?.endereco || ""} loja_telefone={loja?.telefone || ""} loja_logo={loja?.logo_url || ""} />
    </>;
}
