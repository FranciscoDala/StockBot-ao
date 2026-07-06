"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, Loader2 } from "lucide-react";

interface Props {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
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
    return (
        <Dialog open={open} onOpenChange={() => {}}>
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

                {/* FOOTER - COM 1 LINHA IGUAL A PRINT */}
                <DialogFooter className="p-4 bg-neutral-900/30 border-t border-neutral-800 flex-row justify-end gap-3">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={loading}
                        className="text-white hover:bg-neutral-800 h-9"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={loading}
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
