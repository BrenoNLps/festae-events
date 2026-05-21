import { useEffect, useState } from "react";
import { getEventsByFriends } from "../services/database/eventService";
import { Evento } from "../types";

export function useFriendsEvents(userId: string | null) {
  const [events, setEvents] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    getEventsByFriends(userId).then((data) => {
      setEvents(data);
      setLoading(false);
    });
  }, [userId]);

  return { events, loading };
}
