"use client";

import { useEffect, useRef, useState } from "react";
import { Send, MessageCircle, ArrowLeft, Smile, Users, Plus, X, LogOut } from "lucide-react";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import { Avatar } from "@/app/components/(protected)/Avatar";
import { useChat } from "@/app/lib/hooks/useChat";
import { ConversaComInfo } from "@/app/lib/types";
import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";

function ConversaItem({ conv, selected, unreadIds, onClick }: {
  conv: ConversaComInfo;
  selected: ConversaComInfo | null;
  unreadIds: Set<string>;
  onClick: () => void;
}) {
  const isDM = conv.tipo === 'DM';
  const other = isDM ? conv.participantes[0] : null;
  const displayName = isDM
    ? (other?.nome ?? `@${other?.username}`)
    : (conv.nome ?? 'Grupo');

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left ${selected?.id === conv.id ? "bg-purple-50" : ""}`}
    >
      {isDM
        ? <Avatar nome={other?.nome} imagem_url={other?.imagem_url} size={38} />
        : (
          <div className="w-[38px] h-[38px] rounded-full bg-purple-100 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5 text-purple-600" />
          </div>
        )
      }
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-gray-900 truncate">{displayName}</p>
        {!isDM && (
          <p className="text-xs text-gray-400 truncate">{conv.participantes.length + 1} participantes</p>
        )}
      </div>
      {unreadIds.has(conv.id) && (
        <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
      )}
    </button>
  );
}

function CreateGroupModal({ friends, onClose, onCreate }: {
  friends: { id: string; username: string; nome?: string; imagem_url?: string }[];
  onClose: () => void;
  onCreate: (nome: string, ids: string[]) => void;
}) {
  const [nome, setNome] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Novo grupo</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <input
            type="text"
            placeholder="Nome do grupo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
          <div className="flex flex-col gap-1 max-h-56 overflow-y-auto">
            {friends.map((f) => (
              <button
                key={f.id}
                onClick={() => toggle(f.id)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition text-left ${selected.has(f.id) ? 'bg-purple-50' : 'hover:bg-gray-50'}`}
              >
                <Avatar nome={f.nome} imagem_url={f.imagem_url} size={32} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{f.nome ?? `@${f.username}`}</p>
                  <p className="text-xs text-gray-400 truncate">@{f.username}</p>
                </div>
                {selected.has(f.id) && <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />}
              </button>
            ))}
          </div>
        </div>
        <div className="px-5 pb-5">
          <button
            onClick={() => { if (nome.trim() && selected.size > 0) onCreate(nome.trim(), [...selected]); }}
            disabled={!nome.trim() || selected.size === 0}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-semibold rounded-full py-2.5 transition"
          >
            Criar grupo
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Chat() {
  const {
    user,
    conversations,
    friends,
    selected,
    selectConversation,
    startDM,
    handleCreateGroup,
    handleLeaveGroup,
    clearSelected,
    messages,
    participantMap,
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
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [tab, setTab] = useState<'conversas' | 'amigos'>('conversas');

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

  const isDM = selected?.tipo === 'DM';
  const otherParticipant = isDM ? selected?.participantes[0] : null;
  const headerName = isDM
    ? (otherParticipant?.nome ?? `@${otherParticipant?.username}`)
    : (selected?.nome ?? 'Grupo');

  return (
    <div className="flex h-[calc(100vh-9rem)] gap-4">
      {/* Sidebar */}
      <div className={`${selected ? 'hidden lg:flex' : 'flex'} w-full lg:w-72 shrink-0 flex-col border border-gray-100 rounded-2xl bg-white shadow-sm overflow-hidden`}>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setTab('conversas')}
              className={`text-sm font-medium px-3 py-1 rounded-full transition ${tab === 'conversas' ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Conversas
            </button>
            <button
              onClick={() => setTab('amigos')}
              className={`text-sm font-medium px-3 py-1 rounded-full transition ${tab === 'amigos' ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Amigos
            </button>
          </div>
          <button
            onClick={() => setShowCreateGroup(true)}
            className="text-gray-400 hover:text-purple-600 transition"
            title="Novo grupo"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {tab === 'conversas' ? (
            conversations.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8 px-4">Nenhuma conversa ainda.</p>
            ) : (
              conversations.map((conv) => (
                <ConversaItem
                  key={conv.id}
                  conv={conv}
                  selected={selected}
                  unreadIds={unreadIds}
                  onClick={() => selectConversation(conv)}
                />
              ))
            )
          ) : (
            friends.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8 px-4">Adicione amigos para conversar.</p>
            ) : (
              friends.map((f) => (
                <button
                  key={f.id}
                  onClick={() => { startDM(f); setTab('conversas'); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left"
                >
                  <Avatar nome={f.nome} imagem_url={f.imagem_url} size={38} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">@{f.username}</p>
                    {f.nome && <p className="text-xs text-gray-400 truncate">{f.nome}</p>}
                  </div>
                </button>
              ))
            )
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className={`${!selected ? 'hidden lg:flex' : 'flex'} flex-1 flex-col border border-gray-100 rounded-2xl bg-white shadow-sm overflow-hidden`}>
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
            <MessageCircle className="h-10 w-10 text-gray-200" />
            <p className="text-sm text-gray-400">Selecione uma conversa ou amigo.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <button className="lg:hidden p-1 -ml-1 text-gray-500 hover:text-gray-800 transition" onClick={clearSelected}>
                <ArrowLeft className="h-5 w-5" />
              </button>
              {isDM
                ? <Avatar nome={otherParticipant?.nome} imagem_url={otherParticipant?.imagem_url} size={36} />
                : (
                  <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                    <Users className="h-4 w-4 text-purple-600" />
                  </div>
                )
              }
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900">{headerName}</p>
                {!isDM && (
                  <p className="text-xs text-gray-400">{(selected.participantes.length + 1)} participantes</p>
                )}
              </div>
              {!isDM && (
                <button
                  onClick={() => setShowLeaveDialog(true)}
                  className="text-gray-400 hover:text-red-500 transition"
                  title="Sair do grupo"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
              {messages.length === 0 ? (
                <p className="text-sm text-gray-400 text-center mt-8">Nenhuma mensagem ainda. Diga oi!</p>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.id_remetente === user?.id;
                  const sender = !isMine ? participantMap[msg.id_remetente] : null;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                      {!isMine && !isDM && sender && (
                        <span className="text-xs text-gray-400 mb-0.5 ml-1">@{sender.username}</span>
                      )}
                      <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-2xl text-sm wrap-break-word ${isMine ? "bg-purple-600 text-white rounded-br-sm" : "bg-gray-100 text-black rounded-bl-sm"}`}>
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
                    onEmojiClick={(e: EmojiClickData) => { setInput(input + e.emoji); setShowEmoji(false); }}
                    height={380}
                    width="100%"
                  />
                </div>
              )}
              <button onClick={() => setShowEmoji((v) => !v)} className="shrink-0 text-gray-400 hover:text-purple-500 transition">
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

      {showCreateGroup && (
        <CreateGroupModal
          friends={friends}
          onClose={() => setShowCreateGroup(false)}
          onCreate={(nome, ids) => { handleCreateGroup(nome, ids); setShowCreateGroup(false); }}
        />
      )}

      <ConfirmDialog
        open={showLeaveDialog}
        title="Sair do grupo?"
        description="Você não receberá mais mensagens deste grupo."
        confirmLabel="Sair"
        cancelLabel="Cancelar"
        destructive
        onConfirm={() => { setShowLeaveDialog(false); handleLeaveGroup(); }}
        onCancel={() => setShowLeaveDialog(false)}
      />
    </div>
  );
}
