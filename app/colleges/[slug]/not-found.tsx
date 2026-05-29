import Link from "next/link";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return <PageLayout><div className="rounded-lg border bg-white p-10 text-center"><h1 className="font-display text-3xl font-black">College not found</h1><Link href="/colleges" className="mt-5 inline-flex"><Button>Browse colleges</Button></Link></div></PageLayout>;
}
