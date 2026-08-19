"use client";

import { Dispatch, SetStateAction, FormEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

const focusStyle = { outline: 'none', boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.3)' }

export type ClienteForm = {
    nome: string;
    nome_empresa: string | null;
    bi: string | null;
    telefone: string | null;
    email: string | null;
    endereco: string | null;
    cidade: string | null;
    provincia: string | null;
    observacoes: string | null;
    is_active: boolean;
}

interface Props {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    isEditing?: boolean;
    formData: ClienteForm;
    setFormData: Dispatch<SetStateAction<ClienteForm>>;
    onSave: (e: FormEvent) => void;
    saving: boolean;
    handleChange: (field: keyof ClienteForm, value: string | boolean | null) => void;
}

export function ClienteModal({ open, onOpenChange, isEditing = false, formData, setFormData, onSave, saving, handleChange }: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="w-full max-w-md mx-4 p-0 flex-col border shadow-2xl overflow-hidden" // <- CENTRALIZADO + ESPAÇO
                style={{
                    backgroundColor: 'var(--cor-card)',
                    color: 'var(--cor-texto)',
                    borderColor: 'var(--cor-borda)',
                    borderRadius: 'var(--radius)',
                    maxHeight: '90vh', // <- ALTURA FLEXIVEL
                    backdropFilter: 'blur(10px)'
                }}
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <form onSubmit={onSave} className="flex flex-col flex-1 min-h-0">
                    <DialogHeader className="p-4 pb-0 shrink-0">
                        <DialogTitle className="text-lg text-center" style={{ color: 'var(--cor-texto)' }}> {/* <- TITULO CENTRALIZADO */}
                            {isEditing? "Editar Cliente" : "Cadastrar Cliente"}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-center" style={{ color: 'var(--cor-texto-sec)' }}> {/* <- SUBTITULO CENTRALIZADO */}
                            {isEditing? "Altere os dados do cliente." : "Preencha os dados do cliente"}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4 px-4 overflow-y-auto flex-1 min-h-0 scrollbar-hide"> {/* <- GRID SIMPLES */}
                        <p className="text-sm font-semibold -mb-1" style={{ color: 'var(--cor-texto-sec)' }}>Dados Pessoais</p>

                        <div className="grid grid-cols-1 gap-1"> {/* <- 1 COLUNA NO MOBILE */}
                            <Label htmlFor="nome" className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>Nome Completo *</Label>
                            <Input id="nome" value={formData.nome} onChange={e => handleChange('nome', e.target.value)} className="text-xs h-9 w-full" style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)', border: '1.5px solid var(--cor-primaria)', borderRadius: 'var(--radius-sm)',...focusStyle }} required />
                        </div>

                        <div className="grid grid-cols-1 gap-1">
                            <Label htmlFor="bi" className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>BI / Passaporte</Label>
                            <Input id="bi" value={formData.bi || ""} onChange={e => handleChange('bi', e.target.value)} placeholder="000LA000" className="text-xs h-9 w-full" style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)', border: '1.5px solid var(--cor-primaria)', borderRadius: 'var(--radius-sm)',...focusStyle }} />
                        </div>

                        <div className="grid grid-cols-1 gap-1">
                            <Label htmlFor="telefone" className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>Telefone *</Label>
                            <Input id="telefone" value={formData.telefone || ""} onChange={e => handleChange('telefone', e.target.value)} placeholder="923 456 789" className="text-xs h-9 w-full" style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)', border: '1.5px solid var(--cor-primaria)', borderRadius: 'var(--radius-sm)',...focusStyle }} required />
                        </div>

                        <div className="grid grid-cols-1 gap-1">
                            <Label htmlFor="email" className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>Email</Label>
                            <Input id="email" type="email" value={formData.email || ""} onChange={e => handleChange('email', e.target.value)} placeholder="cliente@email.com" className="text-xs h-9 w-full" style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)', border: '1.5px solid var(--cor-primaria)', borderRadius: 'var(--radius-sm)',...focusStyle }} />
                        </div>

                        <div className="border-t pt-4 mt-1"><p className="text-sm font-semibold -mb-1" style={{ color: 'var(--cor-texto-sec)' }}>Dados Comerciais e Endereço</p></div>

                        <div className="grid grid-cols-1 gap-1">
                            <Label htmlFor="nome_empresa" className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>Nome Empresa</Label>
                            <Input id="nome_empresa" value={formData.nome_empresa || ""} onChange={e => handleChange('nome_empresa', e.target.value)} placeholder="Empresa LDA" className="text-xs h-9 w-full" style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)', border: '1.5px solid var(--cor-primaria)', borderRadius: 'var(--radius-sm)',...focusStyle }} />
                        </div>

                        <div className="grid grid-cols-1 gap-1">
                            <Label htmlFor="endereco" className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>Endereço</Label>
                            <Input id="endereco" value={formData.endereco || ""} onChange={e => handleChange('endereco', e.target.value)} placeholder="Rua, Bairro" className="text-xs h-9 w-full" style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)', border: '1.5px solid var(--cor-primaria)', borderRadius: 'var(--radius-sm)',...focusStyle }} />
                        </div>

                        <div className="grid grid-cols-1 gap-1">
                            <Label htmlFor="cidade" className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>Cidade</Label>
                            <Input id="cidade" value={formData.cidade || ""} onChange={e => handleChange('cidade', e.target.value)} placeholder="Luanda" className="text-xs h-9 w-full" style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)', border: '1.5px solid var(--cor-primaria)', borderRadius: 'var(--radius-sm)',...focusStyle }} />
                        </div>

                        <div className="grid grid-cols-1 gap-1">
                            <Label htmlFor="provincia" className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>Província</Label>
                            <Input id="provincia" value={formData.provincia || ""} onChange={e => handleChange('provincia', e.target.value)} placeholder="Luanda" className="text-xs h-9 w-full" style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)', border: '1.5px solid var(--cor-primaria)', borderRadius: 'var(--radius-sm)',...focusStyle }} />
                        </div>

                        <div className="grid grid-cols-1 gap-1">
                            <Label htmlFor="observacoes" className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>Observações</Label>
                            <textarea id="observacoes" value={formData.observacoes || ""} onChange={e => handleChange('observacoes', e.target.value)} rows={3} className="w-full rounded-md px-3 py-2 text-xs" style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)', border: '1.5px solid var(--cor-primaria)', borderRadius: 'var(--radius-sm)',...focusStyle }} placeholder="Notas sobre o cliente" />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <Label htmlFor="active" className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>Cliente Ativo</Label>
                            <Switch id="active" checked={formData.is_active} onCheckedChange={v => handleChange('is_active', v)} className="data-[state=checked]:bg-[var(--cor-primaria)]" />
                        </div>
                    </div>

                    <DialogFooter className="p-4 border-t shrink-0 flex flex-col-reverse gap-2" style={{ backgroundColor: 'var(--cor-card)', borderColor: 'var(--cor-borda)' }}> {/* <- BOTOES EMPILHADOS */}
                        <DialogClose asChild>
                            <Button type="button" className="text-sm w-full font-semibold" style={{ backgroundColor: 'var(--cor-card)', color: 'var(--cor-texto)', border: '1px solid var(--cor-borda)', borderRadius: 'var(--radius)' }}>Cancelar</Button>
                        </DialogClose>
                        <Button type="submit" disabled={saving} className="gap-2 text-sm w-full font-bold whitespace-nowrap" style={{ background: 'var(--cor-primaria)', color: '#fff', borderRadius: 'var(--radius)' }}>
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isEditing? "Salvar Alterações" : "Cadastrar Cliente"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
