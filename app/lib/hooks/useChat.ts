"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCurrentUser } from "./useCurrentUser";
import { getFriends } from "../services/database/friendshipService";
import {
  getMessagesByConversation,
  sendMessage,
  getOrCreateDMConversation,
  getMyConversations,
  createGroup,
  markConversationAsRead,
  leaveGroup,
  addToGroup,
  getUnreadConversationIds,
} from "../services/database/messageService";
import { getSupabaseClient } from "../supabase/singleton";
import type { Usuario, Message, ConversaComInfo, ParticipanteInfo } from "../types";

const supabase = getSupabaseClient();

export function useChat() {
  const { user } = useCurrentUser();
  const searchParams = useSearchParams();

  const [conversations, setConversations] = useState<ConversaComInfo[]>([]);
  const [friends, setFriends] = useState<Usuario[]>([]);
  const [selected, setSelected] = useState<ConversaComInfo | null>(null);
  const [pendingFriend, setPendingFriend] = useState<Usuario | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadIds, setUnreadIds] = useState<Set<string>>(new Set());
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const selectedRef = useRef<ConversaComInfo | null>(null);
  selectedRef.current = selected;

  const participantMap = Object.fromEntries(
    (selected?.participantes ?? []).map((p) => [p.id, p])
  ) as Record<string, ParticipanteInfo>;

  function refreshConversations() {
    if (!user?.id) return;
    getMyConversations().then(({ data }) => setConversations(data));
  }

  useEffect(() => {
    if (!user?.id) return;

    refreshConversations();
    getFriends(user.id).then(({ data }) => {
      if (data) setFriends(data);
    });
    getUnreadConversationIds().then(({ data }) => {
      setUnreadIds(new Set(data));
    });

    const userId = searchParams.get("userId");
    if (userId) {
      getOrCreateDMConversation(userId).then(({ data: convId }) => {
        if (!convId) return;
        getMyConversations().then(({ data }) => {
          const conv = data.find((c) => c.id === convId);
          if (conv) selectConversation(conv);
        });
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Inbox global: detecta novas mensagens
  useEffect(() => {
    if (!user?.id) return;

    const globalChannel = supabase
      .channel(`inbox-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mensagem" }, (payload) => {
        const msg = payload.new as Message;
        if (msg.id_remetente === user.id) return;
        if (msg.id_conversa === selectedRef.current?.id) return;
        setUnreadIds((prev) => {
          if (prev.has(msg.id_conversa)) return prev;
          const next = new Set(prev);
          next.add(msg.id_conversa);
          return next;
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(globalChannel); };
  }, [user?.id]);

  // Carrega mensagens e escuta conversa selecionada
  useEffect(() => {
    if (!user?.id || !selected) return;

    getMessagesByConversation(selected.id).then(({ data }) => {
      setMessages(data ?? []);
    });

    markConversationAsRead(selected.id, user.id);

    const channel = supabase
      .channel(`chat-${selected.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mensagem" }, (payload) => {
        const msg = payload.new as Message;
        if (msg.id_conversa !== selected.id) return;
        setMessages((prev) => [...prev, msg]);
        if (msg.id_remetente !== user.id) {
          markConversationAsRead(selected.id, user.id);
          setUnreadIds((prev) => { const next = new Set(prev); next.delete(selected.id); return next; });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, selected?.id]);

  function selectConversation(conv: ConversaComInfo) {
    setSelected(conv);
    setMessages([]);
    setUnreadIds((prev) => { const next = new Set(prev); next.delete(conv.id); return next; });
  }

  function startDM(friend: Usuario) {
    const existing = conversations.find(
      (c) => c.tipo === 'DM' && c.participantes.some((p) => p.id === friend.id)
    );
    if (existing) {
      selectConversation(existing);
      setPendingFriend(null);
    } else {
      setSelected(null);
      setPendingFriend(friend);
      setMessages([]);
    }
  }

  async function handleCreateGroup(nome: string, participanteIds: string[]) {
    const { data: convId } = await createGroup(nome, participanteIds);
    if (!convId) return;
    const { data } = await getMyConversations();
    setConversations(data);
    const conv = data.find((c) => c.id === convId);
    if (conv) selectConversation(conv);
  }

  async function handleLeaveGroup() {
    if (!selected || !user?.id) return;
    await leaveGroup(selected.id, user.id);
    setSelected(null);
    setMessages([]);
    refreshConversations();
  }

  async function handleAddToGroup(novo_usuario: string) {
    if (!selected) return;
    await addToGroup(selected.id, novo_usuario);
    const { data } = await getMyConversations();
    setConversations(data);
    const updated = data.find((c) => c.id === selected.id);
    if (updated) setSelected(updated);
  }

  const MAX_MESSAGE_LENGTH = 1000;

  async function handleSend() {
    const conteudo = input.trim();
    if (!conteudo || conteudo.length > MAX_MESSAGE_LENGTH || !user?.id || sending) return;
    if (!selected && !pendingFriend) return;

    let convId = selected?.id ?? null;

    if (!convId && pendingFriend) {
      const { data } = await getOrCreateDMConversation(pendingFriend.id);
      if (!data) return;
      convId = data;
      const { data: convs } = await getMyConversations();
      setConversations(convs);
      const conv = convs.find((c) => c.id === convId);
      if (conv) setSelected(conv);
      setPendingFriend(null);
    }

    if (!convId) return;
    setSending(true);
    setInput("");
    try {
      await sendMessage({ conteudo, id_remetente: user.id, id_conversa: convId });
    } finally {
      setSending(false);
    }
  }

  return {
    user,
    conversations,
    friends,
    selected,
    pendingFriend,
    selectConversation,
    startDM,
    handleCreateGroup,
    handleLeaveGroup,
    handleAddToGroup,
    clearSelected: () => { setSelected(null); setPendingFriend(null); setMessages([]); },
    messages,
    participantMap,
    unreadIds,
    input,
    setInput,
    sending,
    handleSend,
    maxMessageLength: MAX_MESSAGE_LENGTH,
  };
}
