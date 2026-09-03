import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, ExternalLink, CheckCircle, MessageSquare, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ContactSection() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phone: '',
    eventType: 'Wedding Photography',
    eventDate: '',
    message: ''
  });

  const [submitted, setSubmitted] = useState(false);

  const mapsUrl = "https://goo.gl/maps/NtABjd1bV6S5kNHq8?g_st=ac";
  const addressText = "Grand Gayathri, 8-5-34, TKS Commercial Complex Near Post Office Station Road, Hotel Lane, Warangal, Telangana 506002";
  const mapEmbedUrl = "https://maps.google.com/maps?q=Grand+Gayathri,+8-5-34,+TKS+Commercial+Complex+Near+Post+Office+Station+Road,+Hotel+Lane,+Warangal,+Telangana+506002&t=&z=16&ie=UTF8&iwloc=&output=embed";

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
    <section id="contact-section" className="w-full bg-[#11100F] text-white py-12 sm:py-20 px-4 sm:px-8 lg:px-16 border-t border-[#C5A880]/20 relative">
      <div className="w-full max-w-[1920px] mx-auto space-y-8 sm:space-y-12">
        
        {/* Section Header */}
        <div className="text-center space-y-2 sm:space-y-3 max-w-2xl mx-auto">
          <span className="text-[10px] sm:text-[11px] tracking-[0.3em] sm:tracking-[0.4em] uppercase text-[#C5A880] font-semibold block">
            VISIT & CONNECT WITH US
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl md:text-5xl font-light text-white tracking-wide">
            Contact KPR Productions
          </h2>
          <p className="text-xs text-white/60 font-light leading-relaxed">
            Have a question or planning your special celebration? Reach out to our Warangal studio directly or drop us a message below.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-start">
          
          {/* Left Column: Contact Cards & Info */}
          <div className="lg:col-span-5 space-y-4 sm:space-y-6">
            
            {/* Address Card */}
            <div className="bg-[#1A1816] border border-[#C5A880]/30 rounded-2xl p-4 sm:p-8 space-y-4 shadow-xl relative overflow-hidden group hover:border-[#C5A880]/60 transition-all">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#C5A880]/5 rounded-bl-full pointer-events-none" />
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#C5A880]/15 border border-[#C5A880]/40 flex items-center justify-center text-[#C5A880] shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg text-white font-medium">Studio Address</h3>
                  <p className="text-[10px] tracking-widest text-[#C5A880] uppercase">Warangal Headquarters</p>
                </div>
              </div>

              <div className="text-xs text-white/80 font-light leading-relaxed pt-2 border-t border-white/10 space-y-1">
                <p className="font-semibold text-white">Grand Gayathri</p>
                <p>8-5-34, TKS Commercial Complex</p>
                <p>Near Post Office Station Road, Hotel Lane</p>
                <p className="text-[#C5A880]">Warangal, Telangana 506002</p>
              </div>
            </div>

            {/* Quick Contact Info */}
            <div className="bg-[#1A1816] border border-white/10 rounded-2xl p-6 space-y-4">
              <h4 className="text-xs font-bold text-[#C5A880] uppercase tracking-widest">Direct Contact & Hours</h4>
              
              <div className="space-y-3 text-xs">
                {/* Phone */}
                <a
                  href="tel:+919849443648"
                  className="flex items-center gap-3 p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-colors group"
                >
                  <Phone className="w-4 h-4 text-[#C5A880] group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="text-[10px] text-white/40 block">Phone & WhatsApp</span>
                    <span className="text-white font-medium">+91 98494 43648</span>
                  </div>
                </a>

                {/* Email */}
                <a
                  href="mailto:kprfotography@gmail.com"
                  className="flex items-center gap-3 p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-colors group"
                >
                  <Mail className="w-4 h-4 text-[#C5A880] group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="text-[10px] text-white/40 block">Official Email</span>
                    <span className="text-white font-medium">kprfotography@gmail.com</span>
                  </div>
                </a>

                {/* Hours */}
                <div className="flex items-center gap-3 p-2.5 bg-white/5 rounded-xl border border-white/5">
                  <Clock className="w-4 h-4 text-[#C5A880]" />
                  <div>
                    <span className="text-[10px] text-white/40 block">Studio Hours</span>
                    <span className="text-white/80">Mon – Sat: 9:30 AM – 8:30 PM</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7 bg-[#1A1816] border border-[#C5A880]/30 rounded-2xl p-6 sm:p-10 shadow-2xl relative">
            <div className="space-y-2 mb-6">
              <span className="text-[10px] tracking-widest text-[#C5A880] uppercase font-bold flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Send a Message</span>
              </span>
              <h3 className="font-serif text-2xl text-white font-light">Inquire About Your Date</h3>
            </div>

            {submitted ? (
              <div className="bg-[#C5A880]/15 border border-[#C5A880]/40 rounded-xl p-8 text-center space-y-4 animate-fadeIn">
                <CheckCircle className="w-12 h-12 text-[#C5A880] mx-auto animate-bounce" />
                <h4 className="font-serif text-xl text-white font-light">Message Sent Successfully!</h4>
                <p className="text-xs text-white/80 max-w-md mx-auto leading-relaxed">
                  Thank you, <strong className="text-[#C5A880]">{formState.name}</strong>! Redirecting you to WhatsApp so our team can confirm your booking instantly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer mt-2"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-white/60 font-medium">Your Name *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formState.name}
                      onChange={handleChange}
                      placeholder="e.g. Priya Sharma"
                      className="w-full bg-white/5 border border-white/15 focus:border-[#C5A880] text-white text-xs rounded-xl px-4 py-3 outline-none transition-colors"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-white/60 font-medium">Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formState.phone}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      className="w-full bg-white/5 border border-white/15 focus:border-[#C5A880] text-white text-xs rounded-xl px-4 py-3 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-white/60 font-medium">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formState.email}
                      onChange={handleChange}
                      placeholder="priya@example.com"
                      className="w-full bg-white/5 border border-white/15 focus:border-[#C5A880] text-white text-xs rounded-xl px-4 py-3 outline-none transition-colors"
                    />
                  </div>

                  {/* Service Type */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-white/60 font-medium">Service Needed</label>
                    <select
                      name="eventType"
                      value={formState.eventType}
                      onChange={handleChange}
                      className="w-full bg-[#22201D] border border-white/15 focus:border-[#C5A880] text-white text-xs rounded-xl px-4 py-3 outline-none transition-colors"
                    >
                      <option value="Wedding Fotography">Luxury Wedding Fotography</option>
                      <option value="Pre-Wedding Shoot">Pre-Wedding Fotography Shoot</option>
                      <option value="Album Printing (Color Lab)">Album Printing / Color Lab</option>
                      <option value="Frames & Acrylic">Custom Frames & Acrylic</option>
                      <option value="Commercial & Flex">Commercial & Flex Printing</option>
                    </select>
                  </div>
                </div>

                {/* Event Date */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-white/60 font-medium">Event Date / Delivery Timeline</label>
                  <input
                    type="date"
                    name="eventDate"
                    value={formState.eventDate}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/15 focus:border-[#C5A880] text-white text-xs rounded-xl px-4 py-3 outline-none transition-colors"
                  />
                </div>

                {/* Message */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-white/60 font-medium">Your Message / Requirements</label>
                  <textarea
                    name="message"
                    rows={4}
                    value={formState.message}
                    onChange={handleChange}
                    placeholder="Tell us about your event, venue location, or printing specifications..."
                    className="w-full bg-white/5 border border-white/15 focus:border-[#C5A880] text-white text-xs rounded-xl px-4 py-3 outline-none transition-colors resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#C5A880] hover:bg-[#b0926b] text-black text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer group"
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
