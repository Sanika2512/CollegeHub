import Link from "next/link";
import { GraduationCap, Mail, Github, Linkedin } from "lucide-react";

const exploreLinks = [
  { href: "/colleges", label: "Browse Colleges" },
  { href: "/compare", label: "Compare Colleges" },
  { href: "/predictor", label: "Rank Predictor" },
  { href: "/discussions", label: "Q&A Forum" }
];

const accountLinks = [
  { href: "/dashboard/saved", label: "Saved Colleges" },
  { href: "/dashboard/comparisons", label: "My Comparisons" },
  { href: "/auth/login", label: "Login" },
  { href: "/auth/signup", label: "Create Account" }
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-display text-xl font-black text-primary">
              <GraduationCap className="h-7 w-7 shrink-0" />
              <span>CollegeHub</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-500">
              Transparent, data-driven discovery for Indian colleges — explore, compare, predict, and decide with confidence.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="flex h-9 w-9 items-center justify-center rounded-md border text-slate-500 transition hover:bg-slate-100 hover:text-primary"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="flex h-9 w-9 items-center justify-center rounded-md border text-slate-500 transition hover:bg-slate-100 hover:text-primary"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href="mailto:support@collegehub.app"
                aria-label="Email"
                className="flex h-9 w-9 items-center justify-center rounded-md border text-slate-500 transition hover:bg-slate-100 hover:text-primary"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wide text-slate-900">Explore</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-500">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wide text-slate-900">Account</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-500">
              {accountLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About / disclaimer */}
          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wide text-slate-900">About</h3>
            <p className="mt-4 text-sm leading-relaxed text-slate-500">
              CollegeHub is an MVP built for transparent Indian college discovery. College and ranking data is seeded for
              demonstration purposes — please verify independently before making admission decisions.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-2 border-t pt-6 text-sm text-slate-500 sm:flex-row sm:justify-between">
          <p>© {year} CollegeHub. All rights reserved.</p>
          <p className="text-slate-400">❤️ Made With Care For Future Students</p>
        </div>
      </div>
    </footer>
  );
}
