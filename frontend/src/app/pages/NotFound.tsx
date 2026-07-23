import React from "react";
import { Link } from "react-router";
import { Plane, Home, ArrowLeft } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#F7F8FA] px-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-[#1B75BC]/8 rounded-full flex items-center justify-center mx-auto mb-6">
          <Plane size={36} className="text-[#1B75BC] -rotate-45" />
        </div>
        <div className="text-7xl font-black text-[#1B75BC]/15 mb-2">404</div>
        <h1 className="text-2xl font-bold text-[#111827] mb-3">Page Not Found</h1>
        <p className="text-[#6B7280] mb-8 text-sm leading-relaxed">
          Oops! This page seems to have taken an unexpected detour. Let us help you get back on course.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1B75BC] text-white font-semibold rounded-[10px] hover:bg-[#14588F] transition-colors text-sm">
            <Home size={15} />
            Back to Home
          </Link>
          <Link to="/contact" className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-[#1B75BC] text-[#1B75BC] font-semibold rounded-[10px] hover:bg-[#1B75BC]/5 transition-colors text-sm">
            <ArrowLeft size={15} />
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
