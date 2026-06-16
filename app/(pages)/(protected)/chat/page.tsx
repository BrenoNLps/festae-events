"use client";

import { useEffect, useRef, useState } from "react";
import { Send, MessageCircle, ArrowLeft, Smile, Users, Plus, X, LogOut, UserPlus, Calendar } from "lucide-react";
import Link from "next/link";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import { Avatar } from "@/app/components/(protected)/Avatar";
import { useChat } from "@/app/lib/hooks/useChat";
import { ConversaComInfo, ParticipanteInfo, Usuario } from "@/app/lib/types";
import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";
import { formatDateRange } from "@/app/lib/utils/date";
import { formatPrice } from "@/app/lib/utils/event";

interface EventShareData {
  __type: "event_share";
  id: number;
  nome: string;
  data_inicio: string;
  data_fim: string;
  hora_inicio: string;
  hora_fim: string;
  valor: number;
  imagem_url?: string | null;
}

function parseEventShare(conteudo: string): EventShareData | null {
  try {
    const data = JSON.parse(conteudo);
    if (data?.__type === "event_share") return data as EventShareData;
  } catch {}
  return null;
}

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
        : <GroupAvatar imagem_url={conv.imagem_url} size={38} />
      }
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-gray-900 truncate">{displayName}</p>
        {!isDM && (
          <p className="text-xs text-gray-500 truncate">{conv.participantes.length + 1} participantes</p>
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
          <button onClick={onClose} className="text-gray-500 hover:text-gray-600 transition">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <input
            type="text"
            placeholder="Nome do grupo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="text-sm text-gray-900 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
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
                  <p className="text-xs text-gray-500 truncate">@{f.username}</p>
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

function GroupAvatar({ imagem_url, size, onClick }: { imagem_url?: string; size: number; onClick?: () => void }) {
  const cls = `rounded-full bg-purple-100 flex items-center justify-center shrink-0 overflow-hidden`;
  const style = { width: size, height: size };
  const inner = imagem_url
    ? <img src={imagem_url} alt="Grupo" className="w-full h-full object-cover" />
    : <Users className="text-purple-600" style={{ width: size * 0.45, height: size * 0.45 }} />;
  if (onClick)
    return <button onClick={onClick} className={`${cls} relative group`} style={style}>{inner}<span className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition rounded-full flex items-center justify-center"><span className="text-white text-xs font-medium">Alterar</span></span></button>;
  return <div className={cls} style={style}>{inner}</div>;
}

function GroupInfoPanel({ selected, currentUserId, friends, onAddToGroup, onLeave, onClose, onUpdateImage }: {
  selected: ConversaComInfo;
  currentUserId: string;
  friends: Usuario[];
  onAddToGroup: (id: string) => void;
  onLeave: () => void;
  onClose: () => void;
  onUpdateImage: (file: File) => void;
}) {
  const memberIds = new Set(selected.participantes.map((p: ParticipanteInfo) => p.id));
  memberIds.add(currentUserId);
  const nonMembers = friends.filter((f) => !memberIds.has(f.id));
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm flex flex-col overflow-hidden max-h-[80vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpdateImage(f); }} />
            <GroupAvatar imagem_url={selected.imagem_url} size={36} onClick={() => fileInputRef.current?.click()} />
            <h2 className="font-semibold text-gray-900 truncate">{selected.nome ?? 'Grupo'}</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <p className="px-5 pt-4 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Participantes ({selected.participantes.length + 1})
          </p>
          <div className="flex flex-col">
            {/* Current user first */}
            <div className="flex items-center gap-3 px-5 py-2.5">
              <Avatar nome={undefined} imagem_url={undefined} size={32} />
              <p className="text-sm text-gray-900 flex-1 truncate">Você</p>
            </div>
            {selected.participantes.map((p: ParticipanteInfo) => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-2.5">
                <Avatar nome={p.nome} imagem_url={p.imagem_url} size={32} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{p.nome ?? `@${p.username}`}</p>
                  <p className="text-xs text-gray-500 truncate">@{p.username}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="px-5 pt-4 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide border-t border-gray-100 mt-2">
            Adicionar amigos
          </p>
          {nonMembers.length === 0 ? (
            <p className="px-5 py-3 text-sm text-gray-500">Sem amigos para adicionar.</p>
          ) : (
            <div className="flex flex-col">
              {nonMembers.map((f) => (
                <div key={f.id} className="flex items-center gap-3 px-5 py-2.5">
                  <Avatar nome={f.nome} imagem_url={f.imagem_url} size={32} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{f.nome ?? `@${f.username}`}</p>
                    <p className="text-xs text-gray-500 truncate">@{f.username}</p>
                  </div>
                  <button
                    onClick={() => onAddToGroup(f.id)}
                    className="shrink-0 text-purple-600 hover:text-purple-700 transition"
                    title="Adicionar ao grupo"
                  >
                    <UserPlus className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-100">
          <button
            onClick={() => setShowLeaveDialog(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition"
          >
            <LogOut className="h-4 w-4" />
            Sair do grupo
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={showLeaveDialog}
        title="Sair do grupo?"
        description="Você não receberá mais mensagens deste grupo."
        confirmLabel="Sair"
        cancelLabel="Cancelar"
        destructive
        onConfirm={() => { setShowLeaveDialog(false); onLeave(); }}
        onCancel={() => setShowLeaveDialog(false)}
      />
    </div>
  );
}

export default function Chat() {
  const {
    user,
    conversations,
    friends,
    selected,
    pendingFriend,
    pendingEventShare,
    clearPendingEventShare,
    selectConversation,
    startDM,
    handleCreateGroup,
    handleLeaveGroup,
    handleAddToGroup,
    handleUpdateGroupImage,
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
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [tab, setTab] = useState<'conversas' | 'amigos'>('conversas');
  const [friendSearch, setFriendSearch] = useState('');

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

  const isDM = pendingFriend ? true : selected?.tipo === 'DM';
  const otherParticipant = pendingFriend ?? (isDM ? selected?.participantes[0] : null);
  const headerName = pendingFriend
    ? (pendingFriend.nome ?? `@${pendingFriend.username}`)
    : isDM
      ? (otherParticipant?.nome ?? `@${otherParticipant?.username}`)
      : (selected?.nome ?? 'Grupo');
  const showChat = !!selected || !!pendingFriend;

  return (
    <div className="flex h-[calc(100vh-9rem)] gap-4">
      {/* Sidebar */}
      <div className={`${showChat ? 'hidden lg:flex' : 'flex'} w-full lg:w-72 shrink-0 flex-col border border-gray-100 rounded-2xl bg-white shadow-sm overflow-hidden`}>
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
            className="text-gray-500 hover:text-purple-600 transition"
            title="Novo grupo"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col">
          {tab === 'conversas' ? (
            conversations.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8 px-4">Nenhuma conversa ainda.</p>
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
            <>
              <div className="px-3 py-2 border-b border-gray-100">
                <input
                  type="text"
                  placeholder="Pesquisar amigo..."
                  value={friendSearch}
                  onChange={(e) => setFriendSearch(e.target.value)}
                  className="w-full text-sm text-gray-900 border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>
              {friends.filter((f) => {
                const q = friendSearch.toLowerCase();
                return !q || f.username.toLowerCase().includes(q) || (f.nome ?? '').toLowerCase().includes(q);
              }).length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8 px-4">Nenhum amigo encontrado.</p>
              ) : (
                friends.filter((f) => {
                  const q = friendSearch.toLowerCase();
                  return !q || f.username.toLowerCase().includes(q) || (f.nome ?? '').toLowerCase().includes(q);
                }).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => { startDM(f); setTab('conversas'); setFriendSearch(''); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left"
                  >
                    <Avatar nome={f.nome} imagem_url={f.imagem_url} size={38} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">@{f.username}</p>
                      {f.nome && <p className="text-xs text-gray-500 truncate">{f.nome}</p>}
                    </div>
                  </button>
                ))
              )}
            </>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className={`${!showChat ? 'hidden lg:flex' : 'flex'} flex-1 flex-col border border-gray-100 rounded-2xl bg-white shadow-sm overflow-hidden`}>
        {!showChat ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
            <MessageCircle className="h-10 w-10 text-gray-200" />
            <p className="text-sm text-gray-500">Selecione uma conversa ou amigo.</p>
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
                  <button
                    onClick={() => setShowGroupInfo(true)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-80 transition"
                  >
                    <GroupAvatar imagem_url={selected?.imagem_url} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900">{headerName}</p>
                      <p className="text-xs text-gray-500">{((selected?.participantes.length ?? 0) + 1)} participantes</p>
                    </div>
                  </button>
                )
              }
              {isDM && (
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900">{headerName}</p>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
              {messages.length === 0 ? (
                <p className="text-sm text-gray-500 text-center mt-8">Nenhuma mensagem ainda. Diga oi!</p>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.id_remetente === user?.id;
                  const sender = !isMine ? participantMap[msg.id_remetente] : null;
                  const eventShare = parseEventShare(msg.conteudo);
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                      {!isMine && !isDM && sender && (
                        <span className="text-xs text-gray-500 mb-0.5 ml-1">@{sender.username}</span>
                      )}
                      {eventShare ? (
                        <Link
                          href={`/events/${eventShare.id}`}
                          className={`max-w-[220px] rounded-xl overflow-hidden border transition-shadow hover:shadow-md ${isMine ? "border-purple-200" : "border-gray-200"}`}
                        >
                          {eventShare.imagem_url ? (
                            <div className="h-24 bg-purple-50 overflow-hidden">
                              <img src={eventShare.imagem_url} alt={eventShare.nome} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="h-24 bg-purple-100 flex items-center justify-center">
                              <Calendar className="h-6 w-6 text-purple-400" />
                            </div>
                          )}
                          <div className={`p-2.5 flex flex-col gap-1 ${isMine ? "bg-purple-50" : "bg-white"}`}>
                            <p className="text-xs font-semibold text-gray-900 leading-tight line-clamp-2">{eventShare.nome}</p>
                            <p className="text-xs text-gray-500">{formatDateRange(eventShare.data_inicio, eventShare.data_fim)}</p>
                            <div className="flex items-center justify-between mt-0.5">
                              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${eventShare.valor === 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                                {formatPrice(eventShare.valor)}
                              </span>
                              <span className="text-xs text-white font-bold bg-gray-900 px-2 py-0.5 rounded-full">Ver evento</span>
                            </div>
                          </div>
                        </Link>
                      ) : (
                        <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-2xl text-sm wrap-break-word ${isMine ? "bg-purple-600 text-white rounded-br-sm" : "bg-gray-100 text-black rounded-bl-sm"}`}>
                          {msg.conteudo}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-gray-100">
              {pendingEventShare && (
                <div className="px-4 pt-3 pb-1">
                  <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-xl px-3 py-2">
                    <Calendar className="h-4 w-4 text-purple-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-purple-800 truncate">{pendingEventShare.nome}</p>
                      <p className="text-xs text-purple-500">Evento será enviado com sua mensagem</p>
                    </div>
                    <button onClick={clearPendingEventShare} className="shrink-0 text-purple-400 hover:text-purple-600 transition">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            <div className="px-4 py-3 flex items-center gap-2 relative">
              {showEmoji && (
                <div ref={emojiRef} className="absolute bottom-16 left-0 right-0 z-50 md:right-auto md:left-4 md:w-[300px]">
                  <EmojiPicker
                    onEmojiClick={(e: EmojiClickData) => { setInput(input + e.emoji); setShowEmoji(false); }}
                    height={380}
                    width="100%"
                  />
                </div>
              )}
              <button onClick={() => setShowEmoji((v) => !v)} className="shrink-0 text-gray-500 hover:text-purple-500 transition">
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
                  <span className={`text-xs text-right pr-2 mt-0.5 ${input.length >= maxMessageLength ? 'text-red-500' : 'text-gray-500'}`}>
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

      {showGroupInfo && selected && !isDM && user && (
        <GroupInfoPanel
          selected={selected}
          currentUserId={user.id}
          friends={friends}
          onAddToGroup={(id) => handleAddToGroup(id)}
          onLeave={() => { setShowGroupInfo(false); handleLeaveGroup(); }}
          onClose={() => setShowGroupInfo(false)}
          onUpdateImage={(file) => handleUpdateGroupImage(file)}
        />
      )}
    </div>
  );
}
