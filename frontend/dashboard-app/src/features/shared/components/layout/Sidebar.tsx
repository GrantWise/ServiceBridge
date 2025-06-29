import { NavLink, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  Database, 
  LayoutDashboard, 
  Settings, 
  Users,
  Activity,
  FileText,
  Shield,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RoleGuard } from '@/features/auth';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
  badge?: string;
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    roles: ['Viewer', 'Operator', 'Manager', 'Admin']
  },
  {
    title: 'Inventory',
    href: '/inventory',
    icon: Database,
    roles: ['Operator', 'Manager', 'Admin']
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    roles: ['Manager', 'Admin']
  },
  {
    title: 'Advanced Analytics',
    href: '/advanced-analytics',
    icon: BarChart3,
    roles: ['Manager', 'Admin'],
    badge: 'New'
  },
  {
    title: 'Activity',
    href: '/activity',
    icon: Activity,
    roles: ['Viewer', 'Operator', 'Manager', 'Admin']
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: FileText,
    roles: ['Manager', 'Admin']
  },
  {
    title: 'Users',
    href: '/users',
    icon: Users,
    roles: ['Admin']
  },
  {
    title: 'Security',
    href: '/security',
    icon: Shield,
    roles: ['Admin']
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: ['Manager', 'Admin']
  }
];

export function Sidebar({ collapsed, onCollapsedChange }: SidebarProps) {
  const location = useLocation();

  const SidebarItem = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.href || 
      (item.href !== '/' && location.pathname.startsWith(item.href));

    const content = (
      <NavLink
        to={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
          isActive 
            ? "bg-accent text-accent-foreground" 
            : "text-muted-foreground"
        )}
      >
        <item.icon className={cn("h-4 w-4", collapsed && "h-5 w-5")} />
        {!collapsed && (
          <>
            <span className="flex-1">{item.title}</span>
            {item.badge && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {item.badge}
              </span>
            )}
          </>
        )}
      </NavLink>
    );

    if (collapsed) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {content}
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{item.title}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return content;
  };

  return (
    <div className={cn(
      "fixed left-0 top-0 z-50 h-full bg-card border-r transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo/Brand */}
      <div className="flex h-16 items-center border-b px-4">
        {collapsed ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Database className="h-4 w-4" />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Database className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">ServiceBridge</span>
              <span className="text-xs text-muted-foreground">Dashboard</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => (
          <RoleGuard key={item.href} roles={item.roles}>
            <SidebarItem item={item} />
          </RoleGuard>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCollapsedChange(!collapsed)}
          className={cn(
            "w-full justify-start",
            collapsed && "justify-center px-2"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Collapse
            </>
          )}
        </Button>
      </div>
    </div>
  );
}