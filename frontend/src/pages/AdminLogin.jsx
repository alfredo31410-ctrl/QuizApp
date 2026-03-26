import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Envelope } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminLogin() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const response = await axios.post(`${API}/admin/login`, {
          email: formData.email,
          password: formData.password,
        });
        localStorage.setItem("admin_token", response.data.access_token);
        toast.success("Login successful");
        navigate("/admin/dashboard");
      } else {
        const response = await axios.post(`${API}/admin/register`, {
          email: formData.email,
          password: formData.password,
          name: formData.name,
        });
        localStorage.setItem("admin_token", response.data.access_token);
        toast.success("Account created successfully");
        navigate("/admin/dashboard");
      }
    } catch (error) {
      const message = error.response?.data?.detail || "Authentication failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#0F1219] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#C41E3A] rounded-lg flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-white" weight="fill" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Portal Admin</h1>
          <p className="text-gray-400 mt-2">
            {isLogin ? "Inicia sesión para acceder al dashboard" : "Crea una cuenta de administrador"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card-swiss">
          {!isLogin && (
            <div className="mb-4">
              <Label htmlFor="name" className="text-sm font-medium text-gray-300">Nombre Completo</Label>
              <Input
                id="name"
                data-testid="admin-name-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-swiss mt-2"
                placeholder="Nombre del Admin"
                required={!isLogin}
              />
            </div>
          )}

          <div className="mb-4">
            <Label htmlFor="email" className="text-sm font-medium text-gray-300">Correo Electrónico</Label>
            <div className="relative mt-2">
              <Envelope className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <Input
                id="email"
                type="email"
                data-testid="admin-email-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-swiss pl-10"
                placeholder="admin@empresa.com"
                required
              />
            </div>
          </div>

          <div className="mb-6">
            <Label htmlFor="password" className="text-sm font-medium text-gray-300">Contraseña</Label>
            <div className="relative mt-2">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <Input
                id="password"
                type="password"
                data-testid="admin-password-input"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input-swiss pl-10"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            data-testid="admin-login-btn"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isLogin ? (
              "Iniciar Sesión"
            ) : (
              "Crear Cuenta"
            )}
          </Button>

          <div className="mt-6 text-center">
            <button
              type="button"
              data-testid="toggle-auth-mode-btn"
              onClick={() => setIsLogin(!isLogin)}
              className="text-[#C41E3A] text-sm hover:underline"
            >
              {isLogin ? "¿Necesitas una cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
            </button>
          </div>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          <button
            data-testid="back-to-assessment-btn"
            onClick={() => navigate("/")}
            className="hover:underline hover:text-gray-300"
          >
            Volver a la Evaluación
          </button>
        </p>
      </motion.div>
    </div>
  );
}
