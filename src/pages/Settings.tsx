import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Moon, Sun, LogOut } from "lucide-react";
import Navigation from "@/components/Navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { auth } from "@/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
        description: "Até logo!",
      });
    } catch (error) {
      toast({
        title: "Erro ao fazer logout",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Configurações</h1>
            <p className="text-muted-foreground mt-2">
              Personalize sua experiência no KaraokeManager
            </p>
          </div>

          {/* Theme Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Aparência</CardTitle>
              <CardDescription>
                Escolha o tema que melhor se adapta ao seu estilo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tema</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setTheme("light")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      theme === "light"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Sun className="h-8 w-8" />
                    <span className="font-medium">Claro</span>
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      theme === "dark"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Moon className="h-8 w-8" />
                    <span className="font-medium">Escuro</span>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Section */}
          {isAuthenticated && (
            <Card>
              <CardHeader>
                <CardTitle>Conta</CardTitle>
                <CardDescription>
                  Gerencie sua conta e sessão
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleLogout}
                  variant="destructive"
                  className="w-full gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sair da Conta
                </Button>
              </CardContent>
            </Card>
          )}

          {/* About Section */}
          <Card>
            <CardHeader>
              <CardTitle>Sobre</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">KaraokeManager</strong> - Sistema de gerenciamento de fila de karaoke
              </p>
              <p>Versão 1.0.0</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
