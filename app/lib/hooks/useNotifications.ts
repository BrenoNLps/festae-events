"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "./useCurrentUser";
import { getPendingReceived } from "../services/database/friendshipService";
import { getUnreadSenderIds } from "../services/database/messageService";
import { getEventsByOrganizer } from "../services/database/eventService";
import { getRegistrationsByUser } from "../services/database/registrationService";
import { Evento } from "../types";
import { ROUTES } from "../routes";
import { getTodayAsString } from "../utils/date";
import { STORAGE_KEYS } from "../storageKeys";

export function useNotifications() {
  const { user } = useCurrentUser();
  const pathname = usePathname();
  const [badges, setBadges] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user?.id) return;

    const onFriends = pathname === ROUTES.friends;
    const onChat = pathname.startsWith(ROUTES.chat);
    const onAgenda = pathname === ROUTES.agenda;

    if (onFriends) localStorage.setItem(STORAGE_KEYS.lastFriendsVisit, new Date().toISOString());
    if (onChat) localStorage.setItem(STORAGE_KEYS.lastChatVisit, new Date().toISOString());
    if (onAgenda) localStorage.setItem(STORAGE_KEYS.lastAgendaVisit, getTodayAsString());

    const lastFriendsVisit = localStorage.getItem(STORAGE_KEYS.lastFriendsVisit) ?? new Date(0).toISOString();
    const lastChatVisit = localStorage.getItem(STORAGE_KEYS.lastChatVisit) ?? new Date(0).toISOString();
    const lastAgendaVisit = localStorage.getItem(STORAGE_KEYS.lastAgendaVisit) ?? "";
    const today = getTodayAsString();

    if (!onFriends) {
      getPendingReceived(user.id).then(({ data }) => {
        if (!data) return;
        const count = data.filter(
          (r: { data_criacao?: string }) => r.data_criacao && r.data_criacao > lastFriendsVisit
        ).length;
        setBadges((prev) => ({ ...prev, [ROUTES.friends]: count }));
      });
    } else {
      setBadges((prev) => ({ ...prev, [ROUTES.friends]: 0 }));
    }

    if (!onChat) {
      getUnreadSenderIds(user.id, lastChatVisit).then(({ data }) => {
        setBadges((prev) => ({ ...prev, [ROUTES.chat]: data?.length ?? 0 }));
      });
    } else {
      setBadges((prev) => ({ ...prev, [ROUTES.chat]: 0 }));
    }

    if (!onAgenda && lastAgendaVisit !== today) {
      Promise.all([
        getEventsByOrganizer(user.id),
        getRegistrationsByUser(user.id),
      ]).then(([created, registered]) => {
        const all: Evento[] = [
          ...(created.data ?? []),
          ...(registered.data ?? []).map((r: { evento: Evento }) => r.evento),
        ];
        const hasToday = all.some((e) => e && e.data_inicio <= today && e.data_fim >= today);
        setBadges((prev) => ({ ...prev, [ROUTES.agenda]: hasToday ? 1 : 0 }));
      });
    } else {
      setBadges((prev) => ({ ...prev, [ROUTES.agenda]: 0 }));
    }
  }, [user?.id, pathname]);

  return badges;
}
