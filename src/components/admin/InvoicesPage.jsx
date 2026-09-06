import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText, Download, Search, RefreshCw, Trash2, Eye,
  CheckCircle, Clock, Receipt, User, Phone, Mail, MapPin,
  Calendar, IndianRupee, Tag, ShieldCheck, X, ExternalLink
} from 'lucide-react';
import {
  fetchInvoicesHistory,
  deleteInvoiceRecord,
  generateInvoicePdf,
  formatINR,
  formatInvoiceDate
} from '../../utils/invoicesService';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const data = await fetchInvoicesHistory();
      setInvoices(data || []);
    } catch (e) {
      console.warn('Failed to load invoices:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return invoices;
    const q = searchQuery.toLowerCase().trim();
    return invoices.filter(inv => {
      const num = (inv.invoice_number || '').toLowerCase();
      const name = (inv.customer_name || '').toLowerCase();
      const phone = (inv.customer_phone || '').toLowerCase();
      const email = (inv.customer_email || '').toLowerCase();
      return num.includes(q) || name.includes(q) || phone.includes(q) || email.includes(q);
    });
  }, [invoices, searchQuery]);

  // Total metrics
  const totalInvoicesCount = invoices.length;
  const totalBilledRevenue = invoices.reduce((sum, inv) => sum + (Number(inv.grand_total) || 0), 0);
  const latestInvoiceNumber = invoices[0]?.invoice_number || 'None';

  // Handle Download Again
  const handleDownloadAgain = (inv) => {
    try {
      generateInvoicePdf(inv, true);
      showToast(`Invoice ${inv.invoice_number} downloaded successfully!`);
    } catch (e) {
      console.error('Download error:', e);
      showToast('Error downloading invoice PDF.');
    }
  };

  // Handle Delete
  const handleDelete = async (inv) => {
    if (window.confirm(`Are you sure you want to delete invoice ${inv.invoice_number} for ${inv.customer_name}?`)) {
      await deleteInvoiceRecord(inv.id || inv.invoice_number);
      setInvoices(prev => prev.filter(i => i.id !== inv.id && i.invoice_number !== inv.invoice_number));
      if (selectedInvoice?.invoice_number === inv.invoice_number) {
        setSelectedInvoice(null);
      }
      showToast(`Invoice ${inv.invoice_number} deleted.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#141414] border border-[#C5A880] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs animate-slide-up">
          <CheckCircle className="w-4 h-4 text-[#13A52D]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header & Metrics Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl text-[#111111] font-semibold flex items-center gap-2.5">
            <Receipt className="w-6 h-6 text-[#1E74FF]" />
            <span>Proforma Invoices & Quotes</span>
          </h2>
          <p className="text-xs text-[#9CA0A6] mt-0.5">
            Complete historical log of all client quotes and downloadable PDF invoices generated via the website estimator.
          </p>
        </div>

        <button
          onClick={loadInvoices}
          disabled={loading}
          className="px-4 py-2 rounded-full border border-[#E7E8EB] bg-white hover:bg-[#F7F8FA] text-xs font-semibold text-[#111111] flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#1E74FF]' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 bg-white rounded-2xl border border-[#E7E8EB] shadow-2xs">
          <span className="text-[11px] uppercase tracking-wider text-[#9CA0A6] font-semibold block">Total Invoices Generated</span>
          <span className="text-2xl font-bold font-serif text-[#111111] mt-1 block">{totalInvoicesCount}</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E7E8EB] shadow-2xs">
          <span className="text-[11px] uppercase tracking-wider text-[#9CA0A6] font-semibold block">Total Value Estimated</span>
          <span className="text-2xl font-bold font-serif text-[#13A52D] mt-1 block">{formatINR(totalBilledRevenue)}</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E7E8EB] shadow-2xs">
          <span className="text-[11px] uppercase tracking-wider text-[#9CA0A6] font-semibold block">Latest Invoice No.</span>
          <span className="text-xl font-bold font-mono text-[#1E74FF] mt-1 block">{latestInvoiceNumber}</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#9CA0A6] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by customer name, invoice number (e.g. KPR-INV-2026-0001), phone, or email…"
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E7E8EB] rounded-full text-xs text-[#111111] placeholder-[#9CA0A6] focus:outline-none focus:border-[#141414] shadow-2xs"
        />
      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-2xl border border-[#E7E8EB] shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#9CA0A6]">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#1E74FF]" />
            <p>Loading invoice records…</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#9CA0A6] space-y-2">
            <Receipt className="w-8 h-8 mx-auto text-[#9CA0A6]" />
            <p className="font-semibold text-[#111111]">No invoice records found</p>
            <p className="text-[11px]">When customers generate quotes in the Package Estimator, invoices will be logged here automatically.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F8FA] border-b border-[#E7E8EB] text-[10px] uppercase tracking-wider text-[#6B7280] font-semibold">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Packages</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E8EB]">
                {filteredInvoices.map((inv) => {
                  const pkgCount = Array.isArray(inv.line_items) ? inv.line_items.length : 1;
                  const pkgNames = Array.isArray(inv.line_items)
                    ? inv.line_items.map(p => p.name).join(', ')
                    : 'Photography Package';

                  return (
                    <tr key={inv.id || inv.invoice_number} className="hover:bg-[#F7F8FA]/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#111111]">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#1E74FF] shrink-0" />
                          <span>{inv.invoice_number}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-[#6B7280]">
                        {formatInvoiceDate(inv.created_at)}
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-[#111111]">{inv.customer_name}</p>
                        <p className="text-[11px] text-[#6B7280]">{inv.customer_phone}</p>
                        {inv.customer_email && (
                          <p className="text-[10px] text-[#9CA0A6] truncate max-w-[160px]">{inv.customer_email}</p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 max-w-[220px]">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-[#DCE9FF] text-[#1E74FF] text-[10px] font-bold mr-1.5">
                          {pkgCount} {pkgCount === 1 ? 'Package' : 'Packages'}
                        </span>
                        <p className="text-[11px] text-[#6B7280] truncate mt-0.5" title={pkgNames}>
                          {pkgNames}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 text-right font-serif font-bold text-[#111111] text-sm">
                        {formatINR(inv.grand_total)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{inv.booking_status || 'Awaiting'}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Download PDF Again */}
                          <button
                            onClick={() => handleDownloadAgain(inv)}
                            className="p-1.5 rounded-full bg-[#141414] hover:bg-[#333333] text-white text-[10px] flex items-center gap-1 px-2.5 transition-colors cursor-pointer shadow-2xs"
                            title="Re-download PDF"
                          >
                            <Download className="w-3 h-3" />
                            <span>PDF</span>
                          </button>

                          {/* View Details */}
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="p-1.5 rounded-full hover:bg-[#F1F2F4] text-[#6B7280] hover:text-[#111111] transition-colors cursor-pointer"
                            title="View invoice details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(inv)}
                            className="p-1.5 rounded-full hover:bg-[#FEF2F2] text-[#9CA0A6] hover:text-[#DC2626] transition-colors cursor-pointer"
                            title="Delete invoice record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Details Drawer / Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E8EB]">
              <div>
                <span className="text-[10px] font-mono text-[#1E74FF] uppercase tracking-wider block font-bold">
                  {selectedInvoice.invoice_number}
                </span>
                <h3 className="font-serif text-lg font-bold text-[#111111]">
                  Invoice Details & Scope
                </h3>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1.5 rounded-full hover:bg-[#F1F2F4] text-[#9CA0A6] hover:text-[#111111] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Customer Info */}
            <div className="bg-[#F7F8FA] p-3.5 rounded-xl text-xs space-y-1">
              <p className="font-bold text-[#111111]">{selectedInvoice.customer_name}</p>
              <p className="text-[#6B7280]">Phone: {selectedInvoice.customer_phone}</p>
              {selectedInvoice.customer_email && <p className="text-[#6B7280]">Email: {selectedInvoice.customer_email}</p>}
              {selectedInvoice.customer_city && <p className="text-[#6B7280]">Location: {selectedInvoice.customer_city}</p>}
            </div>

            {/* Line Items List */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">Line Items</span>
              <div className="divide-y divide-[#E7E8EB] border border-[#E7E8EB] rounded-xl overflow-hidden text-xs">
                {(selectedInvoice.line_items || []).map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between bg-white">
                    <div>
                      <p className="font-bold text-[#111111]">{item.name}</p>
                      <p className="text-[10px] text-[#9CA0A6]">{item.duration || '6 hours'}</p>
                    </div>
                    <span className="font-serif font-bold text-[#111111]">{formatINR(item.total || item.unit_price)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals Breakdown */}
            <div className="bg-[#F7F8FA] p-3.5 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between text-[#6B7280]">
                <span>Subtotal:</span>
                <span>{formatINR(selectedInvoice.subtotal)}</span>
              </div>
              {selectedInvoice.discount_amount > 0 && (
                <div className="flex justify-between text-[#13A52D]">
                  <span>Discount:</span>
                  <span>-{formatINR(selectedInvoice.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#6B7280]">
                <span>Tax ({selectedInvoice.tax_label || 'As applicable'}):</span>
                <span>{selectedInvoice.tax_amount > 0 ? formatINR(selectedInvoice.tax_amount) : 'As applicable'}</span>
              </div>
              <div className="flex justify-between font-bold text-[#111111] text-sm pt-2 border-t border-[#E7E8EB]">
                <span>Grand Total:</span>
                <span className="text-[#1E74FF]">{formatINR(selectedInvoice.grand_total)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => handleDownloadAgain(selectedInvoice)}
                className="px-5 py-2.5 rounded-full bg-[#141414] hover:bg-[#333333] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
