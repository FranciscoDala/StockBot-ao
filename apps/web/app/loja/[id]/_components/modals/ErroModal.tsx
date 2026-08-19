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
                className="w-[calc(100%-2rem)] max-w-[420px] p-0 flex-col border shadow-2xl overflow-hidden [&>button]:hidden"
                style={{
                    backgroundColor: 'var(--cor-card)',
                    color: 'var(--cor-texto)',
                    borderColor: current.color,
                    borderRadius: 'var(--radius)',
                    maxHeight: '85vh'
                }}
            >
                <DialogHeader className="p-5 pb-3">
                    <div className="flex flex-col items-center justify-center gap-3 text-center">
                        <div>{current.icon}</div>
                        <DialogTitle className="text-lg font-bold" style={{color: 'var(--cor-texto)'}}>{current.title}</DialogTitle>
                    </div>
                    <DialogDescription className="text-sm leading-relaxed text-center mt-2" style={{color: 'var(--cor-texto-sec)'}}>{mensagem}</DialogDescription>
                </DialogHeader>
                <DialogFooter
                    className="p-4 border-t flex-col sm:flex-row" // <- PADRAO
                    style={{
                        backgroundColor: 'var(--cor-card)',
                        borderColor: 'var(--cor-borda)'
                    }}
                >
                    <Button
                        onClick={onClose}
                        className="w-full sm:flex-1 font-bold h-10 text-sm" // <- PADRAO
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
