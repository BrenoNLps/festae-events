"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setMenuOpen(false);
    }
    function handleScroll() { setMenuOpen(false); }
      document.addEventListener("mousedown", handleClick);
      window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [menuOpen]);

  function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    if (!menuOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 192;
      const centered = rect.left + rect.width / 2 - menuWidth / 2;
      const left = Math.max(8, Math.min(centered, window.innerWidth - menuWidth - 8));
      setMenuPos({ top: rect.bottom + 8, left });
    }
    setMenuOpen((v) => !v);
  }

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
      <div>
        <button
          ref={buttonRef}
          onClick={handleToggle}
          className={className}
        >
          <Share2 className="h-4 w-4" />
          {label && <span>{copied ? "Link copiado!" : label}</span>}
        </button>
      </div>

      {menuOpen && createPortal(
        <div
          ref={menuRef}
          className="fixed z-50 bg-white rounded-xl shadow-lg border border-gray-100 py-1 w-48"
          style={{ top: menuPos.top, left: menuPos.left }}
        >
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
        </div>,
        document.body
      )}

      {showShare && (
        <ShareEventModal evento={evento} onClose={() => setShowShare(false)} />
      )}
    </>
  );
}
