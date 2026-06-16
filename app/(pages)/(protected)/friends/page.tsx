"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, UserCheck, Users, MessageCircle, UserMinus, Clock, Check, X, MoreVertical } from "lucide-react";

import { useCurrentUser } from "@/app/lib/hooks/useCurrentUser";
import { useSearch } from "@/app/lib/hooks/useSearch";
import { searchUsers } from "@/app/lib/services/database/userService";
import {
  sendFriendRequest,
  getFriends,
  removeFriend,
  getPendingReceived,
  getPendingSent,
  acceptFriend,
  declineFriend,
} from "@/app/lib/services/database/friendshipService";
import { SearchInput } from "@/app/components/(protected)/SearchInput";
import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";
import { Avatar } from "@/app/components/(protected)/Avatar";
import { Usuario } from "@/app/lib/types";
import { ROUTES } from "@/app/lib/routes";

export default function Friends() {
  const { user } = useCurrentUser();
  const router = useRouter();

  const searchFn = useCallback(
    (q: string) => searchUsers(q, user?.id ?? undefined),
    [user?.id],
  );

  const { query, setQuery, results, loading } = useSearch(searchFn);

  const [friends, setFriends] = useState<Usuario[]>([]);
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [pendingReceived, setPendingReceived] = useState<Usuario[]>([]);
  const [pendingSent, setPendingSent] = useState<Usuario[]>([]);
  const pendingSentIds = new Set(pendingSent.map((u) => u.id));

  useEffect(() => {
    if (!user?.id) return;

    getFriends(user.id).then(({ data }) => {
      if (!data) return;
      setFriends(data);
      setFriendIds(new Set(data.map((u) => u.id)));
    });

    getPendingReceived(user.id).then(({ data }) => {
      if (!data) return;
      setPendingReceived(data.map((r: { remetente: Usuario }) => r.remetente).filter(Boolean));
    });

    getPendingSent(user.id).then(({ data }) => {
      if (!data) return;
      setPendingSent(data.map((r: { amigo: Usuario }) => r.amigo));
    });
  }, [user?.id]);

  async function handleAdd(target: Usuario) {
    if (!user?.id) return;
    if (pendingReceived.some((p) => p?.id === target.id)) return;
    setPendingSent((prev) => [...prev, target]);
    await sendFriendRequest({ id_usuario: user.id, id_amigo: target.id });
  }

  async function handleCancel(target: Usuario) {
    if (!user?.id) return;
    await declineFriend(user.id, target.id);
    setPendingSent((prev) => prev.filter((u) => u.id !== target.id));
  }

  async function handleAccept(target: Usuario) {
    if (!user?.id) return;
    await acceptFriend(target.id, user.id);
    setPendingReceived((prev) => prev.filter((u) => u.id !== target.id));
    setFriends((prev) => [...prev, target]);
    setFriendIds((prev) => new Set(prev).add(target.id));
  }

  async function handleDecline(target: Usuario) {
    if (!user?.id) return;
    await declineFriend(target.id, user.id);
    setPendingReceived((prev) => prev.filter((u) => u.id !== target.id));
  }

  async function handleRemove(target: Usuario) {
    if (!user?.id) return;
    await removeFriend(user.id, target.id);
    setFriendIds((prev) => {
      const next = new Set(prev);
      next.delete(target.id);
      return next;
    });
    setFriends((prev) => prev.filter((f) => f.id !== target.id));
  }

  function handleMessage(target: Usuario) {
    router.push(`${ROUTES.chat}?userId=${target.id}`);
  }

  const showSearch = query.trim().length > 0;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Amigos</h1>

      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Buscar por username..."
        loading={loading}
        className="mb-6"
      />

      {showSearch ? (
        <div className="flex flex-col gap-2">
          {!loading && results.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-6">
              Nenhum usuário encontrado para &quot;{query}&quot;
            </p>
          )}
          {results.map((u) => (
            <UserCard
              key={u.id}
              user={u}
              isFriend={friendIds.has(u.id)}
              isPendingSent={pendingSentIds.has(u.id)}
              isPendingReceived={pendingReceived.some((p) => p.id === u.id)}
              onAdd={() => handleAdd(u)}
              onRemove={() => handleRemove(u)}
              onAccept={() => handleAccept(u)}
              onDecline={() => handleDecline(u)}
              onMessage={() => handleMessage(u)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {pendingReceived.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-semibold text-gray-600">
                  Solicitações recebidas ({pendingReceived.length})
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {pendingReceived.map((u) => (
                  <UserCard
                    key={u.id}
                    user={u}
                    isFriend={false}
                    isPendingSent={false}
                    isPendingReceived
                    onAccept={() => handleAccept(u)}
                    onDecline={() => handleDecline(u)}
                    onMessage={() => {}}
                  />
                ))}
              </div>
            </div>
          )}

          {pendingSent.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-semibold text-gray-600">
                  Solicitações enviadas ({pendingSent.length})
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {pendingSent.map((u) => (
                  <UserCard
                    key={u.id}
                    user={u}
                    isFriend={false}
                    isPendingSent
                    isPendingReceived={false}
                    onCancel={() => handleCancel(u)}
                    onMessage={() => {}}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-600">
                {friends.length === 0
                  ? "Nenhum amigo ainda"
                  : `${friends.length} ${friends.length === 1 ? "amigo" : "amigos"}`}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {friends.map((u) => (
                <UserCard
                  key={u.id}
                  user={u}
                  isFriend
                  isPendingSent={false}
                  isPendingReceived={false}
                  onRemove={() => handleRemove(u)}
                  onMessage={() => handleMessage(u)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface UserCardProps {
  user: Usuario;
  isFriend: boolean;
  isPendingSent: boolean;
  isPendingReceived: boolean;
  onAdd?: () => void;
  onRemove?: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
  onCancel?: () => void;
  onMessage?: () => void;
}

function UserCard({ user, isFriend, isPendingSent, isPendingReceived, onAdd, onRemove, onAccept, onDecline, onCancel, onMessage }: UserCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  return (
    <>
      <ConfirmDialog
        open={confirmRemove}
        title="Remover amigo"
        description={`Tem certeza que deseja remover @${user.username} da sua lista de amigos?`}
        confirmLabel="Remover"
        destructive
        onConfirm={() => { onRemove?.(); setConfirmRemove(false); }}
        onCancel={() => setConfirmRemove(false)}
      />
      <div className="relative flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-white shadow-sm">
        <Avatar nome={user.nome} imagem_url={user.imagem_url} size={44} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 truncate">@{user.username}</p>
          {user.nome && <p className="text-xs text-gray-500 truncate">{user.nome}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isFriend ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 min-w-max">
                  <button
                    onClick={() => { onMessage?.(); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-t-xl transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Enviar mensagem
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); setConfirmRemove(true); }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-b-xl transition-colors"
                  >
                    <UserMinus className="h-4 w-4" />
                    Remover amigo
                  </button>
                </div>
              )}
            </div>
          ) : isPendingReceived ? (
            <>
              <button
                onClick={onAccept}
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 px-3 py-2 rounded-full transition-colors"
              >
                <Check className="h-4 w-4" />
                Aceitar
              </button>
              <button
                onClick={onDecline}
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-red-600 border border-gray-200 hover:border-red-300 px-3 py-2 rounded-full transition-colors"
              >
                <X className="h-4 w-4" />
                Recusar
              </button>
            </>
          ) : isPendingSent ? (
            <button
              onClick={onCancel}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-300 px-3 py-2 rounded-full transition-colors"
            >
              <X className="h-4 w-4" />
              Cancelar
            </button>
          ) : (
            onAdd && (
              <button
                onClick={onAdd}
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded-full transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                Adicionar
              </button>
            )
          )}
        </div>
      </div>
    </>
  );
}
