# 🚀 Generador de Releases — Guía del Desarrollador & Ejecución

Este directorio contiene el código fuente de la aplicación **Generador de Releases**, construida con Electron 33, React 18, TypeScript 5, Vite 6, Tailwind CSS v4 y React Flow.

---

## ⚡ Comandos Rápidos de Terminal

```bash
# 1. Instalar todas las dependencias
npm install

# 2. Iniciar en modo desarrollo con Live Reload (HMR)
npm run dev

# 3. Ejecutar pruebas unitarias con Vitest
npm test

# 4. Verificar compilación estricta de TypeScript (0 errores)
npx tsc --noEmit

# 5. Generar build de producción (Vite + Electron)
npx vite build

# 6. Empaquetar la aplicación como instalador de Windows (.exe)
npm run build
```

El instalador ejecutable `.exe` resultante se depositará en `codigo/release-builds/`.

---

## 📁 Estructura del Código

- **`electron/`**: Proceso principal de Electron (Main process, IPC, llamadas nativas a Git, persistencia JSON).
- **`src/`**: Aplicación React (Renderer process, componentes UI, páginas, React Flow canvas, Zustand store).
- **`src/__tests__/`**: Suite de pruebas unitarias con Vitest.

Para más detalles sobre la guía de uso de la aplicación, consulta el [README principal del proyecto](../README.md).
