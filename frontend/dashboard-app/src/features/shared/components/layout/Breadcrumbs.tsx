import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href: string;
}

const routeLabels: Record<string, string> = {
  '': 'Dashboard',
  'inventory': 'Inventory',
  'analytics': 'Analytics', 
  'activity': 'Activity',
  'reports': 'Reports',
  'users': 'User Management',
  'security': 'Security',
  'settings': 'Settings'
};

export function Breadcrumbs() {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/' }
  ];

  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    breadcrumbs.push({
      label,
      href: currentPath
    });
  });

  // Don't show breadcrumbs if we're just on the home page
  if (breadcrumbs.length <= 1) {
    return (
      <div className="flex items-center text-sm">
        <Home className="mr-2 h-4 w-4" />
        <span className="font-medium">Dashboard</span>
      </div>
    );
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-1 text-sm">
      {breadcrumbs.map((item, index) => (
        <div key={item.href} className="flex items-center">
          {index > 0 && (
            <ChevronRight className="mx-2 h-4 w-4 text-muted-foreground" />
          )}
          
          {index === 0 && (
            <Home className="mr-2 h-4 w-4 text-muted-foreground" />
          )}
          
          {index === breadcrumbs.length - 1 ? (
            <span className="font-medium text-foreground">
              {item.label}
            </span>
          ) : (
            <Link
              to={item.href}
              className={cn(
                "font-medium text-muted-foreground transition-colors hover:text-foreground",
                index === 0 && "sr-only sm:not-sr-only"
              )}
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}