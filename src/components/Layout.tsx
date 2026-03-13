import { ReactNode } from "react";
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
} from "lucide-react";
import logo from "../logo/logo-main.png";
interface LayoutProps {
  children: ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
}

export function Layout({ children, currentView, onNavigate }: LayoutProps) {
  const { user, signOut } = useAuth();

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "upload", label: "Upload", icon: Upload },
    { id: "search", label: "Search", icon: Search },
    { id: "catalog", label: "Catalog", icon: Briefcase },
    { id: "marketplace", label: "Marketplace", icon: TrendingUp },
    { id: "ar", label: "AR", icon: Smartphone },
    { id: "tags", label: "Tags", icon: Tag },
    { id: "ai-optimize", label: "AI Optimize", icon: Sparkles },
    { id: "configurator", label: "Configurator", icon: Layers },
    { id: "viewer", label: "3D Viewer", icon: Box },
    ...(user?.email && user.email.includes("admin")
      ? [{ id: "clients", label: "Clients", icon: Users }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="w-full mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <img
                src={logo}
                alt="DAM & Product Visualizer"
                className="h-16 w-auto object-contain"
              />

              <div className="hidden md:flex space-x-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                        currentView === item.id
                          ? "bg-blue-50 text-blue-600"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => signOut()}
                className="flex items-center space-x-2 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="w-full mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
