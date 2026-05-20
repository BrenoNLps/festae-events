import { useEffect, useState } from "react";
import {
  checkRegistration,
  createRegistration,
  deleteRegistration,
} from "../services/database/registrationService";

export function useEventRegistration(
  userId: string | null,
  eventId: number | null
) {
  const [isRegistered, setIsRegistered] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || !eventId) {
      setChecking(false);
      return;
    }
    setChecking(true);
    checkRegistration(userId, eventId).then(({ data }) => {
      setIsRegistered(!!data);
      setChecking(false);
    });
  }, [userId, eventId]);

  async function register() {
    if (!userId || !eventId) return;
    setLoading(true);
    const { error } = await createRegistration({ id_usuario: userId, id_evento: eventId });
    if (!error) setIsRegistered(true);
    setLoading(false);
  }

  async function unregister() {
    if (!userId || !eventId) return;
    setLoading(true);
    const { error } = await deleteRegistration(userId, eventId);
    if (!error) setIsRegistered(false);
    setLoading(false);
  }

  return { isRegistered, checking, loading, register, unregister };
}
