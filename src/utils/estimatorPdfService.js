import * as jspdfModule from 'jspdf';
import autoTable from 'jspdf-autotable';
import { INVOICE_HEADER_LOGO_BASE64, INVOICE_UPI_QR_BASE64 } from './invoiceAssetsBase64.js';

const jsPDF = jspdfModule.jsPDF || jspdfModule.default || jspdfModule;

/**
 * Format INR with Rs. prefix for clean, universal PDF rendering
 */
export function formatINR(val) {
  const num = Number(val) || 0;
  return 'Rs. ' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Format standard Date (e.g. 09 September 2026)
 */
export function formatEstimateDate(dateInput) {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}

/**
 * Generate and download a real, high-resolution branded PDF estimate
 */
export function generateEstimatePdf(estimateData, autoDownload = true) {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const currentYear = new Date().getFullYear();
  const estimateNumber = estimateData.estimateNumber || `KPR-EST-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`;
  const estimateDate = formatEstimateDate(estimateData.date || new Date());
  const validityText = 'Valid for 30 Days';

  const customerName = (estimateData.customerName || 'Valued Customer').trim();
  const customerPhone = (estimateData.customerPhone || '').trim();
  const celebratingEvent = estimateData.event || 'Special Celebration';

  const selectedPackages = Array.isArray(estimateData.selectedPackages) ? estimateData.selectedPackages : [];
  const albumConfig = estimateData.album || { needAlbum: false, sheets: 0, price: 0 };
  const deliverables = Array.isArray(estimateData.deliverables) ? estimateData.deliverables : [];
  const addOns = Array.isArray(estimateData.addOns) ? estimateData.addOns : [];

  const servicesSubtotal = Number(estimateData.servicesSubtotal) || selectedPackages.reduce((acc, p) => acc + (Number(p.price) || 0), 0);
  const albumSubtotal = Number(estimateData.albumSubtotal) || (albumConfig.needAlbum ? Number(albumConfig.price || 0) : 0);
  const addOnsSubtotal = Number(estimateData.addOnsSubtotal) || addOns.reduce((acc, a) => acc + (Number(a.price) * (Number(a.quantity) || 1)), 0);
  const grandTotal = Number(estimateData.grandTotal) || (servicesSubtotal + albumSubtotal + addOnsSubtotal);

  // ══════════════════ 1. HEADER SECTION ══════════════════
  // Top Left: KPR Fotography Logo
  try {
    if (INVOICE_HEADER_LOGO_BASE64) {
      doc.addImage(INVOICE_HEADER_LOGO_BASE64, 'PNG', 14, 14, 48, 15, '', 'FAST');
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(17, 17, 17);
      doc.text('KPR FOTOGRAPHY', 14, 22);
    }
  } catch (e) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(17, 17, 17);
    doc.text('KPR FOTOGRAPHY', 14, 22);
  }

  // Top Right: ESTIMATE HEADER
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(197, 168, 128); // Warm Gold: #C5A880
  doc.text('COST ESTIMATE', 196, 17, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(70, 70, 70);
  doc.text(`Estimate No : ${estimateNumber}`, 196, 23, { align: 'right' });
  doc.text(`Estimate Date: ${estimateDate}`, 196, 27.5, { align: 'right' });
  doc.text(`Validity: ${validityText}`, 196, 32, { align: 'right' });

  // Divider Line
  doc.setDrawColor(216, 207, 196); // Soft Gold Border: #D8CFC4
  doc.setLineWidth(0.4);
  doc.line(14, 37, 196, 37);

  // ══════════════════ 2. FROM & CLIENT BLOCKS ══════════════════
  const addressTop = 43;

  // FROM Block (Left)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(140, 109, 63); // Gold Dark: #8C6D3F
  doc.text('STUDIO DETAILS', 14, addressTop);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(20, 20, 20);
  doc.text('KPR Fotography & Color Lab', 14, addressTop + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text('Luxury Telugu Wedding & Event Fotography', 14, addressTop + 8.5);
  doc.text('Station Road, Warangal / Hyderabad, Telangana', 14, addressTop + 12.5);
  doc.text('Phone: +91 98494 43648 / +91 98493 90876', 14, addressTop + 16.5);
  doc.text('Email: kprfotography@gmail.com', 14, addressTop + 20.5);

  // PREPARED FOR Block (Right)
  const clientLeft = 110;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(140, 109, 63);
  doc.text('ESTIMATE PREPARED FOR', clientLeft, addressTop);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(20, 20, 20);
  doc.text(customerName, clientLeft, addressTop + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text(`Phone: +91 ${customerPhone}`, clientLeft, addressTop + 8.5);
  doc.text(`Event: ${celebratingEvent}`, clientLeft, addressTop + 12.5);
  doc.text('Location: Telangana, India', clientLeft, addressTop + 16.5);
  doc.text(`Reference: ${estimateNumber}`, clientLeft, addressTop + 20.5);

  // ══════════════════ 3. ITEMIZED SERVICES TABLE ══════════════════
  const tableRows = [];

  // Add Packages
  selectedPackages.forEach(pkg => {
    tableRows.push([
      pkg.name,
      (pkg.category === 'Photography' ? 'Fotography' : (pkg.category || 'Fotography')),
      pkg.duration || '6 hours',
      `Rs. ${Number(pkg.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
    ]);
  });

  // Add Album if selected
  if (albumConfig.needAlbum && albumConfig.sheets > 0) {
    tableRows.push([
      `Premium Photobook Album (${albumConfig.sheets} Sheets / ${albumConfig.sheets * 2} Pages)`,
      'Print Album',
      'Layflat Flush Mount, Non-Tearable UV Finish',
      `Rs. ${Number(albumSubtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
    ]);
  }

  // Add extra add-ons if selected
  addOns.forEach(addon => {
    const qty = addon.quantity || 1;
    const itemTotal = Number(addon.price || 0) * qty;
    tableRows.push([
      `${addon.name} (x${qty})`,
      'Deliverable Add-On',
      addon.scope || 'Custom scope',
      `Rs. ${itemTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
    ]);
  });

  autoTable(doc, {
    startY: 72,
    margin: { left: 14, right: 14 },
    head: [
      [
        { content: 'Selected Service / Specification', styles: { halign: 'left' } },
        { content: 'Category', styles: { halign: 'left' } },
        { content: 'Scope / Duration', styles: { halign: 'left' } },
        { content: 'Amount (INR)', styles: { halign: 'right' } }
      ]
    ],
    body: tableRows,
    theme: 'plain',
    headStyles: {
      fillColor: [22, 20, 18], // Dark Luxury: #161412
      textColor: [232, 212, 184], // Soft Gold Text: #E8D4B8
      fontStyle: 'bold',
      fontSize: 8.5,
      cellPadding: 3.5
    },
    bodyStyles: {
      textColor: [30, 30, 30],
      fontSize: 8,
      cellPadding: 3.2
    },
    columnStyles: {
      0: { cellWidth: 78, fontStyle: 'normal', halign: 'left' },
      1: { cellWidth: 36, halign: 'left' },
      2: { cellWidth: 40, halign: 'left' },
      3: { cellWidth: 28, halign: 'right', fontStyle: 'bold' }
    },
    didDrawCell: (data) => {
      if (data.section === 'body') {
        doc.setDrawColor(235, 230, 222);
        doc.setLineWidth(0.2);
        doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
      }
    }
  });

  let currentY = doc.lastAutoTable.finalY + 4;

  // ══════════════════ 4. INCLUDED DELIVERABLES BOX ══════════════════
  if (deliverables.length > 0 && currentY < 205) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(140, 109, 63);
    doc.text('INCLUDED STANDARD DELIVERABLES (COMPLIMENTARY)', 14, currentY);
    currentY += 4.5;

    const delivList = deliverables.slice(0, 6);
    const half = Math.ceil(delivList.length / 2);
    const col1 = delivList.slice(0, half);
    const col2 = delivList.slice(half);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(70, 70, 70);

    let col1Y = currentY;
    col1.forEach((item) => {
      // Draw crisp golden circular bullet
      doc.setFillColor(197, 168, 128);
      doc.circle(15.5, col1Y - 1.1, 0.8, 'F');

      const wrapped = doc.splitTextToSize(item, 82);
      doc.text(wrapped, 18, col1Y);
      col1Y += (wrapped.length * 3.6) + 1.2;
    });

    let col2Y = currentY;
    col2.forEach((item) => {
      doc.setFillColor(197, 168, 128);
      doc.circle(107.5, col2Y - 1.1, 0.8, 'F');

      const wrapped = doc.splitTextToSize(item, 82);
      doc.text(wrapped, 110, col2Y);
      col2Y += (wrapped.length * 3.6) + 1.2;
    });

    currentY = Math.max(col1Y, col2Y) + 3.5;
  }

  // ══════════════════ 5. TOTALS BREAKDOWN SUMMARY ══════════════════
  const summaryLeftLabel = 118;
  const summaryRightVal = 196;

  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);

  // Services Subtotal
  doc.setFont('helvetica', 'normal');
  doc.text('Services Subtotal', summaryLeftLabel, currentY);
  doc.text(`Rs. ${servicesSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, summaryRightVal, currentY, { align: 'right' });

  // Album Subtotal (if any)
  if (albumConfig.needAlbum) {
    currentY += 4.5;
    doc.text('Album Subtotal', summaryLeftLabel, currentY);
    doc.text(`Rs. ${albumSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, summaryRightVal, currentY, { align: 'right' });
  }

  // Add-ons Subtotal (if any)
  if (addOnsSubtotal > 0) {
    currentY += 4.5;
    doc.text('Add-Ons Subtotal', summaryLeftLabel, currentY);
    doc.text(`Rs. ${addOnsSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, summaryRightVal, currentY, { align: 'right' });
  }

  // Grand Total Box
  currentY += 6;
  doc.setFillColor(247, 243, 238); // Cream Sand: #F7F3EE
  doc.setDrawColor(197, 168, 128); // Warm Gold
  doc.setLineWidth(0.4);
  doc.roundedRect(summaryLeftLabel - 4, currentY - 4, 82, 11, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);
  doc.text('ESTIMATED TOTAL', summaryLeftLabel, currentY + 3);

  doc.setFontSize(10.5);
  doc.setTextColor(180, 83, 9); // Amber / Dark Gold
  doc.text(`Rs. ${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, summaryRightVal - 2, currentY + 3, { align: 'right' });

  // ══════════════════ 6. QR CODE PAYMENT CARD & STUDIO TERMS ══════════════════
  // Official Google Pay UPI QR Code Card (Placed in marked area on right below Estimated Total)
  const qrWidth = 37;
  const qrHeight = qrWidth / 0.67436; // 54.8mm
  const qrX = 196 - qrWidth; // 159mm
  const qrY = currentY + 9;

  if (INVOICE_UPI_QR_BASE64) {
    // Subtle luxury rounded frame for the QR card
    doc.setDrawColor(216, 207, 196);
    doc.setLineWidth(0.3);
    doc.roundedRect(qrX - 0.5, qrY - 0.5, qrWidth + 1, qrHeight + 1, 1.5, 1.5, 'S');

    doc.addImage(INVOICE_UPI_QR_BASE64, 'PNG', qrX, qrY, qrWidth, qrHeight, '', 'FAST');
  }

  // Terms & Booking Instructions on the Left
  const notesTop = currentY + 11;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(140, 109, 63);
  doc.text('ESTIMATE TERMS & BOOKING INSTRUCTIONS', 14, notesTop);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(90, 90, 90);
  doc.text('• This estimate is generated based on official standard KPR Fotography rate cards and is valid for 30 days.', 14, notesTop + 4.5);
  doc.text('• Standard Payment Schedule: 30% advance for date reservation, 50% on event date, 20% on final delivery.', 14, notesTop + 8.5);
  doc.text('• Outstation travel, lodging & local conveyance charges (if applicable) are extra at actuals.', 14, notesTop + 12.5);
  doc.text('• Scan the official Google Pay / UPI QR code on the right to pay advance directly.', 14, notesTop + 16.5);
  doc.text('• To confirm booking or customize dates, please WhatsApp or call our team directly at +91 98494 43648.', 14, notesTop + 20.5);

  // Signature Block (Positioned below QR Card with clean clearance)
  const sigTop = Math.max(qrY + qrHeight + 4, notesTop + 28);
  const sigLeft = 145;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(40, 40, 40);
  doc.text('For KPR Fotography & Color Lab', sigLeft, sigTop);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(110, 110, 110);
  doc.text('Authorized Studio Representative', sigLeft, sigTop + 4);

  // ══════════════════ 7. FOOTER ══════════════════
  doc.setDrawColor(220, 215, 205);
  doc.setLineWidth(0.2);
  doc.line(14, 282, 196, 282);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(130, 130, 130);
  doc.text('KPR Productions • Capturing Moments | Creating Memories • Telangana, India', 14, 286);
  doc.text('www.kprproductions.in', 196, 286, { align: 'right' });

  if (autoDownload) {
    const sanitizedName = customerName.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `KPR_Fotography_Estimate_${sanitizedName}_${estimateNumber}.pdf`;
    doc.save(filename);
  }

  return doc;
}
