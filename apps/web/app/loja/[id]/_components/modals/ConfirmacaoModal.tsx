"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2 } from "lucide-react";

type TipoAcao = 'delete' | 'edit' | 'venda' | 'create';

interface Props {
    open: boolean;
    onClose: () => void;
    onConfirm: (senha?: string) => void;
    titulo: string;
    descricao: string;
    loading: boolean;
    textoConfirmar?: string;
    tipo: TipoAcao;
}

export function ConfirmarModal({
    open,
    onClose,
    onConfirm,
    titulo,
    descricao,
    loading,
    textoConfirmar = "Confirmar Ação",
    tipo
}: Props) {
    const [senha, setSenha] = useState("");

    const precisaDeSenha = tipo === 'edit' || tipo === 'delete';

    useEffect(() => {
        if (!open) setSenha("");
    }, [open]);

    const handleConfirm = () => {
        if (precisaDeSenha && senha.length < 4) {
            return;
        }
        onConfirm(precisaDeSenha? senha : undefined);
        setSenha("");
    }

    const handleClose = () => {
        setSenha("");
        onClose();
    }

    const focusStyle = { outline: 'none', boxShadow: '0 0 0 1px var(--cor-primaria)' }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent
                className="sm:max-w-[425px] p-0 shadow-2xl border"
                style={{
                    backgroundColor: 'var(--cor-card)', // 1. trocado
                    color: 'var(--cor-texto)',
                    borderColor: 'var(--cor-borda)', // 2. trocado
                    borderRadius: 'var(--radius)'
                }}
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >

                <DialogHeader className="p-4 pb-2">
                    <div className="flex items-center gap-3">
                        <Shield size={20} style={{color: 'var(--cor-primaria)'}} />
                        <DialogTitle className="text-base font-bold" style={{color: 'var(--cor-texto)'}}>{titulo}</DialogTitle>
                    </div>
                    <DialogDescription className="text-sm pt-2 text-left" style={{color: 'var(--cor-texto-sec)'}}>
                        {descricao}
                    </DialogDescription>
                </DialogHeader>

                {precisaDeSenha && (
                    <div className="px-4 pb-2">
                        <div className="grid gap-2">
                            <Label htmlFor="senha-dono" className="text-xs" style={{color: 'var(--cor-texto-sec)'}}>Digite a senha do Dono para confirmar</Label>
                            <Input
                                id="senha-dono"
                                type="password"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                className="h-9"
                                style={{
                                    backgroundColor: 'var(--cor-fundo)', // 3. trocado
                                    color: 'var(--cor-texto)',
                                    border: '1.5px solid var(--cor-primaria)', // 4. borda primary obrigatoria
                                    borderRadius: 'var(--radius-sm)',
                                  ...focusStyle
                                }}
                                placeholder="******"
                                disabled={loading}
                                autoFocus
                            />
                        </div>
                    </div>
                )}

                <DialogFooter
                    className="p-4 border-t flex-row justify-end gap-3"
                    style={{
                        backgroundColor: 'var(--cor-card)', // 5. trocado
                        borderColor: 'var(--cor-borda)' // 6. trocado
                    }}
                >
                    <Button
                        variant="secondary"
                        onClick={handleClose}
                        disabled={loading}
                        className="h-9"
                        style={{
                            backgroundColor: 'var(--cor-card)', // 7. trocado
                            color: 'var(--cor-texto)',
                            border: '1px solid var(--cor-borda)', // 8. trocado
                            borderRadius: 'var(--radius)'
                        }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={loading || (precisaDeSenha && senha.length < 4)}
                        className="gap-2 font-bold h-9"
                        style={{
                            background: 'var(--cor-primaria)',
                            color: '#fff',
                            borderRadius: 'var(--radius)'
                        }}
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {textoConfirmar}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
