import { z } from "zod";

export const ItemVendaSchema = z.object({
    produto_id: z.string().uuid(),
    quantidade: z.number().int().positive(),
    preco_unitario: z.number().positive(),
    subtotal: z.number().positive(),
    // dados pra mostrar na tela, não obrigatórios pro backend
    nome: z.string().optional(),
    sku: z.string().optional(),
});

export const VendaSchema = z.object({
    id: z.number().or(z.string()), // backend pode mandar string
    total: z.number(),
    total_itens: z.number(),
    forma_pagamento: z.enum(["Dinheiro", "TPA", "Transferencia"]),
    valor_pago: z.number().optional(), // opcional pq cartão não tem
    troco: z.number().optional(),
    data_venda: z.string().datetime(),
    itens: z.array(ItemVendaSchema),
    loja_id: z.string().uuid(),
});

export const ProdutoSchema = z.object({
    id: z.number(),
    nome: z.string(),
    sku: z.string(),
    preco_venda: z.number(),
    preco: z.number(),
    estoque: z.number(),
    estoque_minimo: z.number(),
    unidade: z.string(),
    imagem_url: z.string(),
    is_active: z.boolean(),
});

// TIPOS GERADOS AUTOMATICAMENTE
export type ItemVenda = z.infer<typeof ItemVendaSchema>;
export type Venda = z.infer<typeof VendaSchema>;
export type Produto = z.infer<typeof ProdutoSchema>;
export type CarrinhoItem = Produto & { quantidade: number };
