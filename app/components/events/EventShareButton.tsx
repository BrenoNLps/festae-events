"use client";

import { useEffect, useRef, useState } from "react";
import { Share2, Link2, MessageCircle } from "lucide-react";
import { Evento } from "@/app/lib/types";
import { ShareEventModal } from "./ShareEventModal";

interface Props {
  evento: Evento;
  className?: string;
  label?: string;
}

export function EventShareButton({ evento, className, label }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  async function handleCopyLink() {
    setMenuOpen(false);
    const url = `${window.location.origin}/events/${evento.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: evento.nome, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <>
      <div ref={menuRef} className="relative">
        <button
          onClick={(e) => { e.preventDefault(); setMenuOpen((v) => !v); }}
          className={className}
        >
          <Share2 className="h-4 w-4" />
          {label && <span>{copied ? "Link copiado!" : label}</span>}
        </button>

        {menuOpen && (
          <div className="absolute top-full mt-2 right-0 z-20 bg-white rounded-xl shadow-lg border border-gray-100 py-1 w-48">
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition text-left"
            >
              <Link2 className="h-4 w-4 text-gray-400 shrink-0" />
              Compartilhar link
            </button>
            <button
              onClick={() => { setMenuOpen(false); setShowShare(true); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition text-left"
            >
              <MessageCircle className="h-4 w-4 text-gray-400 shrink-0" />
              Enviar para amigo
            </button>
          </div>
        )}
      </div>

      {showShare && (
        <ShareEventModal evento={evento} onClose={() => setShowShare(false)} />
      )}
    </>
  );
}
