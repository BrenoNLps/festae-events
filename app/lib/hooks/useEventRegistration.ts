import { useEffect, useRef, useState } from "react";
import {
  checkRegistration,
  createRegistration,
  deleteRegistration,
  ensureCodigo,
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
  const [codigo, setCodigo] = useState<string | null>(null);
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
        checkRegistration(userId, eventId).then(async ({ data }) => {
          if (!cancelled) {
            setIsRegistered(!!data);
            if (data && !data.codigo) {
              const novo = await ensureCodigo(userId, eventId);
              if (!cancelled) setCodigo(novo);
            } else {
              setCodigo(data?.codigo ?? null);
            }
          }
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
      const { data, error } = await createRegistration({ id_usuario: userId, id_evento: eventId });
      if (!error) {
        setIsRegistered(true);
        setRegistrationCount((c) => c + 1);
        setCodigo(data?.codigo ?? null);
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

  return { isRegistered, checking, loading, register, unregister, registrationCount, isFull, codigo };
}
