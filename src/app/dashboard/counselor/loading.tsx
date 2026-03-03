import { Card, CardContent, CardHeader } from "@/components/ui/card";

// skeleton helper
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-gray-200 ${className}`} />;
}

export default function CounselorDashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* hero banner skeleton */}
      <section className="pt-16">
        <div className="bg-primary px-6 lg:px-8 py-16 pb-24">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-3">
                <Skeleton className="h-4 w-24 bg-white/20" />
                <Skeleton className="h-10 w-72 bg-white/20" />
                <Skeleton className="h-4 w-96 bg-white/15" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-11 w-44 rounded-xl bg-white/15" />
                <Skeleton className="h-11 w-36 rounded-xl bg-white/25" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* dashboard content skeleton */}
      <section className="px-6 lg:px-8 -mt-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-7 w-20" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="w-11 h-11 rounded-xl" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card className="lg:col-span-2 border-0 shadow-sm">
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-56" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[280px] w-full rounded-lg" />
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-44" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[280px] w-full rounded-lg" />
              </CardContent>
            </Card>
          </div>

          {/* second row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card className="border-0 shadow-sm">
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[240px] w-full rounded-lg" />
              </CardContent>
            </Card>
            <Card className="lg:col-span-2 border-0 shadow-sm">
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-44" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-3.5 rounded-xl bg-gray-50">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* upcoming + reviews row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardHeader className="space-y-2">
                  <Skeleton className="h-4 w-44" />
                </CardHeader>
                <CardContent className="space-y-3">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="flex items-center gap-4 p-3.5 rounded-xl bg-gray-50">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3 w-36" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* mini stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-gray-100">
                <Skeleton className="w-6 h-6 rounded" />
                <div className="space-y-1.5">
                  <Skeleton className="h-5 w-8" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* cta skeleton */}
      <section className="px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-[320px] w-full rounded-3xl" />
        </div>
      </section>
    </div>
  );
}
