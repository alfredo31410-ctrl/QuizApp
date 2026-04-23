import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Envelope, Phone, Calendar, Warning } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
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

const providerLabels = {
  whatsapp: "WhatsApp",
  active_campaign: "ActiveCampaign",
};

const getIntegrationPreview = (event) => {
  if (event.payload?.message) return event.payload.message;
  if (event.payload?.message_preview) return event.payload.message_preview;
  if (event.payload?.meta_response) return JSON.stringify(event.payload.meta_response, null, 2);
  return JSON.stringify(event.payload, null, 2);
};

export default function UserDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserDetail = useCallback(async () => {
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
        toast.error("Usuario no encontrado");
        navigate("/admin/dashboard");
      } else {
        toast.error("No pudimos cargar el detalle del usuario");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, userId]);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      navigate("/admin/login");
      return;
    }
    fetchUserDetail();
  }, [fetchUserDetail, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F1219]">
        <div className="w-8 h-8 border-2 border-[#C41E3A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { user, responses, integration_events = [] } = data;

  return (
    <div className="min-h-screen bg-[#0F1219] p-6 lg:p-12">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Button
            data-testid="back-to-dashboard-btn"
            variant="ghost"
            onClick={() => navigate("/admin/dashboard")}
            className="mb-6 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al dashboard
          </Button>

          {/* Resumen principal del usuario seleccionado. */}
          <div className="card-swiss mb-8">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white" data-testid="user-name">
                    {user.name}
                  </h1>
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${statusColors[user.status] || "bg-gray-500/20 text-gray-400"}`} data-testid="user-status">
                    {user.status === "abandoned" && <Warning className="inline h-3 w-3 mr-1" />}
                    {user.status === "completed" ? "Completado" : "Abandonado"}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-400">
                    <Envelope className="h-5 w-5" />
                    <span data-testid="user-email">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-400">
                    <Phone className="h-5 w-5" />
                    <span data-testid="user-phone">{user.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-400">
                    <Calendar className="h-5 w-5" />
                    <span data-testid="user-date">{new Date(user.created_at).toLocaleString("es-MX")}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4 p-6 bg-[#252B3B] rounded-lg">
                {user.status === "completed" ? (
                  <>
                    <div className="text-center">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Puntuación</p>
                      <p className="text-4xl font-bold text-white" data-testid="user-score">{user.score}</p>
                    </div>
                    <span className={`px-4 py-2 text-sm font-semibold rounded ${levelColors[user.level]}`} data-testid="user-level">
                      Nivel {user.level}
                    </span>
                  </>
                ) : (
                  <div className="text-center">
                    <Warning className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Evaluación no completada</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Respuestas capturadas durante el diagnóstico. */}
          {responses.length > 0 ? (
            <div className="card-swiss">
              <h2 className="text-xl font-bold mb-6 text-white">Respuestas de la evaluación</h2>
              <div className="overflow-x-auto">
                <Table className="table-swiss">
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="w-[50%] text-gray-400">Pregunta</TableHead>
                      <TableHead className="text-gray-400">Respuesta</TableHead>
                      <TableHead className="text-gray-400">Puntos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {responses.map((response, index) => (
                      <TableRow key={response.id} data-testid={`response-row-${index}`} className="border-white/10">
                        <TableCell className="font-medium text-white">{response.question}</TableCell>
                        <TableCell className="text-gray-300">{response.answer}</TableCell>
                        <TableCell>
                          <span className="font-semibold text-[#C41E3A]">{response.score}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="card-swiss text-center py-12">
              <Warning className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2 text-white">Sin respuestas aún</h2>
              <p className="text-gray-400">
                Este usuario abandonó la evaluación antes de responder alguna pregunta.
              </p>
            </div>
          )}

          {/* Evidencia de integraciones simuladas o reales. Sirve para comprobar qué se habría enviado. */}
          <div className="card-swiss mt-8">
            <h2 className="text-xl font-bold mb-2 text-white">Integraciones</h2>
            <p className="text-gray-400 mb-6">
              Aquí puedes verificar si se generó el evento de WhatsApp o ActiveCampaign para este diagnóstico.
            </p>

            {integration_events.length > 0 ? (
              <div className="space-y-4">
                {integration_events.map((event) => (
                  <div key={event.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
                      <div>
                        <p className="font-bold text-white">{providerLabels[event.provider] || event.provider}</p>
                        <p className="text-xs text-gray-500">{new Date(event.created_at).toLocaleString("es-MX")}</p>
                      </div>
                      <span className="w-fit rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-300">
                        {event.status}
                      </span>
                    </div>
                    <pre className="whitespace-pre-wrap rounded-xl bg-black/25 p-4 text-sm leading-relaxed text-gray-200">
                      {getIntegrationPreview(event)}
                    </pre>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center">
                <Warning className="h-8 w-8 text-amber-500 mx-auto mb-3" />
                <p className="text-gray-400">
                  Este registro todavía no tiene eventos de integración guardados.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
