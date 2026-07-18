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
            icon: <XCircle size={24} style={{color: 'var(--cor-erro)'}} />, // 1. trocado
            title: titulo || "Ação não permitida",
            color: 'var(--cor-erro)', // 2. trocado
            btnColor: 'var(--cor-erro)' // 3. trocado
        },
        sucesso: {
            icon: <CheckCircle size={24} style={{color: 'var(--cor-sucesso)'}} />, // 4. trocado
            title: titulo || "Sucesso!",
            color: 'var(--cor-sucesso)', // 5. trocado
            btnColor: 'var(--cor-sucesso)' // 6. trocado
        },
        alerta: {
            icon: <AlertTriangle size={24} style={{color: 'var(--cor-aviso)'}} />, // 7. trocado
            title: titulo || "Atenção",
            color: 'var(--cor-aviso)', // 8. trocado
            btnColor: 'var(--cor-aviso)' // 9. trocado
        },
        info: {
            icon: <Info size={24} style={{color: 'var(--cor-primaria)'}} />,
            title: titulo || "Informação",
            color: 'var(--cor-primaria)', // 10. trocado
            btnColor: 'var(--cor-primaria)'
        }
    }
    const current = config[tipo];

    return (
        <Dialog open={open} onOpenChange={() => {}}>
            <DialogContent
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
                className="sm:max-w-[425px] p-0 shadow-2xl border [&>button]:hidden"
                style={{
                    backgroundColor: 'var(--cor-card)', // 11. trocado
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
                    className="p-4 border-t"
                    style={{
                        backgroundColor: 'var(--cor-card)', // 12. trocado
                        borderColor: 'var(--cor-borda)' // 13. trocado
                    }}
                >
                    <Button
                        onClick={onClose}
                        className="w-full font-semibold"
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
