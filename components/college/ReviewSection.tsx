"use client";

import { FormEvent, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Pencil, Send, Star, ThumbsUp, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StarRating } from "@/components/ui/StarRating";

type Review = {
  id: string;
  rating: number;
  title: string;
  body: string;
  helpful: number;
  createdAt: string;
  userId: string;
  user: { name: string | null; image?: string | null };
};

export function ReviewSection({
  slug,
  initialRating,
  initialReviews
}: {
  slug: string;
  initialRating: number;
  initialReviews: Review[];
}) {
  const { data: session, status } = useSession();
  const [reviews, setReviews] = useState(initialReviews);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const average = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : initialRating;
  const breakdown = useMemo(
    () => [5, 4, 3, 2, 1].map((value) => ({ rating: value, count: reviews.filter((review) => review.rating === value).length })),
    [reviews]
  );

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status !== "authenticated" || !session?.user?.id) {
      toast.error("Login to write a review");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(editingId ? `/api/colleges/${slug}/reviews/${editingId}` : `/api/colleges/${slug}/reviews`, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, title, body })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not save review");
      const savedReview = { ...payload, createdAt: payload.createdAt ?? new Date().toISOString() };
      setReviews((current) => editingId ? current.map((review) => (review.id === editingId ? savedReview : review)) : [savedReview, ...current]);
      setTitle("");
      setBody("");
      setRating(5);
      setEditingId(null);
      toast.success(editingId ? "Review updated" : "Review published");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save review");
    } finally {
      setSubmitting(false);
    }
  }

  function startEditing(review: Review) {
    setEditingId(review.id);
    setRating(review.rating);
    setTitle(review.title);
    setBody(review.body);
    window.requestAnimationFrame(() => document.getElementById("review-form")?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }

  function cancelEditing() {
    setEditingId(null);
    setRating(5);
    setTitle("");
    setBody("");
  }

  async function deleteReview(review: Review) {
    const confirmed = window.confirm(`Delete your review "${review.title}"?`);
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/colleges/${slug}/reviews/${review.id}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not delete review");
      setReviews((current) => current.filter((item) => item.id !== review.id));
      if (editingId === review.id) cancelEditing();
      toast.success("Review deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete review");
    }
  }

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <div>
            <p className="text-sm font-semibold uppercase text-primary">Student reviews</p>
            <div className="mt-3 flex items-end gap-2">
              <p className="font-display text-5xl font-black">{average.toFixed(1)}</p>
              <p className="pb-2 text-sm text-slate-500">/ 5</p>
            </div>
            <div className="mt-3"><StarRating value={average} count={reviews.length} /></div>
          </div>
          <div className="space-y-2">
            {breakdown.map((row) => (
              <div key={row.rating} className="grid grid-cols-[52px_1fr_28px] items-center gap-3 text-sm">
                <span className="font-semibold">{row.rating} star</span>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-accent" style={{ width: `${reviews.length ? (row.count / reviews.length) * 100 : 0}%` }} />
                </div>
                <span className="text-right text-slate-500">{row.count}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card id="review-form" className="p-5">
        <h2 className="font-display text-2xl font-black">Write a review</h2>
        {status === "authenticated" ? (
          <form onSubmit={submitReview} className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className={`inline-flex h-11 items-center gap-1 rounded-md border px-3 text-sm font-semibold ${value <= rating ? "bg-amber-50 text-amber-700" : "bg-white text-slate-500"}`}
                >
                  <Star className={value <= rating ? "h-4 w-4 fill-accent text-accent" : "h-4 w-4"} />
                  {value}
                </button>
              ))}
            </div>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Review title"
              className="min-h-11 w-full rounded-md border bg-white px-3 text-sm outline-none ring-primary/20 transition placeholder:text-slate-400 focus:ring-4"
              required
            />
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Share useful details about academics, placements, campus life, faculty, or facilities"
              className="min-h-28 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none ring-primary/20 transition placeholder:text-slate-400 focus:ring-4"
              required
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" disabled={submitting}>
                <Send className="h-4 w-4" />
                {submitting ? "Saving..." : editingId ? "Update review" : "Publish review"}
              </Button>
              {editingId ? (
                <Button type="button" variant="outline" onClick={cancelEditing}>
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        ) : (
          <div className="mt-4 rounded-md border bg-slate-50 p-4">
            <p className="text-sm text-slate-600">Login is required before adding a review.</p>
            <a href={`/auth/login?callbackUrl=/colleges/${slug}`} className="mt-3 inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-blue-800">
              Login to review
            </a>
          </div>
        )}
      </Card>

      {reviews.map((review) => (
        <Card key={review.id} className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="font-display text-xl font-black">{review.title}</h3>
              <p className="mt-1 text-sm text-slate-500">
                By {review.user.name ?? "Student"} - {new Date(review.createdAt).toLocaleDateString("en-IN")}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
              <StarRating value={review.rating} />
              {session?.user?.id === review.userId ? (
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="h-9 min-h-9 px-3" onClick={() => startEditing(review)}>
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button type="button" variant="danger" className="h-9 min-h-9 px-3" onClick={() => deleteReview(review)}>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
          <p className="mt-3 leading-7 text-slate-700">{review.body}</p>
          <button type="button" className="mt-4 inline-flex items-center gap-1 rounded-md bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
            <ThumbsUp className="h-4 w-4" /> {review.helpful} helpful votes
          </button>
        </Card>
      ))}
    </div>
  );
}
