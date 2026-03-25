import { redirect } from "next/navigation"

/** Logged-in home: always start on Learn (dashboard lives at /dashboard). */
export default function HomePage() {
  redirect("/learn")
}
