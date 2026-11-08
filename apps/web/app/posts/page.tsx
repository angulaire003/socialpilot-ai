"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Edit3,
  Calendar as CalendarIcon,
  MoreVertical,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getPosts, deletePost, updatePost } from "@/lib/storage";
import { Post, PostStatus } from "@/lib/types";

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<PostStatus | "all">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [scheduleId, setScheduleId] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("10:00");

  useEffect(() => {
    setPosts(getPosts());
  }, []);

  const filtered =
    filter === "all" ? posts : posts.filter((p) => p.status === filter);

  function handleDelete(id: string) {
    if (!confirm("Supprimer cette publication ?")) return;
    setPosts(deletePost(id));
  }

  function startEdit(post: Post) {
    setEditingId(post.id);
    setEditContent(post.content);
  }

  function saveEdit(id: string) {
    setPosts(updatePost(id, { content: editContent }));
    setEditingId(null);
  }

  function openSchedule(post: Post) {
    setScheduleId(post.id);
    if (post.scheduledAt) {
      const d = new Date(post.scheduledAt);
      setScheduleDate(format(d, "yyyy-MM-dd"));
      setScheduleTime(format(d, "HH:mm"));
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setScheduleDate(format(tomorrow, "yyyy-MM-dd"));
      setScheduleTime("10:00");
    }
  }

  function saveSchedule() {
    if (!scheduleId || !scheduleDate) return;
    const iso = new Date(`${scheduleDate}T${scheduleTime}:00`).toISOString();
    setPosts(
      updatePost(scheduleId, {
        status: "scheduled",
        scheduledAt: iso,
      })
    );
    setScheduleId(null);
  }

  const statusLabels: Record<PostStatus, string> = {
    draft: "Brouillon",
    scheduled: "Programmée",
    published: "Publiée",
    error: "Erreur",
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Publications</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {posts.length} publication{posts.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/assistant"
          className="flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold px-4 py-2.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouvelle
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(["all", "draft", "scheduled", "published", "error"] as const).map(
          (f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-sky-500 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {f === "all" ? "Toutes" : statusLabels[f]}
            </button>
          )
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-[#111827] py-14 text-center">
          <p className="text-slate-400">Aucune publication dans cette catégorie</p>
          <Link
            href="/assistant"
            className="inline-block mt-3 text-sky-400 text-sm font-medium"
          >
            Créer avec l&apos;IA →
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((post) => (
            <li
              key={post.id}
              className="rounded-2xl border border-slate-800 bg-[#111827] p-4"
            >
              {editingId === post.id ? (
                <div className="space-y-3">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={5}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(post.id)}
                      className="px-4 py-2 rounded-lg bg-sky-500 text-white text-sm font-medium"
                    >
                      Enregistrer
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-slate-200 whitespace-pre-wrap flex-1">
                      {post.content}
                    </p>
                    <StatusBadge status={post.status} />
                  </div>

                  {post.hashtags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {post.hashtags.map((h) => (
                        <span
                          key={h}
                          className="text-[11px] text-sky-400/80"
                        >
                          #{h}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800">
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <span className="capitalize">{post.network}</span>
                      <span>•</span>
                      <span>
                        {format(new Date(post.createdAt), "d MMM yyyy HH:mm", {
                          locale: fr,
                        })}
                      </span>
                      {post.scheduledAt && (
                        <>
                          <span>•</span>
                          <span className="text-sky-400">
                            Prog.{" "}
                            {format(new Date(post.scheduledAt), "d MMM HH:mm", {
                              locale: fr,
                            })}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(post)}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                        title="Modifier"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openSchedule(post)}
                        className="p-2 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800"
                        title="Programmer"
                      >
                        <CalendarIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Schedule modal */}
      {scheduleId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#111827] border border-slate-700 p-5 space-y-4">
            <h3 className="font-semibold text-white">Programmer la publication</h3>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Date</label>
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Heure</label>
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-white text-sm"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setScheduleId(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium"
              >
                Annuler
              </button>
              <button
                onClick={saveSchedule}
                className="flex-1 py-2.5 rounded-xl bg-sky-500 text-white text-sm font-semibold"
              >
                Programmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: PostStatus }) {
  const styles = {
    draft: "bg-amber-500/15 text-amber-400",
    scheduled: "bg-sky-500/15 text-sky-400",
    published: "bg-emerald-500/15 text-emerald-400",
    error: "bg-red-500/15 text-red-400",
  };
  const labels = {
    draft: "Brouillon",
    scheduled: "Programmée",
    published: "Publiée",
    error: "Erreur",
  };
  return (
    <span
      className={`shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
