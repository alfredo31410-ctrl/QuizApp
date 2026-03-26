import { useParams, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Star, Target, ChartLineUp, Rocket } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

const levelConfig = {
  1: {
    title: "Foundation Level",
    subtitle: "Building Your Base",
    description: "You're at the beginning of your journey. This is a great starting point to build strong foundations in fiscal management and innovation practices.",
    icon: Target,
    color: "#EF4444",
    showCalendly: false,
    videoId: "dQw4w9WgXcQ", // Placeholder YouTube video
  },
  2: {
    title: "Developing Level",
    subtitle: "Growing Capabilities",
    description: "You have a solid understanding of the basics. Focus on expanding your knowledge and implementing more structured processes.",
    icon: Star,
    color: "#F97316",
    showCalendly: false,
    videoId: "dQw4w9WgXcQ",
  },
  3: {
    title: "Intermediate Level",
    subtitle: "Strengthening Expertise",
    description: "You demonstrate good competency in fiscal and innovation practices. Let's discuss how to take your organization to the next level.",
    icon: ChartLineUp,
    color: "#EAB308",
    showCalendly: true,
    videoId: "dQw4w9WgXcQ",
  },
  4: {
    title: "Advanced Level",
    subtitle: "Leading with Excellence",
    description: "Your organization shows strong capabilities. You're well-positioned to optimize and innovate further with expert guidance.",
    icon: Trophy,
    color: "#84CC16",
    showCalendly: true,
    videoId: "dQw4w9WgXcQ",
  },
  5: {
    title: "Expert Level",
    subtitle: "Industry Leader",
    description: "Exceptional performance! You're operating at the highest level. Let's explore advanced strategies and partnership opportunities.",
    icon: Rocket,
    color: "#0047FF",
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
  const { score, name } = location.state || { score: 0, name: "Guest" };
  const Icon = config.icon;

  return (
    <div className="min-h-[100dvh] bg-[#FBFBFB]">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative bg-[#0A0A0A] text-white py-24 px-6"
        style={{
          backgroundImage: `url(https://images.unsplash.com/photo-1761555488129-40161d6ea01e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1NzZ8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBjb3Jwb3JhdGUlMjBhcmNoaXRlY3R1cmUlMjBhYnN0cmFjdHxlbnwwfHx8fDE3NzQ1NDMxMzh8MA&ixlib=rb-4.1.0&q=85)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{ backgroundColor: config.color }}
          >
            <Icon className="h-12 w-12 text-white" weight="fill" />
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg mb-2 opacity-80"
          >
            Hello, {name}!
          </motion.p>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter mb-4"
          >
            {config.title}
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-xl mb-6 opacity-90"
          >
            {config.subtitle}
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-8"
          >
            <div className="text-center">
              <p className="text-4xl font-bold">{score}</p>
              <p className="text-sm opacity-70">Total Score</p>
            </div>
            <div className="w-px h-12 bg-white/30" />
            <div className="text-center">
              <p className="text-4xl font-bold" style={{ color: config.color }}>Level {levelNum}</p>
              <p className="text-sm opacity-70">Your Level</p>
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
          <h2 className="text-2xl font-bold mb-4">Your Assessment Results</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
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
          <h3 className="text-xl font-bold mb-4">Watch Our Presentation</h3>
          <div className="video-container">
            <iframe
              data-testid="vsl-video"
              src={`https://www.youtube.com/embed/${config.videoId}`}
              title="Video Sales Letter"
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
            <h3 className="text-xl font-bold mb-4">Schedule a Consultation</h3>
            <p className="text-muted-foreground mb-6">
              Based on your assessment results, we'd love to discuss personalized strategies for your organization.
            </p>
            <div 
              className="calendly-embed border border-black/15 bg-[#F4F4F5] flex items-center justify-center"
              data-testid="calendly-embed"
            >
              <div className="text-center p-8">
                <p className="text-lg font-medium mb-2">Calendly Scheduler</p>
                <p className="text-muted-foreground text-sm mb-4">
                  [PLACEHOLDER] Calendly embed will appear here
                </p>
                <p className="text-xs text-muted-foreground">
                  In production, this would display the actual Calendly scheduling widget
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
            Retake Assessment
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
