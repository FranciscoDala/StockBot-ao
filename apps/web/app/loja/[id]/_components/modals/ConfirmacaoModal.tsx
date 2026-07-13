"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2 } from "lucide-react";

interface Props {
    open: boolean;
    onClose: () => void;
    onConfirm: (senha: string) => void; // <- AGORA RECEBE SENHA
    titulo: string;
    descricao: string;
    loading: boolean;
    textoConfirmar?: string;
}

export function ConfirmarModal({
    open,
    onClose,
    onConfirm,
    titulo,
    descricao,
    loading,
    textoConfirmar = "Confirmar Ação"
}: Props) {
    const [senha, setSenha] = useState("");

    const handleConfirm = () => {
        onConfirm(senha);
        setSenha(""); // limpa ao confirmar
    }

    // limpa senha ao fechar
    const handleClose = () => {
        setSenha("");
        onClose();
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent
                className="sm:max-w-[425px] bg-[#121212] border-amber-500/30 text-white p-0 shadow-2xl shadow-black/50 rounded-xl"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >

                {/* HEADER */}
                <DialogHeader className="p-4 pb-2">
                    <div className="flex items-center gap-3">
                        <Shield className="text-amber-500" size={20} />
                        <DialogTitle className="text-base font-bold text-white">{titulo}</DialogTitle>
                    </div>
                    <DialogDescription className="text-gray-400 text-sm pt-2 text-left">
                        {descricao}
                    </DialogDescription>
                </DialogHeader>

                {/* BODY - INPUT SENHA */}
                <div className="px-4 pb-2">
                    <div className="grid gap-2">
                        <Label htmlFor="senha-dono" className="text-xs text-gray-300">Digite a senha do Dono para confirmar</Label>
                        <Input
                            id="senha-dono"
                            type="password"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            className="bg-neutral-800 border-neutral-700 text-white h-9"
                            placeholder="******"
                            disabled={loading}
                            autoFocus
                        />
                    </div>
                </div>

                {/* FOOTER - COM 1 LINHA IGUAL A PRINT */}
                <DialogFooter className="p-4 bg-neutral-900/30 border-t border-neutral-800 flex-row justify-end gap-3">
                    <Button
                        variant="ghost"
                        onClick={handleClose}
                        disabled={loading}
                        className="text-white hover:bg-neutral-800 h-9"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={loading || senha.length < 4} // <- só ativa com senha
                        className="gap-2 bg-amber-500 hover:bg-amber-600 text-black font-bold h-9"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {textoConfirmar}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
