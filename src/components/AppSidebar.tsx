import { Link, useRouterState } from '@tanstack/react-router';
import { Factory } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { UNITS } from '@/lib/units';

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { location } = useRouterState();
  const currentPath = location.pathname;

  // Group units by category for visual organization while keeping every unit visible.
  const groups = UNITS.reduce<Record<string, typeof UNITS>>((acc, u) => {
    (acc[u.category] ??= []).push(u);
    return acc;
  }, {});

  return (
    <Sidebar collapsible="icon" className="border-r border-[#1e2a3a] bg-[#0a0e17]">
      <SidebarHeader className="border-b border-[#1e2a3a] bg-[#0a0e17]">
        <Link to="/" className="flex items-center gap-2 px-2 py-1.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-[#f0c040]">
            <Factory className="h-4 w-4 text-[#0a0e17]" />
          </span>
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-[0.7rem] font-bold uppercase tracking-wider text-[#f0c040]">
                Refinery
              </div>
              <div className="text-[0.65rem] text-[#5a6a80]">3D Process Units</div>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="bg-[#0a0e17]">
        {Object.entries(groups).map(([category, items]) => (
          <SidebarGroup key={category}>
            {!collapsed && (
              <SidebarGroupLabel className="text-[0.6rem] uppercase tracking-[0.1em] text-[#5a6a80]">
                {category}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((u) => {
                  const path = `/units/${u.id}`;
                  const active = currentPath === path;
                  return (
                    <SidebarMenuItem key={u.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={`${u.tag} — ${u.name}`}
                        className="text-[#8a9ab0] data-[active=true]:bg-[#1a2540] data-[active=true]:text-[#f0c040] hover:bg-[#121a2a] hover:text-[#e0e8f0]"
                      >
                        <Link to="/units/$unitId" params={{ unitId: u.id }}>
                          <u.icon className="h-4 w-4 shrink-0" style={{ color: active ? u.accent : undefined }} />
                          {!collapsed && (
                            <span className="flex flex-1 items-center justify-between gap-2 truncate">
                              <span className="truncate text-[0.78rem]">{u.name}</span>
                              <span
                                className="shrink-0 rounded-sm px-1.5 py-0.5 text-[0.55rem] font-bold tracking-wider text-[#0a0e17]"
                                style={{ backgroundColor: u.accent }}
                              >
                                {u.tag}
                              </span>
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-[#1e2a3a] bg-[#0a0e17]">
        {!collapsed && (
          <div className="px-2 py-1.5 text-[0.6rem] uppercase tracking-wider text-[#5a6a80]">
            <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#22c55e] align-middle shadow-[0_0_6px_#22c55e]" />
            {UNITS.length} units online
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
