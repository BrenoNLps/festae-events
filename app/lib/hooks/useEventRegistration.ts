import { useEffect, useRef, useState } from "react";
import {
  checkRegistration,
  createRegistration,
  deleteRegistration,
  getRegistrationCount,
} from "../services/database/registrationService";

export function useEventRegistration(
  userId: string | null,
  eventId: number | null,
  maxVagas?: number
) {
  const [isRegistered, setIsRegistered] = useState(false);
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registrationCount, setRegistrationCount] = useState(0);
  const inFlight = useRef(false);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    setChecking(true);
    const checks: Promise<void>[] = [
      getRegistrationCount(eventId).then((count) => {
        if (!cancelled) setRegistrationCount(count);
      }),
    ];
    if (userId) {
      checks.push(
        checkRegistration(userId, eventId).then(({ data }) => {
          if (!cancelled) setIsRegistered(!!data);
        })
      );
    }
    Promise.all(checks)
      .then(() => { if (!cancelled) setChecking(false); })
      .catch(() => { if (!cancelled) setChecking(false); });
    return () => { cancelled = true; };
  }, [userId, eventId]);

  const isFull = maxVagas !== undefined && registrationCount >= maxVagas;

  async function register() {
    if (!userId || !eventId || inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    try {
      const { error } = await createRegistration({ id_usuario: userId, id_evento: eventId });
      if (!error) {
        setIsRegistered(true);
        setRegistrationCount((c) => c + 1);
      }
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }

  async function unregister() {
    if (!userId || !eventId || inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    try {
      const { error } = await deleteRegistration(userId, eventId);
      if (!error) {
        setIsRegistered(false);
        setRegistrationCount((c) => Math.max(0, c - 1));
      }
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }

  return { isRegistered, checking, loading, register, unregister, registrationCount, isFull };
}
