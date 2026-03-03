import { Suspense } from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | Mirlind Protocol',
  description: 'Your personal gamified life operating system dashboard',
};

export const experimental_ppr = true;

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      {children}
    </Suspense>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex min-h-screen bg-[#0a0a0f]">
      {/* Sidebar Skeleton */}
      <div className="w-64 bg-[#0a0a0f] border-r border-[#ffffff0f] hidden lg:flex flex-col">
        <div className="p-5 border-b border-[#ffffff0f]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1a1a25] skeleton" />
            <div className="space-y-1">
              <div className="w-16 h-4 skeleton rounded" />
              <div className="w-12 h-2 skeleton rounded" />
            </div>
          </div>
        </div>
        <div className="p-4 space-y-4">
          {[1, 2].map((i) => (
            <div key={i}>
              <div className="w-12 h-3 skeleton rounded mb-2" />
              {[1, 2, 3].map((j) => (
                <div key={j} className="w-full h-9 skeleton rounded mb-1" />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Skeleton */}
      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="w-48 h-8 skeleton rounded" />
              <div className="w-32 h-4 skeleton rounded" />
            </div>
            <div className="w-40 h-16 skeleton rounded-xl" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-[#12121a] border border-[#ffffff0f] p-4">
                <div className="w-20 h-3 skeleton rounded mb-2" />
                <div className="w-16 h-6 skeleton rounded" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
