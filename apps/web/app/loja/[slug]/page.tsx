"use client";

import { useEffect, useState, FormEvent, useMemo, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { LogOut, FileText, BarChart3, ShieldAlert, Store, Users, Package, Truck, ShoppingCart } from "lucide-react";
import { toast, Toaster } from "sonner";
import { z } from "zod"; // <- 1. IMPORT ZOD

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

// 2. SCHEMAS ZOD - FONTE DA VERDADE
const ItemVendaSchema = z.object({
    produto_id: z.union([z.string(), z.number()]),
    quantidade: z.number().int().positive(),
    preco_unitario: z.number(),
    subtotal: z.number(),
    nome: z.string().optional(),
});

const VendaSchema = z.object({
    id: z.union([z.string(), z.number()]),
    total: z.number(),
    total_itens: z.number(),
    forma_pagamento: z.string(),
    valor_pago: z.number().optional(),
    troco: z.number().optional(),
    data_venda: z.string().optional(),
    itens: z.array(ItemVendaSchema).optional(),
    loja_id: z.string().optional(),
});

// Helper: converte string/null pra number
const numberFromString = z.preprocess(
    (val) => val === null || val === "" ? 0 : Number(val),
    z.number()
);

const ProdutoSchema = z.object({
    id: z.union([z.string(), z.number()]).transform(String),
    nome: z.string(),
    sku: z.string(),
    preco: z.number(), // <- VOLTOU A SER SÓ NUMBER
    preco_custo: z.number(),
    preco_venda: z.number().optional(),
    estoque: z.number(),
    estoque_minimo: z.number(),
    is_active: z.boolean(),
    loja_id: z.string(),
    descricao: z.string().optional(),
    codigo_barras: z.string().optional().nullable(),
    marca: z.string().optional(),
    categoria_id: z.union([z.string(), z.number()]).optional().nullable(),
    unidade: z.string(),
    localizacao: z.string().optional(),
    fornecedor_id: z.union([z.string(), z.number()]).optional().nullable(),
    data_validade: z.string().optional(),
    ncm: z.string().optional(),
    peso_kg: z.number().optional().nullable(),
    imagem_url: z.string().optional(),
});

// TIPOS GERADOS
export type ItemVenda = z.infer<typeof ItemVendaSchema>;
export type Venda = z.infer<typeof VendaSchema>;
export type ProdutoType = z.infer<typeof ProdutoSchema>; // renomeei pra não conflitar
export type CarrinhoItem = ProdutoType & { quantidade: number }; // <- AJUSTE 1

export type Loja = {
    id: string;
    nome: string;
    slug: string;
    is_active: boolean;
    created_at: string;
    endereco?: string | null;
    logo_url?: string | null; // <- tu já tem
    nif?: string | null; // <- ADICIONA
    telefone?: string | null; // <- ADICIONA
    ano_fundacao?: number | null;
}
export type UserRole = "DONO" | "GERENTE" | "VENDEDOR" | "CAIXA" | "ESTOQUISTA";

// TYPE QUE VEM DO BACKEND - ACEITA NULL
export type UsuarioLojaPage = { id: string; nome: string; email: string; telefone?: string | null; role: UserRole; is_active: boolean; }

export type UsuarioLoja = { id: string; nome: string; email: string; telefone?: string; role: UserRole; is_active: boolean; } // <- TYPE DO MODAL

export type userread = { id: string; nome: string; email: string; nivel: "admin" | "gerente" | "vendedor" | "dono"; loja?: Loja | null; loja_id?: string | null; }

const formatError = (data: any): string => {
    if (!data) return "Erro desconhecido";
    if (typeof data.detail === 'string') return data.detail;
    if (Array.isArray(data.detail)) return data.detail.map((d: any) => d.msg).join(", ");
    return "Erro ao processar requisição";
}
export const formatCurrency = (value: number) => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);

const initialTabs = [
    { id: "dados", label: "Dados", icon: FileText },
    { id: "venda", label: "Venda", icon: ShoppingCart },
    { id: "produtos", label: "Produtos", icon: Package },
    { id: "equipa", label: "Equipa", icon: Users },
    { id: "fornecedores", label: "Fornecedores", icon: Truck },
    { id: "documentos", label: "Documentos", icon: FileText },
    { id: "estatisticas", label: "Estatisticas", icon: BarChart3 },
    { id: "risco", label: "Risco", icon: ShieldAlert },
];

const getCookie = (name: string): string | undefined => { if (typeof window === "undefined") return undefined; return document.cookie.split('; ').reduce((r, v) => { const parts = v.split('='); return parts[0] === name ? decodeURIComponent(parts[1]) : r; }, ''); };
const deleteCookie = (name: string) => { if (typeof window === "undefined") return; document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`; };

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

const fetchComAuth = async (url: string, token: string, options: RequestInit = {}) => {
    const res = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            ...options.headers
        },
        credentials: 'include',
        cache: "no-store"
    });

    if (!res.ok) {
        const errorText = await res.text();
        try {
            throw new Error(formatError(JSON.parse(errorText)));
        } catch {
            throw new Error(errorText || res.statusText);
        }
    }

    if (res.status === 204) {
        return true;
    }

    return await res.json();
}

export default function LojaPage() {
    const router = useRouter();
    const params = useParams();
    const slug = params.slug as string;
    const [isClient, setIsClient] = useState(false);
    const [user, setUser] = useState<userread | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true); // <- ADICIONADO AQUI

    const [loja, setLoja] = useState<Loja | null>(null); // <- LINHA NOVA

    const [activeTab, setActiveTab] = useState("dados");

    const [equipa, setEquipa] = useState<UsuarioLojaPage[]>([]); // <- USA TYPE DO PAGE
    const [editingUser, setEditingUser] = useState<UsuarioLoja | null>(null);
    const [formDataUser, setFormDataUser] = useState({ nome: "", telefone: "", role: "VENDEDOR" as UserRole, is_active: true });
    const [detalhesUser, setDetalhesUser] = useState<any>(null);

    const [produtos, setProdutos] = useState<ProdutoType[]>([]);
    const [carrinho, setCarrinho] = useState<CarrinhoItem[]>([]);
    const [editingProduto, setEditingProduto] = useState<ProdutoType | null>(null); // <- AJUSTE 2

    const [formDataProduto, setFormDataProduto] = useState<{
        nome: string; sku: string; preco: number; preco_custo: number;
        estoque: number; estoque_minimo: number; is_active: boolean;
        loja_id: string; descricao: string; codigo_barras: string | null;
        marca: string; categoria_id: string | number | null; unidade: string;
        localizacao: string; fornecedor_id: string | number | null; data_validade: string; ncm: string; peso_kg: number; imagem_url: string;
    }>({
        nome: "", sku: "", preco: 0, preco_custo: 0,
        estoque: 0, estoque_minimo: 5, is_active: true,
        loja_id: "", descricao: "", codigo_barras: null, // <- agora aceita string E null
        marca: "", categoria_id: null, unidade: "UN",
        localizacao: "", fornecedor_id: null, data_validade: "", ncm: "", peso_kg: 0, imagem_url: ""
    });

    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<'user' | 'produto'>('user');
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [showPermissaoModal, setShowPermissaoModal] = useState(false);
    const [showErroModal, setShowErroModal] = useState(false);
    const [erroMsgPermissao, setErroMsgPermissao] = useState("");
    const [showDetalhesModal, setShowDetalhesModal] = useState(false);

    const [showConfirmarModal, setShowConfirmarModal] = useState(false);
    const [itemParaRemover, setItemParaRemover] = useState<CarrinhoItem | null>(null);
    const [busca, setBusca] = useState("");
    const [formaPagamento, setFormaPagamento] = useState("Dinheiro");
    const [valorRecebido, setValorRecebido] = useState("");
    const [showConfirmarFinalizar, setShowConfirmarFinalizar] = useState(false);
    const [loadingVenda, setLoadingVenda] = useState(false);

    const [acaoPendente, setAcaoPendente] = useState<{ tipo: 'editar' | 'apagar' | 'adicionar', entidade: 'user' | 'produto', data?: UsuarioLojaPage | ProdutoType } | null>(null); // <- AJUSTE 3

    // 3. TIPAGEM FORTE AQUI
    const [showVendaSucessoModal, setShowVendaSucessoModal] = useState(false);
    const [vendaConcluida, setVendaConcluida] = useState<Venda | null>(null); // <- TROQUEI ANY POR VENDA

    const handleSair = () => { deleteCookie("token"); deleteCookie("user"); router.replace("/login"); };

    const fetchEquipa = async (currentToken: string) => {
        if (!currentToken || !slug) return;
        try {
            const data = await fetchComAuth(`${API_URL}/lojas/${slug}/usuarios`, currentToken);
            if (data && Array.isArray(data)) setEquipa(data); else setEquipa([]);
        } catch (e) { setEquipa([]) }
    };

    const fetchProdutos = useCallback(async (currentToken: string, lojaId: string) => {
        if (!currentToken || !lojaId) { setProdutos([]); return; }
        try {
            const data = await fetchComAuth(`${API_URL}/produtos?loja_id=${lojaId}`, currentToken);
            const produtosValidados = z.array(ProdutoSchema).parse(data); // <- ProdutoType
            setProdutos(produtosValidados);
        } catch (e) {
            console.error(e);
            setProdutos([]);
            toast.error("Erro ao validar produtos do backend");
        }
    }, []);

    const fetchLoja = useCallback(async (currentToken: string) => {
        if (!currentToken || !slug) return;
        try {
            const data = await fetchComAuth(`${API_URL}/lojas/${slug}`, currentToken);
            setLoja(data); // <- pega dados frescos da DB com nif e telefone
        } catch (e) {
            console.error("Erro ao buscar loja:", e);
            setLoja(null);
        }
    }, [slug]);

    useEffect(() => {
        setIsClient(true);
        const currentToken = getCookie("token");
        const userStr = getCookie("user");
        setToken(currentToken || null);
        if (!currentToken || !userStr) { handleSair(); return; }
        try {
            const userData: userread = JSON.parse(userStr);
            if (userData.loja?.slug !== slug) { handleSair(); return; }
            setUser(userData);
            const loadData = async () => {
                setLoading(true);
                await Promise.all([
                    fetchLoja(currentToken),
                    fetchEquipa(currentToken),
                    fetchProdutos(currentToken, userData.loja_id || userData.loja?.id || "")
                ]);
                setLoading(false);
            }
            loadData();
        } catch (err) { handleSair(); }
    }, [router, slug, fetchProdutos, fetchLoja]); // <- CORRIGIDO AQUI

    const getPreco = (item: CarrinhoItem) => item.preco || 0;

    const subtotal = useMemo(() => carrinho.reduce((acc, item) => acc + (getPreco(item) * item.quantidade), 0), [carrinho]);
    const totalItens = useMemo(() => carrinho.reduce((acc, item) => acc + item.quantidade, 0), [carrinho]);
    const troco = useMemo(() => formaPagamento === "Dinheiro" && Number(valorRecebido) > subtotal ? Number(valorRecebido) - subtotal : 0, [formaPagamento, valorRecebido, subtotal]);

    const podeFinalizar = useMemo(() => {
        if (carrinho.length === 0) return false;
        if (formaPagamento === "Dinheiro") {
            return Number(valorRecebido) >= subtotal && subtotal > 0;
        }
        return true;
    }, [carrinho, formaPagamento, valorRecebido, subtotal]);

    const adicionarAoCarrinho = (produto: ProdutoType) => { // <- AJUSTE 4
        if ((produto.estoque ?? 0) <= 0) { toast.error("Produto sem estoque"); return; }

        setCarrinho(prev => {
            const itemExistente = prev.find(item => String(item.id) === String(produto.id)); // <- AJUSTE 5
            if (itemExistente) {
                if (itemExistente.quantidade >= (produto.estoque ?? 0)) { toast.warning("Estoque máximo atingido"); return prev; }

                return prev.map(item => String(item.id) === String(produto.id) ? { ...item, quantidade: item.quantidade + 1 } : item); // <- AJUSTE 6
            }
            return [...prev, { ...produto, quantidade: 1 }];
        });
    };

    const confirmarRemoverItem = (item: CarrinhoItem) => {
        setItemParaRemover(item);
        setShowConfirmarModal(true);
    };

    const handleConfirmarRemocao = () => {
        if (itemParaRemover) {
            setCarrinho(prev => prev.filter(i => i.id !== itemParaRemover.id));
            toast.success("Produto removido do carrinho");
        }
        setShowConfirmarModal(false);
        setItemParaRemover(null);
    };

    const handleFinalizar = useCallback(() => {
        if (!podeFinalizar) return;
        setShowConfirmarFinalizar(true);
    }, [podeFinalizar]);

    const executarFinalizarVenda = async () => {
        if (!token) return;
        setLoadingVenda(true);
        setShowConfirmarFinalizar(false);
        try {
            const itensPayload = carrinho.map(i => ({
                produto_id: String(i.id), // <- backend quer string
                quantidade: Number(i.quantidade),
                preco_unitario: Number(getPreco(i)), // <- FORÇA NUMBER
                subtotal: Number(getPreco(i) * i.quantidade)
            }));

            const payload = {
                total: Number(subtotal),
                total_itens: Number(totalItens),
                forma_pagamento: formaPagamento,
                valor_pago: formaPagamento === "Dinheiro" ? Number(valorRecebido) : Number(subtotal),
                troco: Number(troco),
                loja_id: user?.loja_id || user?.loja?.id || "", // <- AJUSTE 7
                itens: itensPayload
            };

            const vendaSalva = await fetchComAuth(`${API_URL}/vendas/`, token, {
                method: "POST",
                body: JSON.stringify(payload)
            });

            // 3. Monta o objeto pro modal na mão em vez de confiar no backend
            const vendaParaModal: Venda = {
                id: vendaSalva.id,
                total: payload.total,
                total_itens: payload.total_itens,
                forma_pagamento: payload.forma_pagamento,
                valor_pago: payload.valor_pago,
                troco: payload.troco,
                data_venda: vendaSalva.data_venda || new Date().toISOString(),
                itens: itensPayload.map(i => ({
                    ...i,
                    nome: carrinho.find(c => String(c.id) === i.produto_id)?.nome
                })),
                loja_id: payload.loja_id
            };

            // Valida só pra garantir
            const vendaValidada = VendaSchema.parse(vendaParaModal);

            setVendaConcluida(vendaValidada);
            setShowVendaSucessoModal(true);
            setCarrinho([]);
            setValorRecebido("");
            fetchProdutos(token, user?.loja_id || user?.loja?.id || "");

        } catch (err: any) {
            console.error("Erro Finalizar Venda:", err);
            toast.error(err.message || "Erro ao finalizar venda");
            setShowConfirmarFinalizar(true);
        } finally {
            setLoadingVenda(false);
        }
    };

    const openModal = (type: 'user' | 'produto', data: UsuarioLoja | ProdutoType | null = null) => { // <- AJUSTE 8
        setErrorMsg("");
        setModalType(type);
        if (type === 'user') {
            setEditingUser(data as UsuarioLoja | null);
            setFormDataUser({
                nome: (data as UsuarioLoja)?.nome || "",
                telefone: (data as UsuarioLoja)?.telefone || "",
                role: ((data as UsuarioLoja)?.role?.toUpperCase() as UserRole) || "VENDEDOR",
                is_active: (data as UsuarioLoja)?.is_active ?? true
            });
        } else {
            setEditingProduto(data as ProdutoType | null); // <- AJUSTE 9
            setFormDataProduto({
                nome: (data as ProdutoType)?.nome || "",
                sku: (data as ProdutoType)?.sku || "",
                preco: (data as ProdutoType)?.preco || 0,
                preco_custo: (data as ProdutoType)?.preco_custo || 0,
                estoque: (data as ProdutoType)?.estoque || 0,
                estoque_minimo: (data as ProdutoType)?.estoque_minimo || 5,
                is_active: (data as ProdutoType)?.is_active ?? true,
                loja_id: (data as ProdutoType)?.loja_id || user?.loja_id || user?.loja?.id || "", // string
                descricao: (data as ProdutoType)?.descricao || "",
                codigo_barras: (data as ProdutoType)?.codigo_barras ?? null, // null
                marca: (data as ProdutoType)?.marca || "",
                categoria_id: (data as ProdutoType)?.categoria_id || null, // null
                unidade: (data as ProdutoType)?.unidade || "UN",
                localizacao: (data as ProdutoType)?.localizacao || "",
                fornecedor_id: (data as ProdutoType)?.fornecedor_id || null, // null
                data_validade: (data as ProdutoType)?.data_validade || "",
                ncm: (data as ProdutoType)?.ncm || "",
                peso_kg: (data as ProdutoType)?.peso_kg || 0,
                imagem_url: (data as ProdutoType)?.imagem_url || "",
            });
        }
        setShowModal(true);
    };

    const handleAddUserClick = () => { setAcaoPendente({ tipo: 'adicionar', entidade: 'user' }); openModal('user'); }
    // 3 FUNÇÕES AJUSTADAS AQUI ABAIXO
    const handleEditUserClick = (u: UsuarioLojaPage) => {
        const userConvertido: UsuarioLoja = { ...u, telefone: u.telefone ?? undefined };
        setAcaoPendente({ tipo: 'editar', entidade: 'user', data: u });
        openModal('user', userConvertido);
    }
    const handleDeleteUserClick = (u: UsuarioLojaPage) => { setAcaoPendente({ tipo: 'apagar', entidade: 'user', data: u }); setShowPermissaoModal(true); }
    const handleViewUserClick = async (u: UsuarioLojaPage) => {
        if (!token || !slug) return;
        try {
            const data = await fetchComAuth(`${API_URL}/lojas/${slug}/usuarios/${u.id}/detalhes`, token);
            if (data) { setDetalhesUser(data); setShowDetalhesModal(true); }
        } catch (e) { }
    }

    const handleAddProdutoClick = () => { setAcaoPendente({ tipo: 'adicionar', entidade: 'produto' }); openModal('produto'); }
    const handleEditProdutoClick = (p: ProdutoType) => { setAcaoPendente({ tipo: 'editar', entidade: 'produto', data: p }); openModal('produto', p); } // <- AJUSTE 10
    const handleDeleteProdutoClick = (p: ProdutoType) => { setAcaoPendente({ tipo: 'apagar', entidade: 'produto', data: p }); setShowPermissaoModal(true); } // <- AJUSTE 11

    const executarAcaoComSenha = async (senha_dono: string) => {
        if (!acaoPendente || !token) return;
        setSaving(true);
        setShowPermissaoModal(false);
        const { tipo, entidade, data } = acaoPendente;
        try {
            if (entidade === 'user') {
                if (tipo === 'adicionar') {
                    await fetchComAuth(`${API_URL}/lojas/${slug}/usuarios`, token, {
                        method: "POST",
                        body: JSON.stringify({
                            ...formDataUser,
                            role: formDataUser.role.toLowerCase(),
                            senha_dono: senha_dono,
                            senha_confirmacao: senha_dono
                        })
                    });
                    await fetchEquipa(token);
                }
                if (tipo === 'editar' && data) {
                    const userData = data as UsuarioLojaPage;
                    await fetchComAuth(`${API_URL}/lojas/${slug}/usuarios/${userData.id}`, token, {
                        method: "PATCH",
                        body: JSON.stringify({
                            ...formDataUser,
                            role: formDataUser.role.toLowerCase(),
                            senha_dono: senha_dono,
                            senha_confirmacao: senha_dono
                        })
                    });
                    await fetchEquipa(token);
                }
                if (tipo === 'apagar' && data) {
                    const userData = data as UsuarioLojaPage;
                    await fetchComAuth(`${API_URL}/lojas/${slug}/usuarios/${userData.id}`, token, {
                        method: "DELETE",
                        body: JSON.stringify({ senha_dono })
                    });
                    await fetchEquipa(token);
                }
            }

            if (entidade === 'produto') {
                const loja_id = user?.loja_id || user?.loja?.id || "" // <- AJUSTE 12
                const produtoData = data as ProdutoType | null; // <- AJUSTE 13
                const dadosAtuais = data || formDataProduto;

                const payload: any = {
                    ...dadosAtuais,
                    senha_dono,
                    senha_confirmacao: senha_dono,
                    loja_id: produtoData ? produtoData.loja_id : loja_id
                }

                if (tipo === 'editar' && (!payload.codigo_barras || String(payload.codigo_barras).trim() === "")) {
                    delete payload.codigo_barras;
                }

                if (tipo === 'adicionar') {
                    await fetchComAuth(`${API_URL}/produtos/`, token, { method: "POST", body: JSON.stringify(payload) });
                    await fetchProdutos(token, loja_id);
                }
                if (tipo === 'editar' && editingProduto) {
                    await fetchComAuth(`${API_URL}/produtos/${editingProduto.id}`, token, { method: "PATCH", body: JSON.stringify(payload) });
                    await fetchProdutos(token, editingProduto.loja_id || loja_id);
                }
                if (tipo === 'apagar' && editingProduto) {
                    await fetchComAuth(`${API_URL}/produtos/${editingProduto.id}`, token, { method: "DELETE", body: JSON.stringify({ senha_dono, senha_confirmacao: senha_dono, loja_id: editingProduto.loja_id }) });
                    await fetchProdutos(token, editingProduto.loja_id || loja_id);
                }
            }

            setShowModal(false);
            toast.success("Ação realizada com sucesso!")
        } catch (err: any) {
            let msgAmigavel = "Ocorreu um erro inesperado. Tente novamente.";
            const msg = err.message.toLowerCase();

            if (msg.includes("senha do dono incorreta")) {
                msgAmigavel = "A senha do proprietário que você digitou está incorreta.";
            } else if (msg.includes("sem permissão") || msg.includes("403")) {
                msgAmigavel = "Você não tem permissão para realizar esta ação.";
            } else if (msg.includes("não encontrado") || msg.includes("404")) {
                msgAmigavel = "Este registro não foi encontrado.";
            } else {
                msgAmigavel = err.message;
            }

            setErroMsgPermissao(msgAmigavel);
            setShowErroModal(true);

            if (acaoPendente?.tipo === 'editar') {
                setShowModal(true);
            }
        }
        finally {
            setAcaoPendente(null);
            setSaving(false);
        }
    }

    const handleSave = async (payload: any) => {
        if (payload && typeof payload.preventDefault === 'function') payload.preventDefault();
        const data = payload?.target ? formDataProduto : payload;

        if (!token || !slug) return;
        setSaving(true);
        setErrorMsg("");
        try {
            if (modalType === 'user') {
                if (!formDataUser.nome.trim()) { setErrorMsg("Nome é obrigatório"); setSaving(false); return; }
                if (!editingUser) {
                    setShowModal(false);
                    setAcaoPendente({ tipo: 'adicionar', entidade: 'user' });
                    setShowPermissaoModal(true);
                    setSaving(false);
                    return;
                }
                else {
                    setShowModal(false);
                    setShowPermissaoModal(true);
                    setSaving(false);
                    return;
                }
            }
            if (modalType === 'produto') {
                const dadosParaValidar = data || formDataProduto;
                if (!dadosParaValidar.nome.trim()) { setErrorMsg("Nome é obrigatório"); setSaving(false); return; }
                if (dadosParaValidar.preco <= 0) { setErrorMsg("Preço deve ser maior que 0"); setSaving(false); return; }

                setShowModal(false);
                setAcaoPendente({ tipo: editingProduto ? 'editar' : 'adicionar', entidade: 'produto', data: data });
                setShowPermissaoModal(true);
                setSaving(false);
                return;
            }
        } catch (err: any) { setErrorMsg(err.message); setSaving(false); }
    };

    if (!isClient || loading) { return (<div className="flex items-center justify-center min-h-screen bg-black"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div></div>); }

    const isAdmin = user?.nivel === "admin" || user?.nivel === "dono"; // <- linha 546 era essa
    const isDono = user?.nivel === "dono";

    return (
        <>
            <Toaster position="top-center" richColors theme="dark" />

            {activeTab === "venda" ? (
                <div className="fixed inset-0 z-40 bg-black">
                    <VendaTab
                        produtos={produtos} // <- TIREI O CAST
                        carrinho={carrinho}
                        busca={busca}
                        setBusca={setBusca}
                        formaPagamento={formaPagamento}
                        setFormaPagamento={setFormaPagamento}
                        valorRecebido={valorRecebido}
                        setValorRecebido={setValorRecebido}
                        subtotal={subtotal}
                        totalItens={totalItens}
                        troco={troco}
                        podeFinalizar={podeFinalizar}
                        adicionarAoCarrinho={adicionarAoCarrinho}
                        confirmarRemoverItem={confirmarRemoverItem}
                        handleFinalizar={handleFinalizar}
                        showConfirmarModal={showConfirmarModal}
                        setShowConfirmarModal={setShowConfirmarModal}
                        itemParaRemover={itemParaRemover}
                        handleConfirmarRemocao={handleConfirmarRemocao}
                        showConfirmarFinalizar={showConfirmarFinalizar}
                        setShowConfirmarFinalizar={setShowConfirmarFinalizar}
                        executarFinalizarVenda={executarFinalizarVenda}
                        loadingVenda={loadingVenda}
                        formatCurrency={formatCurrency}
                        onClose={() => {
                            setActiveTab("dados");
                            setVendaConcluida(null);
                            setCarrinho([]);
                        }}
                        token={token}
                        nomeLoja={loja?.nome || "PDV"}
                    />
                </div>
            ) : (
                <div className="min-h-screen bg-black text-white p-3 sm:p-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-neutral-800 flex items-center justify-center text-xl sm:text-2xl font-bold text-green-500 shrink-0"><Store /></div>
                                <div className="min-w-0">
                                    <h1 className="text-xl sm:text-3xl font-bold truncate">{loja?.nome || "Sem loja vinculada"}</h1>
                                    <p className="text-xs sm:text-sm text-gray-400 truncate">{loja?.endereco || "endereço não informado"} {loja?.ano_fundacao ? `· Fundada em ${loja.ano_fundacao}` : ""}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${loja?.is_active ? "bg-green-600 text-white" : "bg-gray-600 text-white"}`}><div className={`h-2 w-2 rounded-full ${loja?.is_active ? "bg-white" : "bg-gray-300"}`} />{loja?.is_active ? "ativa" : "inativa"}</span>
                                <button onClick={handleSair} className="px-3 sm:px-4 py-2 bg-red-600 border-red-700 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 hover:bg-red-700"><LogOut size={16} /> <span className="hidden sm:inline">Terminar Sessão</span></button>
                            </div>
                        </div>

                        <div className="flex gap-2 bg-neutral-900 p-1 rounded-lg mb-6 overflow-x-auto">
                            {initialTabs.map((tab) => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id ? "bg-green-600 text-white" : "text-gray-400 hover:bg-neutral-800"}`}>
                                    <tab.icon size={16} /> {tab.label}
                                </button>
                            ))}
                        </div>

                        {activeTab === "dados" && <DadosTab loja={loja} user={user} />}
                        {activeTab === "produtos" && <ProdutosTab produtos={produtos} isAdmin={isAdmin} isDono={isDono} onAdd={handleAddProdutoClick} onEdit={handleEditProdutoClick} onDelete={handleDeleteProdutoClick} formatCurrency={formatCurrency} />}
                        {activeTab === "equipa" && <EquipaTab equipa={equipa} isAdmin={isAdmin} isDono={isDono} onAdd={handleAddUserClick} onEdit={handleEditUserClick} onDelete={handleDeleteUserClick} onView={handleViewUserClick} />}
                        {activeTab !== "dados" && activeTab !== "venda" && activeTab !== "equipa" && activeTab !== "produtos" && (<div className="bg-neutral-900 p-6 rounded-xl border-neutral-800 text-center text-gray-400">Em breve: {initialTabs.find(t => t.id === activeTab)?.label}</div>)}
                    </div>

                    <UserModal open={showModal && modalType === 'user'} onOpenChange={(v) => { if (!saving) setShowModal(v); if (!v) { setEditingUser(null); setErrorMsg(""); } }} editingUser={editingUser} formData={formDataUser} setFormData={setFormDataUser} onSave={handleSave} saving={saving} errorMsg={errorMsg} lojaNome={loja?.nome} />
                    <ProdutoModal open={showModal && modalType === 'produto'} onOpenChange={(v) => { if (!saving) setShowModal(v); if (!v) { setEditingProduto(null); setErrorMsg(""); } }} editingProduto={editingProduto} formData={formDataProduto} setFormData={setFormDataProduto} onSave={handleSave} saving={saving} errorMsg={errorMsg} />
                    <PermissaoModal open={showPermissaoModal} onClose={() => { setShowPermissaoModal(false); setAcaoPendente(null); setSaving(false) }} onConfirm={executarAcaoComSenha} titulo={acaoPendente?.tipo === 'editar' ? "Confirmar Edição" : "Confirmar Exclusão"} loading={saving} />
                    <ErroModal open={showErroModal} onClose={() => { setShowErroModal(false); if (acaoPendente?.tipo === 'editar') setShowModal(true) }} mensagem={erroMsgPermissao} />
                    <DetalhesModal open={showDetalhesModal} onClose={() => setShowDetalhesModal(false)} dados={detalhesUser} />
                </div>
            )}

            <div className="relative z-[9999]">
                <VendaSucessoModal
                    open={showVendaSucessoModal}
                    onClose={() => {
                        setShowVendaSucessoModal(false);
                        setVendaConcluida(null);
                    }}
                    venda={
                        vendaConcluida
                    }
                    formatCurrency={
                        formatCurrency
                    }

                    loja_nome={loja?.nome || "MINHA LOJA"}
                    loja_nif={loja?.nif || ""} // <- já vai pegar quando tu criar no banco

                    loja_endereco={loja?.endereco || ""}
                    loja_telefone={loja?.telefone || ""} // <- já vai pegar
                    loja_logo={loja?.logo_url || ""} // <- já vai pegar
                />
            </div>
        </>
    );
}
