"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, UserCheck, Users, MessageCircle, UserMinus } from "lucide-react";

import { useCurrentUser } from "@/app/lib/hooks/useCurrentUser";
import { useSearch } from "@/app/lib/hooks/useSearch";
import { searchUsers } from "@/app/lib/services/database/userService";
import {
  addFriend,
  getFriends,
  removeFriend,
} from "@/app/lib/services/database/friendshipService";
import { SearchInput } from "@/app/components/(protected)/SearchInput";
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
  const [added, setAdded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.id) return;
    getFriends(user.id).then(({ data }) => {
      if (!data) return;
      const users = data.map((row: { usuario: Usuario }) => row.usuario);
      setFriends(users);
      setFriendIds(new Set(users.map((u: Usuario) => u.id)));
    });
  }, [user?.id]);

  async function handleAdd(target: Usuario) {
    if (!user?.id) return;
    setAdded((prev) => new Set(prev).add(target.id));
    await addFriend({ id_usuario: user.id, id_amigo: target.id });
    setFriendIds((prev) => new Set(prev).add(target.id));
    setFriends((prev) => [...prev, target]);
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
    setAdded((prev) => {
      const next = new Set(prev);
      next.delete(target.id);
      return next;
    });
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
              isAlreadyFriend={friendIds.has(u.id)}
              justAdded={added.has(u.id)}
              onAdd={() => handleAdd(u)}
              onRemove={() => handleRemove(u)}
              onMessage={() => handleMessage(u)}
            />
          ))}
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-gray-400" />
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
                isAlreadyFriend
                onRemove={() => handleRemove(u)}
                onMessage={() => handleMessage(u)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface UserCardProps {
  user: Usuario;
  isAlreadyFriend?: boolean;
  justAdded?: boolean;
  onAdd?: () => void;
  onRemove?: () => void;
  onMessage?: () => void;
}

function UserCard({ user, isAlreadyFriend, justAdded, onAdd, onRemove, onMessage }: UserCardProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-white shadow-sm">
      <Avatar nome={user.nome} imagem_url={user.imagem_url} size={44} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-gray-900 truncate">
          @{user.username}
        </p>
        {user.nome && (
          <p className="text-xs text-gray-500 truncate">{user.nome}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {isAlreadyFriend ? (
          <>
            <button
              onClick={onMessage}
              className="flex items-center gap-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded-full transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              Mensagem
            </button>
            <button
              onClick={onRemove}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-red-600 border border-gray-200 hover:border-red-300 px-3 py-2 rounded-full transition-colors"
            >
              <UserMinus className="h-4 w-4" />
              Remover
            </button>
          </>
        ) : (
          onAdd && (
            <button
              onClick={onAdd}
              disabled={justAdded}
              className="flex items-center gap-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-60 px-3 py-2 rounded-full transition-colors"
            >
              {justAdded ? (
                <UserCheck className="h-4 w-4" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {justAdded ? "Adicionado" : "Adicionar"}
            </button>
          )
        )}
      </div>
    </div>
  );
}
