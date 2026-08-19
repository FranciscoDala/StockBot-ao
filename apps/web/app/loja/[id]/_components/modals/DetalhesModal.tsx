"use client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export function DetalhesModal({ open, onClose, dados }: { open: boolean; onClose: () => void; dados: any }) {
    if (!dados) return null;
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                // AJUSTE 1 e 2: padrão das outras: respiro + centralizado + overflow
                className="w-[calc(100%-2rem)] max-w-[420px] p-0 flex flex-col border shadow-2xl overflow-hidden [&>button]:hidden mx-auto"
                style={{
                    backgroundColor: 'var(--cor-card)',
                    color: 'var(--cor-texto)',
                    borderColor: 'var(--cor-borda)',
                    borderRadius: 'var(--radius)',
                    maxHeight: '85vh'
                }}
            >
                {/* AJUSTE 4: text-left no header */}
                <DialogHeader className="p-5 pb-3 shrink-0 text-left">
                    <DialogTitle className="text-lg font-bold" style={{color: 'var(--cor-texto)'}}>Detalhes: {dados.nome}</DialogTitle>
                    <DialogDescription className="text-sm mt-1" style={{color: 'var(--cor-texto-sec)'}}>
                        Informações do membro
                    </DialogDescription>
                </DialogHeader>

                {/* AJUSTE 3: body com flex-1 e padding igual */}
                <div className="px-5 py-4 flex-1 min-h-0 overflow-y-auto scrollbar-hide grid gap-4">
                    <p style={{color: 'var(--cor-texto)'}}><b>Email:</b> {dados.email}</p>
                    <p style={{color: 'var(--cor-texto)'}}><b>Telefone:</b> {dados.telefone || '-'}</p>
                    <p style={{color: 'var(--cor-texto)'}}><b>Cargo:</b> {dados.role}</p>
                    <p style={{color: 'var(--cor-texto)'}}><b>Status:</b>
                        <span className="ml-1 font-semibold" style={{color: dados.is_active? 'var(--cor-primaria)' : 'var(--cor-erro)'}}>
                            {dados.is_active? 'Ativo' : 'Inativo'}
                        </span>
                    </p>
                    <p style={{color: 'var(--cor-texto)'}}><b>Vendas Totais:</b> {dados.vendas_total}</p>

                    <div>
                        <b style={{color: 'var(--cor-texto)'}}>Histórico de Atividades:</b>
                        <ul
                            className="list-disc pl-4 mt-2 text-xs p-3 space-y-1 overflow-y-auto border"
                            style={{
                                backgroundColor: 'var(--cor-fundo)',
                                borderRadius: 'var(--radius)',
                                borderColor: 'var(--cor-borda)',
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

                {/* AJUSTE: footer padrão */}
                <DialogFooter className="p-4 border-t shrink-0 flex-col sm:flex-row gap-2" style={{ borderColor: 'var(--cor-borda)', backgroundColor: 'var(--cor-card)' }}>
                    <Button
                        onClick={onClose}
                        className="w-full sm:flex-1 font-semibold h-10 text-sm"
                        style={{
                            background: 'var(--cor-primaria)',
                            color: '#fff',
                            borderRadius: 'var(--radius)'
                        }}
                    >
                        Fechar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
