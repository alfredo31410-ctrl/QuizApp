import { useParams, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Star, Target, ChartLineUp, Rocket } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

const levelConfig = {
  // Textos y comportamiento por nivel. Aquí cambiamos copy, color y CTA según resultado.
  1: {
    title: "Contador Inseguro",
    subtitle: "Tu siguiente paso es ganar claridad y confianza",
    description:
      "Estás construyendo tus bases. Hoy el mayor impulso vendrá de fortalecer tu criterio técnico, ordenar tu aprendizaje y sentirte más seguro al responder y cobrar.",
    icon: Target,
    color: "#7bb9d6",
    showWhatsapp: false,
    videoId: "C5nsupc9NU8",
  },
  2: {
    title: "Contador Operativo",
    subtitle: "Ya cumples, ahora toca elevar tu criterio",
    description:
      "Tienes tracción y experiencia operativa, pero aún hay espacio para fortalecer seguridad, estructura y posicionamiento para dejar de solo ejecutar y empezar a influir más.",
    icon: Star,
    color: "#d8b66a",
    showWhatsapp: false,
    videoId: "C5nsupc9NU8",
  },
  3: {
    title: "Contador Técnico",
    subtitle: "Tu conocimiento ya genera valor",
    description:
      "Ya cuentas con una base técnica sólida. El siguiente nivel consiste en estructurar mejor tu valor, comunicarlo con seguridad y convertirlo en mejores clientes e ingresos.",
    icon: ChartLineUp,
    color: "#0a5594",
    showWhatsapp: true,
    videoId: "C5nsupc9NU8",
    whatsappMessage:
      "Acabo de terminar el diagnostico CEFIN y obtuve el nivel Contador Tecnico. Quiero recibir informacion para avanzar al siguiente nivel.",
  },
  4: {
    title: "Contador Estratégico",
    subtitle: "Ya no solo ejecutas, orientas decisiones",
    description:
      "Tu perfil muestra criterio, análisis y capacidad para generar recomendaciones de alto valor. Estás en posición de crecer en ingresos, posicionamiento y sofisticación de tu servicio.",
    icon: Trophy,
    color: "#c2111d",
    showWhatsapp: true,
    videoId: "C5nsupc9NU8",
    whatsappMessage:
      "Acabo de terminar el diagnostico CEFIN y obtuve el nivel Contador Estrategico. Quiero revisar opciones para crecer en posicionamiento e ingresos.",
  },
  5: {
    title: "Contador Consultor",
    subtitle: "Tu perfil está listo para escalar",
    description:
      "Operas con un enfoque consultivo y estratégico. Tu reto ya no es solo mejorar técnicamente, sino escalar tu modelo, aumentar impacto y construir una práctica de mayor nivel.",
    icon: Rocket,
    color: "#950006",
    showWhatsapp: true,
    videoId: "C5nsupc9NU8",
    whatsappMessage:
      "Acabo de terminar el diagnostico CEFIN y obtuve el nivel Contador Consultor. Me interesa hablar sobre escalamiento y siguientes pasos.",
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
  const whatsappLink = config.whatsappMessage
    ? `https://wa.me/5214494951431?text=${encodeURIComponent(`Hola, soy ${name}. ${config.whatsappMessage}`)}`
    : null;

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

        {config.showWhatsapp && whatsappLink && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="card-swiss mb-8"
            data-testid="whatsapp-container"
          >
            <h3 className="text-xl font-bold mb-4 text-white">Habla con nosotros por WhatsApp</h3>
            <p className="text-[var(--text-muted)] mb-6">
              Por tu resultado, tiene sentido revisar una ruta más personalizada para crecer en ingresos,
              criterio y posicionamiento. Ya te dejamos listo un mensaje de inicio.
            </p>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="btn-primary inline-flex"
              data-testid="whatsapp-cta-btn"
            >
              Abrir WhatsApp
            </a>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="text-center"
        >
          <Button
            data-testid="retake-assessment-btn"
            onClick={() => navigate("/")}
            variant="outline"
            className="btn-outline"
          >
            Repetir diagnóstico
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
