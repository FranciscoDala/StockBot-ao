import { notFound } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

async function getProduto(sku: string) {
    try {
        const res = await fetch(`${API_URL}/produtos/publico/${sku}`, { cache: 'no-store' });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

const formatCurrency = (v: number) => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(v);

export default async function PaginaPublicaProduto({ params }: { params: { sku: string } }) {
    const produto = await getProduto(params.sku);
    if (!produto) notFound();

    return (
        <main className="min-h-screen bg-neutral-950 text-white p-4 sm:p-6">
            <div className="max-w-2xl mx-auto bg-neutral-900 rounded-xl border-neutral-800 overflow-hidden">

                {produto.imagem_url && (
                    <img src={produto.imagem_url} alt={produto.nome} className="w-full h-64 object-cover"/>
                )}

                <div className="p-6">
                    <h1 className="text-2xl font-bold mb-1">{produto.nome}</h1>
                    <p className="text-gray-400 text-sm mb-4">SKU: {produto.sku}</p>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                        <div>
                            <p className="text-gray-400">Preço de Venda</p>
                            <p className="font-bold text-green-400 text-lg">{formatCurrency(produto.preco)}</p>
                        </div>
                        <div>
                            <p className="text-gray-400">Estoque</p>
                            <p className="font-bold">{produto.estoque} {produto.unidade}</p>
                        </div>
                        <div>
                            <p className="text-gray-400">Marca</p>
                            <p className="font-semibold">{produto.marca || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-gray-400">Custo</p>
                            <p className="font-semibold">{formatCurrency(produto.preco_custo)}</p>
                        </div>
                    </div>

                    {produto.descricao && (
                        <div className="mb-6">
                            <p className="text-gray-400 text-sm">Descrição</p>
                            <p>{produto.descricao}</p>
                        </div>
                    )}

                    {/* INFO DA LOJA */}
                    <div className="bg-neutral-800 p-4 rounded-lg mb-6">
                        <p className="text-xs text-gray-400">Localizado na loja:</p>
                        <p className="font-bold text-base">{produto.loja_nome || 'Loja não informada'}</p>
                    </div>
                </div>

                {/* RODAPE EMPRESA */}
                <footer className="bg-black p-4 text-center border-t border-neutral-800">
                    <p className="text-xs text-gray-500">Sistema desenvolvido por</p>
                    <p className="font-bold text-base">CONNECT-Tics</p>
                </footer>
            </div>
        </main>
    )
}
