"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Scrollbar } from "swiper/modules";
import { ChevronRight } from "lucide-react";
import { Evento } from "@/app/lib/types";
import { EventCard } from "./EventCard";

function SkeletonCard() {
  return (
    <div className="w-64 rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden animate-pulse">
      <div className="h-36 bg-gray-100" />
      <div className="p-3 flex flex-col gap-2">
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
      </div>
    </div>
  );
}

export function EventShelf({
  title,
  events,
  loading,
}: {
  title: string;
  events: Evento[];
  loading: boolean;
}) {
  const empty = !loading && events.length === 0;

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
        <ChevronRight className="h-4 w-4 text-gray-400" />
      </div>

      {empty ? (
        <p className="text-sm text-gray-400 py-4">Nenhum evento encontrado.</p>
      ) : (
        <Swiper
          modules={[FreeMode, Scrollbar]}
          freeMode
          grabCursor
          slidesPerView="auto"
          spaceBetween={16}
          scrollbar={{ draggable: true }}
          style={{ paddingBottom: 24 }}
        >
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <SwiperSlide key={i} className="!w-64">
                  <SkeletonCard />
                </SwiperSlide>
              ))
            : events.map((event) => (
                <SwiperSlide key={event.id} className="!w-64">
                  <EventCard event={event} />
                </SwiperSlide>
              ))}
        </Swiper>
      )}
    </section>
  );
}
