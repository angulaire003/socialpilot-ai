"use client";

import { useEffect, useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
} from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getPosts } from "@/lib/storage";
import { Post } from "@/lib/types";

export default function CalendarPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    setPosts(getPosts());
  }, []);

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const scheduledPosts = posts.filter(
    (p) => p.status === "scheduled" && p.scheduledAt
  );

  function postsForDay(day: Date) {
    return scheduledPosts.filter((p) =>
      isSameDay(new Date(p.scheduledAt!), day)
    );
  }

  const selectedPosts = selectedDay ? postsForDay(selectedDay) : [];

  // Pad start of calendar
  const firstDayOfWeek = startOfMonth(currentMonth).getDay(); // 0 = Sunday
  const padding = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Monday start

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Calendrier éditorial</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Visualisez vos publications programmées
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-[#111827] overflow-hidden">
        {/* Month header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="font-semibold text-white capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: fr })}
          </h2>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 border-b border-slate-800">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
            <div
              key={d}
              className="py-2 text-center text-xs font-medium text-slate-500"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {Array.from({ length: padding }).map((_, i) => (
            <div key={`pad-${i}`} className="aspect-square border-b border-r border-slate-800/50" />
          ))}
          {days.map((day) => {
            const dayPosts = postsForDay(day);
            const selected = selectedDay && isSameDay(day, selectedDay);
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(day)}
                className={`aspect-square border-b border-r border-slate-800/50 p-1 flex flex-col items-center justify-start relative transition-colors ${
                  selected ? "bg-sky-500/20" : "hover:bg-slate-800/40"
                }`}
              >
                <span
                  className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday(day)
                      ? "bg-sky-500 text-white"
                      : selected
                      ? "text-sky-300"
                      : "text-slate-300"
                  }`}
                >
                  {format(day, "d")}
                </span>
                {dayPosts.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayPosts.slice(0, 3).map((_, i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-sky-400"
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="rounded-2xl border border-slate-800 bg-[#111827] p-4">
          <h3 className="font-semibold text-white mb-3 capitalize">
            {format(selectedDay, "EEEE d MMMM", { locale: fr })}
          </h3>
          {selectedPosts.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aucune publication programmée ce jour
            </p>
          ) : (
            <ul className="space-y-3">
              {selectedPosts.map((post) => (
                <li
                  key={post.id}
                  className="rounded-xl bg-slate-900/60 border border-slate-800 p-3"
                >
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                    <span className="capitalize">{post.network}</span>
                    <span>•</span>
                    <span>
                      {format(new Date(post.scheduledAt!), "HH:mm")}
                    </span>
                  </div>
                  <p className="text-sm text-slate-200 line-clamp-3">
                    {post.content}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
