"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Users, X, ChevronRight, MessageCircle } from "lucide-react";
import { getFriendsAtEvent } from "@/app/lib/services/database/friendshipService";
import { Avatar } from "@/app/components/(protected)/Avatar";
import { ShareEventModal } from "@/app/components/events/ShareEventModal";
import type { Usuario, Evento } from "@/app/lib/types";

function FriendRow({ user, onMessage }: { user: Usuario; onMessage: (user: Usuario) => void }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Avatar nome={user.nome ?? user.username} imagem_url={user.imagem_url} size={40} />
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-sm font-medium text-gray-800 truncate">{user.nome ?? user.username}</span>
        {user.username && user.nome && (
          <span className="text-xs text-gray-400">@{user.username}</span>
        )}
      </div>
      <button
        onClick={() => onMessage(user)}
        className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700 border border-purple-200 hover:border-purple-300 hover:bg-purple-50 px-3 py-1.5 rounded-full transition-colors"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        Mensagem
      </button>
    </div>
  );
}

export function FriendsAtEvent({ userId, evento, organizerId }: { userId: string; evento: Evento; organizerId: string }) {
  const [friends, setFriends] = useState<Usuario[]>([]);
  const [open, setOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState<Usuario | null>(null);

  useEffect(() => {
    getFriendsAtEvent(userId, evento.id).then((data) => {
      setFriends(data.filter((f) => f.id !== organizerId));
    });
  }, [userId, evento.id, organizerId]);

  function handleMessage(friend: Usuario) {
    setOpen(false);
    setShareTarget(friend);
  }

  if (friends.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-purple-700 font-medium border border-purple-200 bg-purple-50 hover:bg-purple-100 transition rounded-full px-4 py-2 w-full sm:w-fit"
      >
        <Users className="h-4 w-4" />
        {friends.length === 1 ? "1 amigo irá" : `${friends.length} amigos irão`}
        <ChevronRight className="h-4 w-4 opacity-60" />
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-800">Amigos que irão</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col divide-y divide-gray-100">
              {friends.map((f) => (
                <FriendRow key={f.id} user={f} onMessage={() => handleMessage(f)} />
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {shareTarget && (
        <ShareEventModal evento={evento} initialFriend={shareTarget} onClose={() => setShareTarget(null)} />
      )}
    </>
  );
}
