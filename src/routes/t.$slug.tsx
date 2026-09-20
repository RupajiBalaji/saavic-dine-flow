import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/t/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/menu",
      search: { table: params.slug },
    });
  },
  head: () => ({
    meta: [
      { title: "Redirecting to Menu | Saavic Healthy Café" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TableQrRedirectPage,
});

function TableQrRedirectPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("saavic:last-table", slug);
    }
    navigate({
      to: "/menu",
      search: { table: slug },
      replace: true,
    });
  }, [slug, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF8F5] p-6 text-center text-sm font-medium text-[#163E24]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#163E24] border-t-transparent" />
        <p>Connecting to {slug.replace("-", " ").toUpperCase()}...</p>
      </div>
    </div>
  );
}
