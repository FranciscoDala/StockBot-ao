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
// import { Produto } from "../modals/ProdutoModal"; // REMOVIDO - causava import circular

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
const API_BASE = API_URL.replace('/api/v1', '');
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const getCookie = (name: string): string | undefined => { if (typeof window === "undefined") return undefined; return document.cookie.split('; ').reduce((r, v) => { const parts = v.split('='); return parts[0] === name? decodeURIComponent(parts[1]) : r; }, ''); };

const gerarSkuAleatorio = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'PROD-';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Adicionei export aqui
export type Produto = {
    id?: string;
    nome: string;
    descricao?: string;
    sku?: string;
    marca?: string;
    preco: number;
    preco_custo?: number;
    estoque?: number;
    estoque_minimo?: number;
    unidade?: string;
    is_active?: boolean;
    imagem_url?: string;
    codigo_barras?: string | null;
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
    const qrLink = formData.sku? `${APP_URL}/p/${formData.sku}` : null;

    useEffect(() => {
        if (open &&!editingProduto &&!formData.sku) {
            setFormData((prev: any) => ({...prev, sku: gerarSkuAleatorio() }));
        }
        if (editingProduto?.imagem_url) {
            setPreview(editingProduto.imagem_url.startsWith('http')? editingProduto.imagem_url : `${API_BASE}${editingProduto.imagem_url}`);
        } else {
            setPreview(null);
        }
        if (editingProduto && editingProduto.codigo_barras === "") {
            setFormData((prev: any) => ({...prev, codigo_barras: undefined }));
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
        setFormData({...formData, file_to_upload: file });
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
        let finalData = {...formData };
        const file = finalData.file_to_upload;
        const token = getCookie('token');
        if (file && token) {
            setUploading(true);
            try {
                const formDataUpload = new FormData();
                formDataUpload.append('file', file);
                const uploadRes = await fetch(`${API_URL}/upload/produto`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formDataUpload
                });
                if (!uploadRes.ok) {
                    const err = await uploadRes.json();
                    throw new Error(err.detail || "Falha no upload da imagem");
                }
                const uploadData = await uploadRes.json();
                finalData.imagem_url = uploadData.url;
                toast.success("Imagem enviada!");
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
        if (finalData.imagem_url === "") {
            finalData.imagem_url = null;
        }
        onSave(finalData);
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData({...formData, [field]: value });
    }

    const inputClass = "bg-neutral-900 border-neutral-700 focus:border-green-500 h-11 px-3"

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent
                    onInteractOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={(e) => e.preventDefault()}
                    className="!max-w-[800px] w-full bg-neutral-950 border-neutral-800 text-white p-0 h-[90vh] flex-col [&>button]:hidden"
                >
                    <DialogHeader className="p-4 sm:p-6 pb-4 shrink-0">
                        <DialogTitle className="text-lg sm:text-xl">{editingProduto? "Editar Produto" : "Adicionar Novo Produto"}</DialogTitle>
                        <DialogDescription className="text-gray-400 text-xs sm:text-sm">Preencha as informações do produto. Campos com * são obrigatórios.</DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto px-4 sm:px-6 no-scrollbar">
                        <Tabs defaultValue="dados" className="w-full">
                            <TabsList className="grid w-full grid-cols-3 bg-neutral-900 sticky top-0 z-10 h-11">
                                <TabsTrigger value="dados" className="text-xs sm:text-sm"><Package size={14} className="mr-1 sm:mr-2" />Dados</TabsTrigger>
                                <TabsTrigger value="imagem" className="text-xs sm:text-sm"><ImageIcon size={14} className="mr-1 sm:mr-2" />Imagem</TabsTrigger>
                                <TabsTrigger value="preco" className="text-xs sm:text-sm"><DollarSign size={14} className="mr-1 sm:mr-2" />Preço</TabsTrigger>
                            </TabsList>
                            <div className="py-4">
                                <TabsContent value="dados" className="space-y-5 mt-0">
                                    <div className="space-y-2">
                                        <Label>Nome do Produto *</Label>
                                        <Input placeholder="Ex: Arroz 5kg" value={formData.nome || ''} onChange={(e) => handleInputChange("nome", e.target.value)} className={inputClass} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Descrição</Label>
                                        <Textarea placeholder="Descrição opcional..." value={formData.descricao || ''} onChange={(e) => handleInputChange("descricao", e.target.value)} className={`bg-neutral-900 border-neutral-700 focus:border-green-500 px-3 py-3 min-h-28`} />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <Label>SKU</Label>
                                            <div className="flex gap-2">
                                                <Input placeholder="Gerado automaticamente" value={formData.sku || ''} disabled className={`${inputClass} bg-neutral-800 text-gray-300 cursor-not-allowed flex-1`} />
                                                {!editingProduto && (
                                                    <Button type="button" variant="secondary" size="icon" onClick={() => handleInputChange("sku", gerarSkuAleatorio())} className="bg-neutral-800 hover:bg-neutral-700 h-11 w-11 shrink-0">
                                                        <RefreshCw size={16} />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Marca</Label>
                                            <Input placeholder="Ex: Nivea" value={formData.marca || ''} onChange={(e) => handleInputChange("marca", e.target.value)} className={inputClass} />
                                        </div>
                                    </div>
                                </TabsContent>
                                <TabsContent value="imagem" className="space-y-5 mt-0">
                                    <div className="space-y-2">
                                        <Label>Imagem do Produto</Label>
                                        <div onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} className={`relative w-full h-52 sm:h-72 rounded-lg border-2 border-dashed transition-colors ${dragActive? 'border-green-500 bg-green-500/10' : 'border-neutral-700 bg-neutral-900'}`}>
                                            {preview? (
                                                <>
                                                    <img src={preview} alt="Preview" className="w-full h-full object-contain rounded-lg p-2" />
                                                    <Button type="button" size="icon" variant="destructive" className="absolute top-2 right-2 h-8 w-8 rounded-full" onClick={() => { setPreview(null); setFormData({...formData, file_to_upload: null, imagem_url: "" }) }}><X size={16} /></Button>
                                                </>
                                            ) : (
                                                <div className="absolute inset-0 flex-col items-center justify-center text-gray-500 text-center">
                                                    <UploadCloud size={32} className="mb-2" />
                                                    <p className="text-sm font-medium">Arraste e solte ou clique</p>
                                                    <p className="text-xs">PNG, JPG, WEBP até 5MB</p>
                                                </div>
                                            )}
                                            <Input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                        </div>
                                    </div>
                                    {qrLink && (
                                        <div className="space-y-2 p-4 bg-neutral-900 rounded-lg border-neutral-800">
                                            <Label className="flex items-center gap-2"><QrCode size={16} /> QR Code do Produto</Label>
                                            <div className="flex justify-center bg-white p-3 rounded">
                                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrLink)}`} alt="QR Code" className="w-40 h-40" />
                                            </div>
                                            <p className="text-xs text-gray-400 text-center break-all">{qrLink}</p>
                                        </div>
                                    )}
                                    {!qrLink && (<p className="text-xs text-gray-500 text-center">Salve o produto para gerar o QR Code</p>)}
                                    {uploading && <p className="text-xs text-yellow-400 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Enviando imagem...</p>}
                                </TabsContent>
                                <TabsContent value="preco" className="space-y-5 mt-0">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <Label>Preço de Custo</Label>
                                            <Input type="number" step="0.01" placeholder="0.00" value={formData.preco_custo || ''} onChange={(e) => handleInputChange("preco_custo", parseFloat(e.target.value) || 0)} className={inputClass} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Preço de Venda *</Label>
                                            <Input type="number" step="0.01" placeholder="0.00" value={formData.preco || ''} onChange={(e) => handleInputChange("preco", parseFloat(e.target.value) || 0)} className={inputClass} />
                                        </div>
                                    </div>
                                    <div className="bg-neutral-900 p-4 rounded-lg border-neutral-800">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-400">Lucro por unidade</span>
                                            <span className={`font-bold text-base sm:text-lg ${lucro >= 0? 'text-green-400' : 'text-red-400'}`}>
                                                {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(lucro)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                                        <div className="space-y-2">
                                            <Label>Estoque Atual</Label>
                                            <Input type="number" value={formData.estoque || 0} onChange={(e) => handleInputChange("estoque", parseInt(e.target.value) || 0)} className={inputClass} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Estoque Mínimo</Label>
                                            <Input type="number" value={formData.estoque_minimo || 5} onChange={(e) => handleInputChange("estoque_minimo", parseInt(e.target.value) || 0)} className={inputClass} />
                                        </div>
                                        <div className="space-y-2 col-span-2 sm:col-span-1">
                                            <Label>Unidade</Label>
                                            <Select value={formData.unidade || 'UN'} onValueChange={(val) => handleInputChange("unidade", val)}>
                                                <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                                                <SelectContent className="bg-neutral-900 border-neutral-700">
                                                    <SelectItem value="UN">UN</SelectItem><SelectItem value="KG">KG</SelectItem><SelectItem value="LT">LT</SelectItem>
                                                    <SelectItem value="CX">CX</SelectItem><SelectItem value="PCT">PCT</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </TabsContent>
                            </div>
                        </Tabs>
                    </div>

                    <DialogFooter className="p-4 sm:p-6 pt-4 border-t border-neutral-800 shrink-0 flex-col sm:flex-row gap-2">
                        <div className="flex items-center space-x-2 mr-auto">
                            <Checkbox id="active" checked={formData.is_active?? true} onCheckedChange={(val) => handleInputChange("is_active",!!val)} className="border-neutral-600 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600" />
                            <Label htmlFor="active" className="text-sm text-gray-300 font-medium cursor-pointer">Produto Ativo</Label>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={saving || uploading} className="flex-1 sm:flex-initial h-11">Cancelar</Button>
                            <Button type="button" onClick={handleSaveClick} disabled={saving || uploading} className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-initial min-w-28 h-11">
                                {(saving || uploading) && <Loader2 className="mr-4 h-4 w-4 animate-spin" />}
                                {editingProduto? 'Salvar' : 'Criar'}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!erroModal} onOpenChange={() => {}}>
                <DialogContent
                    onInteractOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={(e) => e.preventDefault()}
                    className="bg-neutral-900 border-red-500/30 text-white max-w-md [&>button]:hidden"
                >
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-400"><AlertCircle size={20} /> Erro ao Salvar</DialogTitle>
                        <DialogDescription className="text-gray-400">Não foi possível concluir a operação</DialogDescription>
                    </DialogHeader>
                    <div className="py-2"><p className="text-sm text-gray-300">{erroModal}</p></div>
                    <DialogFooter>
                        <Button onClick={() => setErroModal(null)} className="bg-red-600 hover:bg-red-700 w-full h-11">Entendi</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
