"use client";
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadCloud, X, Loader2, DollarSign, Package, Image as ImageIcon, QrCode, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
const API_BASE = API_URL.replace('/api/v1', '');
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const getCookie = (name: string): string | undefined => { if (typeof window === "undefined") return undefined; return document.cookie.split('; ').reduce((r, v) => { const parts = v.split('='); return parts[0] === name ? decodeURIComponent(parts[1]) : r; }, ''); };

const gerarSkuAleatorio = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'PROD-';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

export type Produto = {
    id: string;
    nome: string;
    descricao?: string;
    sku?: string;
    marca?: string;
    preco: number;
    preco_custo?: number;
    preco_venda?: number;
    estoque?: number;
    estoque_minimo?: number;
    unidade?: string;
    is_active?: boolean;
    imagem_url?: string;
    codigo_barras?: string | null;
    loja_id?: string;
    categoria_id?: string | number | null;
    localizacao?: string;
    fornecedor_id?: string | number | null;
    data_validade?: string;
    ncm?: string;
    peso_kg?: number | null;
}

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingProduto: Produto | null;
    formData: any;
    setFormData: (data: any) => void;
    onSave: (data: any) => void;
    saving: boolean;
    errorMsg: string;
}

export function ProdutoModal({ open, onOpenChange, editingProduto, formData, setFormData, onSave, saving, errorMsg }: Props) {
    const [preview, setPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [erroModal, setErroModal] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const lucro = (formData.preco || 0) - (formData.preco_custo || 0);
    const qrLink = formData.sku ? `${APP_URL}/p/${formData.sku}` : null;

    useEffect(() => {
        if (open && !editingProduto && !formData.sku) {
            setFormData((prev: any) => ({ ...prev, sku: gerarSkuAleatorio() }));
        }
        if (editingProduto?.imagem_url) {
            const url = editingProduto.imagem_url.startsWith('http') ? editingProduto.imagem_url : `${API_BASE}${editingProduto.imagem_url}`;
            setPreview(url);
        } else {
            setPreview(null);
        }
        if (editingProduto && editingProduto.codigo_barras === "") {
            setFormData((prev: any) => ({ ...prev, codigo_barras: undefined }));
        }
        if (errorMsg) {
            let mensagemAmigavel = "Ocorreu um erro inesperado. Tente novamente.";
            if (errorMsg.includes("SKU já cadastrado")) {
                mensagemAmigavel = "Este SKU já existe nesta loja. Clique em 'Gerar Novo SKU' para criar um diferente.";
            }
            if (errorMsg.includes("Código de barras")) {
                mensagemAmigavel = "Este código de barras já está sendo usado por outro produto.";
            }
            setErroModal(mensagemAmigavel);
        }
    }, [editingProduto, open, errorMsg, setFormData, formData.sku]);

    const validateFile = (file: File) => {
        if (!file.type.startsWith('image/')) { toast.error("Apenas imagens são permitidas"); return false; }
        if (file.size > MAX_FILE_SIZE) { toast.error("Imagem muito grande. Máximo 5MB"); return false; }
        return true;
    }

    const handleFile = (file: File) => {
        if (!validateFile(file)) return;
        setPreview(URL.createObjectURL(file));
        setFormData({ ...formData, file_to_upload: file });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const handleDrag = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.type === "dragenter" || e.type === "dragover") setDragActive(true); else if (e.type === "dragleave") setDragActive(false); };
    const handleDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); const file = e.dataTransfer.files?.[0]; if (file) handleFile(file); };

    const handleSaveClick = async () => {
        if (!formData.nome || formData.nome.length < 2) { toast.error("Nome do produto é obrigatório"); return; }
        if ((formData.preco || 0) <= 0) { toast.error("Preço de venda deve ser maior que 0"); return; }

        let finalData = { ...formData };
        const file = finalData.file_to_upload;
        const token = getCookie('token');
        let urls: any = {};

        if (file && token) {
            setUploading(true);
            try {
                const formDataUpload = new FormData();
                formDataUpload.append('file', file);

                const [resLocal, resCloud] = await Promise.all([
                    fetch(`${API_URL}/upload/produto/local`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                        body: formDataUpload
                    }),
                    fetch(`${API_URL}/upload/produto/cloudinary`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                        body: formDataUpload
                    })
                ]);

                if (resLocal.ok) {
                    const dataLocal = await resLocal.json();
                    urls.local = dataLocal.url;
                }

                if (resCloud.ok) {
                    const dataCloud = await resCloud.json();
                    urls.cloudinary = dataCloud.optimized_url;
                    urls.public_id = dataCloud.public_id;
                }

                finalData.imagem_url = urls.cloudinary || urls.local;

                if (!finalData.imagem_url) throw new Error("Falha em ambos os uploads");

                toast.success(`Imagem salva! Cloud: ${!!urls.cloudinary} | Local: ${!!urls.local}`);

            } catch (err: any) {
                toast.error("Erro ao enviar imagem: " + err.message);
                setUploading(false);
                return;
            }
            setUploading(false);
        }

        delete finalData.file_to_upload;
        if (!finalData.codigo_barras || String(finalData.codigo_barras).trim() === "") {
            finalData.codigo_barras = null;
        }

        onSave(finalData);
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData({ ...formData, [field]: value });
    }

    const inputStyle = {
        backgroundColor: 'var(--cor-fundo)',
        color: 'var(--cor-texto)',
        border: '1.5px solid var(--cor-primaria)',
        borderRadius: 'var(--radius-sm)',
        outline: 'none',
        boxShadow: '0 0 0 1px transparent'
    }
    const focusStyle = { boxShadow: '0 0 0 3px var(--cor-primaria)30' }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent
                    onInteractOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={(e) => e.preventDefault()}
                    className="!max-w-[800px] w-full p-0 h- flex-col border shadow-2xl [&>button]:hidden"
                    style={{
                        backgroundColor: 'var(--cor-card)',
                        color: 'var(--cor-texto)',
                        borderColor: 'var(--cor-borda)',
                        borderRadius: 'var(--radius)'
                    }}
                >
                    <DialogHeader className="p-4 sm:p-6 pb-4 shrink-0">
                        <DialogTitle className="text-lg sm:text-xl" style={{ color: 'var(--cor-texto)' }}>{editingProduto ? "Editar Produto" : "Adicionar Novo Produto"}</DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm" style={{ color: 'var(--cor-texto-sec)' }}>Preencha as informações do produto. Campos com * são obrigatórios.</DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto px-4 sm:px-6 scrollbar-hide">
                        <Tabs defaultValue="dados" className="w-full">
                            <TabsList
                                className="grid w-full grid-cols-3 sticky top-0 z-10 h-11"
                                style={{ backgroundColor: 'var(--cor-fundo)', borderRadius: 'var(--radius)' }}
                            >
                                <TabsTrigger value="dados" className="text-xs sm:text-sm data-[state=active]:bg-[var(--cor-primaria)] data-[state=active]:text-white"><Package size={14} className="mr-1 sm:mr-2" />Dados</TabsTrigger>
                                <TabsTrigger value="imagem" className="text-xs sm:text-sm data-[state=active]:bg-[var(--cor-primaria)] data-[state=active]:text-white"><ImageIcon size={14} className="mr-1 sm:mr-2" />Imagem</TabsTrigger>
                                <TabsTrigger value="preco" className="text-xs sm:text-sm data-[state=active]:bg-[var(--cor-primaria)] data-[state=active]:text-white"><DollarSign size={14} className="mr-1 sm:mr-2" />Preço</TabsTrigger>
                            </TabsList>
                            <div className="py-4">
                                <TabsContent value="dados" className="space-y-5 mt-0">
                                    <div className="space-y-2">
                                        <Label style={{ color: 'var(--cor-texto-sec)' }}>Nome do Produto *</Label>
                                        <Input placeholder="Ex: Arroz 5kg" value={formData.nome || ''} onChange={(e) => handleInputChange("nome", e.target.value)} className="h-11 px-3" style={{ ...inputStyle, ...focusStyle }} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label style={{ color: 'var(--cor-texto-sec)' }}>Descrição</Label>
                                        <Textarea placeholder="Descrição opcional..." value={formData.descricao || ''} onChange={(e) => handleInputChange("descricao", e.target.value)} className="px-3 py-3 min-h-28" style={{ ...inputStyle, ...focusStyle }} />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <Label style={{ color: 'var(--cor-texto-sec)' }}>SKU</Label>
                                            <div className="flex gap-2">
                                                <Input placeholder="Gerado automaticamente" value={formData.sku || ''} disabled className="h-11 flex-1" style={{ ...inputStyle, backgroundColor: 'var(--cor-card)', color: 'var(--cor-texto-sec)', cursor: 'not-allowed' }} />
                                                {!editingProduto && (
                                                    <Button type="button" size="icon" onClick={() => handleInputChange("sku", gerarSkuAleatorio())} className="h-11 w-11 shrink-0" style={{ backgroundColor: 'var(--cor-card)', color: 'var(--cor-texto)', border: '1px solid var(--cor-borda)' }}>
                                                        <RefreshCw size={16} />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label style={{ color: 'var(--cor-texto-sec)' }}>Marca</Label>
                                            <Input placeholder="Ex: Nivea" value={formData.marca || ''} onChange={(e) => handleInputChange("marca", e.target.value)} className="h-11 px-3" style={{ ...inputStyle, ...focusStyle }} />
                                        </div>
                                    </div>
                                </TabsContent>
                                <TabsContent value="imagem" className="space-y-5 mt-0">
                                    <div className="space-y-2">
                                        <Label style={{ color: 'var(--cor-texto-sec)' }}>Imagem do Produto</Label>
                                        <div
                                            onDragEnter={handleDrag}
                                            onDragLeave={handleDrag}
                                            onDragOver={handleDrag}
                                            onDrop={handleDrop}
                                            className="relative w-full h-52 sm:h-72 border-2 border-dashed transition-colors"
                                            style={{
                                                borderColor: dragActive ? 'var(--cor-primaria)' : 'var(--cor-borda)',
                                                backgroundColor: dragActive ? 'var(--cor-primaria)10' : 'var(--cor-fundo)',
                                                borderRadius: 'var(--radius)'
                                            }}
                                        >
                                            {preview ? (
                                                <>
                                                    <img src={preview} alt="Preview" className="w-full h-full object-contain rounded-lg p-2" />
                                                    <Button type="button" size="icon" variant="destructive" className="absolute top-2 right-2 h-8 w-8 rounded-full" onClick={() => { setPreview(null); setFormData({ ...formData, file_to_upload: null, imagem_url: "" }) }}><X size={16} /></Button>
                                                </>
                                            ) : (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center" style={{ color: 'var(--cor-texto-sec)' }}>
                                                    <UploadCloud size={32} className="mb-2" />
                                                    <p className="text-sm font-medium">Arraste e solte ou clique</p>
                                                    <p className="text-xs">PNG, JPG, WEBP até 5MB</p>
                                                </div>
                                            )}
                                            <Input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                        </div>
                                    </div>
                                    {qrLink && (
                                        <div className="space-y-2 p-4 border" style={{ backgroundColor: 'var(--cor-fundo)', borderColor: 'var(--cor-borda)', borderRadius: 'var(--radius)' }}>
                                            <Label className="flex items-center gap-2" style={{ color: 'var(--cor-texto-sec)' }}><QrCode size={16} /> QR Code do Produto</Label>
                                            <div className="flex justify-center bg-white p-3 rounded">
                                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrLink)}`} alt="QR Code" className="w-40 h-40" />
                                            </div>
                                            <p className="text-xs text-center break-all" style={{ color: 'var(--cor-texto-sec)' }}>{qrLink}</p>
                                        </div>
                                    )}
                                    {!qrLink && (<p className="text-xs text-center" style={{ color: 'var(--cor-texto-sec)' }}>Salve o produto para gerar o QR Code</p>)}
                                    {uploading && <p className="text-xs flex items-center gap-2" style={{ color: 'var(--cor-primaria)' }}><Loader2 size={14} className="animate-spin" /> Enviando imagem...</p>}
                                </TabsContent>
                                <TabsContent value="preco" className="space-y-5 mt-0">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <Label style={{ color: 'var(--cor-texto-sec)' }}>Preço de Custo</Label>
                                            <Input type="number" step="0.01" placeholder="0.00" value={formData.preco_custo || ''} onChange={(e) => handleInputChange("preco_custo", parseFloat(e.target.value) || 0)} className="h-11 px-3" style={{ ...inputStyle, ...focusStyle }} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label style={{ color: 'var(--cor-texto-sec)' }}>Preço de Venda *</Label>
                                            <Input type="number" step="0.01" placeholder="0.00" value={formData.preco || ''} onChange={(e) => handleInputChange("preco", parseFloat(e.target.value) || 0)} className="h-11 px-3" style={{ ...inputStyle, ...focusStyle }} />
                                        </div>
                                    </div>
                                    <div className="p-4 border" style={{ backgroundColor: 'var(--cor-fundo)', borderColor: 'var(--cor-borda)', borderRadius: 'var(--radius)' }}>
                                        <div className="flex justify-between items-center text-sm">
                                            <span style={{ color: 'var(--cor-texto-sec)' }}>Lucro por unidade</span>
                                            <span className="font-bold text-base sm:text-lg" style={{ color: lucro >= 0 ? 'var(--cor-primaria)' : 'var(--cor-erro)' }}>
                                                {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(lucro)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                                        <div className="space-y-2">
                                            <Label style={{ color: 'var(--cor-texto-sec)' }}>Estoque Atual</Label>
                                            <Input type="number" value={formData.estoque || 0} onChange={(e) => handleInputChange("estoque", parseInt(e.target.value) || 0)} className="h-11 px-3" style={{ ...inputStyle, ...focusStyle }} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label style={{ color: 'var(--cor-texto-sec)' }}>Estoque Mínimo</Label>
                                            <Input type="number" value={formData.estoque_minimo || 5} onChange={(e) => handleInputChange("estoque_minimo", parseInt(e.target.value) || 0)} className="h-11 px-3" style={{ ...inputStyle, ...focusStyle }} />
                                        </div>

                                        <div className="space-y-2 col-span-2 sm:col-span-1">
                                            <Label style={{ color: 'var(--cor-texto-sec)' }}>Unidade</Label>
                                            <Select value={formData.unidade || 'UN'} onValueChange={(val) => handleInputChange("unidade", val)}>
                                                <SelectTrigger
                                                    className="h-11"
                                                    style={{
                                                        backgroundColor: 'var(--cor-card)',
                                                        color: 'var(--cor-texto)',
                                                        border: '1.5px solid var(--cor-primaria)',
                                                        borderRadius: 'var(--radius-sm)'
                                                    }}
                                                >
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent
                                                    style={{
                                                        backgroundColor: 'var(--cor-card)',
                                                        borderColor: 'var(--cor-borda)',
                                                        color: 'var(--cor-texto)'
                                                    }}
                                                >
                                                    <SelectItem value="UN">Un</SelectItem>
                                                    <SelectItem value="KG">Kg</SelectItem>
                                                    <SelectItem value="LT">Lt</SelectItem>
                                                    <SelectItem value="CX">Cx</SelectItem>
                                                    <SelectItem value="PCT">Pct</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </TabsContent>
                            </div>
                        </Tabs>
                    </div>

                    <DialogFooter className="p-4 sm:p-6 pt-4 border-t shrink-0 flex-col sm:flex-row gap-2" style={{ backgroundColor: 'var(--cor-card)', borderColor: 'var(--cor-borda)' }}>
                        <div className="flex items-center space-x-2 mr-auto">
                            <Checkbox
                                id="active"
                                checked={formData.is_active ?? true}
                                onCheckedChange={(val) => handleInputChange("is_active", !!val)}
                                className="data-[state=checked]:bg-[var(--cor-primaria)] data-[state=checked]:border-[var(--cor-primaria)]"
                            />
                            <Label htmlFor="active" className="text-sm font-medium cursor-pointer" style={{ color: 'var(--cor-texto-sec)' }}>Produto Ativo</Label>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button
                                type="button"
                                onClick={() => onOpenChange(false)}
                                disabled={saving || uploading}
                                className="flex-1 sm:flex-initial h-11 font-semibold"
                                style={{
                                    backgroundColor: 'var(--cor-card)',
                                    color: 'var(--cor-texto)',
                                    border: '1px solid var(--cor-borda)',
                                    borderRadius: 'var(--radius)'
                                }}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSaveClick}
                                disabled={saving || uploading}
                                className="flex-1 sm:flex-initial min-w-28 h-11 font-bold"
                                style={{
                                    background: 'var(--cor-primaria)',
                                    color: '#fff',
                                    borderRadius: 'var(--radius)'
                                }}
                            >
                                {(saving || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingProduto ? 'Salvar' : 'Criar'}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODAL DE ERRO */}
            <Dialog open={!!erroModal} onOpenChange={() => { }}>
                <DialogContent
                    onInteractOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={(e) => e.preventDefault()}
                    className="max-w-md border [&>button]:hidden"
                    style={{
                        backgroundColor: 'var(--cor-card)',
                        color: 'var(--cor-texto)',
                        borderColor: 'var(--cor-erro)30',
                        borderRadius: 'var(--radius)'
                    }}
                >
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2" style={{ color: 'var(--cor-erro)' }}><AlertCircle size={20} /> Erro ao Salvar</DialogTitle>
                        <DialogDescription style={{ color: 'var(--cor-texto-sec)' }}>Não foi possível concluir a operação</DialogDescription>
                    </DialogHeader>
                    <div className="py-2"><p className="text-sm" style={{ color: 'var(--cor-texto)' }}>{erroModal}</p></div>
                    <DialogFooter>
                        <Button
                            onClick={() => setErroModal(null)}
                            className="w-full h-11 font-bold"
                            style={{
                                backgroundColor: 'var(--cor-erro)',
                                color: '#fff',
                                borderRadius: 'var(--radius)'
                            }}
                        >
                            Entendi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
