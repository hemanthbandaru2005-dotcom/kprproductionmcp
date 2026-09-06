import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from './supabaseClient';
import { INVOICE_UPI_QR_BASE64, INVOICE_HEADER_LOGO_BASE64 } from './invoiceAssetsBase64';

const INVOICES_STORAGE_KEY = 'kpr_invoices_history_v1';

/**
 * Format currency in Indian format
 */
export function formatINR(val) {
  const num = Number(val) || 0;
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Fetch full invoice history (combining Supabase + LocalStorage fallback)
 */
export async function fetchInvoicesHistory() {
  const map = new Map();

  // 1. Try Supabase
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      data.forEach(item => {
        if (item && item.id) map.set(item.id, item);
      });
    }
  } catch (e) {
    console.warn('Supabase invoices fetch skipped:', e);
  }

  // 2. Merge LocalStorage
  try {
    const raw = localStorage.getItem(INVOICES_STORAGE_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        list.forEach(item => {
          if (item && item.id && !map.has(item.id)) {
            map.set(item.id, item);
          }
        });
      }
    }
  } catch (e) {}

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  );
}

/**
 * Calculate the next sequential invoice number (e.g. KPR-INV-2026-0001)
 */
export async function getNextInvoiceNumber() {
  const currentYear = new Date().getFullYear();
  const prefix = `KPR-INV-${currentYear}-`;

  const existingInvoices = await fetchInvoicesHistory();
  let maxSeq = 0;

  existingInvoices.forEach(inv => {
    const num = inv.invoice_number || '';
    if (num.startsWith(prefix)) {
      const seqStr = num.replace(prefix, '');
      const seq = parseInt(seqStr, 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  });

  const nextSeq = maxSeq + 1;
  const padded = String(nextSeq).padStart(4, '0');
  return `${prefix}${padded}`;
}

/**
 * Save an invoice record to Supabase and LocalStorage
 */
export async function saveInvoiceRecord(invoiceData) {
  const record = {
    id: invoiceData.id || `inv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    invoice_number: invoiceData.invoice_number,
    customer_name: invoiceData.customer_name,
    customer_phone: invoiceData.customer_phone,
    customer_email: invoiceData.customer_email || '',
    customer_address: invoiceData.customer_address || '',
    customer_city: invoiceData.customer_city || '',
    line_items: invoiceData.line_items || [],
    subtotal: Number(invoiceData.subtotal) || 0,
    discount_amount: Number(invoiceData.discount_amount) || 0,
    tax_amount: Number(invoiceData.tax_amount) || 0,
    tax_label: invoiceData.tax_label || 'As applicable',
    grand_total: Number(invoiceData.grand_total) || 0,
    booking_status: invoiceData.booking_status || 'Awaiting Confirmation',
    notes: invoiceData.notes || 'Package Includes: Event coverage, high-resolution photographs, colour-corrected deliverables, and direct cloud-link delivery.',
    payment_terms: invoiceData.payment_terms || 'UPI / Bank Transfer / Online Payment',
    created_at: invoiceData.created_at || new Date().toISOString(),
    created_by: invoiceData.created_by || 'customer_estimator'
  };

  // 1. Save to LocalStorage
  try {
    const raw = localStorage.getItem(INVOICES_STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const filtered = list.filter(item => item.id !== record.id && item.invoice_number !== record.invoice_number);
    localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify([record, ...filtered]));
  } catch (e) {}

  // 2. Try Supabase
  try {
    await supabase.from('invoices').insert([record]);
  } catch (e) {
    console.warn('Supabase invoice insert fallback to local:', e);
  }

  return record;
}

/**
 * Delete an invoice record
 */
export async function deleteInvoiceRecord(invoiceId) {
  try {
    const raw = localStorage.getItem(INVOICES_STORAGE_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      const filtered = list.filter(item => item.id !== invoiceId && item.invoice_number !== invoiceId);
      localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(filtered));
    }
  } catch (e) {}

  try {
    await supabase.from('invoices').delete().or(`id.eq.${invoiceId},invoice_number.eq.${invoiceId}`);
  } catch (e) {}

  return { success: true };
}

/**
 * Format standard Date (e.g. 06 September 2026)
 */
export function formatInvoiceDate(dateInput) {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}

/**
 * Generate and trigger download of Pixel-Perfect Proforma Invoice PDF matching reference document
 */
export function generateInvoicePdf(invoiceData, autoDownload = true) {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const invoiceNumber = invoiceData.invoice_number || 'KPR-INV-2026-0001';
  const invoiceDate = formatInvoiceDate(invoiceData.created_at);
  const bookingStatus = invoiceData.booking_status || 'Awaiting Confirmation';

  const customerName = invoiceData.customer_name || 'Valued Customer';
  const customerPhone = invoiceData.customer_phone || '+91 XXXXX XXXXX';
  const customerEmail = invoiceData.customer_email || 'customer@example.com';
  const customerAddress = invoiceData.customer_address || 'Customer Address';
  const customerCity = invoiceData.customer_city || 'Telangana, India';

  const lineItems = Array.isArray(invoiceData.line_items) && invoiceData.line_items.length > 0
    ? invoiceData.line_items
    : [
        {
          name: 'Corporate & Commercial Events',
          duration: '8 hours / Custom scope',
          quantity: 1,
          unit_price: 15000,
          total: 15000
        }
      ];

  const subtotal = Number(invoiceData.subtotal) || lineItems.reduce((sum, item) => sum + (Number(item.total) || Number(item.unit_price) || 0), 0);
  const discount = Number(invoiceData.discount_amount) || 0;
  const taxLabel = invoiceData.tax_label || 'As applicable';
  const taxAmount = Number(invoiceData.tax_amount) || 0;
  const grandTotal = Number(invoiceData.grand_total) || (subtotal - discount + taxAmount);

  // ══════════════════ 1. HEADER SECTION ══════════════════
  // Top Left: KPR Fotography Logo
  try {
    if (INVOICE_HEADER_LOGO_BASE64) {
      doc.addImage(INVOICE_HEADER_LOGO_BASE64, 'PNG', 14, 12, 38, 19, '', 'FAST');
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(17, 17, 17);
      doc.text('KPR FOTOGRAPHY', 14, 20);
    }
  } catch (e) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(17, 17, 17);
    doc.text('KPR FOTOGRAPHY', 14, 20);
  }

  // Top Right: PROFORMA INVOICE details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(30, 30, 30);
  doc.text('PROFORMA INVOICE', 196, 17, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(70, 70, 70);
  doc.text(`Invoice No : ${invoiceNumber}`, 196, 23, { align: 'right' });
  doc.text(`Invoice Date: ${invoiceDate}`, 196, 27.5, { align: 'right' });
  doc.text(`Booking Status: ${bookingStatus}`, 196, 32, { align: 'right' });

  // Divider Line
  doc.setDrawColor(220, 222, 226);
  doc.setLineWidth(0.4);
  doc.line(14, 38, 196, 38);

  // ══════════════════ 2. FROM & BILL TO BLOCKS ══════════════════
  const addressTop = 44;

  // FROM Block (Left)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('FROM', 14, addressTop);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(20, 20, 20);
  doc.text('KPR Productions', 14, addressTop + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text('Photography & Videography Services', 14, addressTop + 8.5);
  doc.text('KPR Productions Studio', 14, addressTop + 12.5);
  doc.text('Telangana, India', 14, addressTop + 16.5);
  doc.text('Phone: +91 98494 43648', 14, addressTop + 20.5);
  doc.text('Email: info@kprproductions.com', 14, addressTop + 24.5);

  // BILL TO Block (Right)
  const billToLeft = 105;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('BILL TO', billToLeft, addressTop);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(20, 20, 20);
  doc.text(customerName, billToLeft, addressTop + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text(customerAddress || 'Customer Address', billToLeft, addressTop + 8.5);
  doc.text(customerCity || 'City, State, PIN', billToLeft, addressTop + 12.5);
  doc.text(`Phone: ${customerPhone}`, billToLeft, addressTop + 16.5);
  doc.text(`Email: ${customerEmail}`, billToLeft, addressTop + 20.5);

  // ══════════════════ 3. ITEMIZED PACKAGES TABLE ══════════════════
  const tableRows = lineItems.map(item => [
    item.name || 'Photography Service',
    item.duration || item.scope || '6 hours / Custom scope',
    String(item.quantity || 1),
    `₹${Number(item.total || item.unit_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
  ]);

  autoTable(doc, {
    startY: 75,
    margin: { left: 14, right: 14 },
    head: [['Package Name', 'Duration / Scope', 'Qty', 'Amount']],
    body: tableRows,
    theme: 'plain',
    headStyles: {
      fillColor: [17, 17, 17],
      textColor: [255, 255, 255],
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
      0: { cellWidth: 70, fontStyle: 'normal' },
      1: { cellWidth: 62 },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 34, halign: 'right', fontStyle: 'bold' }
    },
    didDrawCell: (data) => {
      // Bottom border for each body row
      if (data.section === 'body') {
        doc.setDrawColor(235, 237, 240);
        doc.setLineWidth(0.2);
        doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
      }
    }
  });

  const finalY = doc.lastAutoTable.finalY + 4;

  // ══════════════════ 4. TOTALS SUMMARY BOX (Right Aligned) ══════════════════
  const summaryLeftLabel = 118;
  const summaryRightVal = 196;
  let curY = finalY + 4;

  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);

  // Subtotal
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal', summaryLeftLabel, curY);
  doc.text(`₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, summaryRightVal, curY, { align: 'right' });

  // Discount
  curY += 5;
  doc.text('Discount', summaryLeftLabel, curY);
  doc.text(`₹${discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, summaryRightVal, curY, { align: 'right' });

  // Tax / GST
  curY += 5;
  doc.text('Tax / GST', summaryLeftLabel, curY);
  doc.text(taxAmount > 0 ? `₹${taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : taxLabel, summaryRightVal, curY, { align: 'right' });

  // Total Payable Highlight Box
  curY += 4;
  doc.setFillColor(245, 245, 247);
  doc.roundedRect(114, curY, 82, 9, 1, 1, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(17, 17, 17);
  doc.text('Total Payable', 118, curY + 6);
  doc.text(`₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, summaryRightVal - 2, curY + 6, { align: 'right' });

  // ══════════════════ 5. PACKAGE INCLUDES NOTE ══════════════════
  curY += 16;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(40, 40, 40);
  doc.text('Package Includes: ', 14, curY);

  const includesLabelWidth = doc.getTextWidth('Package Includes: ');
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(90, 90, 90);
  doc.text(
    invoiceData.notes || 'Event coverage, high-resolution photographs, colour-corrected deliverables, and direct cloud-link delivery.',
    14 + includesLabelWidth,
    curY,
    { maxWidth: 170 }
  );

  // ══════════════════ 6. PAYMENT TERMS & UPI QR + SIGNATURE ══════════════════
  curY += 10;

  // Left: Payment Terms & UPI QR
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  doc.text('Payment Terms', 14, curY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text(invoiceData.payment_terms || 'UPI / Bank Transfer / Online Payment', 14, curY + 4);

  // Embed Authentic UPI QR Code (with BHIM/GPay/PhonePe bar)
  try {
    if (INVOICE_UPI_QR_BASE64) {
      doc.addImage(INVOICE_UPI_QR_BASE64, 'PNG', 14, curY + 7, 24, 33, '', 'FAST');
    }
  } catch (e) {}

  // Right: Signature Block
  const sigRight = 196;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.text('For KPR Productions', sigRight - 20, curY + 36, { align: 'center' });

  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(sigRight - 42, curY + 47, sigRight, curY + 47);

  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text('Authorised Signature', sigRight - 20, curY + 50.5, { align: 'center' });

  // ══════════════════ 7. SAVE & DOWNLOAD ══════════════════
  const cleanFilename = `${invoiceNumber}-${customerName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  if (autoDownload) {
    doc.save(cleanFilename);
  }

  return {
    doc,
    filename: cleanFilename,
    invoiceNumber
  };
}
