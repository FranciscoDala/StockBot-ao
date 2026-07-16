"use client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function DetalhesModal({ open, onClose, dados }: { open: boolean; onClose: () => void; dados: any }) {
    if (!dados) return null;
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                className="w-full sm:max-w-[700px] bg-neutral-900 border-white/10 text-white"
                style={{borderRadius: 'var(--radius)'}}
            >
                <DialogHeader><DialogTitle>Detalhes: {dados.nome}</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
                    <p><b>Email:</b> {dados.email}</p>
                    <p><b>Telefone:</b> {dados.telefone || '-'}</p>
                    <p><b>Cargo:</b> {dados.role}</p>
                    <p><b>Status:</b> {dados.is_active? 'Ativo' : 'Inativo'}</p>
                    <p><b>Vendas Totais:</b> {dados.vendas_total}</p>
                    <div><b>Histórico de Atividades:</b>
                        <ul
                            className="list-disc pl-4 mt-2 text-xs p-2"
                            style={{
                                backgroundColor: '#0a0a0a',
                                borderRadius: 'var(--radius)'
                            }}
                        >
                            {dados.historico_atividades?.map((h: any, i: number) => <li key={i}>{h.acao} - {new Date(h.data).toLocaleString()}</li>)}
                        </ul>
                    </div>
                </div>
                <div
                    className="p-4 border-t"
                    style={{borderColor: '#27272a'}}
                >
                    <Button
                        onClick={onClose}
                        variant="secondary"
                        className="w-full"
                        style={{borderRadius: 'var(--radius)'}}
                    >
                        Fechar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
