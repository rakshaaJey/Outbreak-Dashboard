import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/dashboard-sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {children}
      </main>
    </SidebarProvider>
  );
}
