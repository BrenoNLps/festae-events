"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCurrentUser } from "./useCurrentUser";
import { getFriends } from "../services/database/friendshipService";
import {
  getMessagesByConversation,
  sendMessage,
  getOrCreateDMConversation,
  markConversationAsRead,
  getUnreadDMPartnerIds,
} from "../services/database/messageService";
import { getSupabaseClient } from "../supabase/singleton";
import type { Usuario, Message } from "../types";

const supabase = getSupabaseClient();

export function useChat() {
  const { user } = useCurrentUser();
  const searchParams = useSearchParams();

  const [friends, setFriends] = useState<Usuario[]>([]);
  const [selected, setSelectedState] = useState<Usuario | null>(null);
  const [conversaId, setConversaId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadIds, setUnreadIds] = useState<Set<string>>(new Set());
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const conversaIdRef = useRef<string | null>(null);
  conversaIdRef.current = conversaId;

  useEffect(() => {
    if (!user?.id) return;
    getFriends(user.id).then(({ data }) => {
      if (!data) return;
      setFriends(data);
      const userId = searchParams.get("userId");
      if (userId) {
        const friend = data.find((u) => u.id === userId);
        if (friend) selectFriend(friend);
      }
    });

    getUnreadDMPartnerIds().then(({ data }) => {
      setUnreadIds(new Set(data));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, searchParams]);

  // Inbox global: detecta novas mensagens de qualquer conversa
  useEffect(() => {
    if (!user?.id) return;

    const globalChannel = supabase
      .channel(`inbox-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mensagem" }, (payload) => {
        const msg = payload.new as Message;
        if (msg.id_remetente === user.id) return;
        if (msg.id_conversa === conversaIdRef.current) return;
        setUnreadIds((prev) => {
          if (prev.has(msg.id_remetente)) return prev;
          const next = new Set(prev);
          next.add(msg.id_remetente);
          return next;
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(globalChannel); };
  }, [user?.id]);

  // Carrega mensagens e escuta a conversa selecionada
  useEffect(() => {
    if (!user?.id || !conversaId) return;

    getMessagesByConversation(conversaId).then(({ data }) => {
      setMessages(data ?? []);
    });

    markConversationAsRead(conversaId, user.id);

    const channel = supabase
      .channel(`chat-${conversaId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mensagem" }, (payload) => {
        const msg = payload.new as Message;
        if (msg.id_conversa !== conversaId) return;
        setMessages((prev) => [...prev, msg]);
        if (msg.id_remetente !== user.id) {
          markConversationAsRead(conversaId, user.id);
          setUnreadIds((prev) => { const next = new Set(prev); next.delete(msg.id_remetente); return next; });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, conversaId]);

  async function selectFriend(friend: Usuario) {
    setSelectedState(friend);
    setMessages([]);
    setUnreadIds((prev) => { const next = new Set(prev); next.delete(friend.id); return next; });
    const { data: id } = await getOrCreateDMConversation(friend.id);
    setConversaId(id);
  }

  const MAX_MESSAGE_LENGTH = 1000;

  async function handleSend() {
    const conteudo = input.trim();
    if (!conteudo || conteudo.length > MAX_MESSAGE_LENGTH || !user?.id || !conversaId || sending) return;
    setSending(true);
    setInput("");
    try {
      await sendMessage({ conteudo, id_remetente: user.id, id_conversa: conversaId });
    } finally {
      setSending(false);
    }
  }

  return {
    user,
    friends,
    selected,
    selectFriend,
    clearSelected: () => { setSelectedState(null); setConversaId(null); setMessages([]); },
    messages,
    unreadIds,
    input,
    setInput,
    sending,
    handleSend,
    maxMessageLength: MAX_MESSAGE_LENGTH,
  };
}
