import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, ExternalLink, CheckCircle, MessageSquare, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ContactSection() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phone: '',
    eventType: 'Wedding Fotography',
    eventDate: '',
    message: ''
  });

  const [submitted, setSubmitted] = useState(false);

  const colorLabMapUrl = "https://goo.gl/maps/NtABjd1bV6S5kNHq8?g_st=ac";
  const eventsMapUrl = "https://www.google.com/maps/search/?api=1&query=KPR+Dance+Zone+8GHV%2BHH5+Sriramana+Colony+Hastinapuram+Hyderabad+Telangana+500079";

  const handleChange = (e) => {
    setFormState({ ...formState, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#C5A880', '#D4AF37', '#ffffff']
      });
    } catch (err) {
      // ignore fallback
    }

    // Build WhatsApp message
    const waText = encodeURIComponent(
      `Hi KPR Productions!\n\nName: ${formState.name}\nPhone: ${formState.phone}\nEmail: ${formState.email}\nService: ${formState.eventType}\nDate: ${formState.eventDate}\n\nMessage: ${formState.message}`
    );
    
    // Open WhatsApp after a brief delay
    setTimeout(() => {
      window.open(`https://wa.me/919849443648?text=${waText}`, '_blank');
    }, 1200);
  };

  return (
    <section id="contact-section" className="w-full bg-white text-[#1A1A1A] py-12 sm:py-20 px-4 sm:px-8 lg:px-16 border-t border-[#E2D9CC] relative">
      <div className="w-full max-w-[1920px] mx-auto space-y-8 sm:space-y-12">
        
        {/* Section Header */}
        <div className="text-center space-y-2 sm:space-y-3 max-w-2xl mx-auto">
          <span className="text-[10px] sm:text-[11px] tracking-[0.3em] sm:tracking-[0.4em] uppercase text-[#8C6D3F] font-semibold block">
            VISIT & CONNECT WITH US
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl md:text-5xl font-light text-[#1A1A1A] tracking-wide">
            Contact KPR Productions
          </h2>
          <div className="w-16 h-0.5 bg-[#C5A880] mx-auto my-2" />
          <p className="text-xs sm:text-sm text-[#666666] font-light leading-relaxed">
            Have a question or planning your special celebration? Reach out to our Warangal & Hyderabad studios directly or drop us a message below.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-start">
          
          {/* Left Column: Address Cards & Contact Info */}
          <div className="lg:col-span-6 space-y-4 sm:space-y-6">
            
            {/* Two Address Cards: Color Lab Address & Events Address Side-by-Side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* 1. Color Lab Address Card */}
              <div className="kpr-contact-card kpr-contact-card-gold-border bg-white border border-[#E2D9CC] rounded-2xl p-5 space-y-4 shadow-md hover:shadow-xl relative overflow-hidden group hover:border-[#C5A880]/70 transition-all flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#C5A880]/8 rounded-bl-full pointer-events-none" />
                
                <div className="space-y-3 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#C5A880]/15 border border-[#C5A880]/40 flex items-center justify-center text-[#8C6D3F] shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-serif text-base sm:text-lg text-[#1A1A1A] font-semibold">Color Lab Address</h3>
                      <p className="text-[10px] tracking-widest text-[#8C6D3F] uppercase font-bold">Warangal Headquarters</p>
                    </div>
                  </div>

                  <div className="text-xs text-[#555555] font-light leading-relaxed pt-2 border-t border-[#E8E1D5] space-y-1">
                    <p className="font-semibold text-[#1A1A1A]">Grand Gayathri</p>
                    <p>8-5-34, TKS Commercial Complex</p>
                    <p>Near Post Office Station Road, Hotel Lane</p>
                    <p className="text-[#8C6D3F] font-semibold">Warangal, Telangana 506002</p>
                  </div>
                </div>

                <a
                  href={colorLabMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-[#8C6D3F] hover:text-[#1A1A1A] pt-3 border-t border-[#E8E1D5] transition-colors relative z-10"
                >
                  <span>View on Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* 2. Events Address Card */}
              <div className="kpr-contact-card kpr-contact-card-gold-border bg-white border border-[#E2D9CC] rounded-2xl p-5 space-y-4 shadow-md hover:shadow-xl relative overflow-hidden group hover:border-[#C5A880]/70 transition-all flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#C5A880]/8 rounded-bl-full pointer-events-none" />
                
                <div className="space-y-3 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#C5A880]/15 border border-[#C5A880]/40 flex items-center justify-center text-[#8C6D3F] shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-serif text-base sm:text-lg text-[#1A1A1A] font-semibold">Events Address</h3>
                      <p className="text-[10px] tracking-widest text-[#8C6D3F] uppercase font-bold">Hyderabad Studio</p>
                    </div>
                  </div>

                  <div className="text-xs text-[#555555] font-light leading-relaxed pt-2 border-t border-[#E8E1D5] space-y-1">
                    <p className="font-semibold text-[#1A1A1A]">KPR Dance Zone</p>
                    <p>8GHV+HH5, Sriramana Colony,</p>
                    <p>Hastinapuram, Hyderabad,</p>
                    <p className="text-[#8C6D3F] font-semibold">Telangana – 500079, India.</p>
                  </div>
                </div>

                <a
                  href={eventsMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-[#8C6D3F] hover:text-[#1A1A1A] pt-3 border-t border-[#E8E1D5] transition-colors relative z-10"
                >
                  <span>View on Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

            </div>

            {/* Quick Contact Info */}
            <div className="kpr-contact-card kpr-contact-card-subtle-border bg-white border border-[#E2D9CC] rounded-2xl p-5 sm:p-6 space-y-4 shadow-md">
              <h4 className="text-xs font-bold text-[#8C6D3F] uppercase tracking-widest">Direct Contact & Hours</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Phone */}
                <a
                  href="tel:+919849443648"
                  className="flex items-center gap-3 p-3 bg-[#FAF8F5] hover:bg-[#F3EFE9] rounded-xl border border-[#E2D9CC] transition-all group"
                >
                  <Phone className="w-4 h-4 text-[#8C6D3F] group-hover:scale-110 transition-transform shrink-0" />
                  <div>
                    <span className="text-[10px] text-[#888888] font-semibold block uppercase tracking-wider">Phone & WhatsApp</span>
                    <span className="text-[#1A1A1A] font-bold">+91 98494 43648</span>
                  </div>
                </a>

                {/* Email */}
                <a
                  href="mailto:kprfotography@gmail.com"
                  className="flex items-center gap-3 p-3 bg-[#FAF8F5] hover:bg-[#F3EFE9] rounded-xl border border-[#E2D9CC] transition-all group"
                >
                  <Mail className="w-4 h-4 text-[#8C6D3F] group-hover:scale-110 transition-transform shrink-0" />
                  <div>
                    <span className="text-[10px] text-[#888888] font-semibold block uppercase tracking-wider">Official Email</span>
                    <span className="text-[#1A1A1A] font-bold truncate block">kprfotography@gmail.com</span>
                  </div>
                </a>

                {/* Hours */}
                <div className="sm:col-span-2 flex items-center gap-3 p-3 bg-[#FAF8F5] rounded-xl border border-[#E2D9CC]">
                  <Clock className="w-4 h-4 text-[#8C6D3F] shrink-0" />
                  <div>
                    <span className="text-[10px] text-[#888888] font-semibold block uppercase tracking-wider">Studio & Lab Hours</span>
                    <span className="text-[#444444] font-medium">Mon – Sat: 9:30 AM – 8:30 PM • Sunday by Appointment</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Contact Form */}
          <div className="kpr-contact-card kpr-contact-card-gold-border lg:col-span-6 bg-white border border-[#E2D9CC] rounded-2xl p-6 sm:p-10 shadow-xl relative">
            <div className="space-y-2 mb-6">
              <span className="text-[10px] tracking-widest text-[#8C6D3F] uppercase font-bold flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-[#8C6D3F]" />
                <span>Send a Message</span>
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl text-[#1A1A1A] font-light">Inquire About Your Date</h3>
            </div>

            {submitted ? (
              <div className="bg-[#C5A880]/15 border border-[#C5A880]/40 rounded-xl p-8 text-center space-y-4 animate-fadeIn">
                <CheckCircle className="w-12 h-12 text-[#8C6D3F] mx-auto animate-bounce" />
                <h4 className="font-serif text-xl text-[#1A1A1A] font-medium">Message Sent Successfully!</h4>
                <p className="text-xs text-[#555555] max-w-md mx-auto leading-relaxed">
                  Thank you, <strong className="text-[#8C6D3F]">{formState.name}</strong>! Redirecting you to WhatsApp so our team can confirm your booking instantly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-2.5 bg-[#1A1A1A] hover:bg-[#C5A880] text-white hover:text-black text-xs uppercase tracking-wider font-bold rounded-lg transition-colors cursor-pointer mt-2"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-[#555555] font-bold">Your Name *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formState.name}
                      onChange={handleChange}
                      placeholder="e.g. Priya Sharma"
                      className="w-full bg-[#FAF8F5] border border-[#D8CFC4] focus:border-[#C5A880] focus:bg-white text-[#1A1A1A] placeholder-[#999999] text-xs rounded-xl px-4 py-3 outline-none transition-all shadow-2xs"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-[#555555] font-bold">Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formState.phone}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      className="w-full bg-[#FAF8F5] border border-[#D8CFC4] focus:border-[#C5A880] focus:bg-white text-[#1A1A1A] placeholder-[#999999] text-xs rounded-xl px-4 py-3 outline-none transition-all shadow-2xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-[#555555] font-bold">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formState.email}
                      onChange={handleChange}
                      placeholder="priya@example.com"
                      className="w-full bg-[#FAF8F5] border border-[#D8CFC4] focus:border-[#C5A880] focus:bg-white text-[#1A1A1A] placeholder-[#999999] text-xs rounded-xl px-4 py-3 outline-none transition-all shadow-2xs"
                    />
                  </div>

                  {/* Service Type */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-[#555555] font-bold">Service Needed</label>
                    <select
                      name="eventType"
                      value={formState.eventType}
                      onChange={handleChange}
                      className="w-full bg-[#FAF8F5] border border-[#D8CFC4] focus:border-[#C5A880] focus:bg-white text-[#1A1A1A] text-xs rounded-xl px-4 py-3 outline-none transition-all shadow-2xs cursor-pointer"
                    >
                      <option value="Wedding Fotography">Luxury Wedding Fotography</option>
                      <option value="Pre-Wedding Shoot">Pre-Wedding Fotography Shoot</option>
                      <option value="Event Productions">Curated Event Productions (Hyderabad)</option>
                      <option value="KPR Dance Zone">KPR Dance Zone (Hastinapuram)</option>
                      <option value="Album Printing (Color Lab)">Album Printing / Color Lab (Warangal)</option>
                      <option value="Frames & Acrylic">Custom Frames & Acrylic</option>
                      <option value="Commercial & Flex">Commercial & Flex Printing</option>
                    </select>
                  </div>
                </div>

                {/* Event Date */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-[#555555] font-bold">Event Date / Delivery Timeline</label>
                  <input
                    type="date"
                    name="eventDate"
                    value={formState.eventDate}
                    onChange={handleChange}
                    className="w-full bg-[#FAF8F5] border border-[#D8CFC4] focus:border-[#C5A880] focus:bg-white text-[#1A1A1A] text-xs rounded-xl px-4 py-3 outline-none transition-all shadow-2xs"
                  />
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-[#555555] font-bold">Your Message / Requirements</label>
                  <textarea
                    name="message"
                    rows={4}
                    value={formState.message}
                    onChange={handleChange}
                    placeholder="Tell us about your event, venue location, or printing specifications..."
                    className="w-full bg-[#FAF8F5] border border-[#D8CFC4] focus:border-[#C5A880] focus:bg-white text-[#1A1A1A] placeholder-[#999999] text-xs rounded-xl px-4 py-3 outline-none transition-all shadow-2xs resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#1A1A1A] hover:bg-[#C5A880] text-white hover:text-black text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  <span>Submit Inquiry & Connect</span>
                </button>
              </form>
            )}

          </div>

        </div>

      </div>
    </section>
  );
}
