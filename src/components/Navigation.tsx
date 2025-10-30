import { Home, Plus, Settings, LogIn, LogOut } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useParams } from "react-router-dom";
import { auth } from "@/firebase";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  path: string;
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
}

const Navigation = () => {
  const { restaurantId } = useParams();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logout realizado",
        description: "Você saiu da sua conta com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao sair",
        description: "Ocorreu um erro ao tentar sair da conta.",
        variant: "destructive",
      });
    }
  };

  const navItems: NavItem[] = [
    { path: `/${restaurantId}`, icon: Home, label: "Home" },
    { path: `/${restaurantId}/add`, icon: Plus, label: "Adicionar" },
    { path: `/${restaurantId}/settings`, icon: Settings, label: "Configurações" },
  ];

  if (!isAuthenticated) {
    navItems.push({ path: "/login", icon: LogIn, label: "Entrar" });
  } else {
    navItems.push({ path: "#", icon: LogOut, label: "Sair", onClick: handleLogout });
  }

  return (
    <>
      {/* Mobile Header - Top */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-card border-b border-border z-50 shadow-sm">
        <div className="flex items-center justify-center h-14 px-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎤</span>
            <h1 className="text-lg font-bold">
              Karaoke<span className="bg-gradient-primary bg-clip-text text-transparent">Manager</span>
            </h1>
          </div>
        </div>
      </header>

      {/* Desktop Navigation - Top */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 bg-card border-b border-border z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎤</span>
              <h1 className="text-xl font-bold">
                Karaoke<span className="bg-gradient-primary bg-clip-text text-transparent">Manager</span>
              </h1>
            </div>
            <div className="flex gap-1">
              {navItems.map((item) => 
                item.onClick ? (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-foreground hover:bg-muted"
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </button>
                ) : (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-muted"
                      }`
                    }
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </NavLink>
                )
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation - Bottom (iOS style) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 shadow-lg">
        <div className="flex justify-around items-center h-20 px-2 pb-safe">
          {navItems.map((item) => 
            item.onClick ? (
              <button
                key={item.label}
                onClick={item.onClick}
                className="flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all text-muted-foreground"
              >
                <div className="p-2 rounded-xl transition-all">
                  <item.icon className="h-6 w-6" />
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ) : (
              <NavLink
                key={item.path}
                to={item.path}
                end
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all ${
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={`p-2 rounded-xl transition-all ${
                        isActive ? "bg-primary/10" : ""
                      }`}
                    >
                      <item.icon className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-medium">{item.label}</span>
                  </>
                )}
              </NavLink>
            )
          )}
        </div>
      </nav>

      {/* Spacer for fixed navigation */}
      <div className="h-16 hidden md:block" />
      <div className="h-14 md:hidden" />
    </>
  );
};

export default Navigation;
