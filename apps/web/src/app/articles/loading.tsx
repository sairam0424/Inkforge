import { ArticleSkeletons } from "@/components/articles/ArticleSkeletons";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="h-8 w-32 bg-bg-elevated rounded animate-pulse mb-8" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ArticleSkeletons count={6} />
      </div>
    </div>
  );
}
