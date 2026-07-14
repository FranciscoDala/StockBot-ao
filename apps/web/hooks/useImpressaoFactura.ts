"use client"

export function useImpressaoFactura() {
    const imprimir = (venda: any, formatCurrency: (v: number) => string, nomeLoja: string) => {
        const itensHtml = venda.detalhes.map((item: any) => `
            <tr>
                <td>${item.nome_produto}</td>
                <td style="text-align:center">${item.quantidade}</td>
                <td style="text-align:right">${formatCurrency(item.preco_unitario)}</td>
                <td style="text-align:right">${formatCurrency(item.subtotal)}</td>
            </tr>
        `).join('');

        const html = `
        <!DOCTYPE html>
        <html lang="pt-AO">
        <head>
            <meta charset="UTF-8">
            <title>Factura #${venda.id.slice(0,8)}</title>
            <style>
                body { font-family: 'Arial', sans-serif; padding: 10px; max-width: 80mm; margin: auto; font-size: 11px; color: #000; background: #fff; }
              .header { text-align: center; margin-bottom: 10px; }
              .header h1 { margin: 0; font-size: 16px; }
              .info p { margin: 2px 0; }
                table { width: 100%; border-collapse: collapse; margin-top: 8px; }
                th, td { padding: 3px 0; border-bottom: 1px dashed #ccc; font-size: 11px; }
              .total { text-align: right; font-size: 14px; font-weight: bold; margin-top: 8px; }
              .footer { text-align: center; margin-top: 15px; font-size: 10px; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${nomeLoja}</h1>
                <p>FACTURA RECIBO</p>
            </div>
            <div class="info">
                <p><b>Nº:</b> ${venda.id.slice(0,8)}</p>
                <p><b>Data:</b> ${new Date(venda.data).toLocaleString('pt-AO')}</p>
                <p><b>Pagamento:</b> ${venda.formaPagamento}</p>
            </div>
            <table>
                <thead><tr><th>Produto</th><th>Qtd</th><th>Preço</th><th>Total</th></tr></thead>
                <tbody>${itensHtml}</tbody>
            </table>
            <div class="total">TOTAL: ${formatCurrency(venda.total)}</div>
            <div class="footer"><p>Obrigado pela preferência!</p></div>
        </body>
        </html>
        `;

        const printWindow = window.open('', '_blank', 'width=300,height=600');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => printWindow.print(), 250);
            setTimeout(() => printWindow.close(), 1000);
        }
    };
    return { imprimir };
}
