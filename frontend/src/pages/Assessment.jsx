import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, CheckCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API } from "@/lib/api";
import { toast } from "sonner";
import axios from "axios";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 640px)");
    const updateIsMobile = () => setIsMobile(mediaQuery.matches);
    updateIsMobile();
    mediaQuery.addEventListener("change", updateIsMobile);
    return () => mediaQuery.removeEventListener("change", updateIsMobile);
  }, []);

  return isMobile;
}

export default function Assessment() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const screenMotion = isMobile
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.14 },
      }
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
        transition: { duration: 0.5 },
      };
  // step controla la pantalla actual: 0 intro, 1 datos del usuario, 2+ preguntas.
  const [step, setStep] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [capturingInfo, setCapturingInfo] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: "", email: "", phone: "" });
  const [userId, setUserId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await axios.get(`${API}/questions`);
      setQuestions(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch questions:", error);
      toast.error("No pudimos cargar el diagnóstico");
      setLoading(false);
    }
  };

  const totalSteps = questions.length + 2;
  const progress = (step / (totalSteps - 1)) * 100;

  const validateUserInfo = () => {
    // Validamos en frontend para dar feedback rápido antes de llamar al backend.
    const newErrors = {};
    if (!userInfo.name.trim()) newErrors.name = "El nombre es obligatorio";
    if (!userInfo.email.trim()) newErrors.email = "El correo es obligatorio";
    else if (!/\S+@\S+\.\S+/.test(userInfo.email)) newErrors.email = "Ingresa un correo válido";
    if (!userInfo.phone.trim()) newErrors.phone = "El teléfono es obligatorio";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const captureUserInfo = async () => {
    if (!validateUserInfo()) return;

    setCapturingInfo(true);
    try {
      const response = await axios.post(`${API}/assessment/capture`, {
        name: userInfo.name,
        email: userInfo.email,
        phone: userInfo.phone,
      });

      setUserId(response.data.user_id);
      toast.success("Tu información quedó guardada");
      setStep(2);
    } catch (error) {
      console.error("Failed to capture user info:", error);
      toast.error("No pudimos guardar tu información. Intenta de nuevo.");
    } finally {
      setCapturingInfo(false);
    }
  };

  const handleNext = () => {
    if (step >= 2) {
      const currentQuestion = questions[step - 2];
      if (!answers[currentQuestion.id]) {
        toast.error("Selecciona una respuesta para continuar");
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else {
      setStep((prev) => Math.max(0, prev - 1));
    }
  };

  const handleSelectOption = (questionId, option) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const handleSubmit = async () => {
    const currentQuestion = questions[step - 2];
    if (!answers[currentQuestion.id]) {
      toast.error("Selecciona una respuesta para continuar");
      return;
    }

    if (!userId) {
      toast.error("Tu sesión expiró. Inicia el diagnóstico otra vez.");
      setStep(0);
      return;
    }

    setSubmitting(true);
    try {
      // Seguridad extra: aunque la UI no deja avanzar sin responder, volvemos a validar antes de enviar.
      const unansweredQuestion = questions.find((q) => !answers[q.id]?.id);
      if (unansweredQuestion) {
        const unansweredIndex = questions.findIndex((q) => q.id === unansweredQuestion.id);
        setStep(unansweredIndex + 2);
        toast.error("Responde todas las preguntas antes de enviar");
        setSubmitting(false);
        return;
      }

      const responses = questions.map((q) => ({
        question_id: q.id,
        option_id: answers[q.id].id,
      }));

      // El backend calcula la puntuación final; el frontend solo manda ids de respuestas.
      const response = await axios.post(`${API}/assessment/submit`, {
        user_id: userId,
        responses,
      });

      toast.success("Diagnóstico completado");
      navigate(`/result/${response.data.level}`, {
        state: {
          score: response.data.score,
          level: response.data.level,
          name: response.data.name,
        },
      });
    } catch (error) {
      console.error("Submission failed:", error);
      toast.error(error.response?.data?.detail || "No pudimos enviar el diagnóstico");
    } finally {
      setSubmitting(false);
    }
  };

  const isLastQuestion = step === totalSteps - 1;

  if (loading) {
    return (
      <div className="assessment-page flex items-center justify-center">
        <div className="loader-card text-center">
          <div className="w-10 h-10 border-3 border-[var(--cefin-burgundy)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-muted)]">Cargando diagnóstico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="assessment-page">
      {step > 0 && <div className="progress-bar" style={{ width: `${progress}%` }} />}

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="intro"
            {...screenMotion}
            className="assessment-container assessment-container--hero"
          >
            <div className="hero-grid">
              <div className="hero-copy">
                <div className="brand-lockup">
                  <span className="brand-wordmark">
                    <span>CE</span>
                    <span>FIN</span>
                  </span>
                  <span className="brand-caption">Centro de Estudios Fiscales, Innovación y Negocios</span>
                </div>

                <span className="category-badge mb-5 inline-flex">Diagnóstico profesional</span>
                <h1 className="hero-title">
                  Descubre tu nivel como contador y tu siguiente ruta de crecimiento.
                </h1>
                <p className="hero-description">
                  Una evaluación breve para ubicar tu perfil actual: técnico, operativo,
                  estratégico o consultivo. Al terminar recibirás una clasificación clara
                  y accionable.
                </p>

                <div className="hero-actions">
                  <Button
                    data-testid="start-assessment-btn"
                    onClick={() => setStep(1)}
                    className="btn-primary hero-cta text-base"
                  >
                    <span className="hero-cta__shine" />
                    <span className="hero-cta__text">Iniciar diagnóstico</span>
                    <span className="hero-cta__icon">
                      <ArrowRight className="h-5 w-5" />
                    </span>
                  </Button>
                  <span className="hero-note">20 preguntas · 5 minutos · resultado inmediato</span>
                </div>
              </div>

              <div className="hero-panel">
                <div className="panel-glow" />
                <div className="panel-card panel-card--main">
                  <span className="panel-kicker">CEFIN Pro</span>
                  <h2>Diagnóstico del Contador</h2>
                  <p>Evalúa seguridad técnica, criterio fiscal, procesos, clientes e ingresos.</p>
                  <div className="score-preview">
                    <span>20</span>
                    <span>100</span>
                  </div>
                </div>
                <div className="panel-card panel-card--mini">
                  <strong>Resultado final</strong>
                  <span>Contador Consultor</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="userinfo"
            {...screenMotion}
            className="assessment-container"
          >
            <div className="assessment-card form-card w-full max-w-lg">
              <span className="category-badge mb-5 inline-flex">Paso 1</span>
              <h2 className="section-title">Antes de iniciar, cuéntanos sobre ti.</h2>
              <p className="section-description">
                Usaremos estos datos para guardar tu diagnóstico y mostrarlo después en el panel administrativo.
              </p>

              <div className="space-y-6">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium text-[var(--text-soft)]">
                    Nombre completo *
                  </Label>
                  <Input
                    id="name"
                    data-testid="user-name-input"
                    value={userInfo.name}
                    onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                    className="input-swiss mt-2"
                    placeholder="Juan Pérez"
                  />
                  {errors.name && <p className="form-error">{errors.name}</p>}
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-[var(--text-soft)]">
                    Correo electrónico *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    data-testid="user-email-input"
                    value={userInfo.email}
                    onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                    className="input-swiss mt-2"
                    placeholder="juan@empresa.com"
                  />
                  {errors.email && <p className="form-error">{errors.email}</p>}
                </div>

                <div>
                  <Label htmlFor="phone" className="text-sm font-medium text-[var(--text-soft)]">
                    Teléfono *
                  </Label>
                  <Input
                    id="phone"
                    data-testid="user-phone-input"
                    value={userInfo.phone}
                    onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                    className="input-swiss mt-2"
                    placeholder="+52 55 1234 5678"
                  />
                  {errors.phone && <p className="form-error">{errors.phone}</p>}
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <Button data-testid="back-to-intro-btn" onClick={handleBack} variant="outline" className="btn-outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Atrás
                </Button>
                <Button
                  data-testid="continue-to-questions-btn"
                  onClick={captureUserInfo}
                  disabled={capturingInfo}
                  className="btn-primary flex-1"
                >
                  {capturingInfo ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      Continuar
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {step >= 2 && questions[step - 2] && (
          <motion.div
            key={`question-${step}`}
            {...screenMotion}
            className="assessment-container"
          >
            <div className="assessment-card question-card w-full max-w-3xl">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
                <span className="category-badge">{questions[step - 2].category}</span>
                <span className="question-count">
                  Pregunta {step - 1} de {questions.length}
                </span>
              </div>

              <h2 className="question-title">{questions[step - 2].question}</h2>

              <div className="space-y-4">
                {questions[step - 2].options.map((option, index) => (
                  <button
                    key={option.id}
                    data-testid={`option-${index}`}
                    onClick={() => handleSelectOption(questions[step - 2].id, option)}
                    className={`option-card ${
                      answers[questions[step - 2].id]?.label === option.label ? "selected" : ""
                    }`}
                  >
                    <span className="flex items-start gap-3 text-left">
                      <span className="option-letter">{option.id}</span>
                      <span>{option.label}</span>
                    </span>
                    {answers[questions[step - 2].id]?.label === option.label && (
                      <CheckCircle className="h-6 w-6 text-[var(--cefin-burgundy-bright)]" weight="fill" />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex gap-4 mt-8">
                <Button data-testid="back-btn" onClick={handleBack} variant="outline" className="btn-outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Atrás
                </Button>
                {isLastQuestion ? (
                  <Button
                    data-testid="submit-assessment-btn"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="btn-primary flex-1"
                  >
                    {submitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        Ver mi resultado
                        <CheckCircle className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button data-testid="next-question-btn" onClick={handleNext} className="btn-primary flex-1">
                    Siguiente
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
