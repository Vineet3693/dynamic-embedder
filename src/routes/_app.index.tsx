import { createFileRoute, Outlet } from '@tanstack/react-router';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';

// Pathless layout route — wraps every child with the sidebar shell.
export const Route = createFileRoute('/_app/')({
  component: AppLayout,
});

function AppLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#0a0e17]">
        <AppSidebar />
        <SidebarInset className="flex flex-1 flex-col bg-[#0a0e17]">
          {/* Floating trigger so the sidebar can always be opened/closed,
              even while a unit's full-screen iframe is mounted. */}
          <SidebarTrigger className="fixed left-2 top-2 z-[1000] h-8 w-8 bg-[#0a0e17]/80 text-[#f0c040] backdrop-blur hover:bg-[#1a2540]" />
          <main className="relative flex-1">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
