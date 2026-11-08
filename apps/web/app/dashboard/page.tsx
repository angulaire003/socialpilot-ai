"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Calendar,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { getPosts } from "@/lib/storage";
import { Post } from "@/lib/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function DashboardPage() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    setPosts(getPosts());
  }, []);

  const drafts = posts.filter((p) => p.status === "draft").length;
  const scheduled = posts.filter((p) => p.status === "scheduled").length;
  const published = posts.filter((p) => p.status === "published").length;
  const recent = posts.slice(0, 5);

  const stats = [
    {
      label: "Brouillons",
      value: drafts,
      icon: FileText,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Programmées",
      value: scheduled,
      icon: Clock,
      color: "text-sky-400",
      bg: "bg-sky-500/10",
    },
    {
      label: "Publiées",
      value: published,
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Total",
      value: posts.length,
      icon: TrendingUp,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Tableau de bord</h1>
        <p className="text-slate-400 mt-1 text-sm">
          Vue d&apos;ensemble de vos publications et activité
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-800 bg-[#111827] p-4"
          >
            <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href="/assistant"
          className="flex items-center gap-4 rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4 hover:bg-sky-500/15 transition-colors"
        >
          <div className="w-12 h-12 rounded-xl bg-sky-500/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <p className="font-semibold text-white">Générer avec l&apos;IA</p>
            <p className="text-sm text-slate-400">Créer une publication intelligente</p>
          </div>
        </Link>
        <Link
          href="/calendar"
          className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-[#111827] p-4 hover:border-slate-700 transition-colors"
        >
          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-slate-300" />
          </div>
          <div>
            <p className="font-semibold text-white">Calendrier éditorial</p>
            <p className="text-sm text-slate-400">Voir les publications programmées</p>
          </div>
        </Link>
      </div>

      {/* Recent posts */}
      <div className="rounded-2xl border border-slate-800 bg-[#111827] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <h2 className="font-semibold text-white">Publications récentes</h2>
          <Link href="/posts" className="text-sm text-sky-400 hover:text-sky-300">
            Voir tout
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">Aucune publication pour le moment</p>
            <Link
              href="/assistant"
              className="inline-block mt-3 text-sm text-sky-400 font-medium"
            >
              Créer la première →
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-800">
            {recent.map((post) => (
              <li key={post.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-200 line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
                      <span className="capitalize">{post.network}</span>
                      <span>•</span>
                      <span>
                        {format(new Date(post.createdAt), "d MMM yyyy", { locale: fr })}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={post.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Post["status"] }) {
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
