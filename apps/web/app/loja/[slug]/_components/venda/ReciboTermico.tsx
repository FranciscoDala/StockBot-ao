"use client"
import { forwardRef } from "react"

interface ReciboProps {
    loja_nome: string
    loja_nif?: string
    loja_endereco?: string
    loja_telefone?: string
    loja_logo?: string
    venda_id: string
    data: string
    itens: any[]
    total: number
    forma_pagamento: string
    formatCurrency: (v: number) => string
}

const Divider = () => <hr style={{ border: 'none', borderTop: '1px dashed #000', margin: '3px 0', width: '100%' }} />

export const ReciboTermico = forwardRef<HTMLDivElement, ReciboProps>(
    ({ loja_nome, loja_nif, loja_endereco, loja_telefone, loja_logo, venda_id, data, itens, total, forma_pagamento, formatCurrency }, ref) => {
        const totalItens = itens?.reduce((acc, i) => acc + (i.quantidade || i.qtd || 0), 0) ?? 0;

        return (
            <div
                ref={ref}
                style={{
                    width: '58mm',
                    margin: '0 auto',
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    color: 'black',
                    background: 'white',
                    padding: '2px 2px',
                    boxSizing: 'border-box'
                }}
            >
                {/* HEADER COM DADOS DA LOJA */}
                <div style={{ textAlign: 'center', marginBottom: '2px' }}>
                    {loja_logo && (
                        <img src={loja_logo} alt="logo" style={{ width: '30px', height: '30px', objectFit: 'contain', margin: '0 auto 2px' }} />
                    )}
                    {loja_nif && <p style={{ margin: '0', fontSize: '9px' }}>NIF: {loja_nif}</p>}
                    <h1 style={{ fontWeight: 'bold', fontSize: '12px', margin: 0 }}>{loja_nome.toUpperCase()}</h1>
                    {loja_endereco && <p style={{ margin: '0', fontSize: '9px' }}>Endereço: {loja_endereco}</p>}
                    {loja_telefone && <p style={{ margin: '0', fontSize: '9px' }}>Tel: {loja_telefone}</p>}
                    <Divider />
                </div>

                <div style={{ marginBottom: '3px', fontSize: '9px' }}>
                    <p style={{ margin: '1px 0' }}>RECIBO: #{venda_id.slice(0, 8).toUpperCase()}</p>
                    <p style={{ margin: '1px 0' }}>DATA: {data}</p>
                    <Divider />
                </div>

                <div style={{ marginBottom: '3px' }}>
                    {itens?.map((item, i) => {
                        const qtd = item.quantidade || item.qtd || 0
                        const preco = item.preco_unit || item.preco || 0
                        const subtotal = item.subtotal || (qtd * preco)
                        return (
                            <div key={i} style={{ marginBottom: '3px' }}>
                                <p style={{ margin: '1px 0', wordBreak: 'break-word' }}>{item.nome}</p>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{qtd}x {formatCurrency(preco)}</span>
                                    <span>{formatCurrency(subtotal)}</span>
                                </div>
                            </div>
                        )
                    })}
                    <Divider />
                </div>

                <div style={{ marginBottom: '3px', fontSize: '9px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>ITENS</span>
                        <span>{totalItens}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '11px' }}>
                        <span>TOTAL</span>
                        <span>{formatCurrency(total)}</span>
                    </div>
                    <Divider />
                </div>

                <div style={{ textAlign: 'center', fontSize: '9px' }}>
                    <p style={{ margin: '1px 0' }}>Tipo de Pagamento: {forma_pagamento}</p>
                    <p style={{ margin: '1px 0' }}>Obrigado e volte sempre!</p>
                </div>
            </div>
        )
    }
)
ReciboTermico.displayName = "ReciboTermico"
