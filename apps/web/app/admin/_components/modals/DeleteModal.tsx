"use client";
import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2 } from "lucide-react"; // 👈 tirei AlertCircle
import type { Loja } from "../AdminClient";

interface Props {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    loja: Loja | null;
    adminSenha: string;
    setAdminSenha: (v: string) => void;
    onDelete: () => void;
    deleting: boolean;
    // error?: string | null; 👈 REMOVIDO
}

export function DeleteModal({ open, onOpenChange, loja, adminSenha, setAdminSenha, onDelete, deleting }: Props) { // 👈 tirei error

    useEffect(() => {
        if (!open) setAdminSenha("");
    }, [open, setAdminSenha]);

    const handleClose = () => {
        setAdminSenha("");
        onOpenChange(false);
    }

    const handleDelete = () => {
        if (adminSenha.length < 4) return;
        onDelete();
    }

    const focusStyle = { outline: 'none', boxShadow: '0 0 0 1px var(--cor-primaria)' }
    // const errorStyle = { outline: 'none', boxShadow: '0 0 0 1px var(--cor-erro)' } 👈 REMOVIDO

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent
                className="w- max-w-[425px] p-0 shadow-2xl border gap-0"
                style={{
                    backgroundColor: 'var(--cor-card)',
                    color: 'var(--cor-texto)',
                    borderColor: 'var(--cor-borda)',
                    borderRadius: 'var(--radius)',
                    backdropFilter: 'blur(10px)'
                }}
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader className="p-4 pb-2">
                    <div className="flex items-center gap-3 pr-8">
                        <Trash2 size={20} style={{color: 'var(--cor-erro)'}} className="shrink-0" />
                        <DialogTitle className="text-base font-bold break-words" style={{color: 'var(--cor-texto)'}}>
                            Apagar {loja?.nome}?
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-sm pt-2 text-left break-words" style={{color: 'var(--cor-texto-sec)'}}>
                        Esta ação é irreversível. Digita a tua senha de ADMIN para confirmar.
                    </DialogDescription>
                </DialogHeader>

                <div className="px-4 pb-4">
                    <div className="grid gap-2">
                        <Label htmlFor="senha-admin-delete" className="text-xs" style={{color: 'var(--cor-texto-sec)'}}>Digite a senha do ADMIN para confirmar</Label>
                        <Input
                            id="senha-admin-delete"
                            type="password"
                            value={adminSenha}
                            onChange={(e) => setAdminSenha(e.target.value)}
                            className="h-10 text-base"
                            style={{
                                backgroundColor: 'var(--cor-fundo)',
                                color: 'var(--cor-texto)',
                                border: `1.5px solid var(--cor-primaria)`, // 👈 borda sempre primary
                                borderRadius: 'var(--radius-sm)',
                               ...focusStyle
                            }}
                            placeholder="******"
                            disabled={deleting}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleDelete()}
                        />
                        {/* BLOCO DE ERRO REMOVIDO 👇 pq agora vem de outro modal */}
                        {/* {error && (
                            <div className="flex items-center gap-2 text-xs" style={{color: 'var(--cor-erro)'}}>
                                <AlertCircle size={14} />
                                {error === 'Failed to fetch'? 'Erro de conexão com o servidor' : error}
                            </div>
                        )} */}
                    </div>
                </div>

                {/* BOTÕES AJUSTADOS */}
                <div
                    className="p-4 border-t flex-col-reverse sm:flex-row sm:justify-end gap-2"
                    style={{
                        backgroundColor: 'var(--cor-card)',
                        borderColor: 'var(--cor-borda)',
                        borderTopLeftRadius: 0,
                        borderTopRightRadius: 0,
                        borderBottomLeftRadius: 'var(--radius)',
                        borderBottomRightRadius: 'var(--radius)'
                    }}
                >
                    <Button
                        variant="secondary"
                        onClick={handleClose}
                        disabled={deleting}
                        className="h-10 w-full sm:w-auto font-semibold"
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
                        onClick={handleDelete}
                        disabled={deleting || adminSenha.length < 4}
                        className="gap-2 font-bold h-10 w-full sm:w-auto"
                        style={{
                            background: deleting || adminSenha.length < 4? 'color-mix(in srgb, var(--cor-erro) 50%, transparent)' : 'var(--cor-erro)',
                            color: '#fff',
                            borderRadius: 'var(--radius)'
                        }}
                    >
                        {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                        Apagar para sempre
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
