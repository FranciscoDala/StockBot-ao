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
  senha?: string; // senha nova do usuario
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
    onSave: (e: React.FormEvent) => void;
    saving: boolean;
    errorMsg: string;
    lojaNome: string | undefined;
}

export function UserModal({ open, onOpenChange, editingUser, formData, setFormData, onSave, saving, errorMsg, lojaNome }: Props) {
    const focusStyle = { outline: 'none', boxShadow: '0 0 0 1px var(--cor-primaria)' }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="w-full sm:max-w-[600px] p-0 flex-col max-h-[90vh] border shadow-2xl"
                style={{
                    backgroundColor: 'var(--cor-fundo-card, #171717)',
                    color: 'var(--cor-texto)',
                    borderColor: 'var(--cor-primaria)30',
                    borderRadius: 'var(--radius)'
                }}
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <form onSubmit={onSave} className="flex flex-col flex-1 min-h-0">
                    <DialogHeader className="p-4 sm:p-6 pb-0 shrink-0">
                        <DialogTitle className="text-base sm:text-lg" style={{color: 'var(--cor-texto)'}}>{editingUser? "Editar" : "Adicionar"} Membro</DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm" style={{color: 'var(--cor-texto-sec)'}}>{`Preencha os dados. Loja: ${lojaNome || "-"}`}</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-3 sm:gap-4 py-4 px-4 sm:px-6 overflow-y-auto flex-1 min-h-0 scrollbar-hide">
                        {errorMsg && (
                            <div
                                className="border text-xs p-3"
                                style={{
                                    backgroundColor: '#ef444414',
                                    borderColor: '#ef444430',
                                    color: '#ef4444',
                                    borderRadius: 'var(--radius)'
                                }}
                            >
                                {errorMsg}
                            </div>
                        )}

                        <p className="text-sm font-semibold" style={{color: 'var(--cor-texto-sec)'}}>-mb-2">Dados do Membro</p>

                        <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                            <Label className="text-xs sm:text-right" style={{color: 'var(--cor-texto-sec)'}}>Nome *</Label>
                            <Input
                                value={formData.nome}
                                onChange={e => setFormData({...formData, nome: e.target.value})}
                                className="sm:col-span-3 text-xs h-9"
                                style={{
                                    backgroundColor: 'var(--cor-fundo)',
                                    color: 'var(--cor-texto)',
                                    border: '1px solid var(--cor-primaria)30',
                                    borderRadius: 'var(--radius)',
                                  ...focusStyle
                                }}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                            <Label className="text-xs sm:text-right" style={{color: 'var(--cor-texto-sec)'}}>Email</Label>
                            {editingUser? (
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                    className="sm:col-span-3 text-xs h-9"
                                    style={{
                                        backgroundColor: 'var(--cor-fundo)',
                                        color: 'var(--cor-texto)',
                                        border: '1px solid var(--cor-primaria)30',
                                        borderRadius: 'var(--radius)',
                                      ...focusStyle
                                    }}
                                />
                            ) : (
                                <p className="sm:col-span-3 text-xs" style={{color: 'var(--cor-texto-sec)'}}>Será gerado automaticamente: nome@loja.ao</p>
                            )}
                        </div>

                        {!editingUser && (
                            <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                                <Label className="text-xs sm:text-right" style={{color: 'var(--cor-texto-sec)'}}>Senha Temp *</Label>
                                <Input
                                    type="password"
                                    value={formData.senha || ""}
                                    onChange={e => setFormData({...formData, senha: e.target.value})}
                                    className="sm:col-span-3 text-xs h-9"
                                    style={{
                                        backgroundColor: 'var(--cor-fundo)',
                                        color: 'var(--cor-texto)',
                                        border: '1px solid var(--cor-primaria)30',
                                        borderRadius: 'var(--radius)',
                                      ...focusStyle
                                    }}
                                    required
                                    placeholder="mínimo 6 caracteres"
                                />
                            </div>
                        )}

                        {editingUser && (
                            <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                                <Label className="text-xs sm:text-right" style={{color: 'var(--cor-texto-sec)'}}>Nova Senha</Label>
                                <Input
                                    type="password"
                                    value={formData.senha || ""}
                                    onChange={e => setFormData({...formData, senha: e.target.value})}
                                    className="sm:col-span-3 text-xs h-9"
                                    style={{
                                        backgroundColor: 'var(--cor-fundo)',
                                        color: 'var(--cor-texto)',
                                        border: '1px solid var(--cor-primaria)30',
                                        borderRadius: 'var(--radius)',
                                      ...focusStyle
                                    }}
                                    placeholder="deixe em branco para não alterar"
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                            <Label className="text-xs sm:text-right" style={{color: 'var(--cor-texto-sec)'}}>Telefone</Label>
                            <Input
                                value={formData.telefone || ""}
                                onChange={e => setFormData({...formData, telefone: e.target.value})}
                                className="sm:col-span-3 text-xs h-9"
                                style={{
                                    backgroundColor: 'var(--cor-fundo)',
                                    color: 'var(--cor-texto)',
                                    border: '1px solid var(--cor-primaria)30',
                                    borderRadius: 'var(--radius)',
                                  ...focusStyle
                                }}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                            <Label className="text-xs sm:text-right" style={{color: 'var(--cor-texto-sec)'}}>Ativo</Label>
                            <Switch
                                checked={formData.is_active}
                                onCheckedChange={v => setFormData({...formData, is_active: v})}
                                className="sm:col-span-3 w-fit data-[state=checked]:bg-[var(--cor-primaria)]"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                            <Label className="text-xs sm:text-right" style={{color: 'var(--cor-texto-sec)'}}>Cargo</Label>
                            <select
                                value={formData.role}
                                onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                                className="sm:col-span-3 flex h-9 w-full rounded-md px-3 py-2 text-xs"
                                style={{
                                    backgroundColor: 'var(--cor-fundo)',
                                    color: 'var(--cor-texto)',
                                    border: '1px solid var(--cor-primaria)30',
                                    borderRadius: 'var(--radius)',
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
                    </div>

                    <DialogFooter className="p-4 sm:p-6 pt-4 border-t flex-col sm:flex-row gap-2" style={{backgroundColor: 'var(--cor-fundo)', borderColor: 'var(--cor-primaria)30'}}>
                        <DialogClose asChild>
                            <Button
                                type="button"
                                className="text-xs w-full sm:w-auto font-semibold"
                                style={{
                                    backgroundColor: 'var(--cor-fundo)',
                                    color: 'var(--cor-texto)',
                                    border: '1px solid var(--cor-primaria)30',
                                    borderRadius: 'var(--radius)'
                                }}
                            >
                                Cancelar
                            </Button>
                        </DialogClose>
                        <Button
                            type="submit"
                            disabled={saving}
                            className="gap-2 text-xs w-full sm:w-auto font-bold"
                            style={{
                                background: 'var(--cor-primaria)',
                                color: '#fff',
                                borderRadius: 'var(--radius)'
                            }}
                        >
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            {editingUser? "Salvar Alterações" : "Salvar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
