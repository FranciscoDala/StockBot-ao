"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function DetalhesModal({ open, onClose, dados }: { open: boolean; onClose: () => void; dados: any }) {
    if (!dados) return null;
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="w- sm:max-w-[700px] bg-neutral-900 border-white/10 text-white">
                <DialogHeader><DialogTitle>Detalhes: {dados.nome}</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4 max-h- overflow-y-auto">
                    <p><b>Email:</b> {dados.email}</p><p><b>Telefone:</b> {dados.telefone || '-'}</p>
                    <p><b>Cargo:</b> {dados.role}</p><p><b>Status:</b> {dados.is_active? 'Ativo' : 'Inativo'}</p>
                    <p><b>Vendas Totais:</b> {dados.vendas_total}</p>
                    <div><b>Histórico de Atividades:</b>
                        <ul className="list-disc pl-4 mt-2 text-xs bg-black/30 p-2 rounded">
                            {dados.historico_atividades?.map((h: any, i: number) => <li key={i}>{h.acao} - {new Date(h.data).toLocaleString()}</li>)}
                        </ul>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
