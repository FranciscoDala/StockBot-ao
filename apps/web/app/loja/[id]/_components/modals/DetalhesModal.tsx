"use client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function DetalhesModal({ open, onClose, dados }: { open: boolean; onClose: () => void; dados: any }) {
    if (!dados) return null;
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                className="w-full sm:max-w-[700px] border shadow-2xl"
                style={{
                    backgroundColor: 'var(--cor-fundo-card, #171717)',
                    color: 'var(--cor-texto)',
                    borderColor: 'var(--cor-primaria)30',
                    borderRadius: 'var(--radius)'
                }}
            >
                <DialogHeader>
                    <DialogTitle style={{color: 'var(--cor-texto)'}}>Detalhes: {dados.nome}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto scrollbar-hide">
                    <p style={{color: 'var(--cor-texto)'}}><b>Email:</b> {dados.email}</p>
                    <p style={{color: 'var(--cor-texto)'}}><b>Telefone:</b> {dados.telefone || '-'}</p>
                    <p style={{color: 'var(--cor-texto)'}}><b>Cargo:</b> {dados.role}</p>
                    <p style={{color: 'var(--cor-texto)'}}><b>Status:</b>
                        <span className="ml-1 font-semibold" style={{color: dados.is_active? 'var(--cor-primaria)' : '#ef4444'}}>
                            {dados.is_active? 'Ativo' : 'Inativo'}
                        </span>
                    </p>
                    <p style={{color: 'var(--cor-texto)'}}><b>Vendas Totais:</b> {dados.vendas_total}</p>

                    <div>
                        <b style={{color: 'var(--cor-texto)'}}>Histórico de Atividades:</b>
                        <ul
                            className="list-disc pl-4 mt-2 text-xs p-3 space-y-1 overflow-y-auto"
                            style={{
                                backgroundColor: 'var(--cor-fundo)',
                                borderRadius: 'var(--radius)',
                                color: 'var(--cor-texto-sec)',
                                maxHeight: '200px'
                            }}
                        >
                            {dados.historico_atividades?.length > 0? (
                                dados.historico_atividades.map((h: any, i: number) => (
                                    <li key={i}>{h.acao} - {new Date(h.data).toLocaleString('pt-AO')}</li>
                                ))
                            ) : (
                                <li>Nenhuma atividade registrada</li>
                            )}
                        </ul>
                    </div>
                </div>

                <div
                    className="p-4 border-t"
                    style={{
                        borderColor: 'var(--cor-primaria)30',
                        backgroundColor: 'var(--cor-fundo)'
                    }}
                >
                    <Button
                        onClick={onClose}
                        className="w-full font-semibold"
                        style={{
                            background: 'var(--cor-primaria)',
                            color: '#fff',
                            borderRadius: 'var(--radius)'
                        }}
                    >
                        Fechar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
