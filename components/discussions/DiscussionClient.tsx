"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Bell, Loader2, MessageCircle, Search, Send, ThumbsUp, TrendingUp, Users } from "lucide-react";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Question = {
  id: string;
  title: string;
  body: string;
  category: string;
  views: number;
  createdAt: string;
  author: { name: string | null; image: string | null };
  tags: { id: string; name: string; slug: string }[];
  answersCount: number;
  votesCount: number;
};

type Answer = {
  id: string;
  body: string;
  createdAt: string;
  author: { name: string | null; image: string | null };
  _count: { votes: number };
};

type FeedData = {
  items: Question[];
  tags: { id: string; name: string; slug: string }[];
  trending: { id: string; title: string; views: number }[];
  mostAnswered: { id: string; title: string; _count: { answers: number } }[];
  page: number;
  pageCount: number;
};

function relativeTime(value: string) {
  const seconds = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function DiscussionClient() {
  const { status } = useSession();
  const [data, setData] = useState<FeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [answerBody, setAnswerBody] = useState("");
  const [answerLoading, setAnswerLoading] = useState(false);
  const [questionForm, setQuestionForm] = useState({ title: "", body: "", category: "Admissions", tags: "" });
  const [unread, setUnread] = useState(0);

  const loadFeed = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    const response = await fetch(`/api/discussions?${params.toString()}`, { cache: "no-store" });
    const nextData = await response.json();
    setData(nextData);
    setSelectedQuestion((current) => {
      if (!current) return nextData.items[0] ?? null;
      return nextData.items.find((item: Question) => item.id === current.id) ?? current;
    });
    if (!silent) setLoading(false);
  }, [category, q]);

  const loadAnswers = useCallback(async (questionId: string, silent = false) => {
    if (!silent) setAnswerLoading(true);
    const response = await fetch(`/api/discussions/${questionId}/answers`, { cache: "no-store" });
    const nextAnswers = await response.json();
    setAnswers(nextAnswers.items);
    if (!silent) setAnswerLoading(false);
  }, []);

  useEffect(() => {
    loadFeed().catch(() => {
      toast.error("Could not load discussions");
      setLoading(false);
    });
  }, [loadFeed]);

  useEffect(() => {
    if (selectedQuestion) loadAnswers(selectedQuestion.id).catch(() => toast.error("Could not load answers"));
  }, [loadAnswers, selectedQuestion?.id]);

  useEffect(() => {
    const poll = window.setInterval(async () => {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      const payload = await response.json();
      setUnread(payload.unread);
    }, 10000);
    return () => window.clearInterval(poll);
  }, []);

  useEffect(() => {
    if (!selectedQuestion) return;
    const poll = window.setInterval(() => {
      loadAnswers(selectedQuestion.id, true).catch(() => null);
      loadFeed(true).catch(() => null);
    }, 4000);
    return () => window.clearInterval(poll);
  }, [loadAnswers, loadFeed, selectedQuestion?.id]);

  async function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status !== "authenticated") return toast.error("Login to ask a question");
    const response = await fetch("/api/discussions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...questionForm, tags: questionForm.tags.split(",") })
    });
    const payload = await response.json();
    if (!response.ok) return toast.error(payload.error ?? "Could not post question");
    toast.success("Question posted");
    setQuestionForm({ title: "", body: "", category: "Admissions", tags: "" });
    await loadFeed();
  }

  async function submitAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedQuestion) return;
    if (status !== "authenticated") return toast.error("Login to answer");
    const response = await fetch(`/api/discussions/${selectedQuestion.id}/answers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: answerBody })
    });
    const payload = await response.json();
    if (!response.ok) return toast.error(payload.error ?? "Could not post answer");
    toast.success("Answer posted");
    setAnswerBody("");
    setAnswers((current) => [payload, ...current.filter((answer) => answer.id !== payload.id)]);
    setSelectedQuestion((current) => current ? { ...current, answersCount: current.answersCount + 1 } : current);
    setData((current) =>
      current
        ? {
            ...current,
            items: current.items.map((question) =>
              question.id === selectedQuestion.id ? { ...question, answersCount: question.answersCount + 1 } : question
            )
          }
        : current
    );
    await loadFeed(true);
  }

  async function vote(answerId: string) {
    if (status !== "authenticated") return toast.error("Login to upvote answers");
    const response = await fetch(`/api/answers/${answerId}/vote`, { method: "POST" });
    const payload = await response.json();
    if (!response.ok) return toast.error(payload.error ?? "Could not vote");
    setAnswers((current) => current.map((answer) => (answer.id === answerId ? { ...answer, _count: { votes: payload.votes } } : answer)));
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_300px]">
      <aside className="space-y-4">
        <div className="rounded-lg border bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-black">Filters</h2>
            <Bell className={unread ? "h-5 w-5 text-primary" : "h-5 w-5 text-slate-400"} />
          </div>
          <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); loadFeed().catch(() => toast.error("Search failed")); }}>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search discussions" className="pl-9" />
            </div>
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-primary/20">
              <option value="">All categories</option>
              <option>Admissions</option>
              <option>College Comparison</option>
              <option>Campus Life</option>
              <option>Placements</option>
            </select>
            <Button className="w-full" type="submit">Apply</Button>
          </form>
        </div>

        <form onSubmit={submitQuestion} className="rounded-lg border bg-white p-4">
          <h2 className="font-display text-lg font-black">Ask a question</h2>
          <div className="mt-3 space-y-3">
            <Input value={questionForm.title} onChange={(event) => setQuestionForm({ ...questionForm, title: event.target.value })} placeholder="Question title" />
            <textarea value={questionForm.body} onChange={(event) => setQuestionForm({ ...questionForm, body: event.target.value })} placeholder="Add context, rank, goals, constraints" className="min-h-28 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-primary/20" />
            <Input value={questionForm.tags} onChange={(event) => setQuestionForm({ ...questionForm, tags: event.target.value })} placeholder="tags, comma separated" />
            <Button className="w-full" type="submit"><Send className="h-4 w-4" /> Post</Button>
          </div>
        </form>
      </aside>

      <main className="space-y-4">
        <div>
          <p className="text-sm font-semibold uppercase text-primary">Community</p>
          <h1 className="font-display text-3xl font-black sm:text-4xl">Q&amp;A discussions</h1>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((item) => <div key={item} className="h-36 animate-pulse rounded-lg bg-slate-200" />)}
          </div>
        ) : data?.items.length ? (
          data.items.map((question) => {
            const selected = selectedQuestion?.id === question.id;
            return (
              <article key={question.id} className={`rounded-lg border bg-white p-4 shadow-sm transition ${selected ? "ring-2 ring-primary/20" : "hover:-translate-y-0.5 hover:shadow-soft"}`}>
                <button onClick={() => setSelectedQuestion(question)} className="w-full text-left">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-display text-xl font-black">{question.title}</h2>
                      <p className="mt-2 text-sm text-slate-600">{question.body}</p>
                    </div>
                    <Avatar name={question.author.name} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                    <Badge>{question.category}</Badge>
                    {question.tags.map((tag) => <span key={tag.id} className="rounded-full bg-slate-100 px-2.5 py-1">{tag.name}</span>)}
                    <span><MessageCircle className="mr-1 inline h-3.5 w-3.5" />{question.answersCount} answers</span>
                    <span>{relativeTime(question.createdAt)}</span>
                  </div>
                </button>
                {selected ? (
                  <div className="mt-4 border-t pt-4">
                    <form onSubmit={submitAnswer} className="flex flex-col gap-3 sm:flex-row">
                      <textarea value={answerBody} onChange={(event) => setAnswerBody(event.target.value)} placeholder="Write your answer here" className="min-h-20 flex-1 rounded-md border px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-primary/20" />
                      <Button type="submit" className="sm:w-32">Answer</Button>
                    </form>
                    <div className="mt-4 space-y-3">
                      {answerLoading ? (
                        <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading answers</div>
                      ) : answers.length ? (
                        answers.map((answer) => <AnswerCard key={answer.id} answer={answer} onVote={vote} />)
                      ) : (
                        <div className="rounded-md bg-slate-50 p-4 text-sm text-slate-500">No answers yet. Be the first to help.</div>
                      )}
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })
        ) : (
          <div className="rounded-lg border bg-white p-10 text-center text-slate-600">No discussions match your filters.</div>
        )}
      </main>

      <aside className="space-y-4">
        <section className="rounded-lg border bg-white p-4">
          <h2 className="flex items-center gap-2 font-display text-lg font-black"><TrendingUp className="h-5 w-5 text-primary" /> Trending</h2>
          <div className="mt-3 space-y-3">
            {data?.trending.map((item) => <MiniStat key={item.id} title={item.title} meta={`${item.views} views`} />)}
          </div>
        </section>
        <section className="rounded-lg border bg-white p-4">
          <h2 className="flex items-center gap-2 font-display text-lg font-black"><Users className="h-5 w-5 text-primary" /> Most answered</h2>
          <div className="mt-3 space-y-3">
            {data?.mostAnswered.map((item) => <MiniStat key={item.id} title={item.title} meta={`${item._count.answers} answers`} />)}
          </div>
        </section>
        <Link href="/auth/login" className="block text-center text-sm font-semibold text-primary">Login to join discussions</Link>
      </aside>
    </div>
  );
}

function AnswerCard({ answer, onVote }: { answer: Answer; onVote: (answerId: string) => void }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <div className="mb-2 flex items-center justify-between gap-3 text-xs text-slate-500">
        <span>{answer.author.name ?? "Student"} - {relativeTime(answer.createdAt)}</span>
        <button onClick={() => onVote(answer.id)} className="inline-flex items-center gap-1 font-semibold text-primary">
          <ThumbsUp className="h-3.5 w-3.5" /> {answer._count.votes}
        </button>
      </div>
      <p className="text-sm text-slate-700">{answer.body}</p>
    </div>
  );
}

function Avatar({ name }: { name: string | null }) {
  return <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-sm font-black text-white">{(name ?? "S").slice(0, 1).toUpperCase()}</div>;
}

function MiniStat({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <p className="line-clamp-2 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{meta}</p>
    </div>
  );
}
