import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ textAlign: "center", padding: "80px 20px" }}>
      <h1>404 - Page not found</h1>
      <Link href="/">Back to Home</Link>
    </main>
  );
}
