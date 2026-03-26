import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, User, Envelope, Phone, Calendar, Trophy } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
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

export default function UserDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      navigate("/admin/login");
      return;
    }
    fetchUserDetail();
  }, [userId, navigate]);

  const fetchUserDetail = async () => {
    try {
      const response = await axios.get(`${API}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
      });
      setData(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("admin_token");
        navigate("/admin/login");
      } else if (error.response?.status === 404) {
        toast.error("User not found");
        navigate("/admin/dashboard");
      } else {
        toast.error("Failed to fetch user details");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBFBFB]">
        <div className="w-8 h-8 border-2 border-[#0047FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { user, responses } = data;

  return (
    <div className="min-h-screen bg-[#FBFBFB] p-6 lg:p-12">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            data-testid="back-to-dashboard-btn"
            variant="ghost"
            onClick={() => navigate("/admin/dashboard")}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          {/* User Info Card */}
          <div className="card-swiss mb-8">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6" data-testid="user-name">
                  {user.name}
                </h1>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Envelope className="h-5 w-5" />
                    <span data-testid="user-email">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Phone className="h-5 w-5" />
                    <span data-testid="user-phone">{user.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Calendar className="h-5 w-5" />
                    <span data-testid="user-date">{new Date(user.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4 p-6 bg-[#F4F4F5]">
                <div className="text-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Score</p>
                  <p className="text-4xl font-bold" data-testid="user-score">{user.score}</p>
                </div>
                <span className={`px-4 py-2 text-sm font-semibold ${levelColors[user.level]}`} data-testid="user-level">
                  Level {user.level}
                </span>
              </div>
            </div>
          </div>

          {/* Responses Table */}
          <div className="card-swiss">
            <h2 className="text-xl font-bold mb-6">Assessment Responses</h2>
            <div className="overflow-x-auto">
              <Table className="table-swiss">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50%]">Question</TableHead>
                    <TableHead>Answer</TableHead>
                    <TableHead>Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {responses.map((response, index) => (
                    <TableRow key={response.id} data-testid={`response-row-${index}`}>
                      <TableCell className="font-medium">{response.question}</TableCell>
                      <TableCell>{response.answer}</TableCell>
                      <TableCell>
                        <span className="font-semibold">{response.score}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
