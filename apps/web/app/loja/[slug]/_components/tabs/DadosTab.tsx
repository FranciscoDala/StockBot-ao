"use client";
import { User, MapPin } from "lucide-react";
import { Loja, userread } from "../../page";

export function DadosTab({ loja, user }: { loja: Loja | null | undefined; user: userread | null }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-neutral-900 p-4 sm:p-6 rounded-xl border-neutral-800">
                <h3 className="font-semibold mb-3 text-sm sm:text-base">Informações Base</h3>
                <p className="text-xs sm:text-sm text-gray-400">Slug: <span className="text-white break-all">{loja?.slug || "-"}</span></p>
                <p className="text-xs sm:text-sm text-gray-400 mt-2">Ano Fundação: <span className="text-white">{loja?.ano_fundacao || "-"}</span></p>
            </div>
            <div className="bg-neutral-900 p-4 sm:p-6 rounded-xl border-neutral-800">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm sm:text-base"><User size={16} /> Responsável</h3>
                <p className="text-xs sm:text-sm text-gray-400 truncate">{user?.nome}</p>
                <p className="text-xs sm:text-sm text-gray-400 truncate">{user?.email}</p>
            </div>
            <div className="bg-neutral-900 p-4 sm:p-6 rounded-xl border-neutral-800">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm sm:text-base"><MapPin size={16} /> Localização</h3>
                <p className="text-xs sm:text-sm text-gray-400">{loja?.endereco || "não informada"}</p>
            </div>
        </div>
    )
}
