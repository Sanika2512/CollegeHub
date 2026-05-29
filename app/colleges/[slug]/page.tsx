import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageLayout } from "@/components/layout/PageLayout";
import { CollegeHero } from "@/components/college/CollegeHero";
import { SaveButton } from "@/components/college/SaveButton";
import { CompareButton } from "@/components/college/CompareButton";
import { ReviewSection } from "@/components/college/ReviewSection";
import { VirtualTourGallery } from "@/components/college/VirtualTourGallery";
import { Tabs } from "@/components/ui/Tabs";
import { Card } from "@/components/ui/Card";
import { formatFees, formatPackage } from "@/lib/utils";
import { TrackRecentlyViewed } from "@/components/college/RecentlyViewed";

export const dynamic = "force-dynamic";

export default async function CollegeDetailPage({ params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  const college = await prisma.college.findUnique({
    where: { slug: params.slug },
    include: {
      courses: true,
      tourImages: { orderBy: { createdAt: "asc" } },
      reviews: { include: { user: { select: { name: true, image: true } } }, orderBy: { createdAt: "desc" } },
      savedBy: { where: { userId: session?.user?.id ?? "__anonymous__" } }
    }
  });
  if (!college) notFound();

  return (
    <PageLayout>
      <TrackRecentlyViewed item={{ name: college.name, slug: college.slug }} />
      <CollegeHero college={college} />
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <Tabs
          tabs={[
            { label: "Overview", content: <Overview college={college} /> },
            { label: "Courses", content: <Courses courses={college.courses} /> },
            { label: "Placements", content: <Placements college={college} /> },
            { label: "Virtual Tour", content: <VirtualTourGallery key={college.id} images={college.tourImages} collegeSlug={college.slug} /> },
            {
              label: "Reviews",
              content: (
                <ReviewSection
                  slug={college.slug}
                  initialRating={college.rating}
                  initialReviews={college.reviews.map((review) => ({
                    ...review,
                    createdAt: review.createdAt.toISOString()
                  }))}
                />
              )
            }
          ]}
        />
        <aside className="h-fit space-y-3 rounded-lg border bg-white p-4 shadow-sm lg:sticky lg:top-24">
          <h2 className="font-display text-xl font-black">Shortlist this college</h2>
          <p className="text-sm text-slate-600">Save it to your dashboard or add it to a 2-3 college comparison.</p>
          <SaveButton collegeId={college.id} initialSaved={college.savedBy.length > 0} />
          <CompareButton collegeId={college.id} />
        </aside>
      </div>
    </PageLayout>
  );
}

function Overview({ college }: { college: any }) {
  return (
    <Card className="space-y-5 p-6">
      <p className="leading-8 text-slate-700">{college.about}</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <Info label="NAAC grade" value={college.naacGrade} />
        <Info label="Established" value={String(college.established)} />
        <Info label="Affiliations" value={`${college.city} academic council, UGC-recognized`} />
      </div>
    </Card>
  );
}

function Courses({ courses }: { courses: { id: string; name: string; duration: string; seats: number; fees: number }[] }) {
  if (!courses.length) {
    return <Card className="p-6 text-center text-slate-600">Courses will appear here after the admin adds them.</Card>;
  }

  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-slate-50 text-left">
          <tr><th className="p-4">Course Name</th><th className="p-4">Duration</th><th className="p-4">Seats</th><th className="p-4">Fees</th></tr>
        </thead>
        <tbody>
          {courses.map((course) => <tr key={course.id} className="border-t"><td className="p-4 font-semibold">{course.name}</td><td className="p-4">{course.duration}</td><td className="p-4">{course.seats} Seats</td><td className="p-4">{formatFees(course.fees)}</td></tr>)}
        </tbody>
      </table>
    </Card>
  );
}

function Placements({ college }: { college: { avgPackage: number; highPackage: number; topRecruiters: string[] } }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5"><p className="text-sm text-slate-500">Average package</p><p className="font-display text-3xl font-black">{formatPackage(college.avgPackage)}</p></Card>
        <Card className="p-5"><p className="text-sm text-slate-500">Highest package</p><p className="font-display text-3xl font-black">{formatPackage(college.highPackage)}</p></Card>
      </div>
      <Card className="p-5">
        <h3 className="font-display text-xl font-black">Top recruiters</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {college.topRecruiters.map((name) => <span key={name} className="rounded-md border bg-slate-50 px-3 py-2 text-sm font-semibold">{name}</span>)}
        </div>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-slate-50 p-4"><p className="text-sm text-slate-500">{label}</p><p className="mt-1 font-semibold">{value}</p></div>;
}
