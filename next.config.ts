import type { NextConfig } from "next";
import path from "node:path";

// `next dev` / `next build` siempre se ejecutan desde la raíz del proyecto,
// así que cwd apunta a C:\proyectos\torneos-padel
const projectRoot = process.cwd();

const nextConfig: NextConfig = {
  // Fija la raíz del workspace al proyecto. Sin esto, Next.js puede inferir
  // que la raíz es C:\ (por algún lockfile suelto) e intentar vigilar TODO el
  // disco, lo que rompe el hot-reload con el error EINVAL en C:\hiberfil.sys.
  outputFileTracingRoot: projectRoot,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },

  // Headers de seguridad aplicados a todas las rutas.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Evita que el sitio se embeba en iframes de terceros (clickjacking)
          { key: "X-Frame-Options", value: "DENY" },
          // Evita que el navegador "adivine" content-types (MIME sniffing)
          { key: "X-Content-Type-Options", value: "nosniff" },
          // No filtrar la URL completa como referrer a otros orígenes
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Deshabilita APIs del navegador que no usamos
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          // Fuerza HTTPS por 2 años (solo tiene efecto sobre HTTPS; inocuo en dev)
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },

  webpack(config, { dev }) {
    if (dev) {
      // Vigila solo el proyecto e ignora node_modules, .git y los archivos
      // del sistema de Windows que generan EINVAL en watchpack.
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          "**/node_modules/**",
          "**/.git/**",
          "**/.next/**",
          "**/hiberfil.sys",
          "**/pagefile.sys",
          "**/swapfile.sys",
          "**/DumpStack.log.tmp",
        ],
        // Asegura recompilación confiable en Windows aunque fs.watch falle.
        poll: 800,
        aggregateTimeout: 250,
      };
    }
    return config;
  },
};

export default nextConfig;
