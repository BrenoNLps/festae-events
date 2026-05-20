"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import LoadingOverlay from "@/app/components/LoadingOverlay";
import { PROTECTED_ROUTES, ROUTES } from "../routes";
import { getUserById } from "../services/database/userService";
import { getSupabaseClient } from "./singleton";

export default function AuthListener() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = getSupabaseClient();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN") {
        setLoading(true);
        setTimeout(async () => {
          if (!session?.user.id) {
            setLoading(false);
            return;
          }
          const { data: usuario } = await getUserById(session.user.id);

          if (!usuario?.username) {
            router.push(ROUTES.completeProfile);
          } else if (!PROTECTED_ROUTES.some((r) => pathname.startsWith(r))) {
            router.push(ROUTES.events);
          }
          setLoading(false);
        }, 100);
      }
      if (event === "SIGNED_OUT") {
        setLoading(true);
        router.push(ROUTES.login);
        setTimeout(() => setLoading(false), 600);
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router, supabase.auth]);

  if (!loading) return null;

  return <LoadingOverlay />;
}
