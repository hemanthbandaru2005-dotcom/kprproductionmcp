import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FileText, Download, CheckCircle, X, ShieldCheck,
  User, Phone, Mail, MapPin, Tag, Loader2, Sparkles, Receipt
} from 'lucide-react';
import {
  getNextInvoiceNumber,
  saveInvoiceRecord,
  generateInvoicePdf,
  formatINR
} from '../utils/invoicesService';

export default function GenerateInvoiceModal({
  isOpen,
  onClose,
  selectedPackages = [],
  customPrice = null,
  effectiveDuration = ''
}) {
  const { user, profile } = useAuth();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [taxOption, setTaxOption] = useState('as_applicable'); // 'as_applicable' | '18_gst' | '0_exempt'
  const [notes, setNotes] = useState('Event coverage, high-resolution photographs, colour-corrected deliverables, and direct cloud-link delivery.');
  const [paymentTerms, setPaymentTerms] = useState('UPI / Bank Transfer / Online Payment');

  const [generating, setGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [generatedInvoiceNum, setGeneratedInvoiceNum] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-prefill from auth if available
  useEffect(() => {
    if (isOpen) {
      setDownloadSuccess(false);
      setErrorMessage('');
      const displayName = profile?.full_name || user?.user_metadata?.full_name || '';
      const email = user?.email || profile?.email || '';
      const phone = profile?.phone || '';
      if (displayName) setCustomerName(displayName);
      if (email) setCustomerEmail(email);
      if (phone) setCustomerPhone(phone);
    }
  }, [isOpen, user, profile]);

  if (!isOpen) return null;

  // Compute itemized line items
  const lineItems = selectedPackages.map(pkg => ({
    name: pkg.name || 'Fotogarphy Package',
    category: pkg.category || 'Fotogarphy',
    duration: pkg.duration || effectiveDuration || '6 hours / Custom scope',
    quantity: 1,
    unit_price: Number(pkg.price) || 0,
    total: Number(pkg.price) || 0
  }));

  const calculatedSubtotal = selectedPackages.reduce((acc, p) => acc + (Number(p.price) || 0), 0);
  const effectiveSubtotal = customPrice && Number(customPrice) > 0 ? Number(customPrice) : calculatedSubtotal;
  
  // Tax calculations
  let taxAmount = 0;
  let taxLabel = 'As applicable';
  if (taxOption === '18_gst') {
    taxAmount = Math.round(effectiveSubtotal * 0.18);
    taxLabel = '18% GST';
  } else if (taxOption === '0_exempt') {
    taxAmount = 0;
    taxLabel = 'Exempt / Inclusive';
  }

  const grandTotal = effectiveSubtotal + taxAmount;

  const handleGenerateAndDownload = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setErrorMessage('Please enter Customer Full Name');
      return;
    }
    if (!customerPhone.trim()) {
      setErrorMessage('Please enter Customer Phone Number');
      return;
    }

    setGenerating(true);
    setErrorMessage('');

    try {
      // 1. Get next unique sequential invoice number
      const invoiceNumber = await getNextInvoiceNumber();
      setGeneratedInvoiceNum(invoiceNumber);

      // 2. Build invoice payload
      const invoicePayload = {
        invoice_number: invoiceNumber,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim(),
        customer_address: customerAddress.trim() || 'Client Location',
        customer_city: customerCity.trim() || 'Telangana, India',
        line_items: lineItems,
        subtotal: effectiveSubtotal,
        discount_amount: 0,
        tax_amount: taxAmount,
        tax_label: taxLabel,
        grand_total: grandTotal,
        booking_status: 'Awaiting Confirmation',
        notes: notes.trim(),
        payment_terms: paymentTerms.trim(),
        created_at: new Date().toISOString(),
        created_by: user?.email || 'website_customer'
      };

      // 3. Save to database & localStorage history
      await saveInvoiceRecord(invoicePayload);

      // 4. Render and trigger browser PDF download
      generateInvoicePdf(invoicePayload, true);

      setDownloadSuccess(true);
    } catch (err) {
      console.error('Invoice generation error:', err);
      setErrorMessage(err.message || 'Failed to generate invoice PDF.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-[#1E1E1E] via-[#161616] to-[#0F0F0F] border border-[#C5A880]/40 rounded-2xl p-5 sm:p-7 text-white shadow-2xl my-8">
        
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#C5A880]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C5A880]/15 border border-[#C5A880]/40 text-[#E8D4B8] text-[10px] font-semibold tracking-widest uppercase mb-2 shadow-xs">
            <Receipt className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>Official Proforma Invoice</span>
          </div>
          <h3 className="font-serif text-xl sm:text-2xl text-white font-medium">
            Generate Event Proforma Invoice
          </h3>
          <p className="text-xs text-white/60 font-light mt-1">
            Instantly creates a branded PDF invoice with official KPR studio letterhead and payment QR code.
          </p>
        </div>

        {downloadSuccess ? (
          /* Success State */
          <div className="space-y-5 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-[#13A52D]/20 border border-[#13A52D]/40 text-[#13A52D] flex items-center justify-center mx-auto shadow-lg animate-bounce">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <h4 className="font-serif text-lg text-white font-semibold">
                Invoice Downloaded Successfully!
              </h4>
              <p className="text-xs text-[#C5A880] font-mono font-bold mt-1">
                {generatedInvoiceNum}
              </p>
              <p className="text-xs text-white/60 font-light mt-2 max-w-sm mx-auto">
                Your PDF invoice has been saved to your device. A record has also been logged in our studio records for booking confirmation.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#141414] hover:bg-[#252525] border border-white/20 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Form State */
          <form onSubmit={handleGenerateAndDownload} className="space-y-4">
            
            {/* Selected Bundle Summary Box */}
            <div className="bg-black/50 border border-white/10 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/60 font-medium">Selected Packages ({selectedPackages.length}):</span>
                <span className="text-[#E8D4B8] font-bold font-serif">{formatINR(effectiveSubtotal)}</span>
              </div>
              <div className="space-y-1 max-h-24 overflow-y-auto pr-1 text-[11px] text-white/75">
                {selectedPackages.map((pkg, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="truncate pr-2">• {pkg.name} ({pkg.duration || '6h'})</span>
                    <span className="font-mono text-[#C5A880] shrink-0">{formatINR(pkg.price)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300">
                {errorMessage}
              </div>
            )}

            {/* Customer Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#C5A880] font-semibold mb-1">
                  Customer Full Name *
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full bg-[#202020] border border-white/15 focus:border-[#C5A880] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#C5A880] font-semibold mb-1">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-[#202020] border border-white/15 focus:border-[#C5A880] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/60 font-medium mb-1">
                  Email Address (Optional)
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="priya@example.com"
                    className="w-full bg-[#202020] border border-white/15 focus:border-[#C5A880] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/60 font-medium mb-1">
                  City / Location
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={customerCity}
                    onChange={(e) => setCustomerCity(e.target.value)}
                    placeholder="Hyderabad, Telangana"
                    className="w-full bg-[#202020] border border-white/15 focus:border-[#C5A880] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* GST / Tax Setting */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/60 font-medium mb-1">
                  GST / Tax Preference
                </label>
                <select
                  value={taxOption}
                  onChange={(e) => setTaxOption(e.target.value)}
                  className="w-full bg-[#202020] border border-white/15 focus:border-[#C5A880] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                >
                  <option value="as_applicable">As Applicable (Standard)</option>
                  <option value="18_gst">+ 18% GST (Tax Invoice)</option>
                  <option value="0_exempt">Tax Inclusive / Exempt</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/60 font-medium mb-1">
                  Payment Terms
                </label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  placeholder="UPI / Bank Transfer / Online Payment"
                  className="w-full bg-[#202020] border border-white/15 focus:border-[#C5A880] rounded-xl px-3 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none"
                />
              </div>
            </div>

            {/* Total Payable Bar */}
            <div className="flex items-center justify-between bg-white/[0.04] border border-[#C5A880]/30 rounded-xl p-3.5 text-xs mt-2">
              <div>
                <span className="text-white/60 block text-[10px] uppercase tracking-wider">Total Payable Amount</span>
                <span className="text-[#C5A880] text-[10px] font-medium">{taxLabel}</span>
              </div>
              <span className="font-serif text-lg text-[#E8D4B8] font-bold">
                {formatINR(grandTotal)}
              </span>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={generating}
                className="w-full py-3.5 bg-gradient-to-r from-[#C5A880] to-[#DFCAAB] hover:from-[#DFCAAB] hover:to-[#C5A880] text-black text-xs font-bold tracking-[0.2em] uppercase rounded-xl flex items-center justify-center gap-2.5 shadow-lg shadow-[#C5A880]/20 transition-all duration-300 cursor-pointer disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Rendering PDF Invoice…</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Official PDF Invoice</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
