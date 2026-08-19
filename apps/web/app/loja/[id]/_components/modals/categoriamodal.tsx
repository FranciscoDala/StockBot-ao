"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Tag } from "lucide-react";

export type Categoria = {
    id?: string;
    nome: string;
    descricao?: string;
}

interface Props {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    editingCategoria: Categoria | null;
    formData: Categoria;
    setFormData: (d: Categoria) => void;
    onSave: () => void;
    saving: boolean;
    errorMsg: string;
}

export function CategoriaModal({ open, onOpenChange, editingCategoria, formData, setFormData, onSave, saving, errorMsg }: Props) {
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
                // AJUSTE 1 e 2: respiro lateral + centralizada + overflow-hidden
                className="w-[calc(100%-2rem)] max-w-[450px] p-0 flex flex-col border shadow-2xl overflow-hidden [&>button]:hidden mx-auto"
                style={{
                    backgroundColor: 'var(--cor-card)',
                    color: 'var(--cor-texto)',
                    borderColor: 'var(--cor-borda)',
                    borderRadius: 'var(--radius)',
                    height: '80vh',
                    maxHeight: '80vh'
                }}
            >
                <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="flex flex-col flex-1 min-h-0">
                    {/* AJUSTE 4: text-left no header */}
                    <DialogHeader className="p-6 pb-2 shrink-0 text-left">
                        <div className="flex items-center gap-3">
                            <Tag size={24} style={{color: 'var(--cor-primaria)'}} />
                            <DialogTitle className="text-lg font-bold">{editingCategoria? "Editar" : "Adicionar"} Categoria</DialogTitle>
                        </div>
                        <DialogDescription className="text-sm pt-2" style={{color: 'var(--cor-texto-sec)'}}>
                            Organize seus produtos por categorias
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1 min-h-0 scrollbar-hide">
                        {errorMsg && (
                            <div className="border text-xs p-3" style={{ backgroundColor: 'var(--cor-erro)14', borderColor: 'var(--cor-erro)30', color: 'var(--cor-erro)', borderRadius: 'var(--radius)' }}>
                                {errorMsg}
                            </div>
                        )}
                        {/* AJUSTE 3: grid 4 colunas + label right no desktop */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                            <Label className="text-xs sm:text-right sm:justify-self-end" style={{color: 'var(--cor-texto-sec)'}}>Nome *</Label>
                            <Input value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="sm:col-span-3 h-10" style={{...inputStyle,...focusStyle}} required />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-start gap-1 sm:gap-4">
                            <Label className="text-xs sm:text-right sm:justify-self-end pt-2" style={{color: 'var(--cor-texto-sec)'}}>Descrição</Label>
                            <Textarea value={formData.descricao || ''} onChange={e => setFormData({...formData, descricao: e.target.value})} className="sm:col-span-3 min-h-24" style={{...inputStyle,...focusStyle}} />
                        </div>
                    </div>

                    <DialogFooter className="p-4 border-t shrink-0 flex-col sm:flex-row gap-2" style={{backgroundColor: 'var(--cor-card)', borderColor: 'var(--cor-borda)'}}>
                        <DialogClose asChild>
                            <Button type="button" className="text-sm w-full sm:flex-1 h-10 font-semibold" style={{backgroundColor: 'var(--cor-card)', color: 'var(--cor-texto)', border: '1px solid var(--cor-borda)', borderRadius: 'var(--radius)'}}>Cancelar</Button>
                        </DialogClose>
                        <Button type="submit" disabled={saving} className="gap-2 text-sm w-full sm:flex-1 h-10 font-bold" style={{background: 'var(--cor-primaria)', color: '#fff', borderRadius: 'var(--radius)'}}>
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            {editingCategoria? "Salvar" : "Criar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
