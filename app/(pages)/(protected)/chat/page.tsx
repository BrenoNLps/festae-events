"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Send, MessageCircle } from "lucide-react";
import { useCurrentUser } from "@/app/lib/hooks/useCurrentUser";
import { getFriends } from "@/app/lib/services/database/friendshipService";
import { getMessagesBetweenUsers, sendMessage, getUnreadSenderIds } from "@/app/lib/services/database/messageService";
import { Avatar } from "@/app/components/(protected)/Avatar";
import type { Usuario, Message } from "@/app/lib/types";
import { getSupabaseClient } from "@/app/lib/supabase/singleton";

export default function Chat() {
  const { user } = useCurrentUser();
  const searchParams = useSearchParams();
  const supabase = getSupabaseClient();

  const [friends, setFriends] = useState<Usuario[]>([]);
  const [selected, setSelected] = useState<Usuario | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadIds, setUnreadIds] = useState<Set<string>>(new Set());
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastVisitRef = useRef(
    typeof window !== "undefined"
      ? (localStorage.getItem("lastChatVisit") ?? new Date(0).toISOString())
      : new Date(0).toISOString()
  );

  useEffect(() => {
    if (!user?.id) return;
    getFriends(user.id).then(({ data }) => {
      if (!data) return;
      setFriends(data);

      const userId = searchParams.get("userId");
      if (userId) {
        const friend = data.find((u) => u.id === userId);
        if (friend) setSelected(friend);
      }
    });

    getUnreadSenderIds(user.id, lastVisitRef.current).then(({ data }) => {
      if (data) setUnreadIds(new Set(data));
    });
  }, [user?.id, searchParams]);

  useEffect(() => {
    if (!user?.id) return;

    const globalChannel = supabase
      .channel(`inbox-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mensagem" },
        (payload) => {
          const msg = payload.new as Message;
          if (msg.id_destinatario !== user.id) return;
          setUnreadIds((prev) => {
            if (prev.has(msg.id_remetente)) return prev;
            const next = new Set(prev);
            next.add(msg.id_remetente);
            return next;
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(globalChannel); };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !selected) return;

    setMessages([]);
    getMessagesBetweenUsers(user.id, selected.id).then(({ data }) => {
      if (data) setMessages(data);
    });

    const channel = supabase
      .channel(`chat-${[user.id, selected.id].sort().join("-")}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mensagem" },
        (payload) => {
          const msg = payload.new as Message;
          const isRelevant =
            (msg.id_remetente === user.id && msg.id_destinatario === selected.id) ||
            (msg.id_remetente === selected.id && msg.id_destinatario === user.id);
          if (isRelevant) {
            setMessages((prev) => [...prev, msg]);
            if (msg.id_remetente === selected.id) {
              setUnreadIds((prev) => { const next = new Set(prev); next.delete(selected.id); return next; });
            }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, selected?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || !user?.id || !selected || sending) return;
    setSending(true);
    const conteudo = input.trim();
    setInput("");
    await sendMessage({ conteudo, id_remetente: user.id, id_destinatario: selected.id });
    setSending(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex h-[calc(100vh-9rem)] gap-4">
      <div className="w-72 flex-shrink-0 flex flex-col border border-gray-100 rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Mensagens</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {friends.length === 0 ? (
            <p className="text-sm text-gray-900 text-center py-8 px-4">
              Adicione amigos para começar a conversar.
            </p>
          ) : (
            friends.map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setSelected(f);
                  setUnreadIds((prev) => { const next = new Set(prev); next.delete(f.id); return next; });
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left ${
                  selected?.id === f.id ? "bg-purple-50" : ""
                }`}
              >
                <Avatar nome={f.nome} imagem_url={f.imagem_url} size={38} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">@{f.username}</p>
                  {f.nome && <p className="text-xs text-gray-900 truncate">{f.nome}</p>}
                </div>
                {unreadIds.has(f.id) && (
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" />
                )}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col border border-gray-100 rounded-2xl bg-white shadow-sm overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
            <MessageCircle className="h-10 w-10 text-gray-200" />
            <p className="text-sm text-gray-900">Selecione um amigo para conversar.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <Avatar nome={selected.nome} imagem_url={selected.imagem_url} size={36} />
              <div>
                <p className="font-semibold text-sm text-gray-900">@{selected.username}</p>
                {selected.nome && <p className="text-xs text-gray-900">{selected.nome}</p>}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
              {messages.length === 0 ? (
                <p className="text-sm text-gray-900 text-center mt-8">
                  Nenhuma mensagem ainda. Diga oi!
                </p>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.id_remetente === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-xs lg:max-w-md px-3 py-2 rounded-2xl text-sm break-words ${
                          isMine
                            ? "bg-purple-600 text-white rounded-br-sm"
                            : "bg-gray-100 text-black rounded-bl-sm"
                        }`}
                      >
                        {msg.conteudo}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite uma mensagem..."
                className="flex-1 text-sm text-black border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-full transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
