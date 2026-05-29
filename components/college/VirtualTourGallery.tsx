"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SafeImage } from "@/components/ui/SafeImage";
import { normalizeStoredImagePath } from "@/lib/image-utils";

type TourImage = {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  sourceUrl?: string | null;
};

export function VirtualTourGallery({ images, collegeSlug }: { images: TourImage[]; collegeSlug?: string }) {
  const [liveImages, setLiveImages] = useState(images);
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const active = liveImages[activeIndex] ?? liveImages[0];
  const categories = Array.from(new Set(liveImages.map((image) => image.category)));

  useEffect(() => {
    setLiveImages(images);
  }, [images]);

  useEffect(() => {
    if (!collegeSlug) return;

    let activeRequest = true;
    async function loadLiveImages() {
      try {
        const response = await fetch(`/api/colleges/${collegeSlug}`, { cache: "no-store" });
        if (!response.ok) return;
        const payload = await response.json();
        if (!activeRequest || !Array.isArray(payload.tourImages)) return;
        setLiveImages(payload.tourImages);
        setActiveIndex((current) => Math.min(current, Math.max(payload.tourImages.length - 1, 0)));
      } catch {
        // Keep the current gallery visible if the live refresh is temporarily unavailable.
      }
    }

    const intervalId = window.setInterval(loadLiveImages, 5000);
    return () => {
      activeRequest = false;
      window.clearInterval(intervalId);
    };
  }, [collegeSlug]);

  function showPrevious() {
    setActiveIndex((current) => (current === 0 ? liveImages.length - 1 : current - 1));
  }

  function showNext() {
    setActiveIndex((current) => (current === liveImages.length - 1 ? 0 : current + 1));
  }

  if (!liveImages.length) {
    return (
      <Card className="p-6 text-center">
        <h2 className="font-display text-2xl font-black">Virtual tour coming soon</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
          Campus images have not been added for this college yet. Admins can add public image URLs from the dashboard.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="grid bg-slate-950 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="relative aspect-[16/11] overflow-hidden bg-slate-900 sm:aspect-[16/8]">
            <SafeImage src={normalizeStoredImagePath(active.imageUrl)} alt={active.title} className="h-full w-full object-cover transition duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-slate-950/20" />
            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
              <Badge className="bg-white text-primary">{active.category}</Badge>
              <Badge className="bg-slate-950/70 text-white">Scene {activeIndex + 1} of {liveImages.length}</Badge>
            </div>
            <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-6">
              <h2 className="font-display text-2xl font-black sm:text-3xl">{active.title}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">
                Explore the admin-added campus photos as a guided virtual walkthrough.
              </p>
              {active.sourceUrl ? (
                <a href={active.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-xs font-semibold text-white/80 hover:text-white">
                  Public source
                </a>
              ) : null}
            </div>
            <div className="absolute right-3 top-3 flex gap-2">
              <Button type="button" variant="outline" className="h-10 min-h-10 bg-white/95 px-3" onClick={showPrevious} aria-label="Previous tour image">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" className="h-10 min-h-10 bg-white/95 px-3" onClick={showNext} aria-label="Next tour image">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10 min-h-10 bg-white/95 px-3"
                onClick={() => setFullscreen(true)}
              >
                <Maximize2 className="h-4 w-4" />
                <span className="hidden sm:inline">Fullscreen</span>
              </Button>
            </div>
          </div>

          <div className="border-t border-white/10 bg-slate-950 p-4 text-white lg:border-l lg:border-t-0">
            <p className="text-xs font-semibold uppercase text-white/50">Tour stops</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveIndex(liveImages.findIndex((image) => image.category === category))}
                  className={`rounded-md border px-3 py-2 text-xs font-semibold ${category === active.category ? "border-white bg-white text-primary" : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10"}`}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="mt-5 space-y-2">
              {liveImages.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`flex w-full items-center gap-3 rounded-md p-2 text-left transition ${active.id === image.id ? "bg-white text-slate-950" : "text-white/80 hover:bg-white/10 hover:text-white"}`}
                >
                  <SafeImage src={normalizeStoredImagePath(image.imageUrl)} alt="" className="h-12 w-16 rounded object-cover" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{image.title}</span>
                    <span className="block text-xs opacity-70">{image.category}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {liveImages.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`overflow-hidden rounded-lg border bg-white text-left shadow-sm transition ${active.id === image.id ? "ring-2 ring-primary" : "hover:-translate-y-0.5 hover:shadow-soft"}`}
          >
          <SafeImage src={normalizeStoredImagePath(image.imageUrl)} alt={image.title} className="h-28 w-full object-cover" />
            <div className="p-3">
              <p className="line-clamp-1 text-sm font-semibold">{image.title}</p>
              <p className="mt-1 text-xs text-slate-500">{image.category}</p>
            </div>
          </button>
        ))}
      </div>

      {fullscreen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/90 p-4">
          <button
            type="button"
            aria-label="Close fullscreen preview"
            className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white text-slate-900"
            onClick={() => setFullscreen(false)}
          >
            <X className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Previous tour image"
            className="absolute left-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white text-slate-900"
            onClick={showPrevious}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Next tour image"
            className="absolute right-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white text-slate-900"
            onClick={showNext}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="w-full max-w-6xl">
            <SafeImage src={normalizeStoredImagePath(active.imageUrl)} alt={active.title} className="max-h-[82vh] w-full rounded-lg object-contain" />
            <p className="mt-3 text-center text-sm font-semibold text-white">{active.title} - {active.category}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
