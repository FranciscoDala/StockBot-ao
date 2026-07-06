"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Loader2, KeyRound } from "lucide-react";

interface Props {
    open: boolean;
    onClose: () => void;
    onConfirm: (senha: string) => void;
    titulo: string;
    loading: boolean;
}

export function PermissaoModal({ open, onClose, onConfirm, titulo, loading }: Props) {
    const [senha, setSenha] = useState("");

    const handleSubmit = () => {
        if(!senha.trim()) return;
        onConfirm(senha);
        setSenha("");
    }

    return (
        <Dialog open={open} onOpenChange={() => {}}>
            <DialogContent
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
                className="sm:max-w-[425px] bg-neutral-950 border-yellow-500/50 text-white p-0 shadow-2xl shadow-black/50 [&>button]:hidden"
            >
                <DialogHeader className="p-6 pb-2">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="text-yellow-500" size={24} />
                        <DialogTitle className="text-lg font-bold">{titulo}</DialogTitle>
                    </div>
                    <DialogDescription className="text-gray-400 text-sm pt-2">
                        Esta é uma ação sensível. Para continuar, confirme com a senha do proprietário da loja.
                    </DialogDescription>
                </DialogHeader>
                <div className="px-6 pb-4">
                    <div className="grid gap-2">
                        <Label htmlFor="senha" className="flex items-center gap-2"><KeyRound size={14}/> Senha do Proprietário</Label>
                        <Input id="senha" type="password" placeholder="Digite a senha para confirmar" value={senha} onChange={(e) => setSenha(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} className="bg-neutral-900 border-neutral-800 h-10" autoFocus />
                    </div>
                </div>
                <DialogFooter className="p-4 bg-neutral-900/50 border-t border-white/10 flex-row justify-end gap-2">
                    <Button variant="ghost" onClick={onClose} disabled={loading} className="text-white hover:bg-neutral-800">Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={loading ||!senha} className="gap-2 bg-yellow-600 hover:bg-yellow-700 text-black font-bold">
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Confirmar Ação
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
