import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, CheckCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Assessment() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0 = intro, 1 = user info, 2+ = questions
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
      toast.error("Failed to load assessment");
      setLoading(false);
    }
  };

  const totalSteps = questions.length + 2; // intro + user info + questions
  const progress = ((step) / (totalSteps - 1)) * 100;

  const validateUserInfo = () => {
    const newErrors = {};
    if (!userInfo.name.trim()) newErrors.name = "Name is required";
    if (!userInfo.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(userInfo.email)) newErrors.email = "Invalid email";
    if (!userInfo.phone.trim()) newErrors.phone = "Phone is required";
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
      toast.success("Your information has been saved");
      setStep(2); // Move to first question
    } catch (error) {
      console.error("Failed to capture user info:", error);
      toast.error("Failed to save information. Please try again.");
    } finally {
      setCapturingInfo(false);
    }
  };

  const handleNext = () => {
    if (step >= 2) {
      const currentQuestion = questions[step - 2];
      if (!answers[currentQuestion.id]) {
        toast.error("Please select an answer");
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (step === 2) {
      // Going back from first question to user info - don't reset userId
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
      toast.error("Please select an answer");
      return;
    }

    if (!userId) {
      toast.error("Session expired. Please start again.");
      setStep(0);
      return;
    }

    setSubmitting(true);
    try {
      const responses = questions.map((q) => ({
        question: q.question,
        answer: answers[q.id]?.label || "",
        score: answers[q.id]?.score || 0,
      }));

      const payload = {
        user_id: userId,
        responses,
      };

      const response = await axios.post(`${API}/assessment/submit`, payload);
      
      // Show mock integration toasts
      toast.success("ActiveCampaign: User tagged and automation triggered (MOCKED)");
      setTimeout(() => {
        toast.success("WhatsApp: Admin notification sent (MOCKED)");
      }, 500);

      // Navigate to result page
      navigate(`/result/${response.data.level}`, {
        state: {
          score: response.data.score,
          level: response.data.level,
          name: response.data.name,
        },
      });
    } catch (error) {
      console.error("Submission failed:", error);
      toast.error(error.response?.data?.detail || "Failed to submit assessment");
    } finally {
      setSubmitting(false);
    }
  };

  const isLastQuestion = step === totalSteps - 1;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F1219]">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-[#C41E3A] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando evaluación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#0F1219] relative">
      {/* Progress bar */}
      {step > 0 && (
        <div className="progress-bar" style={{ width: `${progress}%` }} />
      )}

      <AnimatePresence mode="wait">
        {/* Intro Screen */}
        {step === 0 && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="assessment-container"
          >
            <div className="max-w-2xl text-center">
              <span className="category-badge mb-6 inline-block">Evaluación CEFIN</span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-white">
                Evaluación Fiscal e Innovación
              </h1>
              <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                Evalúa las capacidades de tu organización en estudios fiscales, innovación y contabilidad. 
                Esta evaluación toma aproximadamente 5 minutos.
              </p>
              <Button
                data-testid="start-assessment-btn"
                onClick={() => setStep(1)}
                className="btn-primary text-lg"
              >
                Comenzar Evaluación
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* User Info Screen */}
        {step === 1 && (
          <motion.div
            key="userinfo"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="assessment-container"
          >
            <div className="w-full max-w-md">
              <span className="category-badge mb-6 inline-block">Paso 1</span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-8 text-white">
                Cuéntanos sobre ti
              </h2>
              
              <div className="space-y-6">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium text-gray-300">Nombre Completo *</Label>
                  <Input
                    id="name"
                    data-testid="user-name-input"
                    value={userInfo.name}
                    onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                    className="input-swiss mt-2"
                    placeholder="Juan Pérez"
                  />
                  {errors.name && <p className="text-[#C41E3A] text-sm mt-1">{errors.name}</p>}
                </div>
                
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-300">Correo Electrónico *</Label>
                  <Input
                    id="email"
                    type="email"
                    data-testid="user-email-input"
                    value={userInfo.email}
                    onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                    className="input-swiss mt-2"
                    placeholder="juan@empresa.com"
                  />
                  {errors.email && <p className="text-[#C41E3A] text-sm mt-1">{errors.email}</p>}
                </div>
                
                <div>
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-300">Teléfono *</Label>
                  <Input
                    id="phone"
                    data-testid="user-phone-input"
                    value={userInfo.phone}
                    onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                    className="input-swiss mt-2"
                    placeholder="+52 55 1234 5678"
                  />
                  {errors.phone && <p className="text-[#C41E3A] text-sm mt-1">{errors.phone}</p>}
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <Button
                  data-testid="back-to-intro-btn"
                  onClick={handleBack}
                  variant="outline"
                  className="btn-outline"
                >
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
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
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

        {/* Question Screens */}
        {step >= 2 && questions[step - 2] && (
          <motion.div
            key={`question-${step}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="assessment-container"
          >
            <div className="w-full max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                <span className="category-badge">{questions[step - 2].category}</span>
                <span className="text-sm text-gray-400">
                  Pregunta {step - 1} de {questions.length}
                </span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-8 text-white">
                {questions[step - 2].question}
              </h2>

              <div className="space-y-4">
                {questions[step - 2].options.map((option, index) => (
                  <button
                    key={index}
                    data-testid={`option-${index}`}
                    onClick={() => handleSelectOption(questions[step - 2].id, option)}
                    className={`option-card ${
                      answers[questions[step - 2].id]?.label === option.label ? "selected" : ""
                    }`}
                  >
                    <span>{option.label}</span>
                    {answers[questions[step - 2].id]?.label === option.label && (
                      <CheckCircle className="h-6 w-6 text-[#C41E3A]" weight="fill" />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex gap-4 mt-8">
                <Button
                  data-testid="back-btn"
                  onClick={handleBack}
                  variant="outline"
                  className="btn-outline"
                >
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
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                        Enviando...
                      </>
                    ) : (
                      <>
                        Enviar Evaluación
                        <CheckCircle className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    data-testid="next-question-btn"
                    onClick={handleNext}
                    className="btn-primary flex-1"
                  >
                    Siguiente Pregunta
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
