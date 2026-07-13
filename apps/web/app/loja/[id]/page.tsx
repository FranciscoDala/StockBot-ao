"use client";
import { useEffect, useState, FormEvent, useMemo, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { LogOut, FileText, BarChart3, ShieldAlert, Store, Users, Package, Truck, ShoppingCart } from "lucide-react";
import { toast, Toaster } from "sonner";
import { z } from "zod";
import { DadosTab } from "./_components/tabs/DadosTab";
import { ProdutosTab } from "./_components/tabs/ProdutosTab";
import { EquipaTab } from "./_components/tabs/EquipaTab";
import { VendaTab } from "./_components/tabs/VendaTab";
import { PermissaoModal } from "./_components/modals/PermissaoModal";
import { ErroModal } from "./_components/modals/ErroModal";
import { DetalhesModal } from "./_components/modals/DetalhesModal";
import { UserModal } from "./_components/modals/UserModal";
import { ProdutoModal, Produto } from "./_components/modals/ProdutoModal";
import { ConfirmarModal } from "./_components/modals/ConfirmacaoModal";
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
const getCookie = (name: string): string | undefined => { if (typeof window === "undefined") return undefined; return document.cookie.split('; ').reduce((r, v) => { const parts = v.split('='); return parts[0] === name ? decodeURIComponent(parts[1]) : r; }, ''); };
const deleteCookie = (name: string) => { if (typeof window === "undefined") return; document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; Secure; SameSite=None`; };
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
const fetchComAuth = async (url: string, token: string, options: RequestInit = {}) => {
    const res = await fetch(url, { ...options, headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}`, ...options.headers }, credentials: 'include', cache: "no-store" });
    if (!res.ok) { if (res.status === 401) throw new Error("UNAUTHORIZED"); const errorText = await res.text(); try { throw new Error(formatError(JSON.parse(errorText))); } catch { throw new Error(errorText || res.statusText); } }
    if (res.status === 204) { return true; } return await res.json();
}

export default function LojaPage() {
    const router = useRouter(); const params = useParams(); const lojaId = params.id as string;
    const [isClient, setIsClient] = useState(false); const [user, setUser] = useState<userread | null>(null); const [token, setToken] = useState<string | null>(null); const [loading, setLoading] = useState(true); const [loja, setLoja] = useState<Loja | null>(null);

    // AJUSTE DAS PERMISSOES
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
    ];
    const initialTabs = allTabs.filter(t => t.show);
    const [activeTab, setActiveTab] = useState(initialTabs[0]?.id || "dados");

    const [equipa, setEquipa] = useState<UsuarioLojaPage[]>([]); const [editingUser, setEditingUser] = useState<UsuarioLoja | null>(null);
    const [formDataUser, setFormDataUser] = useState({ nome: "", email: "", senha: "", telefone: "", role: "VENDEDOR" as UserRole, is_active: true });
    const [detalhesUser, setDetalhesUser] = useState<any>(null); const [produtos, setProdutos] = useState<ProdutoType[]>([]); const [carrinho, setCarrinho] = useState<CarrinhoItem[]>([]); const [editingProduto, setEditingProduto] = useState<ProdutoType | null>(null);
    const [formDataProduto, setFormDataProduto] = useState<any>({ nome: "", sku: "", preco: 0, preco_custo: 0, estoque: 0, estoque_minimo: 5, is_active: true, loja_id: "", descricao: "", codigo_barras: null, marca: "", categoria_id: null, unidade: "UN", localizacao: "", fornecedor_id: null, data_validade: "", ncm: "", peso_kg: 0, imagem_url: "" });
    const [showModal, setShowModal] = useState(false); const [modalType, setModalType] = useState<'user' | 'produto'>('user'); const [saving, setSaving] = useState(false); const [errorMsg, setErrorMsg] = useState("");
    const [showPermissaoModal, setShowPermissaoModal] = useState(false); const [showErroModal, setShowErroModal] = useState(false); const [erroMsgPermissao, setErroMsgPermissao] = useState(""); const [showDetalhesModal, setShowDetalhesModal] = useState(false);
    const [showConfirmarModal, setShowConfirmarModal] = useState(false); const [itemParaRemover, setItemParaRemover] = useState<CarrinhoItem | null>(null); const [busca, setBusca] = useState(""); const [formaPagamento, setFormaPagamento] = useState("Dinheiro"); const [valorRecebido, setValorRecebido] = useState(""); const [showConfirmarFinalizar, setShowConfirmarFinalizar] = useState(false); const [loadingVenda, setLoadingVenda] = useState(false);

    const [acaoPendente, setAcaoPendente] = useState<{
        tipo: 'editar' | 'apagar' | 'adicionar';
        entidade: 'user' | 'produto';
        descricao: string; // <- ADICIONA ISSO
        data?: UsuarioLojaPage | ProdutoType;
    } | null>(null);


    const [showVendaSucessoModal, setShowVendaSucessoModal] = useState(false); const [vendaConcluida, setVendaConcluida] = useState<Venda | null>(null); const [ws, setWs] = useState<WebSocket | null>(null);

    const handleSair = () => { deleteCookie("token"); deleteCookie("user"); router.replace("/login"); };

    const fetchEquipa = async (currentToken: string) => {
        if (!currentToken || !lojaId) return;
        try {
            const data = await fetchComAuth(`${API_URL}/lojas/id/${lojaId}/usuarios`, currentToken);
            const equipaFormatada: UsuarioLojaPage[] = Array.isArray(data)
                ? data
                    .filter((u: any) => String(u.role).toUpperCase() !== "ADMIN") // <- CORRIGIDO: filtra ADMIN e converte pra MAIUSCULO
                    .map((u: any) => ({ ...u, role: String(u.role).toUpperCase() as UserRole }))
                : [];
            setEquipa(equipaFormatada);
        } catch (e) { setEquipa([]) }
    };

    const fetchProdutos = useCallback(async (currentToken: string, lojaId: string) => { if (!currentToken || !lojaId) { setProdutos([]); return; } try { const data = await fetchComAuth(`${API_URL}/produtos?loja_id=${lojaId}`, currentToken); setProdutos(z.array(ProdutoSchema).parse(data)); } catch (e) { console.error(e); setProdutos([]); toast.error("Erro ao validar produtos"); } }, []);
    const fetchLoja = useCallback(async (currentToken: string) => { if (!currentToken || !lojaId) return; try { setLoja(await fetchComAuth(`${API_URL}/lojas/id/${lojaId}`, currentToken)); } catch (e) { console.error("Erro ao buscar loja:", e); setLoja(null); } }, [lojaId]);

    useEffect(() => {
        setIsClient(true); const currentToken = getCookie("token"); const userStr = getCookie("user"); setToken(currentToken || null);
        if (!currentToken || !userStr) { handleSair(); return; } try {
            const userData: userread = JSON.parse(userStr); if (userData.loja_id !== lojaId) { handleSair(); return; } setUser(userData);
            const loadData = async () => { setLoading(true); await Promise.all([fetchLoja(currentToken), fetchEquipa(currentToken), fetchProdutos(currentToken, userData.loja_id || "")]); setLoading(false); }
            loadData();
        } catch (err) { handleSair(); }
    }, [router, lojaId, fetchProdutos, fetchLoja]);

    useEffect(() => {
        if (!token || !lojaId) return; const WS_URL = process.env.NEXT_PUBLIC_WS_URL; const socket = new WebSocket(`${WS_URL}/ws/lojas/${lojaId}?token=${token}`); socket.onopen = () => setWs(socket);
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data); if (data.tipo === "stock.updated") {
                setProdutos(prev => prev.map(p => String(p.id) === String(data.produto_id) ? { ...p, estoque: data.novo_estoque } : p));
                setCarrinho(prev => { const novo = prev.map(item => String(item.id) === String(data.produto_id) ? { ...item, estoque: data.novo_estoque } : item); return novo.map(item => item.quantidade > item.estoque ? { ...item, quantidade: item.estoque } : item).filter(item => item.quantidade > 0); });
                toast.info(`Estoque: ${data.nome_produto} -> ${data.novo_estoque}`);
            }
        };
        socket.onclose = () => { setWs(null); setTimeout(() => { if (token && lojaId) setWs(null); }, 3000); }; return () => socket.close();
    }, [token, lojaId]);

    const getPreco = (item: CarrinhoItem) => item.preco || 0;
    const subtotal = useMemo(() => carrinho.reduce((acc, item) => acc + (getPreco(item) * item.quantidade), 0), [carrinho]);
    const totalItens = useMemo(() => carrinho.reduce((acc, item) => acc + item.quantidade, 0), [carrinho]);
    const troco = useMemo(() => formaPagamento === "Dinheiro" && Number(valorRecebido) > subtotal ? Number(valorRecebido) - subtotal : 0, [formaPagamento, valorRecebido, subtotal]);
    const podeFinalizar = useMemo(() => carrinho.length > 0 && (formaPagamento !== "Dinheiro" || Number(valorRecebido) >= subtotal && subtotal > 0), [carrinho, formaPagamento, valorRecebido, subtotal]);
    const adicionarAoCarrinho = (produto: ProdutoType) => { if ((produto.estoque ?? 0) <= 0) { toast.error("Sem estoque"); return; } setCarrinho(prev => { const item = prev.find(i => String(i.id) === String(produto.id)); if (item) { if (item.quantidade + 1 > (produto.estoque ?? 0)) { toast.warning("Estoque max"); return prev; } return prev.map(i => String(i.id) === String(produto.id) ? { ...i, quantidade: i.quantidade + 1 } : i); } return [...prev, { ...produto, quantidade: 1 }]; }); };
    const confirmarRemoverItem = (item: CarrinhoItem) => { setItemParaRemover(item); setShowConfirmarModal(true); };
    const handleConfirmarRemocao = () => { if (itemParaRemover) { setCarrinho(prev => prev.filter(i => i.id !== itemParaRemover.id)); toast.success("Removido"); } setShowConfirmarModal(false); setItemParaRemover(null); };
    const handleFinalizar = useCallback(() => { if (podeFinalizar) setShowConfirmarFinalizar(true); }, [podeFinalizar]);

    const executarFinalizarVenda = async () => {
        if (!token) return; setLoadingVenda(true); setShowConfirmarFinalizar(false); try {
            const itensPayload = carrinho.map(i => ({ produto_id: String(i.id), quantidade: Number(i.quantidade), preco_unitario: Number(getPreco(i)), subtotal: Number(getPreco(i) * i.quantidade) }));
            const payload = { total: Number(subtotal), total_itens: Number(totalItens), forma_pagamento: formaPagamento, valor_pago: formaPagamento === "Dinheiro" ? Number(valorRecebido) : Number(subtotal), troco: Number(troco), loja_id: user?.loja_id || "", itens: itensPayload };
            const vendaSalva = await fetchComAuth(`${API_URL}/vendas/`, token, { method: "POST", body: JSON.stringify(payload) });
            const vendaParaModal: Venda = { id: vendaSalva.id, ...payload, data_venda: vendaSalva.data_venda || new Date().toISOString(), itens: itensPayload.map(i => ({ ...i, nome: carrinho.find(c => String(c.id) === i.produto_id)?.nome })) };
            setVendaConcluida(VendaSchema.parse(vendaParaModal)); setShowVendaSucessoModal(true); setCarrinho([]); setValorRecebido(""); fetchProdutos(token, user?.loja_id || "");
        } catch (err: any) { toast.error(err.message || "Erro ao finalizar"); setShowConfirmarFinalizar(true); } finally { setLoadingVenda(false); }
    };

    const openModal = (type: 'user' | 'produto', data: UsuarioLoja | ProdutoType | null = null) => {
        setErrorMsg(""); setModalType(type);
        if (type === 'user') { setEditingUser(data as UsuarioLoja | null); setFormDataUser({ nome: (data as UsuarioLoja)?.nome || "", email: (data as UsuarioLoja)?.email || "", senha: "", telefone: (data as UsuarioLoja)?.telefone || "", role: ((data as UsuarioLoja)?.role?.toUpperCase() as UserRole) || "VENDEDOR", is_active: (data as UsuarioLoja)?.is_active ?? true }); }
        else { setEditingProduto(data as ProdutoType | null); setFormDataProduto({ ...formDataProduto, nome: (data as ProdutoType)?.nome || "", sku: (data as ProdutoType)?.sku || "", preco: (data as ProdutoType)?.preco || 0, preco_custo: (data as ProdutoType)?.preco_custo || 0, estoque: (data as ProdutoType)?.estoque || 0, loja_id: (data as ProdutoType)?.loja_id || user?.loja_id || "" }); }
        setShowModal(true);
    };

    const handleAddUserClick = () => { setAcaoPendente({ tipo: 'adicionar', entidade: 'user' }); openModal('user'); }
    const handleEditUserClick = (u: UsuarioLojaPage) => { setAcaoPendente({ tipo: 'editar', entidade: 'user', data: u }); openModal('user', { ...u, telefone: u.telefone ?? undefined }); }
    const handleDeleteUserClick = (u: UsuarioLojaPage) => { setAcaoPendente({ tipo: 'apagar', entidade: 'user', data: u }); setShowPermissaoModal(true); }
    const handleViewUserClick = async (u: UsuarioLojaPage) => { if (!token || !lojaId) return; try { setDetalhesUser(await fetchComAuth(`${API_URL}/lojas/id/${lojaId}/usuarios/${u.id}/detalhes`, token)); setShowDetalhesModal(true); } catch (e) { } }
    const handleAddProdutoClick = () => { setAcaoPendente({ tipo: 'adicionar', entidade: 'produto' }); openModal('produto'); }
    const handleEditProdutoClick = (p: ProdutoType) => { setAcaoPendente({ tipo: 'editar', entidade: 'produto', data: p }); openModal('produto', p); }
    const handleDeleteProdutoClick = (p: ProdutoType) => { setAcaoPendente({ tipo: 'apagar', entidade: 'produto', data: p }); setShowPermissaoModal(true); }

    const executarAcaoComSenha = async (senha_dono: string) => {
        if (!acaoPendente || !token) return; setSaving(true); setShowPermissaoModal(false); const { tipo, entidade, data } = acaoPendente; try {
            if (entidade === 'user') {
                if (tipo === 'adicionar') { await fetchComAuth(`${API_URL}/lojas/id/${lojaId}/usuarios`, token, { method: "POST", body: JSON.stringify({ ...formDataUser, senha: formDataUser.senha, senha_confirmacao: formDataUser.senha }) }); await fetchEquipa(token); toast.success("Adicionado!"); }
                if (tipo === 'editar' && data) { await fetchComAuth(`${API_URL}/lojas/id/${lojaId}/usuarios/${(data as UsuarioLojaPage).id}`, token, { method: "PUT", body: JSON.stringify({ ...formDataUser, senha_dono: senha_dono, senha_confirmacao: senha_dono }) }); await fetchEquipa(token); toast.success("Atualizado!"); }
                if (tipo === 'apagar' && data) { await fetchComAuth(`${API_URL}/lojas/id/${lojaId}/usuarios/${(data as UsuarioLojaPage).id}`, token, { method: "DELETE", body: JSON.stringify({ senha_dono: senha_dono, senha_confirmacao: senha_dono }) }); await fetchEquipa(token); toast.success("Removido!"); }
            }
            if (entidade === 'produto') {
                const loja_id = user?.loja_id || ""; const payload = { ...(data || formDataProduto), senha_dono, senha_confirmacao: senha_dono, loja_id: (data as ProdutoType)?.loja_id || loja_id };
                if (tipo === 'editar' && !payload.codigo_barras) delete payload.codigo_barras;
                if (tipo === 'adicionar') { await fetchComAuth(`${API_URL}/produtos`, token, { method: "POST", body: JSON.stringify(payload) }); }
                if (tipo === 'editar' && editingProduto) { await fetchComAuth(`${API_URL}/produtos/${editingProduto.id}`, token, { method: "PATCH", body: JSON.stringify(payload) }); }
                if (tipo === 'apagar' && editingProduto) { await fetchComAuth(`${API_URL}/produtos/${editingProduto.id}`, token, { method: "DELETE", body: JSON.stringify({ senha_dono, senha_confirmacao: senha_dono, loja_id: editingProduto.loja_id }) }); }
                await fetchProdutos(token, loja_id);
            }
            setShowModal(false); toast.success("Sucesso!")
        } catch (err: any) { setErroMsgPermissao(err.message.includes("senha") ? "Senha incorreta" : err.message.includes("403") ? "Sem permissão" : err.message); setShowErroModal(true); if (acaoPendente?.tipo === 'editar') setShowModal(true); } finally { setAcaoPendente(null); setSaving(false); }
    }

    const handleSave = async (payload: any) => {
        if (payload?.preventDefault) payload.preventDefault(); const data = payload?.target ? formDataProduto : payload; if (!token || !lojaId) return; setSaving(true); setErrorMsg("");
        try {
            if (modalType === 'user') { if (!formDataUser.nome.trim() || !formDataUser.email.trim()) { setErrorMsg("Preencha nome e email"); setSaving(false); return; } if (!editingUser && !formDataUser.senha.trim()) { setErrorMsg("Senha obrigatória"); setSaving(false); return; } setShowModal(false); setAcaoPendente({ tipo: editingUser ? 'editar' : 'adicionar', entidade: 'user' }); setShowPermissaoModal(true); setSaving(false); return; }
            if (modalType === 'produto') { if (!data.nome.trim() || data.preco <= 0) { setErrorMsg("Nome e preco > 0"); setSaving(false); return; } setShowModal(false); setAcaoPendente({ tipo: editingProduto ? 'editar' : 'adicionar', entidade: 'produto', data: data }); setShowPermissaoModal(true); setSaving(false); return; }
        } catch (err: any) { setErrorMsg(err.message); setSaving(false); }
    };

    if (!isClient || loading) return <div className="flex items-center justify-center min-h-screen bg-black"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div></div>;

    return <>
        <Toaster position="top-center" richColors theme="dark" />
        {activeTab === "venda" ? <div className="fixed inset-0 z-40 bg-black"><VendaTab {...{ produtos, carrinho, busca, setBusca, formaPagamento, setFormaPagamento, valorRecebido, setValorRecebido, subtotal, totalItens, troco, podeFinalizar, adicionarAoCarrinho, confirmarRemoverItem, handleFinalizar, showConfirmarModal, setShowConfirmarModal, itemParaRemover, handleConfirmarRemocao, showConfirmarFinalizar, setShowConfirmarFinalizar, executarFinalizarVenda, loadingVenda, formatCurrency, onClose: () => { setActiveTab(initialTabs[0].id); setCarrinho([]) }, token, lojaId, nomeLoja: loja?.nome || "PDV" }} /></div> :
            <div className="min-h-screen bg-black text-white p-3 sm:p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3"><div className="h-12 w-12 rounded-full bg-neutral-800 flex items-center justify-center text-xl font-bold text-green-500"><Store /></div><div><h1 className="text-xl sm:text-3xl font-bold truncate">{loja?.nome || "Sem loja"}</h1><p className="text-xs text-gray-400 truncate">{loja?.endereco}</p></div></div>
                        <div className="flex gap-2"><span className={`px-3 py-1 rounded-full text-xs ${loja?.is_active ? "bg-green-600" : "bg-gray-600"}`}>{loja?.is_active ? "ativa" : "inativa"}</span><button onClick={handleSair} className="px-3 py-2 bg-red-600 rounded-lg text-xs font-bold flex gap-2"><LogOut size={16} />Sair</button></div>
                    </div>
                    <div className="flex gap-2 bg-neutral-900 p-1 rounded-lg mb-6 overflow-x-auto">{initialTabs.map(tab => <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium ${activeTab === tab.id ? "bg-green-600 text-white" : "text-gray-400 hover:bg-neutral-800"}`}><tab.icon size={16} />{tab.label}</button>)}</div>

                    {activeTab === "dados" && <DadosTab loja={loja} user={user} />}
                    {activeTab === "produtos" && (podeVerVendas || podeVerEstoque) && <ProdutosTab produtos={produtos} isAdmin={podeEditarApagar} isDono={["DONO"].includes(user?.nivel!)} lojaId={lojaId} onAdd={podeEditarApagar ? handleAddProdutoClick : () => toast.error("Apenas Dono/Gerente")} onEdit={podeEditarApagar ? handleEditProdutoClick : () => toast.error("Apenas Dono/Gerente")} onDelete={podeEditarApagar ? handleDeleteProdutoClick : () => toast.error("Apenas Dono/Gerente")} formatCurrency={formatCurrency} />}
                    {activeTab === "equipa" && <EquipaTab equipa={equipa} isAdmin={podeEditarApagar} isDono={["DONO"].includes(user?.nivel!)} lojaId={lojaId} onAdd={podeEditarApagar ? handleAddUserClick : () => toast.error("Apenas Dono/Gerente")} onEdit={podeEditarApagar ? handleEditUserClick : () => toast.error("Apenas Dono/Gerente")} onDelete={podeEditarApagar ? handleDeleteUserClick : () => toast.error("Apenas Dono/Gerente")} onView={handleViewUserClick} />}
                    {!["dados", "venda", "produtos", "equipa"].includes(activeTab) && <div className="bg-neutral-900 p-6 rounded-xl text-center text-gray-400">Em breve: {allTabs.find(t => t.id === activeTab)?.label}</div>}
                </div>
                <UserModal open={showModal && modalType === 'user'} onOpenChange={(v) => { if (!saving) setShowModal(v) }} editingUser={editingUser} formData={formDataUser} setFormData={setFormDataUser} onSave={handleSave} saving={saving} errorMsg={errorMsg} lojaNome={loja?.nome} />
                <ProdutoModal open={showModal && modalType === 'produto'} onOpenChange={(v) => { if (!saving) setShowModal(v) }} editingProduto={editingProduto} formData={formDataProduto} setFormData={setFormDataProduto} onSave={handleSave} saving={saving} errorMsg={errorMsg} />
                <PermissaoModal open={showPermissaoModal} onClose={() => { setShowPermissaoModal(false); setAcaoPendente(null) }} onConfirm={executarAcaoComSenha} titulo={acaoPendente?.tipo === 'editar' ? "Confirmar Edição" : "Confirmar Exclusão"} loading={saving} />
                <ErroModal open={showErroModal} onClose={() => setShowErroModal(false)} mensagem={erroMsgPermissao} />
                <DetalhesModal open={showDetalhesModal} onClose={() => setShowDetalhesModal(false)} dados={detalhesUser} />

                <ConfirmarModal
                    open={showConfirmarModal}
                    onClose={() => { setShowConfirmarModal(false); setAcaoPendente(null) }}
                    onConfirm={executarAcaoComSenha}
                    titulo="Confirmar Ação"
                    descricao={acaoPendente?.descricao || ""}
                    loading={saving} // <- ADICIONA ISSO
                />
            </div>
        }
        <VendaSucessoModal open={showVendaSucessoModal} onClose={() => { setShowVendaSucessoModal(false); setVendaConcluida(null) }} venda={vendaConcluida} formatCurrency={formatCurrency} loja_nome={loja?.nome || ""} loja_nif={loja?.nif || ""} loja_endereco={loja?.endereco || ""} loja_telefone={loja?.telefone || ""} loja_logo={loja?.logo_url || ""} />
    </>;
}
