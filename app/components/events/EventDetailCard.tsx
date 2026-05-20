import { Clock, MapPin } from "lucide-react";
import { EventImage } from "./EventImage";
import { Evento } from "@/app/lib/types";
import { formatDateRange } from "@/app/lib/utils/date";
import { formatPrice, formatLocation } from "@/app/lib/utils/event";

export function EventDetailCard({ event }: { event: Evento }) {
  const location = formatLocation(event.endereco);
  const price = formatPrice(event.valor);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="h-28 bg-purple-100">
        <EventImage src={event.imagem_url} alt={event.nome} iconSize="h-8 w-8" />
      </div>

      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-sm text-gray-900 leading-tight">
            {event.nome}
          </p>
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${
              price === "Gratuito"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {price}
          </span>
        </div>

        {event.descricao && (
          <p className="text-xs text-gray-500 line-clamp-2">{event.descricao}</p>
        )}

        <div className="flex flex-col gap-1 mt-1">
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <Clock className="h-3.5 w-3.5 flex-shrink-0" />
            {formatDateRange(event.data_inicio, event.data_fim)} · {event.hora_inicio} – {event.hora_fim}
          </span>
          {location && (
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              {location}
            </span>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-0.5">{event.vagas} vagas</p>
      </div>
    </div>
  );
}
