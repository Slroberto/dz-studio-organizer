import { CommercialQuote, ServiceOrder } from '../types';

declare const jspdf: any;

export const generateQuotePDF = (quote: CommercialQuote): void => {
  const { jsPDF } = jspdf;
  const doc = new jsPDF();

  // --- Header ---
  doc.setFillColor(35, 35, 35); // #232323
  doc.rect(0, 0, 210, 30, 'F');
  
  // Placeholder for Logo
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 255, 0); // #DCFF00
  doc.text('DZ STUDIO', 14, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255);
  doc.text('Rua Fictícia, 123 - São Paulo, SP', 140, 15);
  doc.text('contato@dz.studio | (11) 99999-8888', 140, 20);

  // --- Quote Info ---
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(35, 35, 35);
  doc.text(`Orçamento: ${quote.quoteNumber}`, 14, 45);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Cliente:`, 14, 55);
  doc.setFont('helvetica', 'bold');
  doc.text(quote.client, 32, 55);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Data de Emissão:`, 14, 62);
  doc.setFont('helvetica', 'bold');
  doc.text(new Date(quote.sentDate).toLocaleDateString('pt-BR'), 48, 62);

  doc.setFont('helvetica', 'normal');
  doc.text(`Validade:`, 140, 62);
  doc.setFont('helvetica', 'bold');
  doc.text(new Date(quote.validUntil).toLocaleDateString('pt-BR'), 158, 62);

  // --- Items Table ---
  const tableColumn = ["Item", "Descrição", "Qtd.", "Preço Unit.", "Total"];
  const tableRows: any[][] = [];

  quote.items.forEach((item, index) => {
    const itemData = [
      index + 1,
      item.description,
      item.quantity,
      item.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      (item.quantity * item.unitPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    ];
    tableRows.push(itemData);
  });

  (doc as any).autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 75,
    theme: 'grid',
    headStyles: {
      fillColor: [35, 35, 35],
      textColor: 255,
      fontStyle: 'bold'
    },
    styles: {
        font: 'helvetica',
        fontSize: 10,
    },
    columnStyles: {
        0: { cellWidth: 15 },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' },
    }
  });

  // --- Totals ---
  const finalY = (doc as any).autoTable.previous.finalY;
  const subtotal = quote.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  let discountAmount = 0;
  if (quote.discountType === 'percentage') {
      discountAmount = subtotal * (quote.discountValue / 100);
  } else {
      discountAmount = quote.discountValue;
  }
  const total = quote.value;

  doc.setFontSize(11);
  doc.text('Subtotal:', 140, finalY + 10);
  doc.text(subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 200, finalY + 10, { align: 'right' });

  if (discountAmount > 0) {
      const discountLabel = quote.discountType === 'percentage' ? `Desconto (${quote.discountValue}%):` : 'Desconto:';
      doc.text(discountLabel, 140, finalY + 17);
      doc.setTextColor(255, 0, 0);
      doc.text(`- ${discountAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 200, finalY + 17, { align: 'right' });
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(35, 35, 35);
  doc.text('Total:', 140, finalY + 25);
  doc.text(total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 200, finalY + 25, { align: 'right' });

  // --- Terms & Footer ---
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Termos e Condições', 14, finalY + 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const splitTerms = doc.splitTextToSize(quote.terms, 180);
  doc.text(splitTerms, 14, finalY + 45);

  // Footer
  doc.setFillColor(35, 35, 35);
  doc.rect(0, 287, 210, 10, 'F');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(`Orçamento gerado em ${new Date().toLocaleDateString('pt-BR')}`, 14, 292);

  // --- Save ---
  doc.save(`Orçamento_${quote.quoteNumber}_${quote.client}.pdf`);
};

export const generateInvoicePDF = (order: ServiceOrder): void => {
    if (!order.invoice || !order.value) {
        alert("Dados da fatura incompletos.");
        return;
    }

    const { jsPDF } = jspdf;
    const doc = new jsPDF();
    const { invoice, client, orderNumber, description, value } = order;

    // --- Header ---
    doc.setFillColor(35, 35, 35); // #232323
    doc.rect(0, 0, 210, 30, 'F');
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 255, 0); // #DCFF00
    doc.text('DZ STUDIO', 14, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(255, 255, 255);
    doc.text('Rua Fictícia, 123 - São Paulo, SP', 140, 15);
    doc.text('contato@dz.studio | (11) 99999-8888', 140, 20);

    // --- Invoice Info ---
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(35, 35, 35);
    doc.text(`Fatura: ${invoice.invoiceNumber}`, 14, 45);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Cliente:`, 14, 55);
    doc.setFont('helvetica', 'bold');
    doc.text(client, 32, 55);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Data de Emissão:`, 14, 62);
    doc.setFont('helvetica', 'bold');
    doc.text(new Date(invoice.issueDate).toLocaleDateString('pt-BR'), 48, 62);

    doc.setFont('helvetica', 'normal');
    doc.text(`Vencimento:`, 140, 62);
    doc.setFont('helvetica', 'bold');
    doc.text(new Date(invoice.dueDate).toLocaleDateString('pt-BR'), 162, 62);

    // --- Items Table ---
    (doc as any).autoTable({
        head: [['Descrição', 'Valor']],
        body: [[`Serviços de Fotografia e Pós-produção - OS ${orderNumber}\n${description}`, value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })]],
        startY: 75,
        theme: 'grid',
        headStyles: { fillColor: [35, 35, 35], textColor: 255, fontStyle: 'bold' },
        styles: { font: 'helvetica', fontSize: 10, },
        columnStyles: { 1: { cellWidth: 40, halign: 'right' } }
    });

    // --- Total ---
    const finalY = (doc as any).autoTable.previous.finalY;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(35, 35, 35);
    doc.text('Total a Pagar:', 140, finalY + 15);
    doc.text(value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 200, finalY + 15, { align: 'right' });
    
    // --- Footer ---
    doc.setFillColor(35, 35, 35);
    doc.rect(0, 287, 210, 10, 'F');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(`Fatura gerada por DZ Studio Organizer`, 14, 292);

    // --- Save ---
    doc.save(`Fatura_${invoice.invoiceNumber}_${client}.pdf`);
};