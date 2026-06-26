"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Activity, BarChart3, Building2, CheckCircle2, ImagePlus, Pencil, Plus, RefreshCw, Save, Search, Trash2, UserX, Users, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { SafeImage } from "@/components/ui/SafeImage";
import { normalizeImageSrc, normalizeStoredImagePath } from "@/lib/image-utils";
import { formatFees, formatPackage } from "@/lib/utils";
import { useCountUp, useChangedKeys } from "@/hooks/useAnimationHooks";
import "@/styles/admin-motion.css";

type Overview = {
  generatedAt: string;
  stats: Record<"colleges" | "users" | "reviews" | "questions" | "answers" | "saved" | "comparisons", number>;
  recentUsers: Array<{ id: string; name: string | null; email: string; isAdmin: boolean; createdAt: string }>;
  recentColleges: Array<{ id: string; name: string; city: string; state: string; rating: number; image: string | null; createdAt: string }>;
  pendingReviews: Array<{
    id: string;
    rating: number;
    title: string;
    createdAt: string;
    college: { name: string };
    user: { name: string | null; email: string };
  }>;
};

type College = {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  location?: string;
  type: string;
  stream: string[];
  naacGrade: string;
  established: number;
  fees: number;
  rating: number;
  avgPackage: number;
  highPackage: number;
  topRecruiters: string[];
  about: string;
  image: string | null;
  courses: CourseForm[];
  tourImages: TourImageForm[];
};

type CourseForm = {
  name: string;
  duration: string;
  seats: string | number;
  fees: string | number;
};

type TourImageForm = {
  title: string;
  category: string;
  imageUrl: string;
  sourceUrl?: string | null;
};

type CollegeForm = {
  name: string;
  location: string;
  state: string;
  city: string;
  type: string;
  stream: string;
  naacGrade: string;
  established: string;
  fees: string;
  rating: string;
  avgPackage: string;
  highPackage: string;
  topRecruiters: string;
  about: string;
  image: string;
  courses: CourseForm[];
  tourImages: TourImageForm[];
};

const blankCourse: CourseForm = { name: "", duration: "", seats: "", fees: "" };
const blankTourImage: TourImageForm = { title: "", category: "Campus view", imageUrl: "", sourceUrl: "" };

const emptyForm: CollegeForm = {
  name: "",
  location: "",
  state: "",
  city: "",
  type: "",
  stream: "",
  naacGrade: "",
  established: "",
  fees: "",
  rating: "",
  avgPackage: "",
  highPackage: "",
  topRecruiters: "",
  about: "",
  image: "",
  courses: [{ ...blankCourse }],
  tourImages: []
};

function collegeToForm(college: College): CollegeForm {
  return {
    name: college.name,
    location: college.location ?? `${college.city}, ${college.state}`,
    state: college.state,
    city: college.city,
    type: college.type,
    stream: college.stream.join(", "),
    naacGrade: college.naacGrade,
    established: String(college.established),
    fees: String(college.fees),
    rating: String(college.rating),
    avgPackage: String(college.avgPackage),
    highPackage: String(college.highPackage),
    topRecruiters: college.topRecruiters.join(", "),
    about: college.about,
    image: normalizeStoredImagePath(college.image) || "",
    courses: college.courses.length ? college.courses.map((course) => ({
      name: course.name,
      duration: course.duration,
      seats: String(course.seats),
      fees: String(course.fees)
    })) : [{ ...blankCourse }],
    tourImages: college.tourImages.map((image) => ({
      title: image.title,
      category: image.category,
      imageUrl: normalizeStoredImagePath(image.imageUrl),
      sourceUrl: image.sourceUrl ?? ""
    }))
  };
}

export function AdminDashboardClient({ adminName, adminUserId }: { adminName: string; adminUserId: string }) {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [colleges, setColleges] = useState<College[]>([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<CollegeForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshSpinning, setRefreshSpinning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profilePreviewSrc, setProfilePreviewSrc] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formCardRef = useRef<HTMLDivElement>(null);
  const profilePreviewObjectUrlRef = useRef<string | null>(null);

  const loadOverview = useCallback(async (showToast = false) => {
    const response = await fetch("/api/admin/overview", { cache: "no-store" });
    if (!response.ok) throw new Error("Unable to load admin overview");
    setOverview(await response.json());
    if (showToast) toast.success("Dashboard refreshed");
  }, []);

  const loadColleges = useCallback(async (search: string) => {
    const response = await fetch(`/api/admin/colleges?q=${encodeURIComponent(search)}`, { cache: "no-store" });
    if (!response.ok) throw new Error("Unable to load colleges");
    const data = await response.json();
    setColleges(data.items);
  }, []);

  // Manual refresh gets its own spin flag, decoupled from `loading`,
  // so the icon spins for a perceptible minimum beat instead of a
  // flash that's invisible on fast connections.
  const loadAll = useCallback(async (showToast = false) => {
    setLoading(true);
    if (showToast) setRefreshSpinning(true);
    const spinStartedAt = performance.now();
    try {
      await Promise.all([loadOverview(showToast), loadColleges(query)]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Admin dashboard failed to load");
    } finally {
      setLoading(false);
      if (showToast) {
        const elapsed = performance.now() - spinStartedAt;
        const remaining = Math.max(450 - elapsed, 0);
        window.setTimeout(() => setRefreshSpinning(false), remaining);
      }
    }
  }, [loadColleges, loadOverview, query]);

  useEffect(() => {
    loadAll();
    const intervalId = window.setInterval(() => {
      loadOverview().catch(() => undefined);
      loadColleges(query).catch(() => undefined);
    }, 5000);
    return () => window.clearInterval(intervalId);
  }, [loadAll, loadColleges, loadOverview, query]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadColleges(query).catch(() => toast.error("Search failed"));
    }, 300);
    return () => window.clearTimeout(timeoutId);
  }, [loadColleges, query]);

  useEffect(() => {
    return () => clearProfilePreviewObjectUrl();
  }, []);

  const statCards = useMemo(
    () => [
      { label: "Colleges", value: overview?.stats.colleges ?? 0, icon: Building2 },
      { label: "Users", value: overview?.stats.users ?? 0, icon: Users },
      { label: "Reviews", value: overview?.stats.reviews ?? 0, icon: CheckCircle2 },
      { label: "Q&A Activity", value: (overview?.stats.questions ?? 0) + (overview?.stats.answers ?? 0), icon: Activity },
      { label: "Saved Colleges", value: overview?.stats.saved ?? 0, icon: Save },
      { label: "Comparisons", value: overview?.stats.comparisons ?? 0, icon: BarChart3 }
    ],
    [overview]
  );

  // Rows whose visible fields changed since the last poll get a brief
  // background flash instead of a silent, invisible update.
  const changedCollegeIds = useChangedKeys(
    colleges,
    useCallback((c: College) => `${c.fees}|${c.rating}|${c.avgPackage}|${c.highPackage}|${c.name}`, [])
  );

  function setField(field: keyof CollegeForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function clearProfilePreviewObjectUrl() {
    if (profilePreviewObjectUrlRef.current) {
      URL.revokeObjectURL(profilePreviewObjectUrlRef.current);
      profilePreviewObjectUrlRef.current = null;
    }
  }

  function setProfileImageField(value: string) {
    clearProfilePreviewObjectUrl();
    setField("image", value);
    setProfilePreviewSrc(value);
  }

  function handleProfileFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    clearProfilePreviewObjectUrl();
    if (!file) {
      setProfilePreviewSrc(form.image);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    profilePreviewObjectUrlRef.current = objectUrl;
    setProfilePreviewSrc(objectUrl);
  }

  function setCourseField(index: number, field: keyof CourseForm, value: string) {
    setForm((current) => ({
      ...current,
      courses: current.courses.map((course, courseIndex) => (courseIndex === index ? { ...course, [field]: value } : course))
    }));
  }

  function addCourse() {
    setForm((current) => ({ ...current, courses: [...current.courses, { ...blankCourse }] }));
  }

  function removeCourse(index: number) {
    setForm((current) => ({
      ...current,
      courses: current.courses.length === 1 ? [{ ...blankCourse }] : current.courses.filter((_, courseIndex) => courseIndex !== index)
    }));
  }

  function setTourImageField(index: number, field: keyof TourImageForm, value: string) {
    setForm((current) => ({
      ...current,
      tourImages: current.tourImages.map((image, imageIndex) => (imageIndex === index ? { ...image, [field]: value } : image))
    }));
  }

  function addTourImage() {
    setForm((current) => ({ ...current, tourImages: [...current.tourImages, { ...blankTourImage }] }));
  }

  function removeTourImage(index: number) {
    setForm((current) => ({ ...current, tourImages: current.tourImages.filter((_, imageIndex) => imageIndex !== index) }));
  }

  function autoFillTourImages() {
    const suggestions = [
      ["Campus view", "Campus"],
      ["Library and study spaces", "Library"],
      ["Classrooms and labs", "Labs"],
      ["Hostel and student life", "Hostel"],
      ["Sports facilities", "Sports"]
    ];
    setForm((current) => ({
      ...current,
      tourImages: suggestions.map(([title, category]) => ({
        title,
        category,
        imageUrl: "",
        sourceUrl: ""
      }))
    }));
    toast.success("Blank tour slots added. Upload images for this college before saving.");
  }

  function resetCollegeForm() {
    clearProfilePreviewObjectUrl();
    setProfilePreviewSrc("");
    setForm({ ...emptyForm });
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function showAddCollegeForm() {
    resetCollegeForm();
    formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function showUpdateCollegeForm(college: College) {
    clearProfilePreviewObjectUrl();
    setEditingId(college.id);
    const nextForm = collegeToForm(college);
    setForm(nextForm);
    setProfilePreviewSrc(nextForm.image);
    if (fileInputRef.current) fileInputRef.current.value = "";
    formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function uploadImageIfSelected() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return form.image;

    const uploadBody = new FormData();
    uploadBody.append("imageFile", file);
    const response = await fetch("/api/admin/college-image", {
      method: "POST",
      body: uploadBody
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Unable to upload image");
    clearProfilePreviewObjectUrl();
    setProfilePreviewSrc(data.image as string);
    return data.image as string;
  }

  async function uploadTourImage(index: number, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const uploadBody = new FormData();
      uploadBody.append("imageFile", file);
      const response = await fetch("/api/admin/college-image", {
        method: "POST",
        body: uploadBody
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to upload tour image");
      setTourImageField(index, "imageUrl", data.image as string);
      toast.success("Tour image uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to upload tour image");
    } finally {
      event.target.value = "";
    }
  }

  async function submitCollege(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const image = await uploadImageIfSelected();
      const courses = form.courses
        .map((course) => ({
          name: String(course.name).trim(),
          duration: String(course.duration).trim(),
          seats: Number(course.seats),
          fees: Number(course.fees)
        }))
        .filter((course) => course.name && course.duration && Number.isFinite(course.seats) && Number.isFinite(course.fees));
      if (!courses.length) throw new Error("Add at least one course with name, duration, seats, and annual fees.");
      const tourImages = form.tourImages
        .map((tourImage) => ({
          title: tourImage.title.trim(),
          category: tourImage.category.trim(),
          imageUrl: normalizeStoredImagePath(tourImage.imageUrl),
          sourceUrl: tourImage.sourceUrl?.trim() ?? ""
        }))
        .filter((tourImage) => tourImage.title && tourImage.category && tourImage.imageUrl);
      const response = await fetch(editingId ? `/api/admin/colleges/${editingId}` : "/api/admin/colleges", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, image, courses, tourImages })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to save college");
      toast.success(editingId ? "College updated" : "College created");
      resetCollegeForm();
      await Promise.all([loadOverview(), loadColleges(query)]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save college");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCollege(college: College) {
    const confirmed = window.confirm(`Delete ${college.name}? This removes its courses, cutoffs, reviews, and saved links.`);
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/colleges/${college.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to delete college");
      toast.success("College deleted");
      if (editingId === college.id) {
        resetCollegeForm();
      }
      await Promise.all([loadOverview(), loadColleges(query)]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete college");
    }
  }

  async function deleteUser(user: { id: string; title: string; detail: string; isAdmin?: boolean }) {
    if (user.id === adminUserId || user.isAdmin) {
      toast.error("Admin account cannot be deleted from here");
      return;
    }

    const confirmed = window.confirm(`Delete ${user.title}? This removes their saved colleges, reviews, questions, answers, votes, and notifications.`);
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      const contentType = response.headers.get("content-type") ?? "";
      const data = contentType.includes("application/json") ? await response.json() : null;
      if (!response.ok) throw new Error(data?.error ?? "Unable to delete user");
      toast.success("User deleted");
      await loadOverview();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete user");
    }
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase text-primary">Admin</p>
          <h1 className="font-display text-3xl font-black sm:text-4xl">Admin dashboard</h1>
          <p className="mt-2 max-w-2xl text-slate-600">Signed in as {adminName}. Live counts refresh every 5 seconds from the database.</p>
        </div>
        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => loadAll(true)} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${refreshSpinning ? "admin-spin-active" : ""}`} />
          Refresh
        </Button>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {statCards.map((item, index) => (
          <StatCard key={item.label} label={item.label} value={item.value} icon={item.icon} index={index} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="overflow-hidden">
          <div className="border-b p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 className="font-display text-xl font-black sm:text-2xl">College management</h2>
                <p className="text-sm text-slate-600">Create, edit, search, and delete live college records.</p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <Button type="button" className="w-full sm:w-auto" onClick={showAddCollegeForm}>
                  <Plus className="h-4 w-4" />
                  Add college
                </Button>
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Realtime college search" className="pl-10 pr-10" />
                  {query ? (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      aria-label="Clear search"
                      className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs font-semibold text-slate-500">
              {loading ? "Syncing records..." : `${colleges.length.toLocaleString("en-IN")} matching college${colleges.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <div className="grid gap-3 p-4 md:hidden">
            {colleges.map((college, index) => (
              <div
                key={college.id}
                className={`admin-rise-in rounded-lg border bg-white p-3 ${changedCollegeIds.has(college.id) ? "admin-row-flash" : ""}`}
                style={{ "--i": index } as React.CSSProperties}
              >
                <div className="flex gap-3">
                  <SafeImage
                    src={college.image}
                    alt={college.name}
                    className="h-20 w-24 shrink-0 rounded-md border object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 font-semibold">{college.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{college.city}, {college.state}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatFees(college.fees)} / {formatPackage(college.avgPackage)}</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button type="button" variant="outline" className="admin-icon-btn h-10 px-3" onClick={() => showUpdateCollegeForm(college)}>
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button type="button" variant="danger" className="admin-icon-btn h-10 px-3" onClick={() => deleteCollege(college)}>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
            {!colleges.length ? (
              <div className="rounded-lg border p-8 text-center text-sm text-slate-500">
                {loading ? "Loading colleges..." : "No colleges found."}
              </div>
            ) : null}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Image</th>
                  <th className="px-5 py-3">College</th>
                  <th className="px-5 py-3">Location</th>
                  <th className="px-5 py-3">Fees</th>
                  <th className="px-5 py-3">Package</th>
                  <th className="px-5 py-3">Rating</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {colleges.map((college, index) => (
                  <tr
                    key={college.id}
                    className={`admin-rise-in admin-card-hover ${changedCollegeIds.has(college.id) ? "admin-row-flash" : ""}`}
                    style={{ "--i": index } as React.CSSProperties}
                  >
                    <td className="px-5 py-4">
                      <SafeImage
                        src={college.image}
                        alt={college.name}
                        className="h-14 w-20 rounded-md border object-cover"
                      />
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold">{college.name}</p>
                      <p className="text-xs text-slate-500">{college.type} • {college.stream.join(", ")}</p>
                    </td>
                    <td className="px-5 py-4">{college.city}, {college.state}</td>
                    <td className="px-5 py-4">{formatFees(college.fees)}</td>
                    <td className="px-5 py-4">{formatPackage(college.avgPackage)}</td>
                    <td className="px-5 py-4">{college.rating.toFixed(1)}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" className="admin-icon-btn h-9 px-3" onClick={() => showUpdateCollegeForm(college)} title={`Update ${college.name}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="danger" className="admin-icon-btn h-9 px-3" onClick={() => deleteCollege(college)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!colleges.length ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                      {loading ? "Loading colleges..." : "No colleges found."}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>

        <Card ref={formCardRef} className="p-4 sm:p-5 xl:sticky xl:top-24 xl:self-start">
          <div key={editingId ?? "add"} className="admin-panel-switch flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-primary">{editingId ? "Update mode" : "Add mode"}</p>
              <h2 className="font-display text-xl font-black sm:text-2xl">{editingId ? "Update selected college" : "Add new college"}</h2>
              <p className="mt-1 text-xs text-slate-500">
                {editingId ? "Editing the selected row. Courses and tour images saved here render on the college page." : "Use the same complete fields as update. New courses and tour images render on the frontend after saving."}
              </p>
            </div>
            {editingId ? (
              <Button type="button" variant="outline" className="admin-icon-btn shrink-0" onClick={showAddCollegeForm}>
                <Plus className="h-4 w-4" />
                New
              </Button>
            ) : null}
          </div>
          <form className="mt-4 space-y-3" onSubmit={submitCollege}>
            <Input value={form.name} onChange={(event) => setField("name", event.target.value)} placeholder="College name" required />
            <Input value={form.location} onChange={(event) => setField("location", event.target.value)} placeholder="Full location" required />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input value={form.city} onChange={(event) => setField("city", event.target.value)} placeholder="City" required />
              <Input value={form.state} onChange={(event) => setField("state", event.target.value)} placeholder="State" required />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input value={form.type} onChange={(event) => setField("type", event.target.value)} placeholder="Type" required />
              <Input value={form.naacGrade} onChange={(event) => setField("naacGrade", event.target.value)} placeholder="NAAC" required />
            </div>
            <Input value={form.stream} onChange={(event) => setField("stream", event.target.value)} placeholder="Streams, comma separated" required />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input value={form.established} onChange={(event) => setField("established", event.target.value)} placeholder="Established" type="number" required />
              <Input value={form.rating} onChange={(event) => setField("rating", event.target.value)} placeholder="Rating" type="number" step="0.1" required />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Input value={form.fees} onChange={(event) => setField("fees", event.target.value)} placeholder="Fees" type="number" required />
              <Input value={form.avgPackage} onChange={(event) => setField("avgPackage", event.target.value)} placeholder="Avg LPA" type="number" required />
              <Input value={form.highPackage} onChange={(event) => setField("highPackage", event.target.value)} placeholder="High LPA" type="number" required />
            </div>
            <Input value={form.topRecruiters} onChange={(event) => setField("topRecruiters", event.target.value)} placeholder="Recruiters, comma separated" />
            <div className="rounded-lg border bg-slate-50 p-3">
              <h3 className="font-semibold">College profile image</h3>
              <p className="text-xs text-slate-500">Upload a unique image for this college or paste an image URL. Empty means the frontend uses fallback only while rendering.</p>
              <div className="mt-3 grid gap-3">
                {profilePreviewSrc || form.image ? (
                  <SafeImage src={profilePreviewSrc || form.image} alt={`${form.name || "College"} profile preview`} className="admin-block-enter h-36 w-full rounded-md border bg-white object-cover" />
                ) : null}
                <Input value={form.image} onChange={(event) => setProfileImageField(event.target.value)} placeholder="https://... or /uploads/colleges/photo.jpg" />
                <Input ref={fileInputRef} type="file" accept="image/*" onChange={handleProfileFileChange} />
              </div>
            </div>
            <textarea
              value={form.about}
              onChange={(event) => setField("about", event.target.value)}
              placeholder="About college"
              required
              className="min-h-24 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none ring-primary/20 transition placeholder:text-slate-400 focus:ring-4"
            />
            <div className="rounded-lg border bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold">Courses</h3>
                  <p className="text-xs text-slate-500">Course name, duration, total seats, and annual fees appear in the Courses tab.</p>
                </div>
                <Button type="button" variant="outline" className="admin-icon-btn h-10 px-3" onClick={addCourse}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-3 space-y-3">
                {form.courses.map((course, index) => (
                  <div key={index} className="admin-block-enter rounded-md border bg-white p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold">Course {index + 1}</p>
                      <button type="button" className="text-sm font-semibold text-red-600 transition hover:text-red-700" onClick={() => removeCourse(index)}>Remove</button>
                    </div>
                    <div className="grid gap-2">
                      <Input value={course.name} onChange={(event) => setCourseField(index, "name", event.target.value)} placeholder="B.Tech Computer Science" required />
                      <div className="grid gap-2 sm:grid-cols-3">
                        <Input value={course.duration} onChange={(event) => setCourseField(index, "duration", event.target.value)} placeholder="4 Years" required />
                        <Input value={course.seats} onChange={(event) => setCourseField(index, "seats", event.target.value)} placeholder="120 Seats" type="number" required />
                        <Input value={course.fees} onChange={(event) => setCourseField(index, "fees", event.target.value)} placeholder="Annual fees" type="number" required />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border bg-slate-50 p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold">Virtual tour images</h3>
                  <p className="text-xs text-slate-500">Upload campus photos from this machine or paste public URLs for the Virtual Tour tab.</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button type="button" variant="outline" className="admin-icon-btn h-10 px-3" onClick={autoFillTourImages}>
                    <ImagePlus className="h-4 w-4" />
                    Auto-fill
                  </Button>
                  <Button type="button" variant="outline" className="admin-icon-btn h-10 px-3" onClick={addTourImage}>
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
              </div>
              <div className="mt-3 space-y-3">
                {form.tourImages.map((tourImage, index) => (
                  <div key={index} className="admin-block-enter rounded-md border bg-white p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold">Tour image {index + 1}</p>
                      <button type="button" className="text-sm font-semibold text-red-600 transition hover:text-red-700" onClick={() => removeTourImage(index)}>Remove</button>
                    </div>
                    <div className="grid gap-2">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Input value={tourImage.title} onChange={(event) => setTourImageField(index, "title", event.target.value)} placeholder="Library and study spaces" />
                        <Input value={tourImage.category} onChange={(event) => setTourImageField(index, "category", event.target.value)} placeholder="Library" />
                      </div>
                      {tourImage.imageUrl ? (
                        <SafeImage src={normalizeImageSrc(tourImage.imageUrl)} alt={tourImage.title || `Tour image ${index + 1}`} className="admin-block-enter h-32 w-full rounded-md border object-cover" />
                      ) : null}
                      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                        <Input value={tourImage.imageUrl} onChange={(event) => setTourImageField(index, "imageUrl", event.target.value)} placeholder="https://... or /uploads/colleges/photo.jpg" />
                        <label className="admin-icon-btn inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50">
                          <ImagePlus className="h-4 w-4" />
                          Upload
                          <input type="file" accept="image/*" className="sr-only" onChange={(event) => uploadTourImage(index, event)} />
                        </label>
                      </div>
                      <Input value={tourImage.sourceUrl ?? ""} onChange={(event) => setTourImageField(index, "sourceUrl", event.target.value)} placeholder="Source URL (optional)" type="url" />
                    </div>
                  </div>
                ))}
                {!form.tourImages.length ? <p className="text-sm text-slate-500">No tour images yet.</p> : null}
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" disabled={saving} className="flex-1 transition active:scale-[0.98]">
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : editingId ? "Update college" : "Create college"}
              </Button>
              {editingId ? (
                <Button type="button" variant="outline" onClick={resetCollegeForm}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <ActivityList
          title="Recent users"
          items={overview?.recentUsers.map((user) => ({ id: user.id, title: user.name ?? user.email, detail: user.email, isAdmin: user.isAdmin })) ?? []}
          onDelete={deleteUser}
        />
        <ActivityList title="Recent colleges" items={overview?.recentColleges.map((college) => ({ id: college.id, title: college.name, detail: `${college.city}, ${college.state}`, image: college.image })) ?? []} />
        <ActivityList title="Latest reviews" items={overview?.pendingReviews.map((review) => ({ id: review.id, title: review.title, detail: `${review.college.name} • ${review.rating}/5` })) ?? []} />
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  index
}: {
  label: string;
  value: number;
  icon: typeof Building2;
  index: number;
}) {
  const animatedValue = useCountUp(value);
  return (
    <Card className="admin-rise-in admin-card-hover p-4" style={{ "--i": index } as React.CSSProperties}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-600">{label}</p>
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <p className="mt-3 font-display text-3xl font-black tabular-nums">{animatedValue.toLocaleString("en-IN")}</p>
    </Card>
  );
}

function ActivityList({
  title,
  items,
  onDelete
}: {
  title: string;
  items: Array<{ id: string; title: string; detail: string; image?: string | null; isAdmin?: boolean }>;
  onDelete?: (item: { id: string; title: string; detail: string; isAdmin?: boolean }) => void;
}) {
  return (
    <Card className="p-5">
      <h2 className="font-display text-xl font-black">{title}</h2>
      <div className="mt-4 space-y-3">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="admin-rise-in admin-card-hover flex items-center gap-3 rounded-md border p-3"
            style={{ "--i": index } as React.CSSProperties}
          >
            {item.image !== undefined ? (
              <SafeImage src={item.image} alt={item.title} className="h-12 w-16 rounded-md object-cover" />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="mt-1 truncate text-xs text-slate-500">{item.detail}</p>
            </div>
            {onDelete ? (
              <Button
                type="button"
                variant="danger"
                className="admin-icon-btn h-9 px-3"
                disabled={item.isAdmin}
                onClick={() => onDelete(item)}
              >
                <UserX className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        ))}
        {!items.length ? <p className="text-sm text-slate-500">No records yet.</p> : null}
      </div>
    </Card>
  );
}
