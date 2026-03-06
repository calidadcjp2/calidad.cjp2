import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface AreaCardProps {
  title: string;
  icon: LucideIcon;
  count: number;
  colorTheme: 'blue' | 'amber' | 'emerald' | 'purple' | 'slate';
  href: string;
}

export function AreaCard({ title, icon: Icon, count, colorTheme, href }: AreaCardProps) {
  const themeClasses = {
    blue: { bg: 'bg-blue-50', iconBg: 'bg-blue-100', iconText: 'text-blue-600' },
    amber: { bg: 'bg-amber-50', iconBg: 'bg-amber-100', iconText: 'text-amber-600' },
    emerald: { bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', iconText: 'text-emerald-600' },
    purple: { bg: 'bg-purple-50', iconBg: 'bg-purple-100', iconText: 'text-purple-600' },
    slate: { bg: 'bg-slate-50', iconBg: 'bg-slate-100', iconText: 'text-slate-600' },
  };

  const theme = themeClasses[colorTheme];

  return (
    <Link href={href}>
      <a className="block group">
        <Card className="border-slate-200 shadow-sm bg-white overflow-hidden relative transition-all duration-200 group-hover:shadow-md group-hover:border-slate-300 h-full">
          <div className={`absolute right-0 top-0 w-24 h-24 ${theme.bg} rounded-bl-full -mr-4 -mt-4 z-0 transition-transform duration-300 group-hover:scale-110`}></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-slate-600 line-clamp-1 pr-2" title={title}>{title}</CardTitle>
            <div className={`h-8 w-8 ${theme.iconBg} rounded-md flex items-center justify-center shrink-0`}>
              <Icon className={`h-4 w-4 ${theme.iconText}`} />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-slate-900">{count}</div>
            <p className="text-xs text-slate-500 mt-1">registros totales</p>
          </CardContent>
        </Card>
      </a>
    </Link>
  );
}
