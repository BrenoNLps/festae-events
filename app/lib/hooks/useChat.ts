"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCurrentUser } from "./useCurrentUser";
import { getFriends } from "../services/database/friendshipService";
import { getMessagesBetweenUsers, sendMessage, getUnreadSenderIds } from "../services/database/messageService";
import { getSupabaseClient } from "../supabase/singleton";
import { STORAGE_KEYS } from "../storageKeys";
import type { Usuario, Message } from "../types";

const supabase = getSupabaseClient();

export function useChat() {
  const { user } = useCurrentUser();
  const searchParams = useSearchParams();

  const [friends, setFriends] = useState<Usuario[]>([]);
  const [selected, setSelectedState] = useState<Usuario | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadIds, setUnreadIds] = useState<Set<string>>(new Set());
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const lastVisitRef = useRef(
    typeof window !== "undefined"
      ? (localStorage.getItem(STORAGE_KEYS.lastChatVisit) ?? new Date(0).toISOString())
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
        if (friend) setSelectedState(friend);
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
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mensagem" }, (payload) => {
        const msg = payload.new as Message;
        if (msg.id_destinatario !== user.id) return;
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

  useEffect(() => {
    if (!user?.id || !selected) return;

    getMessagesBetweenUsers(user.id, selected.id).then(({ data }) => {
      setMessages(data ?? []);
    });

    const channel = supabase
      .channel(`chat-${[user.id, selected.id].sort().join("-")}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mensagem" }, (payload) => {
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
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, selected?.id]);

  function selectFriend(friend: Usuario) {
    setSelectedState(friend);
    setUnreadIds((prev) => { const next = new Set(prev); next.delete(friend.id); return next; });
  }

  async function handleSend() {
    if (!input.trim() || !user?.id || !selected || sending) return;
    setSending(true);
    const conteudo = input.trim();
    setInput("");
    await sendMessage({ conteudo, id_remetente: user.id, id_destinatario: selected.id });
    setSending(false);
  }

  return {
    user,
    friends,
    selected,
    selectFriend,
    clearSelected: () => setSelectedState(null),
    messages,
    unreadIds,
    input,
    setInput,
    sending,
    handleSend,
  };
}
