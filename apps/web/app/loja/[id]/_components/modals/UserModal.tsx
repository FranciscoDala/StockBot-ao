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
                className="w-full sm:max-w-[600px] bg-black/95 border-white/10 p-0 flex-col max-h-[90vh] text-white"
                style={{borderRadius: 'var(--radius)'}}
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <form onSubmit={onSave} className="flex flex-col flex-1 min-h-0">
                    <DialogHeader className="p-4 sm:p-6 pb-0 shrink-0">
                        <DialogTitle className="text-base sm:text-lg">{editingUser? "Editar" : "Adicionar"} Membro</DialogTitle>
                        <DialogDescription className="text-gray-400 text-xs sm:text-sm">{`Preencha os dados. Loja: ${lojaNome || "-"}`}</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-3 sm:gap-4 py-4 px-4 sm:px-6 overflow-y-auto flex-1 min-h-0">
                        {errorMsg && (
                            <div
                                className="border text-red-300 text-xs p-2"
                                style={{
                                    backgroundColor: '#ef44441a',
                                    borderColor: '#ef444430',
                                    borderRadius: 'var(--radius)'
                                }}
                            >
                                {errorMsg}
                            </div>
                        )}

                        <p className="text-sm font-semibold text-muted-foreground -mb-2">Dados do Membro</p>

                        <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                            <Label className="text-xs sm:text-right">Nome *</Label>
                            <Input
                                value={formData.nome}
                                onChange={e => setFormData({...formData, nome: e.target.value})}
                                className="sm:col-span-3 bg-background text-xs"
                                style={focusStyle}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                            <Label className="text-xs sm:text-right">Email</Label>
                            {editingUser? (
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                    className="sm:col-span-3 bg-background text-xs"
                                    style={focusStyle}
                                />
                            ) : (
                                <p className="sm:col-span-3 text-xs text-gray-400">Será gerado automaticamente: nome@loja.ao</p>
                            )}
                        </div>

                        {!editingUser && (
                            <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                                <Label className="text-xs sm:text-right">Senha Temp *</Label>
                                <Input
                                    type="password"
                                    value={formData.senha || ""}
                                    onChange={e => setFormData({...formData, senha: e.target.value})}
                                    className="sm:col-span-3 bg-background text-xs"
                                    style={focusStyle}
                                    required
                                    placeholder="mínimo 6 caracteres"
                                />
                            </div>
                        )}

                        {editingUser && (
                            <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                                <Label className="text-xs sm:text-right">Nova Senha</Label>
                                <Input
                                    type="password"
                                    value={formData.senha || ""}
                                    onChange={e => setFormData({...formData, senha: e.target.value})}
                                    className="sm:col-span-3 bg-background text-xs"
                                    style={focusStyle}
                                    placeholder="deixe em branco para não alterar"
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                            <Label className="text-xs sm:text-right">Telefone</Label>
                            <Input
                                value={formData.telefone || ""}
                                onChange={e => setFormData({...formData, telefone: e.target.value})}
                                className="sm:col-span-3 bg-background text-xs"
                                style={focusStyle}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                            <Label className="text-xs sm:text-right">Ativo</Label>
                            <Switch
                                checked={formData.is_active}
                                onCheckedChange={v => setFormData({...formData, is_active: v})}
                                className="sm:col-span-3 w-fit"
                                style={{
                                    '--ring-color': 'var(--cor-primaria)',
                                } as any}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                            <Label className="text-xs sm:text-right">Cargo</Label>
                            <select
                                value={formData.role}
                                onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                                className="sm:col-span-3 flex h-10 w-full rounded-md border-input bg-background px-3 py-2 text-xs"
                                style={focusStyle}
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

                    <DialogFooter className="p-4 sm:p-6 pt-4 bg-background shrink-0 border-t border-white/10 flex-col sm:flex-row gap-2">
                        <DialogClose asChild>
                            <Button type="button" variant="secondary" className="text-xs w-full sm:w-auto">
                                Cancelar
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={saving} className="btn-primary gap-2 text-xs w-full sm:w-auto">
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            {editingUser? "Salvar Alterações" : "Salvar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
