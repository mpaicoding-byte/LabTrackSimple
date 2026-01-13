import { redirect } from "next/navigation";

// Redirect /login to /auth for consistency
export default function LoginPage() {
    redirect("/auth");
}
