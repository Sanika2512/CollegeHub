import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const branchAliases: Record<string, string[]> = {
  cse: ["Computer Science", "CSE", "Computer"],
  cs: ["Computer Science", "CSE", "Computer"],
  ai: ["Artificial Intelligence", "AI", "Computer Science", "CSE"],
  aids: ["Artificial Intelligence", "Data Science", "Computer Science"],
  ds: ["Data Science", "Artificial Intelligence", "Computer Science"],
  it: ["Information Technology", "Computer Science", "IT"],
  ece: ["Electronics", "Electronics and Communication", "ECE"],
  entc: ["Electronics", "Electronics and Telecommunication", "ENTC"],
  electrical: ["Electrical", "Electronics"],
  ee: ["Electrical", "Electronics"],
  mech: ["Mechanical", "Mechanical Engineering"],
  civil: ["Civil", "Civil Engineering"],
  mba: ["Management", "MBA"],
  management: ["Management", "MBA"],
  bcom: ["Commerce", "B.Com"],
  commerce: ["Commerce", "B.Com"],
  science: ["Science"],
  arts: ["Arts"]
};

function chanceFor(userRank: number, cutoffRank: number) {
  if (userRank <= cutoffRank * 0.9) return "Safe";
  if (userRank <= cutoffRank * 1.12) return "Moderate";
  return "Dream";
}

function confidenceFor(userRank: number, cutoffRank: number) {
  const chance = chanceFor(userRank, cutoffRank);
  const ratio = userRank / cutoffRank;
  if (chance === "Safe") return Math.max(72, Math.min(98, Math.round(108 - ratio * 35)));
  if (chance === "Moderate") return Math.max(48, Math.min(71, Math.round(128 - ratio * 65)));
  return Math.max(15, Math.min(47, Math.round(78 - ratio * 28)));
}

function adviceFor(userRank: number, cutoffRank: number) {
  const gap = cutoffRank - userRank;
  if (gap >= 0) return `You have a ${gap.toLocaleString("en-IN")} rank buffer against this cutoff.`;
  return `You are ${Math.abs(gap).toLocaleString("en-IN")} ranks beyond this cutoff, so keep it as an aspirational option.`;
}

function branchFilter(value?: string): Prisma.CutoffWhereInput {
  if (!value) return {};
  const normalized = value.trim().toLowerCase();
  const aliases = branchAliases[normalized] ?? [value];
  return {
    OR: aliases.map((alias) => ({ branch: { contains: alias, mode: "insensitive" as const } }))
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const exam = searchParams.get("exam")?.trim();
  const rank = Number(searchParams.get("rank"));
  const category = searchParams.get("category")?.trim();
  const state = searchParams.get("state")?.trim();
  const branch = searchParams.get("branch")?.trim();
  const q = searchParams.get("q")?.trim();
  const type = searchParams.get("type")?.trim();
  const maxFee = Number(searchParams.get("maxFee") || 0);
  const chance = searchParams.get("chance")?.trim();

  if (!exam || !Number.isFinite(rank) || rank <= 0) {
    return NextResponse.json({ error: "Exam and valid rank are required" }, { status: 400 });
  }

  const collegeWhere: Prisma.CollegeWhereInput = {
    ...(type ? { type } : {}),
    ...(maxFee ? { fees: { lte: maxFee } } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { city: { contains: q, mode: "insensitive" } },
            { state: { contains: q, mode: "insensitive" } }
          ]
        }
      : {})
  };

  const baseWhere: Prisma.CutoffWhereInput = {
    exam,
    ...(category ? { category } : {}),
    ...(state ? { state: { contains: state, mode: "insensitive" } } : {}),
    ...branchFilter(branch),
    college: collegeWhere
  };

  let relaxedBranch = false;
  let relaxedCategory = false;
  let relaxedState = false;
  let cutoffs = await prisma.cutoff.findMany({
    where: baseWhere,
    include: { college: true },
    orderBy: [{ rank: "asc" }],
    take: 80
  });

  if (!cutoffs.length && branch) {
    relaxedBranch = true;
    cutoffs = await prisma.cutoff.findMany({
      where: { ...baseWhere, OR: undefined },
      include: { college: true },
      orderBy: [{ rank: "asc" }],
      take: 80
    });
  }

  if (!cutoffs.length && category) {
    relaxedCategory = true;
    cutoffs = await prisma.cutoff.findMany({
      where: { ...baseWhere, category: undefined, OR: branch ? baseWhere.OR : undefined },
      include: { college: true },
      orderBy: [{ rank: "asc" }],
      take: 80
    });
  }

  if (!cutoffs.length && state) {
    relaxedState = true;
    cutoffs = await prisma.cutoff.findMany({
      where: { ...baseWhere, state: undefined, category: relaxedCategory ? undefined : baseWhere.category, OR: relaxedBranch ? undefined : baseWhere.OR },
      include: { college: true },
      orderBy: [{ rank: "asc" }],
      take: 80
    });
  }

  const ranked = cutoffs
    .map((cutoff) => {
      const predictedChance = chanceFor(rank, cutoff.rank);
      return {
        id: cutoff.id,
        exam: cutoff.exam,
        cutoffRank: cutoff.rank,
        rankGap: cutoff.rank - rank,
        category: cutoff.category,
        branch: cutoff.branch,
        year: cutoff.year,
        chance: predictedChance,
        confidence: confidenceFor(rank, cutoff.rank),
        advice: adviceFor(rank, cutoff.rank),
        matchNotes: [
          relaxedBranch ? "nearest branch" : "branch match",
          relaxedCategory ? "all categories" : "category match",
          relaxedState ? "all states" : state ? "state match" : "national options"
        ],
        college: {
          id: cutoff.college.id,
          name: cutoff.college.name,
          slug: cutoff.college.slug,
          location: cutoff.college.location,
          fees: cutoff.college.fees,
          rating: cutoff.college.rating,
          type: cutoff.college.type,
          avgPackage: cutoff.college.avgPackage,
          highPackage: cutoff.college.highPackage,
          image: cutoff.college.image
        }
      };
    })
    .filter((item) => !chance || item.chance === chance)
    .sort((a, b) => {
      const score = { Safe: 0, Moderate: 1, Dream: 2 };
      return (
        score[a.chance as keyof typeof score] - score[b.chance as keyof typeof score] ||
        b.confidence - a.confidence ||
        Math.abs(a.rankGap) - Math.abs(b.rankGap) ||
        b.college.rating - a.college.rating
      );
    })
    .slice(0, 40);

  return NextResponse.json({
    items: ranked,
    relaxedBranch,
    relaxedCategory,
    relaxedState,
    summary: {
      total: ranked.length,
      safe: ranked.filter((item) => item.chance === "Safe").length,
      moderate: ranked.filter((item) => item.chance === "Moderate").length,
      dream: ranked.filter((item) => item.chance === "Dream").length
    }
  });
}
