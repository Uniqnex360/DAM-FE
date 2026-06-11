import { ReactNode, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  Upload,
  Box,
  Layers,
  Briefcase,
  LogOut,
  BarChart3,
  Search,
  TrendingUp,
  Smartphone,
  Tag,
  Sparkles,
  Users,
  Menu,
  X,
} from "lucide-react";

interface LayoutProps {
  children: ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
}

export function Layout({ children, currentView, onNavigate }: LayoutProps) {
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navSections = [
    {
      title: "MAIN",
      items: [
        { id: "dashboard", label: "Dashboard", icon: BarChart3 },
        { id: "upload", label: "Upload", icon: Upload },
        { id: "reports", label: "Reports", icon: TrendingUp },
        { id: "search", label: "Search", icon: Search },
        { id: "catalog", label: "Catalog", icon: Briefcase },
        { id: "marketplace", label: "Marketplace", icon: TrendingUp },
      ],
    },
    {
      title: "CREATIVE",
      items: [
        { id: "ar", label: "AR", icon: Smartphone },
        { id: "tags", label: "Tags", icon: Tag },
        { id: "ai-optimize", label: "AI Optimize", icon: Sparkles },
        { id: "configurator", label: "Configurator", icon: Layers },
        { id: "viewer", label: "3D Viewer", icon: Box },
      ],
    },
    ...(user?.email?.includes("admin")
      ? [
          {
            title: "ADMIN",
            items: [{ id: "clients", label: "Clients", icon: Users }],
          },
        ]
      : []),
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
            <Box className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white font-semibold text-sm">AssetLynx</div>
            <div className="text-cyan-400 text-xs">AI PLATFORM</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-6">
        {navSections.map((section) => (
          <div key={section.title} className="mb-6">
            <div className="px-6 mb-3 text-xs font-semibold text-slate-500">
              {section.title}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setMobileOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-6 py-3 transition-colors ${
                    isActive
                      ? "bg-cyan-500/10 text-cyan-400 border-r-2 border-cyan-400"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-6 border-t border-slate-800">
        <button
          onClick={() => signOut()}
          className="w-full flex items-center space-x-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-slate-800/50 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="hidden md:block w-64 border-r border-slate-200">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-64 z-50 md:hidden">
            <SidebarContent />
          </aside>
        </>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
              <Box className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold">AssetLynx</span>
          </div>
          <div className="w-10" />
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}