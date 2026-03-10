import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Music, Building2, Mic } from "lucide-react";

const SignUp = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-blue-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-4">
              <Music className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Criar Conta
            </h1>
            <p className="text-muted-foreground mt-2">
              Como você quer se cadastrar?
            </p>
          </div>

          <div className="space-y-4">
            <Link to="/owner/signup" className="block">
              <Button
                variant="outline"
                className="w-full py-6 text-lg justify-start gap-3"
              >
                <Building2 className="w-6 h-6" />
                Sou dono do estabelecimento
              </Button>
            </Link>
            <Link to="/users/signup" className="block">
              <Button
                variant="outline"
                className="w-full py-6 text-lg justify-start gap-3"
              >
                <Mic className="w-6 h-6" />
                Quero cantar no karaoke
              </Button>
            </Link>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Já tem uma conta?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
