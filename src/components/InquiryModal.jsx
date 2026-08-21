import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Calendar, MapPin, Mail, Phone, User, Sparkles, Send, ArrowRight, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function InquiryModal({ isOpen, onClose, preselectedPackage, preselectedPhoto, preselectedMoodboard }) {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    partnerName: '',
    email: '',
    phone: '',
    eventType: 'Wedding',
    eventDate: '',
    venueLocation: '',
    budget: '$5,000 - $8,000',
    packageChoice: preselectedPackage ? preselectedPackage.package.name : 'Modern Luxury ($5,400)',
    notes: ''
  });

  useEffect(() => {
    if (preselectedPackage) {
      setFormData(prev => ({
        ...prev,
        packageChoice: `${preselectedPackage.package.name} ($${preselectedPackage.totalPrice.toLocaleString()})`
      }));
    }
  }, [preselectedPackage]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (step < 3) setStep(step + 1);
  };

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    // Fire celebration confetti!
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#C5A880', '#A4865E', '#ffffff']
      });
    } catch (err) {
      // fallback
    }
  };

  const resetModal = () => {
    setSubmitted(false);
    setStep(1);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-[#F7F3EE] text-[#1A1A1A] max-w-2xl w-full border border-[#E2D9CC] shadow-2xl relative my-8 overflow-hidden rounded-sm">
        
        {/* Header */}
        <div className="bg-[#121212] text-white p-6 flex items-center justify-between">
          <div>
            <span className="text-[10px] tracking-[0.3em] uppercase text-[#C5A880] font-medium block">
              LEO SPIN PHOTOGRAPHY
            </span>
            <h3 className="font-serif text-2xl font-light text-white">Booking & Inquiry Consultation</h3>
          </div>

          <button onClick={resetModal} className="p-2 text-white/70 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Step Progress Bar */}
        {!submitted && (
          <div className="bg-[#E8E1D5] h-1.5 w-full flex">
            <div className={`h-full bg-[#C5A880] transition-all duration-500 ${
              step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'
            }`} />
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 md:p-10">
          
          {submitted ? (
            /* Confirmation Success Screen */
            <div className="text-center py-8 space-y-6">
              <div className="w-20 h-20 rounded-full bg-[#C5A880] text-white mx-auto flex items-center justify-center shadow-lg">
                <CheckCircle className="w-10 h-10" />
              </div>

              <div>
                <h3 className="font-serif text-3xl md:text-4xl text-[#1A1A1A]">Inquiry Received with Honor</h3>
                <p className="text-xs uppercase tracking-widest text-[#C5A880] font-semibold mt-1">
                  Confirmation Code: #LS-{Math.floor(100000 + Math.random() * 900000)}
                </p>
              </div>

              <p className="text-sm text-[#555555] font-light max-w-md mx-auto leading-relaxed">
                Thank you, <strong className="text-[#1A1A1A]">{formData.name}</strong>. Leo Spin personally reviews every date request within 24 hours. We have dispatched a preliminary PDF guide to <strong className="text-[#1A1A1A]">{formData.email}</strong>.
              </p>

              {/* Inquiry Summary Box */}
              <div className="bg-white p-6 border border-[#E2D9CC] text-left text-xs space-y-2 max-w-md mx-auto">
                <p className="font-semibold text-[#1A1A1A] border-b border-[#E8E1D5] pb-2 uppercase tracking-wider">
                  Summary Details:
                </p>
                <p><strong className="text-[#666666]">Event Type:</strong> {formData.eventType}</p>
                <p><strong className="text-[#666666]">Target Date:</strong> {formData.eventDate || 'TBD / Flexible'}</p>
                <p><strong className="text-[#666666]">Venue:</strong> {formData.venueLocation || 'Not specified'}</p>
                <p><strong className="text-[#666666]">Package Selection:</strong> {formData.packageChoice}</p>
                {preselectedMoodboard && (
                  <p><strong className="text-[#666666]">Attached Moodboard:</strong> {preselectedMoodboard.length} photos selected</p>
                )}
              </div>

              <button
                onClick={resetModal}
                className="px-8 py-3 bg-[#1A1A1A] text-white text-[11px] font-medium tracking-[0.25em] uppercase hover:bg-[#C5A880] transition-colors"
              >
                RETURN TO WEBSITE
              </button>
            </div>
          ) : (
            /* Multi-step Form */
            <form onSubmit={step === 3 ? handleSubmit : handleNextStep} className="space-y-6">
              
              {/* Step 1: Personal Contact Information */}
              {step === 1 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="border-b border-[#E8E1D5] pb-3">
                    <h4 className="font-serif text-2xl text-[#1A1A1A]">Step 1: Client Information</h4>
                    <p className="text-xs text-[#777777]">Tell us about yourself and your partner.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#333333] mb-1">Your Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. Sophia Sterling"
                        className="w-full px-4 py-2.5 bg-white border border-[#E2D9CC] focus:border-[#C5A880] text-xs outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#333333] mb-1">Partner's Name</label>
                      <input
                        type="text"
                        name="partnerName"
                        value={formData.partnerName}
                        onChange={handleChange}
                        placeholder="e.g. Julian Sterling"
                        className="w-full px-4 py-2.5 bg-white border border-[#E2D9CC] focus:border-[#C5A880] text-xs outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#333333] mb-1">Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="sophia@example.com"
                        className="w-full px-4 py-2.5 bg-white border border-[#E2D9CC] focus:border-[#C5A880] text-xs outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#333333] mb-1">Phone / WhatsApp *</label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+1 (832) 555-0192"
                        className="w-full px-4 py-2.5 bg-white border border-[#E2D9CC] focus:border-[#C5A880] text-xs outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Event Details & Location */}
              {step === 2 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="border-b border-[#E8E1D5] pb-3">
                    <h4 className="font-serif text-2xl text-[#1A1A1A]">Step 2: Celebration Details</h4>
                    <p className="text-xs text-[#777777]">Where and when will your magic unfold?</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#333333] mb-1">Event Type *</label>
                      <select
                        name="eventType"
                        value={formData.eventType}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-white border border-[#E2D9CC] focus:border-[#C5A880] text-xs outline-none"
                      >
                        <option value="Wedding">Full Wedding Celebration</option>
                        <option value="Destination Elopement">Destination Elopement</option>
                        <option value="Editorial / Fashion">Editorial & High Fashion</option>
                        <option value="Engagement Session">Engagement Session Only</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#333333] mb-1">Target Date *</label>
                      <input
                        type="date"
                        name="eventDate"
                        required
                        value={formData.eventDate}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-white border border-[#E2D9CC] focus:border-[#C5A880] text-xs outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#333333] mb-1">Venue / City Location *</label>
                    <input
                      type="text"
                      name="venueLocation"
                      required
                      value={formData.venueLocation}
                      onChange={handleChange}
                      placeholder="e.g. Château de Chantilly, Paris, France or Houston, TX"
                      className="w-full px-4 py-2.5 bg-white border border-[#E2D9CC] focus:border-[#C5A880] text-xs outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Package, Moodboard & Notes */}
              {step === 3 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="border-b border-[#E8E1D5] pb-3">
                    <h4 className="font-serif text-2xl text-[#1A1A1A]">Step 3: Vision & Budget</h4>
                    <p className="text-xs text-[#777777]">Finalize your customized photography preferences.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#333333] mb-1">Selected Package</label>
                    <input
                      type="text"
                      name="packageChoice"
                      value={formData.packageChoice}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-[#EFE8DD] border border-[#E2D9CC] text-xs font-semibold text-[#1A1A1A] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#333333] mb-1">Estimated Photography Budget</label>
                      <select
                        name="budget"
                        value={formData.budget}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-white border border-[#E2D9CC] focus:border-[#C5A880] text-xs outline-none"
                      >
                        <option value="$3,000 - $5,000">$3,000 - $5,000 USD</option>
                        <option value="$5,000 - $8,000">$5,000 - $8,000 USD</option>
                        <option value="$8,000 - $12,000">$8,000 - $12,000 USD</option>
                        <option value="$12,000+">$12,000+ USD</option>
                      </select>
                    </div>

                    {preselectedMoodboard && preselectedMoodboard.length > 0 && (
                      <div className="bg-[#FDFBF7] p-3 border border-[#C5A880]/40 rounded text-xs flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-[#1A1A1A]">Moodboard Attached</p>
                          <p className="text-[10px] text-[#777777]">{preselectedMoodboard.length} photos selected</p>
                        </div>
                        <Sparkles className="w-4 h-4 text-[#C5A880]" />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#333333] mb-1">Tell Us About Your Vision & Story</label>
                    <textarea
                      name="notes"
                      rows="3"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Share your wedding theme, guest count, or any special requests..."
                      className="w-full px-4 py-2.5 bg-white border border-[#E2D9CC] focus:border-[#C5A880] text-xs outline-none resize-none"
                    ></textarea>
                  </div>
                </div>
              )}

              {/* Wizard Nav Control Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-[#E8E1D5]">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-6 py-2.5 border border-[#E2D9CC] text-[#555555] text-xs font-medium uppercase tracking-wider hover:bg-[#E8E1D5] transition-colors flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                ) : <div />}

                <button
                  type="submit"
                  className="px-8 py-3 bg-[#C5A880] hover:bg-[#A4865E] text-white text-[11px] font-medium tracking-[0.25em] uppercase transition-colors flex items-center gap-2 shadow"
                >
                  <span>{step === 3 ? 'SEND INQUIRY NOW' : 'NEXT STEP'}</span>
                  {step < 3 ? <ArrowRight className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
}
