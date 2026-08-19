"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import type { UsuarioLoja, UserRole } from "../../page";

type FormDataType = {
    nome: string;
    email: string;
    senha?: string;
    telefone: string;
    role: UserRole;
    is_active: boolean
};

interface Props {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    editingUser: UsuarioLoja | null;
    formData: FormDataType;
    setFormData: (d: any) => void;
    onSave: (payload: any, e: React.FormEvent) => void;
    saving: boolean;
    errorMsg: string;
    lojaNome: string | undefined;
}

export function UserModal({ open, onOpenChange, editingUser, formData, setFormData, onSave, saving, errorMsg, lojaNome }: Props) {
    const focusStyle = { outline: 'none', boxShadow: '0 0 0 3px var(--cor-primaria)30' }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                // AJUSTE 1 e 2: overflow-hidden + centralizado com respiro
                className="w-[calc(100%-2rem)] max-w-[420px] p-0 flex flex-col border shadow-2xl overflow-hidden [&>button]:hidden mx-auto"
                style={{
                    backgroundColor: 'var(--cor-card)',
                    color: 'var(--cor-texto)',
                    borderColor: 'var(--cor-borda)',
                    borderRadius: 'var(--radius)',
                    maxHeight: '85vh'
                }}
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >

                <form onSubmit={(e) => onSave(formData, e)} className="flex flex-col flex-1 min-h-0">
                    {/* AJUSTE 4: text-left no header */}
                    <DialogHeader className="p-5 pb-3 shrink-0 text-left">
                        <DialogTitle className="text-lg font-bold" style={{ color: 'var(--cor-texto)' }}>{editingUser? "Editar" : "Adicionar"} Membro</DialogTitle>
                        <DialogDescription className="text-sm mt-1" style={{ color: 'var(--cor-texto-sec)' }}>{`Preencha os dados. Loja: ${lojaNome || "-"}`}</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4 px-5 overflow-y-auto flex-1 min-h-0 scrollbar-hide">
                        {errorMsg && (
                            <div className="border text-sm p-3" style={{ backgroundColor: 'var(--cor-erro)14', borderColor: 'var(--cor-erro)30', color: 'var(--cor-erro)', borderRadius: 'var(--radius)' }}>
                                {errorMsg}
                            </div>
                        )}

                        <p className="text-sm font-semibold" style={{ color: 'var(--cor-texto-sec)' }}>Dados do Membro</p>

                        {/* AJUSTE 3: grid 4 colunas + label right no desktop */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                            <Label className="text-xs sm:text-right sm:justify-self-end" style={{ color: 'var(--cor-texto-sec)' }}>Nome *</Label>
                            <Input
                                value={formData.nome}
                                onChange={e => setFormData({...formData, nome: e.target.value })}
                                className="sm:col-span-3 text-sm h-10"
                                style={{
                                    backgroundColor: 'var(--cor-fundo)',
                                    color: 'var(--cor-texto)',
                                    border: '1.5px solid var(--cor-primaria)',
                                    borderRadius: 'var(--radius-sm)',
                                 ...focusStyle
                                }}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-start gap-1 sm:gap-4">
                            <Label className="text-xs sm:text-right sm:justify-self-end pt-2" style={{ color: 'var(--cor-texto-sec)' }}>Email</Label>
                            <div className="sm:col-span-3">
                                {editingUser? (
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({...formData, email: e.target.value })}
                                        className="text-sm h-10 w-full"
                                        style={{
                                            backgroundColor: 'var(--cor-fundo)',
                                            color: 'var(--cor-texto)',
                                            border: '1.5px solid var(--cor-primaria)',
                                            borderRadius: 'var(--radius-sm)',
                                         ...focusStyle
                                        }}
                                    />
                                ) : (
                                    <p className="text-xs pt-2" style={{ color: 'var(--cor-texto-sec)' }}>Será gerado automaticamente: nome@loja.ao</p>
                                )}
                            </div>
                        </div>

                        {!editingUser && (
                            <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                                <Label className="text-xs sm:text-right sm:justify-self-end" style={{ color: 'var(--cor-texto-sec)' }}>Senha Temp *</Label>
                                <Input
                                    type="password"
                                    value={formData.senha || ""}
                                    onChange={e => setFormData({...formData, senha: e.target.value })}
                                    className="sm:col-span-3 text-sm h-10"
                                    style={{
                                        backgroundColor: 'var(--cor-fundo)',
                                        color: 'var(--cor-texto)',
                                        border: '1.5px solid var(--cor-primaria)',
                                        borderRadius: 'var(--radius-sm)',
                                     ...focusStyle
                                    }}
                                    required
                                    placeholder="mínimo 6 caracteres"
                                />
                            </div>
                        )}

                        {editingUser && (
                            <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                                <Label className="text-xs sm:text-right sm:justify-self-end" style={{ color: 'var(--cor-texto-sec)' }}>Nova Senha</Label>
                                <Input
                                    type="password"
                                    value={formData.senha || ""}
                                    onChange={e => setFormData({...formData, senha: e.target.value })}
                                    className="sm:col-span-3 text-sm h-10"
                                    style={{
                                        backgroundColor: 'var(--cor-fundo)',
                                        color: 'var(--cor-texto)',
                                        border: '1.5px solid var(--cor-primaria)',
                                        borderRadius: 'var(--radius-sm)',
                                     ...focusStyle
                                    }}
                                    placeholder="deixe em branco para não alterar"
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                            <Label className="text-xs sm:text-right sm:justify-self-end" style={{ color: 'var(--cor-texto-sec)' }}>Telefone</Label>
                            <Input
                                value={formData.telefone || ""}
                                onChange={e => setFormData({...formData, telefone: e.target.value })}
                                className="sm:col-span-3 text-sm h-10"
                                style={{
                                    backgroundColor: 'var(--cor-fundo)',
                                    color: 'var(--cor-texto)',
                                    border: '1.5px solid var(--cor-primaria)',
                                    borderRadius: 'var(--radius-sm)',
                                 ...focusStyle
                                }}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                            <Label className="text-xs sm:text-right sm:justify-self-end" style={{ color: 'var(--cor-texto-sec)' }}>Cargo</Label>
                            <select
                                value={formData.role}
                                onChange={e => setFormData({...formData, role: e.target.value as UserRole })}
                                className="sm:col-span-3 flex h-10 w-full rounded-md px-3 py-2 text-sm"
                                style={{
                                    backgroundColor: 'var(--cor-fundo)',
                                    color: 'var(--cor-texto)',
                                    border: '1.5px solid var(--cor-primaria)',
                                    borderRadius: 'var(--radius-sm)',
                                 ...focusStyle
                                }}
                            >
                                <option value="GERENTE">Gerente</option>
                                <option value="VENDEDOR">Vendedor</option>
                                <option value="CAIXA">Caixa</option>
                                <option value="ESTOQUISTA">Estoquista</option>
                                <option value="ADMIN">Admin</option>
                                {!editingUser && <option value="DONO">Dono</option>}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                            <Label className="text-xs sm:text-right sm:justify-self-end" style={{ color: 'var(--cor-texto-sec)' }}>Ativo</Label>
                            <div className="sm:col-span-3">
                                <Switch
                                    checked={formData.is_active}
                                    onCheckedChange={v => setFormData({...formData, is_active: v })}
                                    className="data-[state=checked]:bg-[var(--cor-primaria)]"
                                />
                            </div>
                        </div>

                    </div>

                    <DialogFooter className="p-4 border-t shrink-0 flex-col sm:flex-row gap-2" style={{ backgroundColor: 'var(--cor-card)', borderColor: 'var(--cor-borda)' }}>
                        <Button
                            type="submit"
                            disabled={saving}
                            className="gap-2 text-sm w-full sm:flex-1 h-10 font-bold"
                            style={{
                                background: 'var(--cor-primaria)',
                                color: '#fff',
                                borderRadius: 'var(--radius)'
                            }}
                        >
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            {editingUser? "Salvar Alterações" : "Salvar"}
                        </Button>
                        <DialogClose asChild>
                            <Button
                                type="button"
                                className="text-sm w-full sm:flex-1 h-10 font-semibold"
                                style={{
                                    backgroundColor: 'var(--cor-card)',
                                    color: 'var(--cor-texto)',
                                    border: '1px solid var(--cor-borda)',
                                    borderRadius: 'var(--radius)'
                                }}
                            >
                                Cancelar
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </form>

            </DialogContent>
        </Dialog>
    )
}
