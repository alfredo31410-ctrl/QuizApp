import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  MagnifyingGlass, 
  Download, 
  Eye, 
  SignOut, 
  Users,
  ChartBar,
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
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const levelColors = {
  1: "level-1",
  2: "level-2",
  3: "level-3",
  4: "level-4",
  5: "level-5",
};

const statusColors = {
  completed: "bg-green-100 text-green-800",
  abandoned: "bg-amber-100 text-amber-800",
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminInfo, setAdminInfo] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      navigate("/admin/login");
      return;
    }
    fetchAdminInfo();
    fetchUsers();
  }, [navigate]);

  useEffect(() => {
    fetchUsers();
  }, [levelFilter, statusFilter]);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
  });

  const fetchAdminInfo = async () => {
    try {
      const response = await axios.get(`${API}/admin/me`, getAuthHeaders());
      setAdminInfo(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("admin_token");
        navigate("/admin/login");
      }
    }
  };

  const fetchUsers = async () => {
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
  };

  const handleExportCSV = async () => {
    try {
      const params = {};
      if (levelFilter !== "all") {
        params.level = parseInt(levelFilter, 10);
      }
      if (statusFilter !== "all") {
        params.status_filter = statusFilter;
      }
      const response = await axios.get(`${API}/admin/export`, {
        ...getAuthHeaders(),
        params,
      });
      
      const blob = new Blob([response.data.csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users_export_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Exported ${response.data.count} users`);
    } catch (error) {
      toast.error("Failed to export data");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    navigate("/admin/login");
    toast.success("Logged out successfully");
  };

  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  });

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
      <aside className="hidden lg:flex flex-col bg-[#0A0A0A] text-white p-6">
        <div className="mb-8">
          <h1 className="text-xl font-bold tracking-tight">FIA Admin</h1>
          {adminInfo && (
            <p className="text-sm text-white/60 mt-1">{adminInfo.name}</p>
          )}
        </div>

        <nav className="flex-1">
          <div className="space-y-2">
            <button
              className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 text-white"
              data-testid="nav-users"
            >
              <Users className="h-5 w-5" />
              Users
            </button>
          </div>
        </nav>

        <Button
          data-testid="logout-btn"
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10"
        >
          <SignOut className="h-5 w-5 mr-2" />
          Logout
        </Button>
      </aside>

      {/* Main Content */}
      <main className="p-6 lg:p-8 overflow-auto">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">FIA Admin</h1>
          <Button
            data-testid="mobile-logout-btn"
            onClick={handleLogout}
            variant="ghost"
            size="sm"
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
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total</p>
            <p className="text-3xl font-bold mt-1">{stats.total}</p>
          </div>
          <div className="card-swiss" data-testid="stat-completed">
            <p className="text-xs font-semibold uppercase tracking-wider text-green-600">Completed</p>
            <p className="text-3xl font-bold mt-1">{stats.completed}</p>
          </div>
          <div className="card-swiss" data-testid="stat-abandoned">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Abandoned</p>
            <p className="text-3xl font-bold mt-1">{stats.abandoned}</p>
          </div>
          {[1, 2, 3, 4, 5].map((level) => (
            <div key={level} className="card-swiss" data-testid={`stat-level-${level}`}>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">L{level}</p>
              <p className="text-3xl font-bold mt-1">{stats[`level${level}`]}</p>
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
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                data-testid="search-input"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-swiss pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 input-swiss" data-testid="status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="abandoned">Abandoned</SelectItem>
                </SelectContent>
              </Select>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-36 input-swiss" data-testid="level-filter">
                  <Funnel className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="1">Level 1</SelectItem>
                  <SelectItem value="2">Level 2</SelectItem>
                  <SelectItem value="3">Level 3</SelectItem>
                  <SelectItem value="4">Level 4</SelectItem>
                  <SelectItem value="5">Level 5</SelectItem>
                </SelectContent>
              </Select>
              <Button
                data-testid="export-csv-btn"
                onClick={handleExportCSV}
                className="btn-primary"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
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
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="w-6 h-6 border-2 border-[#0047FF] border-t-transparent rounded-full animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${statusColors[user.status] || 'bg-gray-100 text-gray-800'}`}>
                          {user.status === "abandoned" && <Warning className="inline h-3 w-3 mr-1" />}
                          {user.status}
                        </span>
                      </TableCell>
                      <TableCell>{user.score ?? "-"}</TableCell>
                      <TableCell>
                        {user.level ? (
                          <span className={`px-2 py-1 text-xs font-semibold ${levelColors[user.level]}`}>
                            Level {user.level}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          data-testid={`view-user-${user.id}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/user/${user.id}`)}
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
