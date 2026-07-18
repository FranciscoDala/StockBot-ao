"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, User } from "lucide-react";

export type Cliente = {
    id?: string;
    nome: string;
    telefone?: string;
    email?: string;
    nif?: string;
    endereco?: string;
    observacao?: string;
}

interface Props {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    editingCliente: Cliente | null;
    formData: Cliente;
    setFormData: (d: Cliente) => void;
    onSave: () => void;
    saving: boolean;
    errorMsg: string;
}

export function ClienteModal({ open, onOpenChange, editingCliente, formData, setFormData, onSave, saving, errorMsg }: Props) {
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
                className="sm:max-w-[500px] p-0 border shadow-2xl [&>button]:hidden"
                style={{
                    backgroundColor: 'var(--cor-card)',
                    color: 'var(--cor-texto)',
                    borderColor: 'var(--cor-borda)',
                    borderRadius: 'var(--radius)'
                }}
            >
                <form onSubmit={(e) => { e.preventDefault(); onSave(); }}>
                    <DialogHeader className="p-6 pb-2">
                        <div className="flex items-center gap-3">
                            <User size={24} style={{color: 'var(--cor-primaria)'}} />
                            <DialogTitle className="text-lg font-bold">{editingCliente? "Editar" : "Adicionar"} Cliente</DialogTitle>
                        </div>
                        <DialogDescription className="text-sm pt-2" style={{color: 'var(--cor-texto-sec)'}}>
                            Preencha os dados do cliente
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-6 py-4 space-y-4">
                        {errorMsg && (
                            <div className="border text-xs p-3" style={{ backgroundColor: 'var(--cor-erro)14', borderColor: 'var(--cor-erro)30', color: 'var(--cor-erro)', borderRadius: 'var(--radius)' }}>
                                {errorMsg}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label style={{color: 'var(--cor-texto-sec)'}}>Nome *</Label>
                            <Input value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="h-10" style={{...inputStyle,...focusStyle}} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label style={{color: 'var(--cor-texto-sec)'}}>Telefone</Label>
                                <Input value={formData.telefone || ''} onChange={e => setFormData({...formData, telefone: e.target.value})} className="h-10" style={{...inputStyle,...focusStyle}} />
                            </div>
                            <div className="space-y-2">
                                <Label style={{color: 'var(--cor-texto-sec)'}}>NIF</Label>
                                <Input value={formData.nif || ''} onChange={e => setFormData({...formData, nif: e.target.value})} className="h-10" style={{...inputStyle,...focusStyle}} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label style={{color: 'var(--cor-texto-sec)'}}>Email</Label>
                            <Input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="h-10" style={{...inputStyle,...focusStyle}} />
                        </div>
                        <div className="space-y-2">
                            <Label style={{color: 'var(--cor-texto-sec)'}}>Endereço</Label>
                            <Input value={formData.endereco || ''} onChange={e => setFormData({...formData, endereco: e.target.value})} className="h-10" style={{...inputStyle,...focusStyle}} />
                        </div>
                        <div className="space-y-2">
                            <Label style={{color: 'var(--cor-texto-sec)'}}>Observação</Label>
                            <Textarea value={formData.observacao || ''} onChange={e => setFormData({...formData, observacao: e.target.value})} className="min-h-20" style={{...inputStyle,...focusStyle}} />
                        </div>
                    </div>

                    <DialogFooter className="p-4 border-t flex-row justify-end gap-2" style={{backgroundColor: 'var(--cor-card)', borderColor: 'var(--cor-borda)'}}>
                        <DialogClose asChild>
                            <Button type="button" className="font-semibold" style={{backgroundColor: 'var(--cor-card)', color: 'var(--cor-texto)', border: '1px solid var(--cor-borda)', borderRadius: 'var(--radius)'}}>Cancelar</Button>
                        </DialogClose>
                        <Button type="submit" disabled={saving} className="gap-2 font-bold" style={{background: 'var(--cor-primaria)', color: '#fff', borderRadius: 'var(--radius)'}}>
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            {editingCliente? "Salvar" : "Criar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
