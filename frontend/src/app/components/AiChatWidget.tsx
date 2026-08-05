import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";
import { usePublicAiChat } from "../hooks/ai";
import type { AiChatMessageDto } from "@contracts/ai.contract";

export function AiChatWidget() {
  const { t } = useTranslation("aiChat");
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AiChatMessageDto[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const chat = usePublicAiChat();

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: "assistant", content: t("greeting") }]);
    }
  }, [open, messages.length, t]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chat.isPending]);

  const send = () => {
    const text = input.trim();
    if (!text || chat.isPending) return;
    const next: AiChatMessageDto[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    chat.mutate(
      { messages: next.filter((m) => m.role === "user" || (m.role === "assistant" && m.content !== t("greeting"))) },
      {
        onSuccess: (r) => setMessages((prev) => [...prev, { role: "assistant", content: r.reply }]),
        onError: () => setMessages((prev) => [...prev, { role: "assistant", content: t("error") }]),
      },
    );
  };

  return (
    <>
      {/* Panel — bottom-left (WhatsApp is bottom-right) */}
      {open && (
        <div className="fixed bottom-24 md:bottom-6 left-4 md:left-6 z-40 w-[min(100vw-2rem,380px)] bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] flex flex-col overflow-hidden"
          style={{ maxHeight: "min(70vh, 520px)" }}>
          <div className="flex items-center justify-between px-4 py-3 bg-[#1B75BC] text-white">
            <div>
              <p className="text-sm font-bold">{t("title")}</p>
              <p className="text-[10px] text-white/80">{t("subtitle")}</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg" aria-label={t("close")}>
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px]">
            {messages.map((m, i) => (
              <div key={i} className={cn("text-[13px] leading-relaxed px-3 py-2 rounded-xl max-w-[90%]",
                m.role === "user" ? "ml-auto bg-[#1B75BC] text-white" : "mr-auto bg-slate-100 text-slate-800")}>
                {m.content}
              </div>
            ))}
            {chat.isPending && (
              <div className="flex items-center gap-2 text-xs text-slate-400 px-2">
                <Loader2 size={14} className="animate-spin" /> {t("typing")}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div className="p-3 border-t border-slate-100 space-y-2">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
                placeholder={t("placeholder")}
                className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B75BC]/20"
              />
              <button type="button" onClick={send} disabled={!input.trim() || chat.isPending}
                className="p-2 bg-[#1B75BC] text-white rounded-lg hover:bg-[#14588F] disabled:opacity-50">
                <Send size={16} />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center">
              {t("bookHint")}{" "}
              <Link to="/book" className="text-[#1B75BC] font-medium hover:underline">{t("bookLink")}</Link>
            </p>
          </div>
        </div>
      )}

      {/* FAB */}
      {!open && (
        <button type="button" onClick={() => setOpen(true)}
          className="hidden md:flex fixed bottom-6 left-6 z-40 w-14 h-14 bg-[#1B75BC] text-white rounded-full items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all"
          aria-label={t("open")}>
          <MessageCircle size={26} />
        </button>
      )}
    </>
  );
}
