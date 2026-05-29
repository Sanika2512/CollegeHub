import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
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
    image: normalizeStoredImagePath(body.image) || null
  };
}

function toCourseCreate(body: z.infer<typeof collegeSchema>) {
  return body.courses.map((course) => ({
    name: course.name,
    duration: formatDuration(course.duration),
    seats: course.seats,
    fees: course.fees
  }));
}

function toTourImageCreate(body: z.infer<typeof collegeSchema>) {
  return body.tourImages.map((image) => ({
    title: image.title,
    category: image.category,
    imageUrl: normalizeStoredImagePath(image.imageUrl),
    sourceUrl: image.sourceUrl || null
  }));
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if ("error" in admin) return admin.error;

  const parsed = collegeSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: validationMessage(parsed.error) }, { status: 422 });

  const data = toCollegeData(parsed.data);
  const previous = await prisma.college.findUnique({ where: { id: params.id }, select: { slug: true } });
  const duplicate = await prisma.college.findFirst({ where: { slug: data.slug, NOT: { id: params.id } }, select: { id: true } });
  if (duplicate) return NextResponse.json({ error: "College with this name already exists" }, { status: 409 });

  const college = await prisma.college.update({
    where: { id: params.id },
    data: {
      ...data,
      courses: {
        deleteMany: {},
        create: toCourseCreate(parsed.data)
      },
      tourImages: {
        deleteMany: {},
        create: toTourImageCreate(parsed.data)
      }
    }
  });
  revalidatePath("/");
  revalidatePath("/colleges");
  if (previous?.slug && previous.slug !== college.slug) revalidatePath(`/colleges/${previous.slug}`);
  revalidatePath(`/colleges/${college.slug}`);
  revalidatePath("/admin/dashboard");
  return NextResponse.json({ college });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if ("error" in admin) return admin.error;

  const college = await prisma.college.findUnique({ where: { id: params.id }, select: { slug: true } });

  await prisma.$transaction([
    prisma.savedCollege.deleteMany({ where: { collegeId: params.id } }),
    prisma.review.deleteMany({ where: { collegeId: params.id } }),
    prisma.collegeTourImage.deleteMany({ where: { collegeId: params.id } }),
    prisma.cutoff.deleteMany({ where: { collegeId: params.id } }),
    prisma.course.deleteMany({ where: { collegeId: params.id } }),
    prisma.college.delete({ where: { id: params.id } })
  ]);

  revalidatePath("/");
  revalidatePath("/colleges");
  if (college) revalidatePath(`/colleges/${college.slug}`);
  revalidatePath("/admin/dashboard");
  return NextResponse.json({ ok: true });
}
