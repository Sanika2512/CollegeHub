import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NavbarClient } from "@/components/layout/NavbarClient";

export async function Navbar() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "ADMIN";

  return <NavbarClient isSignedIn={Boolean(session)} isAdmin={isAdmin} />;
}
