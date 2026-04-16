import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const generateWorkerPaySlip = (worker, masterData) => {
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString('en-GB');

    // Branding
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 210, 50, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(30);
    doc.setFont('helvetica', 'bold');
    doc.text('NRZO0NE', 20, 30);
    doc.setFontSize(10);
    doc.text('FACTORY MANAGEMENT SYSTEM', 20, 38);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text(`PAY SLIP: ${dateStr}`, 140, 30);

    // Worker Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text('RECIPIENT DETAILS', 20, 70);
    doc.setFontSize(11);
    doc.text(`Name: ${worker.name}`, 20, 82);
    doc.text(`Department: ${worker.dept?.toUpperCase() || 'N/A'}`, 20, 89);
    doc.text(`NID: ${worker.nid || 'N/A'}`, 20, 96);

    // Calculations logic
    const productions = [
        ...(masterData.productions || []),
        ...(masterData.pataEntries || [])
    ].filter(p => p.worker?.toUpperCase() === worker.name?.toUpperCase() && p.status === 'Received');
    
    // Simple wage logic - would be more complex in real usage
    const totalQty = productions.reduce((sum, p) => sum + (p.pataQty || (p.receiveBorka + p.receiveHijab) || 0), 0);
    const earnings = productions.reduce((sum, p) => sum + (p.pataRate || p.sewingRate || p.stoneRate || 0) * (p.pataQty || (p.receiveBorka + p.receiveHijab) || 0), 0);
    
    const advances = (masterData.workerPayments || []).filter(p => p.worker === worker.name && p.type === 'Advance').reduce((sum, p) => sum + p.amount, 0);
    const netPay = earnings - advances;

    // Financial Table
    doc.autoTable({
        startY: 110,
        head: [['Earnings Description', 'Quantity', 'Rate', 'Total']],
        body: [
            ['Production Pieces', totalQty, 'Multiple', `${earnings} Taka`],
            ['Advances Taken', '-', '-', `-${advances} Taka`],
            ['NET PAYABLE', '-', '-', `${netPay} Taka`]
        ],
        theme: 'grid',
        headStyles: { fillColor: [0, 0, 0] },
        styles: { font: 'helvetica', fontSize: 10 }
    });

    const finalY = doc.lastAutoTable.finalY + 30;
    doc.setDrawColor(0, 0, 0);
    doc.line(20, finalY, 80, finalY);
    doc.text('Worker Signature', 20, finalY + 10);
    
    doc.line(130, finalY, 190, finalY);
    doc.text('Admin Signature', 130, finalY + 10);
    
    doc.save(`${worker.name}_Statement_${dateStr.replace(/\//g, '-')}.pdf`);
};

export const generateDeliverySlip = (delivery, masterData) => {
    const doc = new jsPDF({ format: 'a5' }); // A5 is standard for delivery slips
    const dateStr = delivery.date || new Date().toLocaleDateString('en-GB');

    const renderSlip = (yOffset, label) => {
        // Branding Header
        doc.setFillColor(30, 41, 59);
        doc.rect(10, yOffset, 128, 15, 'F');
        doc.setTextColor(255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(masterData.settings?.factoryName?.toUpperCase() || 'NRZO0NE ERP', 15, yOffset + 10);
        doc.setFontSize(7);
        doc.text(label, 110, yOffset + 10);

        // Client & Meta info
        doc.setTextColor(0);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`CLIENT: ${delivery.receiver?.toUpperCase() || 'N/A'}`, 15, yOffset + 22);
        doc.text(`DATE: ${dateStr}`, 90, yOffset + 22);
        doc.text(`LOT/ID: #${delivery.id?.toString().slice(-6)}`, 90, yOffset + 27);

        // Table
        doc.autoTable({
            startY: yOffset + 32,
            margin: { left: 10, right: 10 },
            tableWidth: 128,
            head: [['DESIGN / ITEM', 'COLOR', 'SIZE', 'BORKA', 'HIJAB']],
            body: [[
                delivery.design?.toUpperCase() || 'N/A',
                delivery.color?.toUpperCase() || 'MIX',
                delivery.size || 'N/A',
                `${delivery.qtyBorka || 0} PCS`,
                `${delivery.qtyHijab || 0} PCS`
            ]],
            theme: 'grid',
            headStyles: { fillColor: [51, 65, 85], textColor: 255 },
            styles: { font: 'helvetica', fontSize: 8, cellPadding: 2 }
        });

        const finalY = doc.lastAutoTable.finalY + 15;
        doc.setFontSize(7);
        doc.text('PREPARED BY', 15, finalY);
        doc.text('AUTHORIZED SIGN', 100, finalY);
        doc.setDrawColor(200);
        doc.line(10, finalY - 5, 40, finalY - 5);
        doc.line(95, finalY - 5, 138, finalY - 5);
    };

    // Copy 1: Factory Copy
    renderSlip(10, 'FACTORY COPY');
    
    // Cutting Line
    doc.setLineDash([2, 1], 0);
    doc.setDrawColor(150);
    doc.line(0, 105, 148, 105);
    doc.setLineDash([], 0);

    // Copy 2: Client Copy
    renderSlip(115, 'CLIENT COPY');

    doc.save(`Delivery_Slip_${delivery.receiver}_${delivery.id}.pdf`);
};
