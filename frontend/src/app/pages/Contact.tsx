import React, { useState } from "react";
import { MapPin, Phone, Mail, Clock, Send, CheckCircle, Facebook, Instagram } from "lucide-react";
import { BRANCHES } from "../lib/data";
import { cn } from "../lib/utils";

export function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", service: "", message: "" });
  const [sent, setSent] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  const SERVICES = ["Hajj Package", "Umrah Package", "Visa Services", "Air Ticket", "Manpower", "Tour Package", "Hotel Booking", "Other"];

  return (
    <>
      {/* Hero */}
      <section className="bg-[#0E6BB8] py-14 text-white">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-[#C43A15] text-[12px] font-bold uppercase tracking-widest mb-2">Get in Touch</div>
          <h1 className="text-3xl font-black mb-2">Contact Us</h1>
          <p className="text-white/60 text-sm">We're here to help. Reach us via form, phone, or WhatsApp — 6 days a week.</p>
        </div>
      </section>

      {/* Branch Cards */}
      <section className="py-10 md:py-14 bg-[#F7F8FA]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="text-center mb-8 md:mb-10">
            <div className="text-[#C43A15] text-[12px] font-bold uppercase tracking-widest mb-2">Our Offices</div>
            <h2 className="text-2xl font-black text-[#111827]">Branch Offices</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-10 md:mb-14">
            {BRANCHES.map((branch, i) => (
              <div key={branch.city} className={cn(
                "bg-white rounded-2xl border p-5 hover:shadow-md transition-shadow",
                i === 0 ? "border-[#E8471F]" : "border-[#E5E7EB]"
              )}>
                {i === 0 && (
                  <div className="text-[10px] font-black text-[#C43A15] uppercase tracking-widest mb-2">Head Office</div>
                )}
                <h3 className="text-[15px] font-black text-[#0E6BB8] mb-3">{branch.city}</h3>
                <ul className="flex flex-col gap-2.5">
                  <li className="flex items-start gap-2 text-[12px] text-[#6B7280]">
                    <MapPin size={13} className="text-[#C43A15] flex-shrink-0 mt-0.5" />
                    {branch.address}
                  </li>
                  <li>
                    <a href={`tel:${branch.phone}`} className="flex items-center gap-2 text-[12px] text-[#374151] hover:text-[#0E6BB8] transition-colors">
                      <Phone size={13} className="text-[#C43A15]" />{branch.phone}
                    </a>
                  </li>
                  <li>
                    <a href={`mailto:${branch.email}`} className="flex items-center gap-2 text-[12px] text-[#374151] hover:text-[#0E6BB8] transition-colors">
                      <Mail size={13} className="text-[#C43A15]" />{branch.email}
                    </a>
                  </li>
                  <li className="flex items-center gap-2 text-[12px] text-[#6B7280]">
                    <Clock size={13} className="text-[#C43A15]" />{branch.hours}
                  </li>
                </ul>
              </div>
            ))}
          </div>

          {/* Map placeholder */}
          <div className="rounded-2xl overflow-hidden border border-[#E5E7EB] h-[300px] bg-[#E9EEF5] flex items-center justify-center mb-14 shadow-sm">
            <div className="text-center text-[#9CA3AF]">
              <MapPin size={36} className="text-[#0E6BB8]/30 mx-auto mb-2" />
              <p className="text-[13px] font-semibold">Interactive Map</p>
              <p className="text-[11px]">32 Motijheel C/A, Dhaka — Head Office</p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-7">
                <h2 className="text-[19px] font-black text-[#111827] mb-1">Send Us a Message</h2>
                <p className="text-[12px] text-[#9CA3AF] mb-6">We typically respond within 2 business hours.</p>

                {sent ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-16 h-16 bg-[#ECFDF5] rounded-full flex items-center justify-center mb-4">
                      <CheckCircle size={32} className="text-[#0E7C66]" />
                    </div>
                    <h3 className="text-[17px] font-black text-[#111827] mb-2">Message Sent!</h3>
                    <p className="text-[13px] text-[#6B7280]">Thank you for reaching out. Our team will contact you within 2 business hours.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                      {[
                        { key: "name", label: "Full Name", placeholder: "Your full name", type: "text" },
                        { key: "email", label: "Email Address", placeholder: "email@example.com", type: "email" },
                        { key: "phone", label: "Phone Number", placeholder: "+880 1X XXX XXXXX", type: "tel" },
                      ].map(f => (
                        <div key={f.key} className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-bold text-[#374151] uppercase tracking-wider">{f.label}</label>
                          <input type={f.type} placeholder={f.placeholder}
                            value={form[f.key as keyof typeof form]}
                            onChange={e => set(f.key as keyof typeof form)(e.target.value)}
                            className="px-3 py-2.5 border border-[#E5E7EB] rounded-[10px] text-[13px] outline-none focus:border-[#0E6BB8] focus:ring-2 focus:ring-[#0E6BB8]/10 transition-all" />
                        </div>
                      ))}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-[#374151] uppercase tracking-wider">Service Needed</label>
                        <select value={form.service} onChange={e => set("service")(e.target.value)}
                          className="px-3 py-2.5 border border-[#E5E7EB] rounded-[10px] text-[13px] outline-none focus:border-[#0E6BB8] bg-white cursor-pointer">
                          <option value="">Select service</option>
                          {SERVICES.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-[#374151] uppercase tracking-wider">Your Message</label>
                      <textarea rows={5} placeholder="Tell us about your travel plans, preferred dates, number of travelers, any special requirements..."
                        value={form.message} onChange={e => set("message")(e.target.value)}
                        className="px-3 py-2.5 border border-[#E5E7EB] rounded-[10px] text-[13px] outline-none focus:border-[#0E6BB8] focus:ring-2 focus:ring-[#0E6BB8]/10 transition-all resize-none" />
                    </div>
                    <button type="submit"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#0E6BB8] hover:bg-[#0B5794] text-white font-bold rounded-[10px] text-[13px] transition-colors cursor-pointer">
                      <Send size={14} /> Send Message
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Quick contact */}
            <div className="flex flex-col gap-4">
              <div className="bg-[#0E6BB8] rounded-2xl p-6 text-white">
                <h3 className="text-[15px] font-black mb-4">Quick Contact</h3>
                <ul className="flex flex-col gap-4">
                  <li>
                    <div className="text-[10px] text-white/40 uppercase font-bold mb-0.5">Hotline</div>
                    <a href="tel:+88029553421" className="text-[#C43A15] font-bold text-[15px] hover:underline">+880 2 9553421</a>
                  </li>
                  <li>
                    <div className="text-[10px] text-white/40 uppercase font-bold mb-0.5">WhatsApp</div>
                    <a href="https://wa.me/8801712345678" target="_blank" rel="noopener noreferrer"
                      className="text-[#25D366] font-bold hover:underline text-[14px]">+880 1712 345678</a>
                  </li>
                  <li>
                    <div className="text-[10px] text-white/40 uppercase font-bold mb-0.5">Email</div>
                    <a href="mailto:info@smtravel.com.bd" className="text-white/70 hover:text-white text-[13px]">info@smtravel.com.bd</a>
                  </li>
                  <li>
                    <div className="text-[10px] text-white/40 uppercase font-bold mb-0.5">Office Hours</div>
                    <div className="text-white/70 text-[12px]">Sunday – Thursday<br />9:00 AM – 6:00 PM</div>
                  </li>
                </ul>
                <div className="mt-5 pt-5 border-t border-white/10">
                  <div className="text-[11px] text-white/40 mb-2">Social Media</div>
                  <div className="flex gap-3">
                    {[Facebook, Instagram].map((Icon, i) => (
                      <a key={i} href="#" className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#E8471F] transition-colors">
                        <Icon size={14} />
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-[#25D366] rounded-2xl p-5 text-white text-center">
                <div className="text-[14px] font-black mb-1">Chat on WhatsApp</div>
                <div className="text-white/70 text-[12px] mb-4">Get instant help — average response under 5 minutes</div>
                <a href="https://wa.me/8801712345678?text=Hello%20SMTravel%2C%20I%20need%20assistance." target="_blank" rel="noopener noreferrer"
                  className="block py-2.5 bg-white text-[#25D366] font-black rounded-[10px] text-[13px] hover:bg-[#F0FFF4] transition-colors">
                  Start Chat Now
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
