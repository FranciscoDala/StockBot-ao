"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { LogOut, FileText, BarChart3, ShieldAlert, Store, Users, Package, Truck, ShoppingCart, Settings, Palette, Sun, Moon } from "lucide-react";
import { toast, Toaster } from "sonner";
import { z } from "zod";
import { formatCurrency } from "./_components/utils";

import LojaLayout from "./LojaLayout";

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
import { ConfirmarModal } from "./_components/modals/ConfirmacaoModal";
import { VendaSucessoModal } from "./_components/modals/VendaSucessoModal";

// SCHEMAS ZOD
const ItemVendaSchema = z.object({ produto_id: z.union([z.string(), z.number()]), quantidade: z.number().int().positive(), preco_unitario: z.number(), subtotal: z.number(), nome: z.string().optional() });
const VendaSchema = z.object({ id: z.union([z.string(), z.number()]), total: z.number(), total_itens: z.number(), forma_pagamento: z.string(), valor_pago: z.number().optional(), troco: z.number().optional(), data_venda: z.string().optional(), itens: z.array(ItemVendaSchema).optional(), loja_id: z.string().optional() });
const ProdutoSchema = z.object({ id: z.union([z.string(), z.number()]).transform(String), nome: z.string(), sku: z.string(), preco: z.number(), preco_custo: z.number(), preco_venda: z.number().optional(), estoque: z.number(), estoque_minimo: z.number(), is_active: z.boolean(), loja_id: z.string(), descricao: z.string().optional(), codigo_barras: z.string().optional().nullable(), marca: z.string().optional(), categoria_id: z.union([z.string(), z.number()]).optional().nullable(), unidade: z.string(), localizacao: z.string().optional(), fornecedor_id: z.union([z.string(), z.number()]).optional().nullable(), data_validade: z.string().optional(), ncm: z.string().optional(), peso_kg: z.number().optional().nullable(), imagem_url: z.string().optional() });

export type ItemVenda = z.infer<typeof ItemVendaSchema>;
export type Venda = z.infer<typeof VendaSchema>;
export type ProdutoType = z.infer<typeof ProdutoSchema>;
export type CarrinhoItem = ProdutoType & { quantidade: number };
export type UserRole = "DONO" | "GERENTE" | "VENDEDOR" | "CAIXA" | "ESTOQUISTA" | "ADMIN";
export type UsuarioLojaPage = { id: string; nome: string; email: string; telefone?: string | null; role: UserRole; is_active: boolean; }

export type UsuarioLoja = UsuarioLojaPage // <- usa o mesmo tipo da lista

export type userread = { id: string; nome: string; email: string; nivel: UserRole; loja?: Loja | null; loja_id?: string | null; }
export type Loja = { id: string; nome: string; slug: string; is_active: boolean; created_at: string; endereco?: string | null; logo_url?: string | null; nif?: string | null; telefone?: string | null; ano_fundacao?: number | null; theme?: string; card_style?: string; card_size?: string; font_size?: string; cor_primaria?: string; cor_fundo?: string; }

const getCookie = (name: string): string | undefined => { if (typeof window === "undefined") return undefined; return document.cookie.split('; ').reduce((r, v) => { const parts = v.split('='); return parts[0] === name ? decodeURIComponent(parts[1]) : r; }, ''); };
const deleteCookie = (name: string) => { if (typeof window === "undefined") return; document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; Secure; SameSite=None`; };
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://gentle-playfulness-production-d333.up.railway.app/api/v1";

const fetchComAuth = async (url: string, token: string, options: RequestInit = {}) => {
    const res = await fetch(url, { ...options, headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}`, ...options.headers }, credentials: 'include', cache: "no-store" });
    if (!res.ok) { if (res.status === 401) throw new Error("UNAUTHORIZED"); const errorData = await res.json().catch(() => ({})); throw new Error(errorData.detail || res.statusText); }
    if (res.status === 204) { return true; } return await res.json();
}

export default function LojaPage() {
    const router = useRouter(); const params = useParams(); const lojaId = params.id as string;
    const [isClient, setIsClient] = useState(false); const [user, setUser] = useState<userread | null>(null); const [token, setToken] = useState<string | null>(null); const [loading, setLoading] = useState(true); const [loja, setLoja] = useState<Loja | null>(null);

    const [theme, setTheme] = useState("dark");
    const [cardStyle, setCardStyle] = useState("padrao");
    const [cardSize, setCardSize] = useState("medio");
    const [fontSize, setFontSize] = useState("medio");
    const [corPrimaria, setCorPrimaria] = useState("#10b981");
    const [corFundo, setCorFundo] = useState("#000");

    const updateLojaTheme = async (lojaId: string, token: string, themeData: Partial<Pick<Loja, 'theme' | 'card_style' | 'card_size' | 'font_size' | 'cor_primaria' | 'cor_fundo'>>) => {
        return await fetchComAuth(`${API_URL}/lojas/${lojaId}/definicoes`, token, { method: 'PATCH', body: JSON.stringify(themeData) });
    }

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
        data: UsuarioLojaPage | ProdutoType | null;
    } | null>(null);
    const [showVendaSucessoModal, setShowVendaSucessoModal] = useState(false);
    const [vendaConcluida, setVendaConcluida] = useState<Venda | null>(null);
    const [ws, setWs] = useState<WebSocket | null>(null); // <- ESSA LINHA SUMIU

    const getPreco = (item: CarrinhoItem) => item.preco_venda ?? item.preco ?? 0;
    const subtotal = useMemo(() => carrinho.reduce((acc, item) => acc + (getPreco(item) * item.quantidade), 0), [carrinho]);
    const totalItens = useMemo(() => carrinho.reduce((acc, item) => acc + item.quantidade, 0), [carrinho]);
    const troco = useMemo(() => formaPagamento === "Dinheiro" && Number(valorRecebido) > subtotal ? Number(valorRecebido) - subtotal : 0, [formaPagamento, valorRecebido, subtotal]);
    const podeFinalizar = useMemo(() => carrinho.length > 0 && (formaPagamento !== "Dinheiro" || Number(valorRecebido) >= subtotal && subtotal > 0), [carrinho, formaPagamento, valorRecebido, subtotal]);

    const handleSair = () => { deleteCookie("token"); deleteCookie("user"); router.replace("/login"); };

    const applyTheme = useCallback((t: string, cs: string, csz: string, fsz: string, corP: string, corF: string) => {
        const bg = corF || (t === 'light' ? '#f5f5f5' : '#000');
        const text = t === 'light' ? '#111827' : '#fff';
        document.documentElement.style.setProperty('--cor-primaria', corP || '#16a34a');
        document.documentElement.style.setProperty('--cor-fundo', bg);
        document.documentElement.setAttribute('data-theme', t);
        document.documentElement.setAttribute('data-card-style', cs);
        document.documentElement.setAttribute('data-card-size', csz);
        document.documentElement.style.setProperty('--font-size', fsz === 'grande' ? '16px' : fsz === 'pequeno' ? '12px' : '14px');
        document.body.style.backgroundColor = bg;
        document.body.style.color = text;
    }, []);

    const handleSaveTheme = useCallback(async (newTheme: Partial<Pick<Loja, 'theme' | 'card_style' | 'card_size' | 'font_size' | 'cor_primaria' | 'cor_fundo'>>) => {
        if (!token || !lojaId) return;
        try {
            let corFundoParaSalvar = newTheme.cor_fundo;
            if (newTheme.theme && newTheme.cor_fundo === undefined) {
                corFundoParaSalvar = newTheme.theme === 'light' ? '#f5f5f5' : '#000';
            }
            const themeParaSalvar = { ...newTheme, cor_fundo: corFundoParaSalvar };
            await updateLojaTheme(lojaId, token, themeParaSalvar);
            const newLoja = { ...loja, ...themeParaSalvar } as Loja;
            setLoja(newLoja);
            if (newTheme.theme) setTheme(newTheme.theme);
            if (newTheme.card_style) setCardStyle(newTheme.card_style);
            if (newTheme.card_size) setCardSize(newTheme.card_size);
            if (newTheme.font_size) setFontSize(newTheme.font_size);
            if (newTheme.cor_primaria) setCorPrimaria(newTheme.cor_primaria);
            if (corFundoParaSalvar) setCorFundo(corFundoParaSalvar);
            applyTheme(
                newTheme.theme || theme,
                newTheme.card_style || cardStyle,
                newTheme.card_size || cardSize,
                newTheme.font_size || fontSize,
                newTheme.cor_primaria || corPrimaria,
                corFundoParaSalvar || corFundo
            );
            toast.success("Aparência salva!");
        } catch (e) { toast.error("Erro ao salvar aparência"); }
    }, [token, lojaId, loja, theme, cardStyle, cardSize, fontSize, corPrimaria, corFundo, applyTheme]);

    const fetchEquipa = async (currentToken: string) => {
        if (!currentToken || !lojaId) return;
        try {
            // <- AJUSTE AQUI: pede ativos e inativos
            const data = await fetchComAuth(`${API_URL}/lojas/id/${lojaId}/usuarios?incluir_inativos=true`, currentToken);
            const equipaFormatada: UsuarioLojaPage[] = Array.isArray(data)
                ? data
                    .filter((u: any) => String(u.role).toUpperCase() !== "ADMIN")
                    .map((u: any) => ({
                        ...u,
                        id: u.usuario_id || u.id, // <- garante usar usuario_id se vier
                        role: String(u.role).toUpperCase() as UserRole
                    }))
                : [];
            setEquipa(equipaFormatada);
        } catch (e) { setEquipa([]) }
    };

    const fetchProdutos = useCallback(async (currentToken: string, lojaId: string) => { if (!currentToken || !lojaId) { setProdutos([]); return; } try { const data = await fetchComAuth(`${API_URL}/produtos?loja_id=${lojaId}`, currentToken); setProdutos(z.array(ProdutoSchema).parse(data)); } catch (e) { setProdutos([]); } }, []);
    const fetchVendas = useCallback(async (currentToken: string, lojaId: string) => { if (!currentToken || !lojaId) { setVendas([]); return; } try { const data = await fetchComAuth(`${API_URL}/vendas?loja_id=${lojaId}`, currentToken); setVendas(z.array(VendaSchema).parse(data)); } catch (e) { setVendas([]); } }, []);

    const fetchLoja = useCallback(async (currentToken: string) => {
        if (!currentToken || !lojaId) return;
        try {
            const data = await fetchComAuth(`${API_URL}/lojas/id/${lojaId}`, currentToken);
            setLoja(data);
            if (data.theme) setTheme(data.theme);
            if (data.card_style) setCardStyle(data.card_style);
            if (data.card_size) setCardSize(data.card_size);
            if (data.font_size) setFontSize(data.font_size);
            if (data.cor_primaria) setCorPrimaria(data.cor_primaria);
            if (data.cor_fundo) setCorFundo(data.cor_fundo);
            applyTheme(data.theme || "dark", data.card_style || "padrao", data.card_size || "medio", data.font_size || "medio", data.cor_primaria || "#10b981", data.cor_fundo || "#000");
        } catch (e) { setLoja(null); }
    }, [lojaId, applyTheme]);

    useEffect(() => {
        setIsClient(true); const currentToken = getCookie("token"); const userStr = getCookie("user"); setToken(currentToken || null);
        if (!currentToken || !userStr) { handleSair(); return; } try {
            const userData: userread = JSON.parse(userStr); if (userData.loja_id !== lojaId) { handleSair(); return; } setUser(userData);
            const loadData = async () => { setLoading(true); await Promise.all([fetchLoja(currentToken), fetchEquipa(currentToken), fetchProdutos(currentToken, userData.loja_id || ""), fetchVendas(currentToken, userData.loja_id || "")]); setLoading(false); }
            loadData();
        } catch (err) { handleSair(); }
    }, [router, lojaId, fetchProdutos, fetchLoja, fetchVendas]);

    useEffect(() => {
        if (!token || !lojaId) return; const WS_URL = process.env.NEXT_PUBLIC_WS_URL; const socket = new WebSocket(`${WS_URL}/ws/lojas/${lojaId}?token=${token}`); socket.onopen = () => setWs(socket);
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data); if (data.tipo === "stock.updated") {
                setProdutos(prev => prev.map(p => String(p.id) === String(data.produto_id) ? { ...p, estoque: data.novo_estoque } : p));
                setCarrinho(prev => { const novo = prev.map(item => String(item.id) === String(data.produto_id) ? { ...item, estoque: data.novo_estoque } : item); return novo.map(item => item.quantidade > item.estoque ? { ...item, quantidade: item.estoque } : item).filter(item => item.quantidade > 0); });
                toast.info(`Estoque: ${data.nome_produto} -> ${data.novo_estoque}`);
            }
        };
        socket.onclose = () => { setWs(null); }; return () => socket.close();
    }, [token, lojaId]);

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
            setVendaConcluida(VendaSchema.parse(vendaParaModal)); setShowVendaSucessoModal(true); setCarrinho([]); setValorRecebido(""); fetchProdutos(token, user?.loja_id || ""); fetchVendas(token, user?.loja_id || "");
        } catch (err: any) { toast.error(err.message || "Erro ao finalizar"); setShowConfirmarFinalizar(true); } finally { setLoadingVenda(false); }
    };

    const openModal = (type: 'user' | 'produto', data: UsuarioLoja | ProdutoType | null = null) => {
        setErrorMsg(""); setModalType(type);
        if (type === 'user') {
            console.log("ABRINDO MODAL COM:", data)
            setEditingUser(data as UsuarioLoja | null);
            setFormDataUser({
                nome: (data as UsuarioLoja)?.nome || "",
                email: (data as UsuarioLoja)?.email || "",
                senha: "",
                telefone: (data as UsuarioLoja)?.telefone || "",
                role: ((data as UsuarioLoja)?.role?.toUpperCase() as UserRole) || "VENDEDOR",
                is_active: (data as UsuarioLoja)?.is_active ?? true
            });
        }
        else {
            setEditingProduto(data as ProdutoType | null);
            setFormDataProduto({
                ...formDataProduto,
                nome: (data as ProdutoType)?.nome || "",
                sku: (data as ProdutoType)?.sku || "",
                preco: (data as ProdutoType)?.preco || 0,
                preco_custo: (data as ProdutoType)?.preco_custo || 0,
                estoque: (data as ProdutoType)?.estoque || 0,
                estoque_minimo: (data as ProdutoType)?.estoque_minimo || 5,
                is_active: (data as ProdutoType)?.is_active ?? true,
                loja_id: (data as ProdutoType)?.loja_id || user?.loja_id || "",
                descricao: (data as ProdutoType)?.descricao || "",
                codigo_barras: (data as ProdutoType)?.codigo_barras || null,
                marca: (data as ProdutoType)?.marca || "",
                categoria_id: (data as ProdutoType)?.categoria_id || null,
                unidade: (data as ProdutoType)?.unidade || "UN",
                localizacao: (data as ProdutoType)?.localizacao || "",
                fornecedor_id: (data as ProdutoType)?.fornecedor_id || null,
                data_validade: (data as ProdutoType)?.data_validade || "",
                ncm: (data as ProdutoType)?.ncm || "",
                peso_kg: (data as ProdutoType)?.peso_kg || 0,
                imagem_url: (data as ProdutoType)?.imagem_url || ""
            });
        }
        setShowModal(true);
    };

    const handleAddUserClick = () => {
        setAcaoPendente({
            tipo: 'adicionar',
            entidade: 'user',
            descricao: 'Tem certeza que deseja adicionar este novo membro?',
            data: null
        });
        openModal('user');
    }

    const handleEditUserClick = (u: UsuarioLojaPage) => {
        setAcaoPendente({
            tipo: 'editar',
            entidade: 'user',
            descricao: `Tem certeza que deseja salvar as alterações de ${u.nome}?`,
            data: u
        });
        openModal('user', { ...u, telefone: u.telefone ?? undefined });
    }

    const handleDeleteUserClick = (u: UsuarioLojaPage) => {
        setAcaoPendente({
            tipo: 'apagar',
            entidade: 'user',
            descricao: `Tem certeza que deseja apagar o membro ${u.nome}? Esta ação não pode ser desfeita.`,
            data: u
        });
        setShowPermissaoModal(true);
    }

    const handleViewUserClick = async (u: UsuarioLojaPage) => {
        if (!token || !lojaId) return;
        try {
            setDetalhesUser(await fetchComAuth(`${API_URL}/lojas/id/${lojaId}/usuarios/${u.id}/detalhes`, token));
            setShowDetalhesModal(true);
        } catch (e) { }
    }

    const handleAddProdutoClick = () => {
        setAcaoPendente({
            tipo: 'adicionar',
            entidade: 'produto',
            descricao: 'Tem certeza que deseja adicionar este novo produto?',
            data: null
        });
        openModal('produto');
    }

    const handleEditProdutoClick = (p: ProdutoType) => {
        setAcaoPendente({
            tipo: 'editar',
            entidade: 'produto',
            descricao: `Tem certeza que deseja salvar as alterações de ${p.nome}?`,
            data: p
        });
        openModal('produto', p);
    }

    const handleDeleteProdutoClick = (p: ProdutoType) => {
        setAcaoPendente({
            tipo: 'apagar',
            entidade: 'produto',
            descricao: `Tem certeza que deseja apagar o produto ${p.nome}? Esta ação não pode ser desfeita.`,
            data: p
        });
        setShowPermissaoModal(true);
    }

    const executarAcaoComSenha = async (senha_dono: string) => {
        if (!token || !acaoPendente) return;
        setSaving(true);
        try {
            // PEGA OS DADOS QUE GUARDAMOS QUANDO CLICOU EM "SALVAR"
            const dados = acaoPendente.data;
            if (!dados) throw new Error("Dados perdidos. Feche e tente novamente");

            if (acaoPendente.tipo === 'apagar') {
                const url = acaoPendente.entidade === 'user'
                    ? `${API_URL}/lojas/id/${lojaId}/usuarios/${dados.id}`
                    : `${API_URL}/produtos/${dados.id}`;

                const body = acaoPendente.entidade === 'user'
                    ? { senha_dono, senha_confirmacao: senha_dono }
                    : { loja_id: lojaId, senha_dono, senha_confirmacao: senha_dono };

                await fetchComAuth(url, token, { method: 'DELETE', body: JSON.stringify(body) });
                toast.success(acaoPendente.entidade === 'user' ? "Membro apagado!" : "Produto apagado!");

                if (acaoPendente.entidade === 'user') fetchEquipa(token);
                if (acaoPendente.entidade === 'produto') fetchProdutos(token, lojaId);
            }

            if (acaoPendente.tipo === 'adicionar' || acaoPendente.tipo === 'editar') {
                // JUNTA OS DADOS SALVOS + SENHA E MANDA PRO handleSave
                await handleSave({ ...dados, senha_dono, senha_confirmacao: senha_dono });
            }

            setShowPermissaoModal(false);
            setAcaoPendente(null);
        } catch (err: any) {
            setErroMsgPermissao(err.message || "Senha incorreta");
            setShowErroModal(true);
        } finally {
            setSaving(false);
        }
    }

    const handleSave = async (payload: any, e?: React.FormEvent) => {
        e?.preventDefault();

        console.log("=== INICIO HANDLE SAVE ===")
        console.log("0. PAYLOAD RECEBIDO DO MODAL:", payload)
        console.log("LOJAID:", lojaId, "TOKEN:", !!token, "EDITING_USER:", editingUser)

        if (!token || !lojaId) {
            toast.error("Sessão ou loja expirada. Recarrega a página");
            return;
        }
        setSaving(true);
        setErrorMsg("");
        try {
            let url = "";
            let method = "POST";

            // 1. SE NÃO TEM SENHA DO DONO: Pede senha
            if (!payload.senha_dono || !payload.senha_confirmacao) {
                console.log("1. SEM SENHA - PEDINDO PERMISSAO")
                setAcaoPendente({
                    tipo: modalType === 'user' ? (editingUser ? 'editar' : 'adicionar') : (editingProduto ? 'editar' : 'adicionar'),
                    entidade: modalType,
                    descricao: '',
                    data: payload
                });
                setShowPermissaoModal(true);
                setSaving(false);
                return;
            }

            // 2. MONTA URL E METHOD CORRETO
            if (modalType === 'user') {
                if (editingUser) {
                    // UPDATE
                    url = `${API_URL}/lojas/id/${lojaId}/usuarios/${editingUser.id}`;
                    method = "PUT";
                } else {
                    // CREATE
                    url = `${API_URL}/lojas/id/${lojaId}/usuarios`;
                    method = "POST";
                }
            } else if (modalType === 'produto') {
                url = editingProduto ? `${API_URL}/produtos/${editingProduto.id}` : `${API_URL}/produtos`;
                method = editingProduto ? "PATCH" : "POST";
            }

            console.log("2. URL:", url, "METHOD:", method)

            // 3. MONTA PAYLOAD ÚNICO
            let finalPayload: any = {};

            if (modalType === 'user') {
                if (editingUser) {
                    // UPDATE: só manda o que veio
                    finalPayload = {
                        nome: payload.nome,
                        telefone: payload.telefone || null,
                        role: payload.role,
                        is_active: payload.is_active,
                        senha_dono: payload.senha_dono,
                        senha_confirmacao: payload.senha_confirmacao, // <- confirmação da senha do DONO
                    };
                    // só manda senha se digitou nova senha
                    if (payload.senha && payload.senha.trim()) {
                        finalPayload.senha = payload.senha;
                        finalPayload.senha_confirmacao_user = payload.senha; // <- confirmação da senha do USER
                    }
                    // só manda email se mudou E não estiver vazio
                    if (payload.email && payload.email.trim() && payload.email !== editingUser.email) {
                        finalPayload.email = payload.email;
                    }
                } else {
                    // CREATE: manda tudo. O back gera email automatico
                    finalPayload = {
                        nome: payload.nome,
                        // NÃO MANDA EMAIL VAZIO. Se veio vazio, o back gera
                        ...(payload.email && payload.email.trim() && { email: payload.email }),
                        senha: payload.senha,
                        senha_confirmacao: payload.senha, // <- confirmação da senha do USER
                        telefone: payload.telefone || null,
                        role: payload.role,
                        is_active: payload.is_active,
                        senha_dono: payload.senha_dono, // senha do dono
                        senha_confirmacao_dono: payload.senha_confirmacao // <- confirmação da senha do DONO
                    };
                }

                if (finalPayload.telefone === "") finalPayload.telefone = null;
            }

            if (modalType === 'produto') {
                finalPayload = {
                    ...payload,
                    loja_id: lojaId,
                    preco: Number(payload.preco),
                    preco_custo: Number(payload.preco_custo),
                    estoque: Number(payload.estoque),
                    estoque_minimo: Number(payload.estoque_minimo),
                };
                if (!finalPayload.codigo_barras || String(finalPayload.codigo_barras).trim() === "") {
                    finalPayload.codigo_barras = null;
                }
            }

            console.log("4. PAYLOAD FINAL ENVIADO PRO BACK:", JSON.stringify(finalPayload, null, 2))

            const response = await fetchComAuth(url, token, { method, body: JSON.stringify(finalPayload) });
            console.log("5. RESPOSTA DO BACK:", response)

            toast.success(modalType === 'user' ? (editingUser ? "Membro atualizado!" : "Membro adicionado!") : (editingProduto ? "Produto atualizado!" : "Produto adicionado!"));

            if (modalType === 'user') fetchEquipa(token);
            if (modalType === 'produto') fetchProdutos(token, lojaId);

            setShowModal(false);
            setEditingUser(null);
            setEditingProduto(null);
            setAcaoPendente(null);
        } catch (err: any) {
            console.error("ERRO NO HANDLE SAVE:", err)
            let msg = "Erro ao salvar";
            try {
                const data = JSON.parse(err.message);
                msg = data.detail || JSON.stringify(data);
            } catch {
                msg = err.message || "Erro ao salvar";
            }
            setErrorMsg(msg);
            toast.error(msg);
        } finally {
            setSaving(false);
            console.log("=== FIM HANDLE SAVE ===")
        }
    }

    const vendasParaRisco = useMemo(() => vendas.map(v => ({ id: String(v.id), data: v.data_venda || new Date().toISOString(), total: v.total, formaPagamento: v.forma_pagamento, itens: v.total_itens, detalhes: (v.itens || []).map((it, idx) => ({ id: String(it.produto_id) + '-' + idx, nome_produto: it.nome || 'Produto', quantidade: it.quantidade, preco_unitario: it.preco_unitario, subtotal: it.subtotal })), status: "concluida" })), [vendas]);

    if (!isClient || loading) return (<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--cor-primaria)' }}></div></div>);


    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)' }}>
            <Toaster key={theme} position="top-center" richColors theme={theme as any} />
            {activeTab === "venda" ?
                <VendaTab {...{ produtos, carrinho, busca, setBusca, formaPagamento, setFormaPagamento, valorRecebido, setValorRecebido, subtotal, totalItens, troco, podeFinalizar, adicionarAoCarrinho, confirmarRemoverItem, handleFinalizar, showConfirmarModal, setShowConfirmarModal, itemParaRemover, handleConfirmarRemocao, showConfirmarFinalizar, setShowConfirmarFinalizar, executarFinalizarVenda, loadingVenda, onClose: () => { setActiveTab(initialTabs[0].id); setCarrinho([]) }, token, lojaId, nomeLoja: loja?.nome || "PDV", nifLoja: `NIF: ${loja?.nif || ""}`, enderecoLoja: loja?.endereco || "", theme, cardStyle, cardSize }} />
                :
                <LojaLayout theme={theme} handleSaveTheme={handleSaveTheme} lojaNome={loja?.nome}>
                    <div className="mb-4 sm:mb-6">
                        <div className="p-1 overflow-x-auto scrollbar-hide" style={{ backgroundColor: 'var(--cor-card)', borderRadius: '8px' }}>
                            <div className="flex gap-1 w-max min-w-full">
                                {initialTabs.map(tab => (
                                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 text-xs sm:text-sm font-medium whitespace-nowrap transition" style={{ backgroundColor: activeTab === tab.id ? 'var(--cor-primaria)' : 'transparent', color: activeTab === tab.id ? 'white' : 'var(--cor-texto-sec)', borderRadius: '8px' }}>
                                        <tab.icon size={14} />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="pb-8">
                        {activeTab === "dados" && <DadosTab loja={loja} user={user} theme={theme} cardStyle={cardStyle} cardSize={cardSize} />}
                        {activeTab === "produtos" && <ProdutosTab produtos={produtos} isAdmin={podeEditarApagar} isDono={["DONO"].includes(user?.nivel!)} lojaId={lojaId} onAdd={podeEditarApagar ? handleAddProdutoClick : () => toast.error("Apenas Dono/Gerente")} onEdit={podeEditarApagar ? handleEditProdutoClick : () => toast.error("Apenas Dono/Gerente")} onDelete={podeEditarApagar ? handleDeleteProdutoClick : () => toast.error("Apenas Dono/Gerente")} theme={theme} cardStyle={cardStyle} cardSize={cardSize} formatCurrency={formatCurrency} />}
                        {activeTab === "equipa" && <EquipaTab equipa={equipa} isAdmin={podeEditarApagar} isDono={["DONO"].includes(user?.nivel!)} lojaId={lojaId} onAdd={podeEditarApagar ? handleAddUserClick : () => toast.error("Apenas Dono/Gerente")} onEdit={podeEditarApagar ? handleEditUserClick : () => toast.error("Apenas Dono/Gerente")} onDelete={podeEditarApagar ? handleDeleteUserClick : () => toast.error("Apenas Dono/Gerente")} onView={handleViewUserClick} theme={theme} cardStyle={cardStyle} cardSize={cardSize} />}

                        {activeTab === "estatisticas" && <EstatisticasTab lojaId={lojaId} token={token} nomeLoja={loja?.nome || "MINHA LOJA"} nifLoja={`NIF: ${loja?.nif || ""}`} enderecoLoja={loja?.endereco || ""} theme={theme} cardStyle={cardStyle} cardSize={cardSize} formatCurrency={formatCurrency} />}
                        {activeTab === "risco" && <RiscoTab vendas={vendasParaRisco as any} produtos={produtos} theme={theme} cardStyle={cardStyle} cardSize={cardSize} formatCurrency={formatCurrency} />}
                        {activeTab === "fornecedores" && <FornecedoresTab theme={theme} cardStyle={cardStyle} cardSize={cardSize} />}


                        {activeTab === "documentos" && (
                            <DocumentosTab
                                loja={loja}
                                dadosFiltrados={{ vendasF: vendas }}
                                tipoRelatorio="Vendas"
                            />
                        )}




                        {activeTab === "definicoes" && <DefinicoesTab onSaveTheme={handleSaveTheme} theme={theme} cardStyle={cardStyle} cardSize={cardSize} fontSize={fontSize} corPrimaria={corPrimaria} corFundo={corFundo} />}
                    </div>

                    <UserModal open={showModal && modalType === 'user'} onOpenChange={(v) => { if (!saving) setShowModal(v) }} editingUser={editingUser} formData={formDataUser} setFormData={setFormDataUser} onSave={handleSave} saving={saving} errorMsg={errorMsg} lojaNome={loja?.nome} />
                    <ProdutoModal open={showModal && modalType === 'produto'} onOpenChange={(v) => { if (!saving) setShowModal(v) }} editingProduto={editingProduto} formData={formDataProduto} setFormData={setFormDataProduto} onSave={handleSave} saving={saving} errorMsg={errorMsg} />
                    <PermissaoModal open={showPermissaoModal} onClose={() => { setShowPermissaoModal(false); setAcaoPendente(null) }} onConfirm={executarAcaoComSenha} titulo={acaoPendente?.tipo === 'editar' ? "Confirmar Edição" : "Confirmar Exclusão"} loading={saving} />
                    <ErroModal open={showErroModal} onClose={() => setShowErroModal(false)} mensagem={erroMsgPermissao} />
                    <DetalhesModal open={showDetalhesModal} onClose={() => setShowDetalhesModal(false)} dados={detalhesUser} />
                    <ConfirmarModal open={showConfirmarModal} onClose={() => { setShowConfirmarModal(false); setItemParaRemover(null) }} onConfirm={handleConfirmarRemocao} titulo="Remover do Carrinho" descricao={`Deseja remover ${itemParaRemover?.nome} do carrinho?`} loading={false} tipo="venda" />
                </LojaLayout>
            }

            {/* MODAL GLOBAL - FORA DO TERNARIO PRA FUNCIONAR NA VENDA TAMBEM */}
            <VendaSucessoModal open={showVendaSucessoModal} onClose={() => { setShowVendaSucessoModal(false); setVendaConcluida(null) }} venda={vendaConcluida} loja_nome={loja?.nome || ""} loja_nif={loja?.nif || ""} loja_endereco={loja?.endereco || ""} loja_telefone={loja?.telefone || ""} loja_logo={loja?.logo_url || ""} formatCurrency={formatCurrency} />
        </div>
    );


}
