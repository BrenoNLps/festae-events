"use client";

import Link from "next/link";
import { Calendar, MapPin } from "lucide-react";
import { Evento } from "@/app/lib/types";
import { formatDateRange } from "@/app/lib/utils/date";
import { formatPrice, formatLocation } from "@/app/lib/utils/event";
import { EventImage } from "./EventImage";
import { useCurrentUser } from "@/app/lib/hooks/useCurrentUser";

export function EventCard({ event }: { event: Evento }) {
  const { user, loading } = useCurrentUser();
  const dateLabel = formatDateRange(event.data_inicio, event.data_fim);
  const location = formatLocation(event.endereco);
  const price = formatPrice(event.valor);
  const href =
    !loading && !user
      ? `/login?callbackUrl=/events/${event.id}`
      : `/events/${event.id}`;

  return (
    <Link href={href} className="shrink-0 w-64 rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer block">
      <div className="relative h-36 bg-purple-100">
        <EventImage src={event.imagem_url} alt={event.nome} iconSize="h-10 w-10" />
        <span
          className={`absolute top-2 right-2 text-xs font-semibold px-2 py-1 rounded-full ${
            price === "Gratuito"
              ? "bg-green-100 text-green-700"
              : "bg-white text-gray-700"
          }`}
        >
          {price}
        </span>
      </div>

      <div className="p-3 flex flex-col gap-1.5">
        <p className="font-semibold text-sm text-gray-900 leading-tight line-clamp-2">
          {event.nome}
        </p>

        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span>{dateLabel}</span>
        </div>

        {location && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{location}</span>
          </div>
        )}

        <div className="text-xs text-gray-400 mt-0.5">{event.vagas} vagas</div>
      </div>
    </Link>
  );
}
