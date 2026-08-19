"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
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

    const focusStyle = { outline: 'none', boxShadow: '0 0 0 3px var(--cor-primaria)30' } // <- PADRAO

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent
                className="w-[calc(100%-2rem)] max-w-[420px] p-0 flex flex-col border shadow-2xl overflow-hidden" // <- PADRAO
                style={{
                    backgroundColor: 'var(--cor-card)',
                    color: 'var(--cor-texto)',
                    borderColor: 'var(--cor-borda)',
                    borderRadius: 'var(--radius)',
                    maxHeight: '85vh'
                }}
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >

                <DialogHeader className="p-5 pb-3 shrink-0">
                    <div className="flex items-center justify-center gap-3"> {/* <- CENTRALIZADO */}
                        <Shield size={24} style={{color: 'var(--cor-primaria)'}} />
                        <DialogTitle className="text-lg font-bold" style={{color: 'var(--cor-texto)'}}>{titulo}</DialogTitle>
                    </div>
                    <DialogDescription className="text-sm text-center mt-1" style={{color: 'var(--cor-texto-sec)'}}> {/* <- CENTRALIZADO */}
                        {descricao}
                    </DialogDescription>
                </DialogHeader>

                {precisaDeSenha && (
                    <div className="px-5 pb-2">
                        <div className="grid gap-1.5"> {/* <- PADRAO */}
                            <Label htmlFor="senha-dono" className="text-xs" style={{color: 'var(--cor-texto-sec)'}}>Digite a senha do Dono para confirmar</Label>
                            <Input
                                id="senha-dono"
                                type="password"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                className="h-10 w-full text-sm" // <- PADRAO
                                style={{
                                    backgroundColor: 'var(--cor-fundo)',
                                    color: 'var(--cor-texto)',
                                    border: '1.5px solid var(--cor-primaria)',
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
                    className="p-4 border-t shrink-0 flex-col gap-2" // <- BOTOES EMPILHADOS
                    style={{
                        backgroundColor: 'var(--cor-card)',
                        borderColor: 'var(--cor-borda)'
                    }}
                >
                    <Button
                        onClick={handleConfirm}
                        disabled={loading || (precisaDeSenha && senha.length < 4)}
                        className="gap-2 font-bold h-10 w-full text-sm whitespace-nowrap" // <- PADRAO
                        style={{
                            background: 'var(--cor-primaria)',
                            color: '#fff',
                            borderRadius: 'var(--radius)'
                        }}
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {textoConfirmar}
                    </Button>
                    <DialogClose asChild>
                        <Button
                            variant="secondary"
                            onClick={handleClose}
                            disabled={loading}
                            className="h-10 w-full text-sm font-semibold" // <- PADRAO
                            style={{
                                backgroundColor: 'var(--cor-card)',
                                color: 'var(--cor-texto)',
                                border: '1px solid var(--cor-borda)',
                                borderRadius: 'var(--radius)'
                            }}
                        >
                            Cancelar
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
