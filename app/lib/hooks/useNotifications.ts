"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "./useCurrentUser";
import { getUnreadConversationIds } from "../services/database/messageService";
import { getUnreadNotificationCount, markNotificationsAsRead } from "../services/database/notificationService";
import { ROUTES } from "../routes";

export function useNotifications() {
  const { user } = useCurrentUser();
  const pathname = usePathname();
  const [badges, setBadges] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user?.id) return;

    const onFriends = pathname === ROUTES.friends;
    const onChat = pathname.startsWith(ROUTES.chat);
    const onAgenda = pathname === ROUTES.agenda;

    if (onFriends) markNotificationsAsRead('amizade');
    if (onAgenda) markNotificationsAsRead('evento');

    if (!onFriends) {
      getUnreadNotificationCount('amizade').then((count) => {
        setBadges((prev) => ({ ...prev, [ROUTES.friends]: count }));
      });
    } else {
      setBadges((prev) => ({ ...prev, [ROUTES.friends]: 0 }));
    }

    if (!onChat) {
      getUnreadConversationIds().then(({ data }) => {
        setBadges((prev) => ({ ...prev, [ROUTES.chat]: data.length }));
      });
    } else {
      setBadges((prev) => ({ ...prev, [ROUTES.chat]: 0 }));
    }

    if (!onAgenda) {
      getUnreadNotificationCount('evento').then((count) => {
        setBadges((prev) => ({ ...prev, [ROUTES.agenda]: count }));
      });
    } else {
      setBadges((prev) => ({ ...prev, [ROUTES.agenda]: 0 }));
    }
  }, [user?.id, pathname]);

  return badges;
}
