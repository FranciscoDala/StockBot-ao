"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { X, PackageX } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produtos: any[];
}

export function SemEstoqueModal({ open, onOpenChange, produtos }: Props) {

  return (
    <>
      <style jsx global>{`
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
          .snap-x { scroll-snap-type: x mandatory; }
          .snap-center { scroll-snap-align: center; }
      `}</style>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="!fixed !inset-0 !w-screen !h-screen !max-w-none !max-h-none !p-0 !flex !flex-col !border-0 !rounded-none !shadow-none !translate-x-0 !translate-y-0 [&>button]:hidden"
          style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)' }}
        >
          {/* HEADER IGUAL AO CAIXA */}
          <DialogHeader className="p-4 sm:p-6 border-b shrink-0 flex-row items-center justify-between" style={{ borderColor: 'color-mix(in srgb, var(--cor-borda) 20%, transparent)', backgroundColor: 'var(--cor-card)' }}>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2" style={{ color: 'var(--cor-texto)' }}>
                <PackageX size={22} className="text-red-500" />
                Sem Estoque
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm" style={{ color: 'var(--cor-texto-sec)' }}>
                {produtos.length} produto(s) com estoque zerado
              </DialogDescription>
            </div>

            <button
              onClick={() => onOpenChange(false)}
              className="h-10 w-10 sm:h-11 sm:w-11 flex items-center justify-center rounded-lg transition hover:opacity-90 shrink-0"
              style={{ background: 'var(--cor-erro)', color: '#fff' }}
              aria-label="Fechar"
            >
              <X size={22} strokeWidth={3} />
            </button>
          </DialogHeader>

          {/* CONTEUDO */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {produtos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <p className="font-semibold">Nenhum produto zerado</p>
                <p className="text-sm" style={{ color: 'var(--cor-texto-sec)' }}>Tudo certo por aqui!</p>
              </div>
            ) : (
              <>
                {/* MOBILE: SCROLL HORIZONTAL */}
                <div className="sm:hidden overflow-x-auto scrollbar-hide snap-x -mx-4 px-4 py-2">
                  <div className="flex w-max gap-4">
                    {produtos.map(prod => (
                      <div
                        key={`mobile-${prod.id}`}
                        className="w-[calc(100vw-32px)] snap-center shrink-0 p-4 rounded-lg border"
                        style={{ background: 'var(--cor-card)', borderColor: 'color-mix(in srgb, var(--cor-erro) 25%, transparent)' }}
                      >
                        <p className="font-bold truncate mb-2" style={{ color: 'var(--cor-texto)' }}>{prod.nome}</p>
                        <div className="space-y-1 text-sm">
                          <p className="font-bold text-red-500">Estoque: {prod.estoque}</p>
                          <p style={{ color: 'var(--cor-texto-sec)' }}>Mínimo: {prod.estoque_minimo}</p>
                        </div>
                        <div className="flex justify-between mt-3 pt-3 border-t text-xs" style={{ borderColor: 'color-mix(in srgb, var(--cor-borda) 20%, transparent)', color: 'var(--cor-texto-sec)' }}>
                          <span>SKU: {prod.sku}</span>
                          <span>Un: {prod.unidade}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* DESKTOP: GRID NORMAL */}
                <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
                  {produtos.map(prod => (
                    <div
                      key={`desktop-${prod.id}`}
                      className="p-4 rounded-lg border"
                      style={{ background: 'var(--cor-card)', borderColor: 'color-mix(in srgb, var(--cor-erro) 25%, transparent)' }}
                    >
                      <p className="font-bold truncate mb-2" style={{ color: 'var(--cor-texto)' }}>{prod.nome}</p>
                      <div className="space-y-1 text-sm">
                        <p className="font-bold text-red-500">Estoque: {prod.estoque}</p>
                        <p style={{ color: 'var(--cor-texto-sec)' }}>Mínimo: {prod.estoque_minimo}</p>
                      </div>
                      <div className="flex justify-between mt-3 pt-3 border-t text-xs" style={{ borderColor: 'color-mix(in srgb, var(--cor-borda) 20%, transparent)', color: 'var(--cor-texto-sec)' }}>
                        <span>SKU: {prod.sku}</span>
                        <span>Un: {prod.unidade}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
