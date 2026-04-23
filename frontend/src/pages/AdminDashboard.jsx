import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  MagnifyingGlass, 
  Download, 
  Eye, 
  SignOut, 
  Users,
  Funnel,
  Warning
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { API } from "@/lib/api";
import { toast } from "sonner";
import axios from "axios";

const levelColors = {
  1: "level-1",
  2: "level-2",
  3: "level-3",
  4: "level-4",
  5: "level-5",
};

const statusColors = {
  completed: "bg-green-500/20 text-green-400 border border-green-500/30",
  abandoned: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
};

const levelNames = {
  1: "Contador Inseguro",
  2: "Contador Operativo",
  3: "Contador Técnico",
  4: "Contador Estratégico",
  5: "Contador Consultor",
};

const formatDate = (dateValue) => new Date(dateValue).toLocaleString("es-MX");

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminInfo, setAdminInfo] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Todas las rutas del admin usan el token JWT guardado al iniciar sesión.
  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
  });

  const fetchAdminInfo = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/admin/me`, getAuthHeaders());
      setAdminInfo(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("admin_token");
        navigate("/admin/login");
      }
    }
  }, [navigate]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (levelFilter !== "all") {
        params.level = parseInt(levelFilter, 10);
      }
      if (statusFilter !== "all") {
        params.status_filter = statusFilter;
      }
      const response = await axios.get(`${API}/admin/users`, {
        ...getAuthHeaders(),
        params,
      });
      setUsers(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("admin_token");
        navigate("/admin/login");
      } else {
        toast.error("Failed to fetch users");
      }
    } finally {
      setLoading(false);
    }
  }, [levelFilter, navigate, statusFilter]);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      navigate("/admin/login");
      return;
    }
    fetchAdminInfo();
    fetchUsers();
  }, [fetchAdminInfo, fetchUsers, navigate]);

  const getVisibleUsers = () => {
    if (!searchQuery) return users;
    const query = searchQuery.toLowerCase();
    return users.filter((user) => (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    ));
  };

  const downloadFile = (content, fileName, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const buildStyledExcel = (rows) => {
    const generatedAt = formatDate(new Date().toISOString());
    const tableRows = rows.map((user) => `
      <tr>
        <td>${escapeHtml(user.name)}</td>
        <td>${escapeHtml(user.email)}</td>
        <td>${escapeHtml(user.phone)}</td>
        <td class="center ${user.status === "completed" ? "ok" : "warn"}">${user.status === "completed" ? "Completado" : "Abandonado"}</td>
        <td class="center">${escapeHtml(user.score ?? "-")}</td>
        <td class="center">${escapeHtml(user.level ? `Nivel ${user.level}` : "-")}</td>
        <td>${escapeHtml(user.level ? levelNames[user.level] : "-")}</td>
        <td>${escapeHtml(formatDate(user.created_at))}</td>
      </tr>
    `).join("");

    // Excel puede abrir HTML como .xls; así mantenemos estilos sin agregar dependencias pesadas.
    return `
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            body { font-family: Arial, sans-serif; color: #061729; }
            h1 { color: #950006; margin-bottom: 4px; }
            p { color: #475569; margin-top: 0; }
            table { border-collapse: collapse; width: 100%; }
            th { background: #003b70; color: #ffffff; font-weight: 700; padding: 10px; border: 1px solid #d7e5ef; }
            td { padding: 9px; border: 1px solid #d7e5ef; }
            tr:nth-child(even) td { background: #f6efe4; }
            .center { text-align: center; }
            .ok { color: #166534; font-weight: 700; }
            .warn { color: #92400e; font-weight: 700; }
          </style>
        </head>
        <body>
          <h1>CEFIN - Reporte de diagnósticos</h1>
          <p>Generado: ${escapeHtml(generatedAt)} | Registros: ${rows.length}</p>
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th>Puntuación</th>
                <th>Nivel</th>
                <th>Resultado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </body>
      </html>
    `;
  };

  const handleExportExcel = () => {
    try {
      const rows = getVisibleUsers();
      const today = new Date().toISOString().split("T")[0];
      downloadFile(
        buildStyledExcel(rows),
        `cefin_diagnosticos_${today}.xls`,
        "application/vnd.ms-excel;charset=utf-8"
      );
      toast.success(`Reporte Excel generado con ${rows.length} registros`);
    } catch (error) {
      toast.error("No pudimos exportar el reporte");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    navigate("/admin/login");
    toast.success("Logged out successfully");
  };

  const filteredUsers = getVisibleUsers();

  const stats = {
    total: users.length,
    completed: users.filter((u) => u.status === "completed").length,
    abandoned: users.filter((u) => u.status === "abandoned").length,
    level1: users.filter((u) => u.level === 1).length,
    level2: users.filter((u) => u.level === 2).length,
    level3: users.filter((u) => u.level === 3).length,
    level4: users.filter((u) => u.level === 4).length,
    level5: users.filter((u) => u.level === 5).length,
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col bg-[#1A1F2E] text-white p-6 border-r border-white/10">
        <div className="mb-8">
          <h1 className="text-xl font-bold tracking-tight text-[#C41E3A]">CEFIN Admin</h1>
          {adminInfo && (
            <p className="text-sm text-gray-400 mt-1">{adminInfo.name}</p>
          )}
        </div>

        <nav className="flex-1">
          <div className="space-y-2">
            <button
              className="w-full flex items-center gap-3 px-4 py-3 bg-[#C41E3A]/20 text-white rounded-lg border border-[#C41E3A]/30"
              data-testid="nav-users"
            >
              <Users className="h-5 w-5" />
              Usuarios
            </button>
          </div>
        </nav>

        <Button
          data-testid="logout-btn"
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start text-gray-400 hover:text-white hover:bg-white/10"
        >
          <SignOut className="h-5 w-5 mr-2" />
          Cerrar Sesión
        </Button>
      </aside>

      {/* Main Content */}
      <main className="p-6 lg:p-8 overflow-auto bg-[#0F1219]">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-[#C41E3A]">CEFIN Admin</h1>
          <Button
            data-testid="mobile-logout-btn"
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="text-gray-400"
          >
            <SignOut className="h-5 w-5" />
          </Button>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8"
        >
          <div className="card-swiss" data-testid="stat-total">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total</p>
            <p className="text-3xl font-bold mt-1 text-white">{stats.total}</p>
          </div>
          <div className="card-swiss" data-testid="stat-completed">
            <p className="text-xs font-semibold uppercase tracking-wider text-green-400">Completados</p>
            <p className="text-3xl font-bold mt-1 text-white">{stats.completed}</p>
          </div>
          <div className="card-swiss" data-testid="stat-abandoned">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">Abandonados</p>
            <p className="text-3xl font-bold mt-1 text-white">{stats.abandoned}</p>
          </div>
          {[1, 2, 3, 4, 5].map((level) => (
            <div key={level} className="card-swiss" data-testid={`stat-level-${level}`}>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">N{level}</p>
              <p className="text-3xl font-bold mt-1 text-white">{stats[`level${level}`]}</p>
            </div>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-swiss mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <Input
                data-testid="search-input"
                placeholder="Buscar por nombre o correo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-swiss pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 input-swiss" data-testid="status-filter">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1F2E] border-white/10">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="completed">Completados</SelectItem>
                  <SelectItem value="abandoned">Abandonados</SelectItem>
                </SelectContent>
              </Select>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-36 input-swiss" data-testid="level-filter">
                  <Funnel className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Nivel" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1F2E] border-white/10">
                  <SelectItem value="all">Todos los Niveles</SelectItem>
                  <SelectItem value="1">Nivel 1</SelectItem>
                  <SelectItem value="2">Nivel 2</SelectItem>
                  <SelectItem value="3">Nivel 3</SelectItem>
                  <SelectItem value="4">Nivel 4</SelectItem>
                  <SelectItem value="5">Nivel 5</SelectItem>
                </SelectContent>
              </Select>
              <Button
                data-testid="export-excel-btn"
                onClick={handleExportExcel}
                className="btn-primary"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar Excel
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-swiss overflow-hidden"
        >
          <div className="overflow-x-auto">
            <Table className="table-swiss">
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-gray-400">Nombre</TableHead>
                  <TableHead className="text-gray-400">Correo</TableHead>
                  <TableHead className="text-gray-400">Teléfono</TableHead>
                  <TableHead className="text-gray-400">Estado</TableHead>
                  <TableHead className="text-gray-400">Puntuación</TableHead>
                  <TableHead className="text-gray-400">Nivel</TableHead>
                  <TableHead className="text-gray-400">Fecha</TableHead>
                  <TableHead className="text-gray-400">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="w-6 h-6 border-2 border-[#C41E3A] border-t-transparent rounded-full animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                      No se encontraron usuarios
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} data-testid={`user-row-${user.id}`} className="border-white/10">
                      <TableCell className="font-medium text-white">{user.name}</TableCell>
                      <TableCell className="text-gray-300">{user.email}</TableCell>
                      <TableCell className="text-gray-300">{user.phone}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${statusColors[user.status] || 'bg-gray-500/20 text-gray-400'}`}>
                          {user.status === "abandoned" && <Warning className="inline h-3 w-3 mr-1" />}
                          {user.status === "completed" ? "Completado" : "Abandonado"}
                        </span>
                      </TableCell>
                      <TableCell className="text-white">{user.score ?? "-"}</TableCell>
                      <TableCell>
                        {user.level ? (
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${levelColors[user.level]}`}>
                            Nivel {user.level}
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {new Date(user.created_at).toLocaleDateString('es-MX')}
                      </TableCell>
                      <TableCell>
                        <Button
                          data-testid={`view-user-${user.id}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/user/${user.id}`)}
                          className="text-gray-400 hover:text-white"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
