--- src/App.tsx (原始)
export default function App() {
  return (
    <div/>
  );
}


+++ src/App.tsx (修改后)
import { useState, useEffect } from 'react';

const capabilities = [
  {
    icon: '🌐',
    title: 'Sitios Web Completos',
    description: 'Landing pages, portfolios, blogs, tiendas online y más. Diseño responsive y moderno.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: '⚛️',
    title: 'Aplicaciones React',
    description: 'SPAs complejas con componentes reutilizables, hooks personalizados y estado global.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: '🎨',
    title: 'Diseño con Tailwind CSS',
    description: 'Interfaces hermosas con gradientes, animaciones, dark mode y diseño responsive.',
    color: 'from-teal-500 to-emerald-500',
  },
  {
    icon: '📊',
    title: 'Dashboards & Gráficos',
    description: 'Paneles de control, visualizaciones de datos y herramientas de análisis.',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: '🎮',
    title: 'Juegos & Interactividad',
    description: 'Juegos en el navegador, quizzes interactivos y experiencias gamificadas.',
    color: 'from-indigo-500 to-violet-500',
  },
  {
    icon: '🔌',
    title: 'Integración de APIs',
    description: 'Conexión con servicios externos, REST APIs, y datos en tiempo real.',
    color: 'from-rose-500 to-pink-500',
  },
  {
    icon: '📱',
    title: 'Diseño Responsive',
    description: 'Perfecto en móviles, tablets y desktop. Mobile-first approach.',
    color: 'from-amber-500 to-yellow-500',
  },
  {
    icon: '🚀',
    title: 'Performance & SEO',
    description: 'Código optimizado, carga rápida y mejores prácticas de SEO.',
    color: 'from-green-500 to-lime-500',
  },
];

const examples = [
  { name: 'Dashboard Analytics', emoji: '📈', desc: 'Panel de métricas con gráficos' },
  { name: 'E-commerce', emoji: '🛒', desc: 'Tienda online con carrito' },
  { name: 'Portfolio', emoji: '💼', desc: 'Sitio personal profesional' },
  { name: 'Blog', emoji: '📝', desc: 'Plataforma de artículos' },
  { name: 'Landing Page', emoji: '🎯', desc: 'Página de aterrizaje' },
  { name: 'Calculadora', emoji: '🧮', desc: 'Herramientas interactivas' },
  { name: 'Chat UI', emoji: '💬', desc: 'Interfaz de mensajería' },
  { name: 'Mapa Interactivo', emoji: '🗺️', desc: 'Visualizaciones geográficas' },
];

function TypingEffect({ text, speed = 50 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timer = setTimeout(() => {
        setDisplayed(prev => prev + text[index]);
        setIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timer);
    }
  }, [index, text, speed]);

  return <span>{displayed}<span className="animate-pulse">|</span></span>;
}

function CapabilityCard({ icon, title, description, color, index }: {
  icon: string;
  title: string;
  description: string;
  color: string;
  index: number;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative group p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10
        transition-all duration-500 hover:scale-105 hover:bg-white/10 hover:shadow-2xl
        hover:border-white/20 cursor-pointer`}
      style={{ animationDelay: `${index * 100}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${color} opacity-0
        group-hover:opacity-10 transition-opacity duration-500`} />
      <div className="relative z-10">
        <div className={`text-4xl mb-4 transition-transform duration-300 ${isHovered ? 'scale-125' : ''}`}>
          {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function App() {
  const [activeSection, setActiveSection] = useState('hero');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['hero', 'capabilities', 'examples', 'prompt'];
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 200) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute w-96 h-96 rounded-full bg-purple-500/20 blur-3xl transition-all duration-1000"
          style={{
            left: `${mousePos.x * 0.02}%`,
            top: `${mousePos.y * 0.02}%`,
          }}
        />
        <div
          className="absolute w-96 h-96 rounded-full bg-blue-500/20 blur-3xl transition-all duration-1000"
          style={{
            right: `${mousePos.x * 0.015}%`,
            bottom: `${mousePos.y * 0.015}%`,
          }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-sm font-bold">
              AI
            </div>
            <span className="font-semibold text-lg">Web Builder</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            {['hero', 'capabilities', 'examples', 'prompt'].map((section) => (
              <a
                key={section}
                href={`#${section}`}
                className={`text-sm transition-colors duration-300 ${
                  activeSection === section ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {section === 'hero' ? 'Inicio' :
                 section === 'capabilities' ? 'Capacidades' :
                 section === 'examples' ? 'Ejemplos' : 'Pruébame'}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm text-gray-400">Listo para crear</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
              ¿Qué puedo hacer?
            </span>
          </h1>

          <div className="text-xl md:text-2xl text-gray-400 mb-8 h-16">
            <TypingEffect text="Puedo crear cualquier aplicación web que imagines..." speed={40} />
          </div>

          <p className="text-gray-500 max-w-2xl mx-auto mb-12 leading-relaxed">
            Soy un asistente especializado en desarrollo web con React, TypeScript, Tailwind CSS y Vite.
            Desde landing pages simples hasta aplicaciones complejas con múltiples componentes y estados.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#capabilities"
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 font-semibold
                hover:from-purple-600 hover:to-blue-600 transition-all duration-300 hover:scale-105
                hover:shadow-lg hover:shadow-purple-500/25"
            >
              Ver Capacidades ↓
            </a>
            <a
              href="#prompt"
              className="px-8 py-4 rounded-xl bg-white/5 border border-white/10 font-semibold
                hover:bg-white/10 transition-all duration-300 hover:scale-105"
            >
              ¡Pruébame! 🚀
            </a>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-1">
              <div className="w-1.5 h-3 rounded-full bg-white/40 animate-pulse" />
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section id="capabilities" className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Mis Capacidades
              </span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Todo lo que puedo construir para ti usando las últimas tecnologías web
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {capabilities.map((cap, i) => (
              <CapabilityCard key={i} {...cap} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Examples Section */}
      <section id="examples" className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Ejemplos de Proyectos
              </span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Algunos ejemplos de lo que puedo crear para ti
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {examples.map((example, i) => (
              <div
                key={i}
                className="group p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10
                  hover:border-white/20 transition-all duration-300 hover:scale-105 cursor-pointer text-center"
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  {example.emoji}
                </div>
                <h4 className="font-semibold text-sm mb-1">{example.name}</h4>
                <p className="text-xs text-gray-500">{example.desc}</p>
              </div>
            ))}
          </div>

          {/* Tech stack */}
          <div className="mt-16 p-8 rounded-2xl bg-white/5 border border-white/10">
            <h3 className="text-xl font-bold mb-6 text-center">Stack Tecnológico</h3>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                { name: 'React 18', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
                { name: 'TypeScript', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
                { name: 'Tailwind CSS', color: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
                { name: 'Vite', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
                { name: 'HTML5', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
                { name: 'CSS3', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
                { name: 'JavaScript', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
                { name: 'npm', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
              ].map((tech, i) => (
                <span
                  key={i}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium ${tech.color}
                    hover:scale-110 transition-transform duration-200 cursor-default`}
                >
                  {tech.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Prompt Section */}
      <section id="prompt" className="relative z-10 py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              ¡Pruébame Ahora!
            </span>
          </h2>
          <p className="text-gray-500 mb-12">
            Solo dime qué quieres crear y lo construiré para ti
          </p>

          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-left">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-sm">
                  👤
                </div>
                <span className="text-sm text-gray-400">Tú dices:</span>
              </div>
              <p className="text-white font-medium pl-11">
                "Crea un dashboard de analíticas con gráficos de ventas"
              </p>
            </div>

            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center animate-bounce">
                <span className="text-xs">AI</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 text-left">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-sm">
                  🤖
                </div>
                <span className="text-sm text-gray-400">Yo creo:</span>
              </div>
              <p className="text-white font-medium pl-11">
                Un dashboard completo con React, gráficos interactivos, datos en tiempo real,
                diseño responsive y dark mode. ¡Listo para usar! 🚀
              </p>
            </div>
          </div>

          <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10 border border-white/10">
            <p className="text-lg font-medium mb-2">💡 Ideas que puedes pedirme:</p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {[
                '🎵 Reproductor de música',
                '📋 App de tareas',
                '🌤️ App del clima',
                '🎲 Juego de dados',
                '📸 Galería de fotos',
                '💰 Calculadora financiera',
                '📅 Calendario',
                '🎨 Editor de colores',
              ].map((idea, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300
                    hover:bg-white/10 hover:scale-105 transition-all duration-200 cursor-default"
                >
                  {idea}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-600 text-sm">
            Creado con ❤️ usando React + TypeScript + Tailwind CSS + Vite
          </p>
          <p className="text-gray-700 text-xs mt-2">
            Esta página fue generada completamente por IA en respuesta a "¿qué puedes hacer?"
          </p>
        </div>
      </footer>
    </div>
  );
}
