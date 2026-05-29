import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { normalizeStoredImagePath } from "@/lib/image-utils";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

const imagePathSchema = z.preprocess(
  (value) => (typeof value === "string" ? normalizeStoredImagePath(value) : value),
  z.string().url().or(z.string().regex(/^\/uploads\/colleges\/[^?#]+\.(?:avif|gif|jpe?g|png|webp)$/i))
);
const courseDurationSchema = z.coerce.string().trim().min(1);

const collegeSchema = z.object({
  name: z.string().min(2),
  location: z.string().min(2),
  state: z.string().min(2),
  city: z.string().min(2),
  type: z.string().min(2),
  stream: z.string().min(2),
  naacGrade: z.string().min(1),
  established: z.coerce.number().int().min(1800).max(2100),
  fees: z.coerce.number().int().min(0),
  rating: z.coerce.number().min(0).max(5),
  avgPackage: z.coerce.number().int().min(0),
  highPackage: z.coerce.number().int().min(0),
  topRecruiters: z.string().optional().default(""),
  about: z.string().min(10),
  image: z.string().optional().default(""),
  courses: z
    .array(
      z.object({
        name: z.string().min(2),
        duration: courseDurationSchema,
        seats: z.coerce.number().int().min(0),
        fees: z.coerce.number().int().min(0)
      })
    )
    .optional()
    .default([]),
  tourImages: z
    .array(
      z.object({
        title: z.string().min(2),
        category: z.string().min(2),
        imageUrl: imagePathSchema,
        sourceUrl: z.string().url().optional().or(z.literal(""))
      })
    )
    .optional()
    .default([])
});

function validationMessage(error: z.ZodError) {
  const issue = error.issues[0];
  const field = issue?.path.join(".");
  return field ? `Invalid college data: ${field} - ${issue.message}` : "Invalid college data";
}

function formatDuration(duration: string) {
  const value = duration.trim();
  return /^\d+$/.test(value) ? `${value} Years` : value;
}

function toCollegeData(body: z.infer<typeof collegeSchema>) {
  return {
    name: body.name,
    slug: slugify(body.name),
    location: body.location,
    state: body.state,
    city: body.city,
    type: body.type.toLowerCase(),
    stream: body.stream.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean),
    naacGrade: body.naacGrade,
    established: body.established,
    fees: body.fees,
    rating: body.rating,
    avgPackage: body.avgPackage,
    highPackage: body.highPackage,
    topRecruiters: body.topRecruiters.split(",").map((item) => item.trim()).filter(Boolean),
    about: body.about,
    image: normalizeStoredImagePath(body.image) || null,
    reviewCount: 0,
    courses: {
      create: body.courses.map((course) => ({
        name: course.name,
        duration: formatDuration(course.duration),
        seats: course.seats,
        fees: course.fees
      }))
    },
    tourImages: {
      create: body.tourImages.map((image) => ({
        title: image.title,
        category: image.category,
        imageUrl: normalizeStoredImagePath(image.imageUrl),
        sourceUrl: image.sourceUrl || null
      }))
    }
  };
}

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if ("error" in admin) return admin.error;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const where: Prisma.CollegeWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
          { state: { contains: q, mode: "insensitive" } }
        ]
      }
    : {};

  const items = await prisma.college.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
    take: 50,
    select: {
      id: true,
      name: true,
      slug: true,
      location: true,
      city: true,
      state: true,
      type: true,
      stream: true,
      naacGrade: true,
      established: true,
      fees: true,
      rating: true,
      avgPackage: true,
      highPackage: true,
      topRecruiters: true,
      about: true,
      image: true,
      courses: { orderBy: { name: "asc" } },
      tourImages: { orderBy: { createdAt: "asc" } },
      createdAt: true
    }
  });

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if ("error" in admin) return admin.error;

  const parsed = collegeSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: validationMessage(parsed.error) }, { status: 422 });

  const data = toCollegeData(parsed.data);
  const existing = await prisma.college.findUnique({ where: { slug: data.slug } });
  if (existing) return NextResponse.json({ error: "College with this name already exists" }, { status: 409 });

  const college = await prisma.college.create({ data });
  revalidatePath("/");
  revalidatePath("/colleges");
  revalidatePath(`/colleges/${college.slug}`);
  revalidatePath("/admin/dashboard");
  return NextResponse.json({ college }, { status: 201 });
}
