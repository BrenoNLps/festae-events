"use client";

import { useEffect, useRef, useState } from "react";
import { Send, MessageCircle, ArrowLeft, Smile } from "lucide-react";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import { Avatar } from "@/app/components/(protected)/Avatar";
import { useChat } from "@/app/lib/hooks/useChat";

export default function Chat() {
  const {
    user,
    friends,
    selected,
    selectFriend,
    clearSelected,
    messages,
    unreadIds,
    input,
    setInput,
    sending,
    handleSend,
    maxMessageLength,
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const [showEmoji, setShowEmoji] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!showEmoji) return;
    function handleClickOutside(e: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmoji]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex h-[calc(100vh-9rem)] gap-4">
      <div className={`${selected ? 'hidden lg:flex' : 'flex'} w-full lg:w-72 shrink-0 flex-col border border-gray-100 rounded-2xl bg-white shadow-sm overflow-hidden`}>
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
                onClick={() => selectFriend(f)}
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
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                )}
              </button>
            ))
          )}
        </div>
      </div>

      <div className={`${!selected ? 'hidden lg:flex' : 'flex'} flex-1 flex-col border border-gray-100 rounded-2xl bg-white shadow-sm overflow-hidden`}>
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
            <MessageCircle className="h-10 w-10 text-gray-200" />
            <p className="text-sm text-gray-900">Selecione um amigo para conversar.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <button
                className="lg:hidden p-1 -ml-1 text-gray-500 hover:text-gray-800 transition"
                onClick={clearSelected}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
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
                        className={`max-w-xs lg:max-w-md px-3 py-2 rounded-2xl text-sm wrap-break-word ${
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

            <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-2 relative">
              {showEmoji && (
                <div ref={emojiRef} className="absolute bottom-16 left-0 right-0 z-50 md:right-auto md:left-4 md:w-[300px]">
                  <EmojiPicker
                    onEmojiClick={(e: EmojiClickData) => {
                      setInput(input + e.emoji);
                      setShowEmoji(false);
                    }}
                    height={380}
                    width="100%"
                  />
                </div>
              )}
              <button
                onClick={() => setShowEmoji((v) => !v)}
                className="shrink-0 text-gray-400 hover:text-purple-500 transition"
              >
                <Smile className="h-5 w-5" />
              </button>
              <div className="flex-1 flex flex-col">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite uma mensagem..."
                  maxLength={maxMessageLength}
                  className="text-sm text-black border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
                {input.length > maxMessageLength * 0.8 && (
                  <span className={`text-xs text-right pr-2 mt-0.5 ${input.length >= maxMessageLength ? 'text-red-500' : 'text-gray-400'}`}>
                    {input.length}/{maxMessageLength}
                  </span>
                )}
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || input.length > maxMessageLength || sending}
                className="shrink-0 w-9 h-9 flex items-center justify-center bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-full transition-colors"
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
