"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, XCircle, CheckCircle, Info } from "lucide-react";

interface Props {
    open: boolean;
    onClose: () => void;
    mensagem: string;
    tipo?: 'erro' | 'sucesso' | 'alerta' | 'info';
    titulo?: string;
}

export function ErroModal({ open, onClose, mensagem, tipo = 'erro', titulo }: Props) {
    const config = {
        erro: {
            icon: <XCircle size={24} style={{color: 'var(--cor-erro)'}} />,
            title: titulo || "Ação não permitida",
            color: 'var(--cor-erro)',
            btnColor: 'var(--cor-erro)'
        },
        sucesso: {
            icon: <CheckCircle size={24} style={{color: 'var(--cor-sucesso)'}} />,
            title: titulo || "Sucesso!",
            color: 'var(--cor-sucesso)',
            btnColor: 'var(--cor-sucesso)'
        },
        alerta: {
            icon: <AlertTriangle size={24} style={{color: 'var(--cor-aviso)'}} />,
            title: titulo || "Atenção",
            color: 'var(--cor-aviso)',
            btnColor: 'var(--cor-aviso)'
        },
        info: {
            icon: <Info size={24} style={{color: 'var(--cor-primaria)'}} />,
            title: titulo || "Informação",
            color: 'var(--cor-primaria)',
            btnColor: 'var(--cor-primaria)'
        }
    }
    const current = config[tipo];

    return (
        <Dialog open={open} onOpenChange={() => {}}>
            <DialogContent
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
                className="sm:max-w-md w-full mx-4 p-0 shadow-2xl border overflow-hidden [&>button]:hidden" // <- AJUSTADO: max-w-md, mx-4, overflow-hidden
                style={{
                    backgroundColor: 'var(--cor-card)',
                    color: 'var(--cor-texto)',
                    borderColor: current.color,
                    borderRadius: 'var(--radius)'
                }}
            >
                <DialogHeader className="p-6 pb-2">
                    <div className="flex items-start gap-3">
                        <div className="mt-1">{current.icon}</div>
                        <div>
                            <DialogTitle className="text-lg font-bold" style={{color: 'var(--cor-texto)'}}>{current.title}</DialogTitle>
                            <DialogDescription className="text-sm leading-relaxed mt-2" style={{color: 'var(--cor-texto-sec)'}}>{mensagem}</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                <DialogFooter
                    className="p-4 border-t" // <- AJUSTADO: só p-4 pra ficar igual ao outro
                    style={{
                        backgroundColor: 'var(--cor-card)',
                        borderColor: 'var(--cor-borda)'
                    }}
                >
                    <Button
                        onClick={onClose}
                        className="w-full font-semibold" // <- já estava w-full, ficou bom no mobile
                        style={{
                            backgroundColor: current.btnColor,
                            color: '#fff',
                            borderRadius: 'var(--radius)'
                        }}
                    >
                        Entendi
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
