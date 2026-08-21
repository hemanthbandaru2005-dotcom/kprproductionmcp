import React, { useState } from 'react';
import { Plus, Minus, HelpCircle } from 'lucide-react';

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: "How far in advance should we reserve our wedding date?",
      a: "Due to our studio's commitment to high artistic standards, we limit bookings to 25 weddings per calendar year. Most couples reserve 9 to 18 months prior to their wedding date."
    },
    {
      q: "Do you travel for destination weddings & international celebrations?",
      a: "Absolutely. Approximately 60% of our annual commissions are outside of Houston, including Paris, Lake Como, the Amalfi Coast, Tulum, and New York. All travel logistics and accommodations are handled seamlessly by our studio."
    },
    {
      q: "When will we receive our final edited gallery and print items?",
      a: "Sneak peek galleries containing 25+ retouched masterpieces are delivered within 48 hours of your event. Your complete high-resolution online gallery is delivered within 4 to 6 weeks."
    },
    {
      q: "Can we request dual analog 35mm film coverage alongside digital?",
      a: "Yes! We specialize in medium format 120 and 35mm film stock (Kodak Portra 400 & Fujifilm 400H). You can select our Film Add-on during your investment customization."
    },
    {
      q: "What is your backup and image security protocol?",
      a: "Every photograph is simultaneously written to dual memory cards in real time on location. Immediately following your event, assets are archived to encrypted offsite cloud servers and mirrored local RAID storage."
    }
  ];

  return (
    <section id="faq" className="py-24 bg-[#121212] text-white relative">
      <div className="max-w-4xl mx-auto px-6">
        
        <div className="text-center mb-16">
          <p className="text-[11px] md:text-[12px] tracking-[0.4em] uppercase text-[#C5A880] font-medium mb-3">
            QUESTIONS & ANSWERS
          </p>
          <h2 className="font-serif text-3xl sm:text-5xl text-white font-light tracking-wide">
            FREQUENTLY ASKED
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-[#1A1A1A] border border-white/10 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 focus:outline-none"
                >
                  <span className="font-serif text-lg md:text-xl text-white font-light">{faq.q}</span>
                  <div className="p-1.5 rounded bg-[#2A2A2A] text-[#C5A880] shrink-0">
                    {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 text-sm text-white/70 font-light leading-relaxed border-t border-white/5 pt-4 animate-fadeIn">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
