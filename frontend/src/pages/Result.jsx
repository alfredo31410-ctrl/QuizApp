import { useParams, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Star, Target, ChartLineUp, Rocket } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

const levelConfig = {
  1: {
    title: "Nivel Fundación",
    subtitle: "Construyendo tu Base",
    description: "Estás al inicio de tu camino. Este es un excelente punto de partida para construir bases sólidas en gestión fiscal y prácticas de innovación.",
    icon: Target,
    color: "#EF4444",
    showCalendly: false,
    videoId: "dQw4w9WgXcQ",
  },
  2: {
    title: "Nivel Desarrollo",
    subtitle: "Capacidades en Crecimiento",
    description: "Tienes una comprensión sólida de los fundamentos. Enfócate en expandir tu conocimiento e implementar procesos más estructurados.",
    icon: Star,
    color: "#F97316",
    showCalendly: false,
    videoId: "dQw4w9WgXcQ",
  },
  3: {
    title: "Nivel Intermedio",
    subtitle: "Fortaleciendo Experiencia",
    description: "Demuestras buena competencia en prácticas fiscales e innovación. Hablemos sobre cómo llevar a tu organización al siguiente nivel.",
    icon: ChartLineUp,
    color: "#EAB308",
    showCalendly: true,
    videoId: "dQw4w9WgXcQ",
  },
  4: {
    title: "Nivel Avanzado",
    subtitle: "Liderando con Excelencia",
    description: "Tu organización muestra capacidades sólidas. Estás bien posicionado para optimizar e innovar aún más con orientación experta.",
    icon: Trophy,
    color: "#22C55E",
    showCalendly: true,
    videoId: "dQw4w9WgXcQ",
  },
  5: {
    title: "Nivel Experto",
    subtitle: "Líder de la Industria",
    description: "¡Desempeño excepcional! Estás operando al más alto nivel. Exploremos estrategias avanzadas y oportunidades de colaboración.",
    icon: Rocket,
    color: "#C41E3A",
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
    <div className="min-h-[100dvh] bg-[#0F1219]">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative bg-gradient-to-br from-[#1A1F2E] to-[#0F1219] text-white py-24 px-6"
      >
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920')] bg-cover bg-center opacity-5" />
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center shadow-2xl"
            style={{ backgroundColor: config.color }}
          >
            <Icon className="h-12 w-12 text-white" weight="fill" />
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg mb-2 text-gray-400"
          >
            ¡Hola, {name}!
          </motion.p>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4"
          >
            {config.title}
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-xl mb-6 text-gray-300"
          >
            {config.subtitle}
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-8"
          >
            <div className="text-center bg-[#1A1F2E] px-8 py-4 rounded-lg">
              <p className="text-4xl font-bold">{score}</p>
              <p className="text-sm text-gray-400">Puntuación Total</p>
            </div>
            <div className="w-px h-16 bg-white/20" />
            <div className="text-center bg-[#1A1F2E] px-8 py-4 rounded-lg">
              <p className="text-4xl font-bold" style={{ color: config.color }}>Nivel {levelNum}</p>
              <p className="text-sm text-gray-400">Tu Nivel</p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="card-swiss mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 text-white">Resultados de tu Evaluación</h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            {config.description}
          </p>
        </motion.div>

        {/* VSL Video */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="card-swiss mb-12"
          data-testid="vsl-video-container"
        >
          <h3 className="text-xl font-bold mb-4 text-white">Mira Nuestra Presentación</h3>
          <div className="video-container">
            <iframe
              data-testid="vsl-video"
              src={`https://www.youtube.com/embed/${config.videoId}`}
              title="Video de Ventas"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </motion.div>

        {/* Calendly Embed (only for levels 3-5) */}
        {config.showCalendly && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="card-swiss mb-12"
            data-testid="calendly-container"
          >
            <h3 className="text-xl font-bold mb-4 text-white">Agenda una Consulta</h3>
            <p className="text-gray-400 mb-6">
              Basado en los resultados de tu evaluación, nos encantaría discutir estrategias personalizadas para tu organización.
            </p>
            <div 
              className="calendly-embed border border-white/10 bg-[#252B3B] flex items-center justify-center rounded-lg"
              data-testid="calendly-embed"
            >
              <div className="text-center p-8">
                <p className="text-lg font-medium text-white mb-2">Calendario de Citas</p>
                <p className="text-gray-400 text-sm mb-4">
                  [PLACEHOLDER] El widget de Calendly aparecerá aquí
                </p>
                <p className="text-xs text-gray-500">
                  En producción, aquí se mostrará el widget de programación de Calendly
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="text-center"
        >
          <Button
            data-testid="retake-assessment-btn"
            onClick={() => navigate("/")}
            variant="outline"
            className="btn-outline"
          >
            Repetir Evaluación
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
