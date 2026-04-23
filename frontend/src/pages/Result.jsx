import { useParams, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Star, Target, ChartLineUp, Rocket } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

const levelConfig = {
  1: {
    title: "Contador Inseguro",
    subtitle: "Tu siguiente paso es ganar claridad y confianza",
    description: "Estás construyendo tus bases. Hoy el mayor impulso vendrá de fortalecer tu criterio técnico, ordenar tu aprendizaje y sentirte más seguro al responder y cobrar.",
    icon: Target,
    color: "#7bb9d6",
    showCalendly: false,
    videoId: "dQw4w9WgXcQ",
  },
  2: {
    title: "Contador Operativo",
    subtitle: "Ya cumples, ahora toca elevar tu criterio",
    description: "Tienes tracción y experiencia operativa, pero aún hay espacio para fortalecer seguridad, estructura y posicionamiento para dejar de solo ejecutar y empezar a influir más.",
    icon: Star,
    color: "#d8b66a",
    showCalendly: false,
    videoId: "dQw4w9WgXcQ",
  },
  3: {
    title: "Contador Técnico",
    subtitle: "Tu conocimiento ya genera valor",
    description: "Ya cuentas con una base técnica sólida. El siguiente nivel consiste en estructurar mejor tu valor, comunicarlo con seguridad y convertirlo en mejores clientes e ingresos.",
    icon: ChartLineUp,
    color: "#0a5594",
    showCalendly: true,
    videoId: "dQw4w9WgXcQ",
  },
  4: {
    title: "Contador Estratégico",
    subtitle: "Ya no solo ejecutas, orientas decisiones",
    description: "Tu perfil muestra criterio, análisis y capacidad para generar recomendaciones de alto valor. Estás en posición de crecer en ingresos, posicionamiento y sofisticación de tu servicio.",
    icon: Trophy,
    color: "#c2111d",
    showCalendly: true,
    videoId: "dQw4w9WgXcQ",
  },
  5: {
    title: "Contador Consultor",
    subtitle: "Tu perfil está listo para escalar",
    description: "Operas con un enfoque consultivo y estratégico. Tu reto ya no es solo mejorar técnicamente, sino escalar tu modelo, aumentar impacto y construir una práctica de mayor nivel.",
    icon: Rocket,
    color: "#950006",
    showCalendly: true,
    videoId: "dQw4w9WgXcQ",
  },
};

export default function Result() {
  const { level } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const levelNum = parseInt(level, 10);
  const config = levelConfig[levelNum] || levelConfig[1];
  const { score, name } = location.state || { score: 0, name: "Invitado" };
  const Icon = config.icon;

  return (
    <div className="assessment-page">
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="assessment-container"
      >
        <div className="w-full max-w-5xl">
          <div className="brand-lockup mb-8">
            <span className="brand-wordmark text-[4rem]">
              <span>CE</span>
              <span>FIN</span>
            </span>
            <span className="brand-caption">Centro de Estudios Fiscales, Innovación y Negocios</span>
          </div>

          <div className="assessment-card result-hero">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 180 }}
              className="result-icon"
              style={{ background: `linear-gradient(135deg, ${config.color}, var(--cefin-wine))` }}
            >
              <Icon className="h-11 w-11 text-white" weight="fill" />
            </motion.div>

            <div>
              <p className="category-badge mb-5 inline-flex">Resultado del diagnóstico</p>
              <p className="result-greeting">Hola, {name}</p>
              <h1 className="hero-title">{config.title}</h1>
              <p className="hero-description">{config.subtitle}</p>
            </div>

            <div className="result-stats">
              <div>
                <span>{score}</span>
                <p>Puntuación total</p>
              </div>
              <div>
                <span>Nivel {levelNum}</span>
                <p>Clasificación CEFIN</p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="relative z-10 max-w-5xl mx-auto px-5 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="card-swiss mb-8"
        >
          <h2 className="text-2xl font-bold mb-4 text-white">Lectura de tu resultado</h2>
          <p className="text-[var(--text-muted)] text-lg leading-relaxed">{config.description}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="card-swiss mb-8"
          data-testid="vsl-video-container"
        >
          <h3 className="text-xl font-bold mb-4 text-white">Mira la presentación recomendada</h3>
          <div className="video-container">
            <iframe
              data-testid="vsl-video"
              src={`https://www.youtube.com/embed/${config.videoId}`}
              title="Video de ventas"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </motion.div>

        {config.showCalendly && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="card-swiss mb-8"
            data-testid="calendly-container"
          >
            <h3 className="text-xl font-bold mb-4 text-white">Agenda una consulta</h3>
            <p className="text-[var(--text-muted)] mb-6">
              Por tu resultado, tiene sentido revisar una ruta más personalizada para crecer en ingresos,
              criterio y posicionamiento.
            </p>
            <div className="calendly-embed border border-white/10 bg-white/[0.04] flex items-center justify-center" data-testid="calendly-embed">
              <div className="text-center p-8">
                <p className="text-lg font-bold text-white mb-2">Calendario de citas</p>
                <p className="text-[var(--text-muted)] text-sm">
                  Aquí conectaremos el widget de Calendly cuando tengamos el enlace final.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="text-center"
        >
          <Button data-testid="retake-assessment-btn" onClick={() => navigate("/")} variant="outline" className="btn-outline">
            Repetir diagnóstico
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
