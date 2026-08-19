"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Truck } from "lucide-react";

export type Fornecedor = {
    id?: string;
    nome: string;
    nif?: string;
    telefone?: string;
    email?: string;
    endereco?: string;
    contato_nome?: string;
}

interface Props {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    editingFornecedor: Fornecedor | null;
    formData: Fornecedor;
    setFormData: (d: Fornecedor) => void;
    onSave: () => void;
    saving: boolean;
    errorMsg: string;
}

export function FornecedorModal({ open, onOpenChange, editingFornecedor, formData, setFormData, onSave, saving, errorMsg }: Props) {
    const focusStyle = { outline: 'none', boxShadow: '0 0 0 3px var(--cor-primaria)30' }
    const inputStyle = {
        backgroundColor: 'var(--cor-fundo)',
        color: 'var(--cor-texto)',
        border: '1.5px solid var(--cor-primaria)',
        borderRadius: 'var(--radius-sm)',
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="w-[calc(100%-2rem)] max-w-[420px] p-0 flex flex-col border shadow-2xl overflow-hidden [&>button]:hidden"
                style={{
                    backgroundColor: 'var(--cor-card)',
                    color: 'var(--cor-texto)',
                    borderColor: 'var(--cor-borda)',
                    borderRadius: 'var(--radius)',
                    maxHeight: '85vh'
                }}
            >
                <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="flex flex-col flex-1 min-h-0">
                    <DialogHeader className="p-5 pb-3 shrink-0">
                        <div className="flex items-center justify-center gap-3">
                            <Truck size={24} style={{color: 'var(--cor-primaria)'}} />
                            <DialogTitle className="text-lg font-bold">{editingFornecedor? "Editar" : "Adicionar"} Fornecedor</DialogTitle>
                        </div>
                        <DialogDescription className="text-sm text-center mt-1" style={{color: 'var(--cor-texto-sec)'}}>
                            Dados da empresa fornecedora
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-5 py-4 grid gap-4 overflow-y-auto flex-1 min-h-0 scrollbar-hide">
                        {errorMsg && (
                            <div className="border text-sm p-3" style={{ backgroundColor: 'var(--cor-erro)14', borderColor: 'var(--cor-erro)30', color: 'var(--cor-erro)', borderRadius: 'var(--radius)' }}>
                                {errorMsg}
                            </div>
                        )}
                        <div className="grid gap-1.5">
                            <Label className="text-xs" style={{color: 'var(--cor-texto-sec)'}}>Nome da Empresa *</Label>
                            <Input value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="h-10 w-full text-sm" style={{...inputStyle,...focusStyle}} required />
                        </div>
                        <div className="grid gap-1.5">
                            <Label className="text-xs" style={{color: 'var(--cor-texto-sec)'}}>NIF</Label>
                            <Input value={formData.nif || ''} onChange={e => setFormData({...formData, nif: e.target.value})} className="h-10 w-full text-sm" style={{...inputStyle,...focusStyle}} />
                        </div>
                        <div className="grid gap-1.5">
                            <Label className="text-xs" style={{color: 'var(--cor-texto-sec)'}}>Telefone</Label>
                            <Input value={formData.telefone || ''} onChange={e => setFormData({...formData, telefone: e.target.value})} className="h-10 w-full text-sm" style={{...inputStyle,...focusStyle}} />
                        </div>
                        <div className="grid gap-1.5">
                            <Label className="text-xs" style={{color: 'var(--cor-texto-sec)'}}>Email</Label>
                            <Input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="h-10 w-full text-sm" style={{...inputStyle,...focusStyle}} />
                        </div>
                        <div className="grid gap-1.5">
                            <Label className="text-xs" style={{color: 'var(--cor-texto-sec)'}}>Pessoa de Contato</Label>
                            <Input value={formData.contato_nome || ''} onChange={e => setFormData({...formData, contato_nome: e.target.value})} className="h-10 w-full text-sm" style={{...inputStyle,...focusStyle}} />
                        </div>
                        <div className="grid gap-1.5">
                            <Label className="text-xs" style={{color: 'var(--cor-texto-sec)'}}>Endereço</Label>
                            <Textarea value={formData.endereco || ''} onChange={e => setFormData({...formData, endereco: e.target.value})} className="min-h-20 w-full text-sm" style={{...inputStyle,...focusStyle}} />
                        </div>
                    </div>

                    <DialogFooter className="p-4 border-t shrink-0 flex-col sm:flex-row gap-2" style={{backgroundColor: 'var(--cor-card)', borderColor: 'var(--cor-borda)'}}> {/* <- AJUSTADO */}
                        <Button
                          type="submit"
                          disabled={saving}
                          className="gap-2 font-bold w-full sm:flex-1 h-10 text-sm" // <- AJUSTADO
                          style={{background: 'var(--cor-primaria)', color: '#fff', borderRadius: 'var(--radius)'}}
                        >
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            {editingFornecedor? "Salvar" : "Criar"}
                        </Button>
                        <DialogClose asChild>
                            <Button
                              type="button"
                              className="font-semibold w-full sm:flex-1 h-10 text-sm" // <- AJUSTADO
                              style={{backgroundColor: 'var(--cor-card)', color: 'var(--cor-texto)', border: '1px solid var(--cor-borda)', borderRadius: 'var(--radius)'}}
                            >
                              Cancelar
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
