"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Send, Check, Users } from "lucide-react";
import { Evento, ConversaComInfo, Usuario } from "@/app/lib/types";
import {
  getMyConversations,
  getOrCreateDMConversation,
  sendMessage,
} from "@/app/lib/services/database/messageService";
import { getFriends } from "@/app/lib/services/database/friendshipService";
import { useCurrentUser } from "@/app/lib/hooks/useCurrentUser";
import { Avatar } from "@/app/components/(protected)/Avatar";

interface Props {
  evento: Evento;
  onClose: () => void;
}

export function buildEventSharePayload(evento: Evento): string {
  return JSON.stringify({
    __type: "event_share",
    id: evento.id,
    nome: evento.nome,
    data_inicio: evento.data_inicio,
    data_fim: evento.data_fim,
    hora_inicio: evento.hora_inicio,
    hora_fim: evento.hora_fim,
    valor: evento.valor,
    imagem_url: evento.imagem_url ?? null,
    categoria: evento.categoria ?? null,
    endereco: evento.endereco,
  });
}

function ShareRow({
  avatar,
  name,
  subtitle,
  isSent,
  onSend,
}: {
  avatar: React.ReactNode;
  name: string;
  subtitle?: string;
  isSent: boolean;
  onSend: (message: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSend() {
    setLoading(true);
    await onSend(message.trim());
    setLoading(false);
    setExpanded(false);
    setMessage("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSend();
    if (e.key === "Escape") { setExpanded(false); setMessage(""); }
  }

  useEffect(() => {
    if (expanded) inputRef.current?.focus();
  }, [expanded]);

  return (
    <div className="flex flex-col px-5 py-2.5 gap-2">
      <div className="flex items-center gap-3">
        {avatar}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
          {subtitle && <p className="text-xs text-gray-500 truncate">{subtitle}</p>}
        </div>
        <button
          onClick={() => { if (isSent) return; setExpanded((v) => !v); setMessage(""); }}
          disabled={isSent || loading}
          className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition ${
            isSent
              ? "bg-green-100 text-green-600"
              : expanded
                ? "bg-gray-100 text-gray-500 hover:bg-gray-200"
                : "bg-purple-100 text-purple-600 hover:bg-purple-200"
          } disabled:opacity-50`}
        >
          {isSent ? <Check className="h-4 w-4" /> : expanded ? <X className="h-4 w-4" /> : <Send className="h-4 w-4" />}
        </button>
      </div>

      {expanded && !isSent && (
        <div className="flex items-center gap-2 pl-11">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Mensagem (opcional)..."
            maxLength={500}
            className="flex-1 text-sm text-gray-900 border border-gray-200 rounded-full px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition"
          >
            {loading
              ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
              : <Send className="h-4 w-4" />
            }
          </button>
        </div>
      )}
    </div>
  );
}

export function ShareEventModal({ evento, onClose }: Props) {
  const { user } = useCurrentUser();
  const [conversations, setConversations] = useState<ConversaComInfo[]>([]);
  const [friends, setFriends] = useState<Usuario[]>([]);
  const [search, setSearch] = useState("");
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    getMyConversations().then(({ data }) => setConversations(data));
    if (user?.id) {
      getFriends(user.id).then(({ data }) => {
        if (data) setFriends(data);
      });
    }
  }, [user?.id]);

  const dmFriendIds = new Set(
    conversations
      .filter((c) => c.tipo === "DM")
      .flatMap((c) => c.participantes.map((p) => p.id))
  );
  const friendsWithoutConv = friends.filter((f) => !dmFriendIds.has(f.id));

  const q = search.toLowerCase();
  const filteredConvs = conversations.filter((conv) => {
    if (!q) return true;
    const name =
      conv.tipo === "DM"
        ? (conv.participantes[0]?.nome ?? conv.participantes[0]?.username ?? "")
        : (conv.nome ?? "");
    return name.toLowerCase().includes(q);
  });
  const filteredFriends = friendsWithoutConv.filter(
    (f) =>
      !q ||
      f.username.toLowerCase().includes(q) ||
      (f.nome ?? "").toLowerCase().includes(q)
  );

  async function sendToConv(convId: string, message: string) {
    if (!user?.id) return;
    await sendMessage({ conteudo: buildEventSharePayload(evento), id_remetente: user.id, id_conversa: convId });
    if (message) {
      await sendMessage({ conteudo: message, id_remetente: user.id, id_conversa: convId });
    }
    setSentIds((prev) => new Set(prev).add(convId));
  }

  async function sendToFriend(friend: Usuario, message: string) {
    if (!user?.id) return;
    const { data: convId } = await getOrCreateDMConversation(friend.id);
    if (convId) {
      await sendMessage({ conteudo: buildEventSharePayload(evento), id_remetente: user.id, id_conversa: convId });
      if (message) {
        await sendMessage({ conteudo: message, id_remetente: user.id, id_conversa: convId });
      }
      setSentIds((prev) => new Set(prev).add(friend.id));
    }
  }

  const isEmpty = filteredConvs.length === 0 && filteredFriends.length === 0;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm flex flex-col overflow-hidden max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Enviar para...</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-2.5 bg-purple-50 border-b border-gray-100">
          <p className="text-xs text-purple-700 font-medium truncate">{evento.nome}</p>
        </div>

        <div className="px-4 py-2 border-b border-gray-100">
          <input
            type="text"
            placeholder="Pesquisar conversa ou amigo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm text-gray-900 border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {isEmpty && (
            <p className="text-sm text-gray-400 text-center py-8 px-4">
              Nenhuma conversa ou amigo encontrado.
            </p>
          )}

          {filteredConvs.map((conv) => {
            const isDM = conv.tipo === "DM";
            const other = isDM ? conv.participantes[0] : null;
            const name = isDM ? (other?.nome ?? `@${other?.username}`) : (conv.nome ?? "Grupo");
            const subtitle = !isDM ? `${conv.participantes.length + 1} participantes` : undefined;

            return (
              <ShareRow
                key={conv.id}
                avatar={
                  isDM ? (
                    <Avatar nome={other?.nome} imagem_url={other?.imagem_url} size={36} />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                      <Users className="h-4 w-4 text-purple-600" />
                    </div>
                  )
                }
                name={name}
                subtitle={subtitle}
                isSent={sentIds.has(conv.id)}
                onSend={(msg) => sendToConv(conv.id, msg)}
              />
            );
          })}

          {filteredFriends.map((f) => (
            <ShareRow
              key={f.id}
              avatar={<Avatar nome={f.nome} imagem_url={f.imagem_url} size={36} />}
              name={f.nome ?? `@${f.username}`}
              subtitle={`@${f.username}`}
              isSent={sentIds.has(f.id)}
              onSend={(msg) => sendToFriend(f, msg)}
            />
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
