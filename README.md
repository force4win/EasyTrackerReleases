# 🚀 Generador de Releases

> Aplicación de escritorio para automatizar y gestionar visualmente el flujo de releases en proyectos Git multi-repositorio.

![Version](https://img.shields.io/badge/version-0.1.0-blue?style=flat-square)
![Electron](https://img.shields.io/badge/Electron-33-47848F?style=flat-square&logo=electron)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

---

## 📋 Tabla de Contenidos

- [¿Qué es esto?](#-qué-es-esto)
- [Características](#-características)
- [Capturas de Pantalla](#-capturas-de-pantalla)
- [Tech Stack](#-tech-stack)
- [Arquitectura](#-arquitectura)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Instalación y Desarrollo](#-instalación-y-desarrollo)
- [Cómo Usar](#-cómo-usar)
- [Flujos de Trabajo](#-flujos-de-trabajo)
- [Design System — Frutiger Aero](#-design-system--frutiger-aero)
- [Modelo de Datos](#-modelo-de-datos)
- [Sistema de Persistencia](#-sistema-de-persistencia)
- [Motor de Scripts Git](#-motor-de-scripts-git)
- [Testing](#-testing)
- [Build y Distribución](#-build-y-distribución)
- [Roadmap](#-roadmap)

---

## ¿Qué es esto?

**Generador de Releases** es una aplicación de escritorio (Electron) que simplifica la gestión de merges y releases en equipos que trabajan con múltiples repositorios Git y ramas con flujos de trabajo definidos (DEV → QA → STG → PROD).

### El problema que resuelve

En proyectos con múltiples repos y ambientes, hacer un release implica repetir manualmente en cada repositorio una secuencia de comandos Git (checkouts, pulls, merges de ramas intermedias, etc.). Este proceso es:
- **Tedioso**: decenas de comandos repetitivos
- **Propenso a errores**: un paso omitido rompe el release
- **Difícil de coordinar**: cuando hay conflictos de merge, se pierde el contexto de qué faltaba ejecutar

### La solución

Esta herramienta permite:
1. **Configurar visualmente** la topología de branches de cada repositorio (en un canvas interactivo con React Flow)
2. **Definir scripts** de transición entre ramas que se guardan por repositorio
3. **Agrupar repositorios** en un "Release" y ejecutar todos los scripts en lote con un solo clic
4. **Pausar y reanudar** automáticamente cuando ocurren conflictos de merge, para que el desarrollador los resuelva en su IDE y continúe desde donde quedó
5. **Aislar contextos** con "Ambientes Globales": diferentes entornos (trabajo, personal) con sus propios repos y releases

---

## ✨ Características

### 🌍 Ambientes Globales (Environments)
- Crea ambientes de trabajo aislados (ej. "Desarrollo Local", "Trabajo")
- Cada ambiente tiene sus propios repositorios y releases completamente independientes
- Cambio instantáneo entre ambientes con persistencia de sesión (se recuerda el último ambiente activo)
- Identificación visual por color e icono personalizados
- Eliminación en cascada: al borrar un ambiente se eliminan todos sus datos asociados

### 🗂️ Gestión de Repositorios
- CRUD de repositorios Git locales con selector de carpeta nativo del sistema operativo
- Validación del estado del repositorio (cambios sin commit, archivos sin seguimiento, rama actual)
- Canvas visual interactivo (React Flow) para ver la topología de branches
- Nodos arrastrables y reposicionables con estado persistente

### 🌿 Branches y Conexiones
- Registro de branches con tipo lógico: `DEV`, `QA`, `STG`, `CV`, `PROD`
- Conexiones direccionales entre branches como flechas en el canvas
- Generación automática del script Git de 9 pasos para cada conexión:
  ```bash
  git checkout {source}
  git pull
  git checkout {target}
  git pull
  git branch -D {target}_merge       # elimina rama temporal si existía
  git checkout -b {target}_merge     # crea rama temporal limpia
  git merge {source}                 # merge al temporal
  git checkout {target}
  git merge {target}_merge           # merge al destino final
  ```
- Script completamente editable por el usuario en un editor inline

### 🚀 Releases
- Creación de releases agrupando repositorios y sus conexiones seleccionadas
- Vista resumen de todo lo que incluye el release antes de ejecutar
- **Ejecución en lote**: ejecuta las transiciones de todos los repos secuencialmente con barra de progreso
- Consola embebida con streaming en tiempo real de la salida de cada comando Git

### ⚡ Motor de Ejecución Inteligente
- Ejecución línea por línea con `spawn` (streaming real, no buffered)
- Detección automática de la shell correcta:
  - Git Bash (`sh.exe`) en Windows si está disponible
  - `cmd.exe` como fallback en Windows
  - `/bin/sh` en macOS/Linux
- **Detección de conflictos de merge**: si un `git merge` produce un CONFLICT, la ejecución se pausa automáticamente
- `git branch -D` con rama inexistente → error **no fatal** (la rama simplemente no existía, se continúa)
- Sanitización de comandos legacy (elimina sintaxis bash `if..then..fi` incompatible con Windows)

### 🛑 Resolución Interactiva de Conflictos
1. El motor detecta "CONFLICT" o "Automatic merge failed" en la salida del merge
2. Se pausa la ejecución y se muestra el modal `ConflictResolutionModal`
3. El desarrollador resuelve los conflictos en su IDE externo
4. Al confirmar "OK, todo solucionado", la app reanuda ejecutando los comandos restantes
5. Si cancela, se aborta el batch sin ejecutar los pasos pendientes

### 🎨 UI Frutiger Aero
- Diseño glassmorphism con `backdrop-filter: blur`
- Botones gel glossy con gradientes y specular highlights
- Fondos atmosféricos con degradés radiales y lens flare
- Tipografía con text-glow para títulos sobre fondos oscuros
- Totalmente responsivo entre pantallas

---

## 💻 Tech Stack

| Categoría | Tecnología | Versión | Rol |
|-----------|-----------|---------|-----|
| **Runtime de escritorio** | Electron | 33 | Proceso main + ventana nativa |
| **Build tool** | Vite + vite-plugin-electron | 6 | Bundling HMR en dev, build en prod |
| **Frontend** | React | 18.3 | UI declarativa en el renderer |
| **Lenguaje** | TypeScript | 5.6 | Tipado estático estricto en ambos procesos |
| **Estado** | Zustand | 5 | Store centralizado del renderer |
| **Canvas** | React Flow (@xyflow/react) | 12 | Grafo interactivo de branches |
| **Routing** | React Router DOM | 7 | Navegación Hash-based entre páginas |
| **Estilos** | TailwindCSS | 4 | Utilidades CSS + design system custom |
| **Persistencia** | JSON plano (fs) | — | Archivo `data.json` en `userData` |
| **Identificadores** | uuid | 14 | IDs únicos v4 para todas las entidades |
| **Testing** | Vitest | 5 | Tests unitarios del renderer |
| **Empaquetado** | electron-builder | 25 | Instalador NSIS para Windows |

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    RENDERER PROCESS                      │
│   React + TypeScript + TailwindCSS + Zustand            │
│                                                         │
│   ┌──────────┐  ┌──────────┐  ┌───────────────────┐    │
│   │ HomePage │  │ Repos    │  │ ReleasesPage       │    │
│   │          │  │ Page     │  │ (batch execution)  │    │
│   └──────────┘  └──────────┘  └───────────────────┘    │
│         │              │                │               │
│   ┌─────▼──────────────▼────────────────▼─────────┐    │
│   │              useAppStore (Zustand)              │    │
│   │   environments, repositories, releases, etc.   │    │
│   └─────────────────────┬──────────────────────────┘    │
│                         │ window.electronAPI.*           │
└─────────────────────────│──────────────────────────────┘
                          │ contextBridge (IPC seguro)
┌─────────────────────────│──────────────────────────────┐
│                  PRELOAD SCRIPT                         │
│   preload.ts → expone electronAPI al renderer          │
│   (contextBridge.exposeInMainWorld)                    │
└─────────────────────────│──────────────────────────────┘
                          │ ipcRenderer.invoke / ipcMain.handle
┌─────────────────────────│──────────────────────────────┐
│                   MAIN PROCESS                          │
│                                                         │
│   ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│   │ ipc-handlers │  │ script-runner│  │ git-service│  │
│   │ (CRUD + IPC) │  │ (spawn Git)  │  │ (branches) │  │
│   └──────┬───────┘  └──────────────┘  └────────────┘  │
│          │                                              │
│   ┌──────▼───────────────────────────────────────┐     │
│   │               database.ts                    │     │
│   │   getDB() / setDB() / updateCollection()     │     │
│   │   Caché en memoria + fs.writeFileSync        │     │
│   └──────────────────┬───────────────────────────┘     │
│                      │                                  │
└──────────────────────│─────────────────────────────────┘
                       │
              ┌────────▼────────┐
              │   data.json     │
              │  (app.userData) │
              └─────────────────┘
```

### Principios de Diseño Arquitectónico

- **Proceso separado**: Todo acceso a datos y Git se ejecuta en el main process. El renderer nunca toca el sistema de archivos directamente.
- **IPC tipado**: `vite-env.d.ts` declara la interfaz completa de `window.electronAPI` con tipos TS exactos.
- **Caché en memoria**: `database.ts` mantiene la BD en RAM para lecturas rápidas. Cada escritura es síncrona al disco.
- **Persistencia simple**: JSON plano (`data.json`). Sin SQLite ni ORMs. Simple de auditar, respaldar y migrar.
- **Migración automática**: Al arrancar, `database.ts` detecta si faltan campos nuevos y migra los datos automáticamente (ej. creación del ambiente "Default" en la primera ejecución tras la actualización).

---

## 📁 Estructura del Proyecto

```
codigo/
│
├── electron/                    # Main process (Node.js)
│   ├── main.ts                  # Ventana Electron, lifecycle, menú
│   ├── database.ts              # Persistencia JSON + caché + migración automática
│   ├── ipc-handlers.ts          # Todos los handlers ipcMain.handle() — CRUD completo
│   ├── preload.ts               # contextBridge → expone electronAPI seguro
│   ├── script-runner.ts         # Motor de ejecución línea-a-línea con spawn
│   └── git-service.ts           # Utilidades Git: getBranches, validateRepoState
│
├── src/                         # Renderer process (React)
│   ├── App.tsx                  # Rutas + initializeApp() al montar
│   ├── main.tsx                 # Entry point del renderer
│   ├── index.css                # Design system Frutiger Aero + Tailwind
│   ├── vite-env.d.ts            # Declaración de tipos de window.electronAPI
│   │
│   ├── pages/
│   │   ├── HomePage.tsx         # Landing: selector de ambiente + tarjetas de acceso
│   │   ├── RepositoriesPage.tsx # Sidebar repos + canvas de branches
│   │   └── ReleasesPage.tsx     # Gestión de releases + ejecución batch + conflictos
│   │
│   ├── components/
│   │   ├── EnvironmentModal.tsx     # Modal crear/editar ambiente (preview, colores, iconos)
│   │   ├── EnvironmentSelector.tsx  # Dropdown glassmorphism de selección de ambiente
│   │   ├── RepositoryModal.tsx      # Modal crear/editar repositorio
│   │   ├── BranchModal.tsx          # Modal crear/editar branch (tipo, nombre)
│   │   ├── BranchCanvas.tsx         # Canvas React Flow con generador de scripts
│   │   ├── BranchNode.tsx           # Nodo custom del canvas (por tipo de branch)
│   │   ├── BranchEdge.tsx           # Edge custom del canvas (con label de script)
│   │   ├── ReleaseModal.tsx         # Modal crear release
│   │   ├── ReleaseSummaryCard.tsx   # Card resumen del release (repos + conexiones)
│   │   ├── ReleaseWorkspace.tsx     # Workspace del release (agregar repos, preview)
│   │   ├── AddRepoToReleaseModal.tsx# Modal para agregar repo al release
│   │   ├── ConsoleDrawer.tsx        # Drawer con output streaming + modal conflictos
│   │   ├── ConflictResolutionModal.tsx # Modal de resolución de conflictos
│   │   ├── BatchExecutionModal.tsx  # Modal de progreso de ejecución en lote
│   │   └── Toast.tsx               # Notificaciones toast
│   │
│   ├── store/
│   │   └── useAppStore.ts       # Zustand store: estado global + todas las acciones
│   │
│   ├── types/
│   │   └── models.ts            # Interfaces TypeScript + DatabaseSchema + DEFAULT_DB
│   │
│   └── __tests__/
│       ├── branch-edge.test.ts  # Tests del edge del canvas
│       └── git-script.test.ts   # Tests del generador de scripts Git
│
├── index.html                   # Entry HTML del renderer
├── vite.config.ts               # Config Vite + plugins electron
├── tsconfig.json                # TypeScript para renderer
├── tsconfig.node.json           # TypeScript para main process
└── package.json                 # Dependencies + scripts + electron-builder config
```

---

## 🚀 Instalación y Desarrollo

### Requisitos Previos

- **Node.js** ≥ 18
- **Git** instalado y en el PATH del sistema
- **Windows 10/11** (recomendado; macOS/Linux compatible pero no probado)
- En Windows: [Git for Windows](https://gitforwindows.org/) para tener Git Bash disponible

### Instalación

```bash
# Clonar o posicionarse en el directorio
cd "codigo"

# Instalar dependencias
npm install
```

### Comandos de Desarrollo

```bash
# Iniciar en modo desarrollo (Vite HMR + Electron)
npm run dev

# Iniciar Electron con build previo (más cercano a producción)
npm run electron:dev

# Verificar tipos TypeScript sin compilar
npx tsc --noEmit

# Ejecutar tests unitarios
npm test

# Vista previa del build web (sin Electron)
npm run preview
```

> **Nota**: `npm run dev` usa `vite` que levanta el renderer con HMR. Para que Electron recoja los cambios, usar `npm run electron:dev` que hace build completo antes.

---

## 📖 Cómo Usar

### Paso 0: Configurar un Ambiente

Al abrir la app por primera vez con datos existentes, se crea automáticamente un ambiente **"Default"** con todos tus datos previos. En adelante:

1. En el **banner de Ambiente Activo** (parte superior de la pantalla de inicio), haz clic en el selector
2. Elige un ambiente existente o crea uno nuevo con **"＋ Nuevo Ambiente"**
3. Configura nombre, descripción, icono emoji y color identificador
4. El ambiente queda activo y todas las operaciones siguientes operarán dentro de él

### Paso 1: Configurar Repositorios

1. Haz clic en **"Prepare Repositories"** en la pantalla de inicio
2. En el panel lateral, haz clic en **"＋ Agregar Repositorio"**
3. Ingresa el nombre y selecciona la carpeta raíz del repositorio Git con el selector nativo
4. El repositorio aparece en el panel lateral; selecciónalo para abrir su canvas

#### Canvas de Branches

5. Con el repositorio seleccionado, el canvas central muestra sus branches
6. Haz clic en **"＋ Branch"** para agregar un branch:
   - Ingresa el nombre real del branch en Git (ej. `main`, `develop`, `feature/qa`)
   - Selecciona el tipo lógico: `DEV`, `QA`, `STG`, `CV` o `PROD`
7. Arrastra los nodos para organizar visualmente la topología
8. Para crear una **conexión/flecha** entre dos branches: arrastra desde el handle (punto) de un nodo al otro
9. Haz clic en la **etiqueta de la flecha** para ver/editar el script de esa transición

#### Script de Transición

Cada conexión tiene un script Git editable. El script default generado automáticamente es:

```bash
git checkout {sourceBranch}     # ir al origen
git pull                        # actualizar
git checkout {targetBranch}     # ir al destino
git pull                        # actualizar
git branch -D {target}_merge    # limpiar rama temporal anterior
git checkout -b {target}_merge  # crear rama temporal limpia
git merge {sourceBranch}        # merge al temporal
git checkout {targetBranch}     # volver al destino
git merge {target}_merge        # merge final al destino
```

Puedes editarlo completamente para adaptarlo a tu flujo.

### Paso 2: Crear y Ejecutar un Release

1. Haz clic en **"Prepare Release"** en la pantalla de inicio
2. Crea un nuevo release con **"＋ Nuevo Release"**
3. Dentro del release, haz clic en **"＋ Agregar Repositorio"**
4. Selecciona el repositorio y las **conexiones** (transiciones) que quieres incluir en este release
5. Repite para todos los repositorios que forman parte del release
6. Cuando esté todo listo, haz clic en **"▶ Ejecutar Release"**

#### Durante la Ejecución

- Se abre la **consola de salida** con streaming en tiempo real de cada comando Git
- Cada paso muestra: ✔ éxito, ❌ error, ℹ️ información
- Si hay un **conflicto de merge**:
  1. La ejecución se pausa automáticamente
  2. Aparece el modal de resolución de conflictos
  3. Abre tu IDE, resuelve los conflictos, haz `git add .`
  4. Vuelve a la app y haz clic en **"OK, todo solucionado"**
  5. La ejecución reanuda desde el siguiente comando

---

## 🔄 Flujos de Trabajo

### Flujo Típico de Release

```
Desarrollador crea release → Agrega Repo A (DEV→QA) + Repo B (DEV→QA)
     ↓
Ejecuta release
     ↓
Script Repo A:
  git checkout develop → git pull → git checkout qa → git pull
  git branch -D qa_merge → git checkout -b qa_merge → git merge develop
  ┌─ Conflicto detectado ──────────────────────────────────────────┐
  │  Modal: "Hay conflictos en Repo A. Resuélvelos en tu IDE."    │
  │  [Usuario abre IDE, resuelve, hace git add .]                 │
  │  [Usuario hace clic en "OK, todo solucionado"]                │
  └───────────────────────────────────────────────────────────────┘
  git checkout qa → git merge qa_merge ✔
     ↓
Script Repo B:
  ... (ejecución limpia sin conflictos) ✔
     ↓
Release completado exitosamente ✅
```

### Flujo de Ambientes

```
Ambiente "Trabajo"          Ambiente "Desarrollo Local"
├── Repo: api-backend       ├── Repo: mi-proyecto
├── Repo: frontend-web      ├── Repo: mi-libreria
├── Release: Sprint 23      └── Release: v1.0-beta
└── Release: Hotfix 5.2

Al seleccionar "Trabajo" → Solo se ven repos y releases de trabajo
Al seleccionar "Local"   → Solo se ven repos y releases personales
```

---

## 🎨 Design System — Frutiger Aero

El proyecto implementa un design system inspirado en la estética **Frutiger Aero** (ca. 2004–2013): glassmorphism, materiales translúcidos, colores vibrantes y una sensación de profundidad y luz.

### Clases CSS Custom (definidas en `src/index.css`)

| Clase | Descripción |
|-------|-------------|
| `.fa-background` | Fondo radial atmosférico `#040d1a → #0a2540 → #0d3558` |
| `.fa-lens-flare` | Elemento de resplandor de luz posicionado absolutamente |
| `.fa-glass-panel` | Panel glassmorphism: `backdrop-blur-xl`, borde sutil, gradiente interior |
| `.fa-glass-window` | Modal glass: fondo más oscuro con borde iluminado |
| `.fa-glass-header` | Header de panel con specular split highlight cyan |
| `.fa-glass-header-orange` | Variante naranja del header |
| `.fa-glass-header-amber` | Variante ámbar del header |
| `.fa-btn-green` | Botón gel glossy verde con gradiente + specular |
| `.fa-btn-cyan` | Botón gel glossy cyan |
| `.fa-btn-purple` | Botón gel glossy púrpura |
| `.fa-btn-glass` | Botón gel transparente (para acciones secundarias) |
| `.fa-text-glow` | Texto con glow cyan para títulos principales |
| `.fa-text-shadow` | Sombra de texto para legibilidad sobre glass |

### Paleta de Colores

```
Fondo profundo:   #040d1a
Panel glass:      rgba(255,255,255,0.06) + blur(20px)
Acento principal: #00e5ff (cyan)
Acento secundario: #7c3aed (púrpura)
Acento éxito:     #16a34a (verde)
Acento advertencia: #ea580c (naranja)
Texto principal:  #ffffff
Texto secundario: rgba(255,255,255,0.7)
```

### Paddings Base

```css
/* Botones */
.fa-btn-*: padding: 0.65rem 1.5rem;

/* Headers de panel */
.fa-glass-header*: padding: 1.25rem 2rem;

/* Inputs */
inputs: px-4 py-3;

/* Modales */
max-width: max-w-lg (448px) o max-w-xl (576px);

/* Forms */
padding: p-8; gap: space-y-6;
```

---

## 🗄️ Modelo de Datos

Todas las entidades se definen en `src/types/models.ts` y se persisten en `data.json`.

### Entidades

```typescript
Environment {
  id: string          // UUID v4
  name: string        // "Trabajo", "Personal"
  description: string // "Proyectos de la empresa"
  color: string       // "#00e5ff" (hex)
  icon: string        // "💼" (emoji)
  createdAt: string   // ISO 8601
}

Repository {
  id: string
  name: string         // Nombre descriptivo
  folderPath: string   // Ruta absoluta al repo Git
  environmentId: string // Ambiente al que pertenece
  createdAt: string
}

Branch {
  id: string
  name: string          // Nombre real en Git (ej. "develop")
  branchType: BranchType // 'DEV'|'QA'|'STG'|'CV'|'PROD'
  repositoryId: string
  position: { x, y }   // Posición en el canvas
}

Connection {
  id: string
  sourceBranchId: string
  targetBranchId: string
  repositoryId: string
  script: string   // Comandos Git (multi-línea)
  label: string    // "DEV → QA"
}

Release {
  id: string
  name: string
  environmentId: string
  createdAt: string
}

ReleaseRepository {
  id: string
  releaseId: string
  repositoryId: string
  connectionIds: string[]  // Conexiones incluidas en este release
}

AppSettings {
  lastActiveEnvironmentId: string | null
}
```

### Relaciones

```
Environment 1──n Repository
Environment 1──n Release
Repository  1──n Branch
Repository  1──n Connection
Branch      n──m Branch (vía Connection)
Release     n──m Repository (vía ReleaseRepository)
ReleaseRepository 1──n Connection (connectionIds[])
```

---

## 💾 Sistema de Persistencia

### Ubicación del archivo

El archivo `data.json` se almacena en la carpeta de datos de usuario de Electron:

| OS | Ruta |
|----|------|
| Windows | `%APPDATA%\generador-de-releases\data.json` |
| macOS | `~/Library/Application Support/generador-de-releases/data.json` |
| Linux | `~/.config/generador-de-releases/data.json` |

### Migración Automática

Al iniciar, `database.ts` ejecuta `migrateIfNeeded()`:

1. Lee el `data.json` existente
2. Si `environments` está vacío (versión anterior sin ambientes), crea el ambiente **"Default"**
3. Asigna `environmentId` del ambiente "Default" a todos los repositorios y releases existentes que no tengan uno
4. Guarda los cambios automáticamente

Esto garantiza **compatibilidad hacia atrás** sin pérdida de datos al actualizar.

### API de Persistencia

```typescript
getDB(): DatabaseSchema          // Lee desde caché (o disco si no hay caché)
setDB(data: DatabaseSchema)      // Escribe todo el objeto al disco
updateCollection(key, updater)   // Helper genérico para actualizar una colección
```

---

## ⚙️ Motor de Scripts Git

`electron/script-runner.ts` implementa la ejecución segura de scripts Git:

### Detección de Shell

```typescript
// En Windows, busca Git Bash primero:
'C:\\Program Files\\Git\\bin\\sh.exe'
'C:\\Program Files\\Git\\bin\\bash.exe'
// Si no existe, usa cmd.exe como fallback
// En macOS/Linux: /bin/sh
```

### Ejecución Línea a Línea

Cada línea del script se ejecuta como un proceso independiente con `spawn`. Esto permite:
- **Streaming en tiempo real** de stdout/stderr (no espera a que termine el proceso)
- **Control granular**: si una línea falla, se detiene y reporta exactamente qué falló
- **Comandos restantes**: se devuelven al frontend para poder reanudar tras resolver un conflicto

### Detección de Conflictos

```typescript
const isConflictErr = output.toLowerCase().includes('conflict')
                   || output.toLowerCase().includes('automatic merge failed')
const isMergeCmd = /^git\s+merge\s+/i.test(commandLine)

if (isMergeCmd && isConflictErr) {
  return { success: false, isConflict: true, remainingLines: [...] }
}
```

### Errores No Fatales

`git branch -D <rama>` cuando la rama no existe genera un error de Git (`branch not found`) pero **no detiene** la ejecución. La aplicación lo detecta y continúa con el siguiente paso, registrando una nota informativa en la consola.

---

## 🧪 Testing

### Ejecutar Tests

```bash
npm test                    # Ejecuta todos los tests (vitest run)
npx vitest                  # Modo watch interactivo
npx vitest run --reporter=verbose  # Con detalle de cada test
```

### Tests Existentes

| Archivo | Tests | Descripción |
|---------|-------|-------------|
| `branch-edge.test.ts` | 2 | Renderizado del componente BranchEdge |
| `git-script.test.ts` | 3 | Generación del script Git por defecto |

### Verificación Completa (antes de hacer PR o release)

```bash
npx tsc --noEmit    # 0 errores de tipos
npm test            # 5/5 tests
npx vite build      # build exitoso (3 bundles: renderer, main, preload)
```

---

## 📦 Build y Distribución

### Build de Producción

```bash
npm run build
```

Este comando:
1. Compila TypeScript del main process (`tsc`)
2. Genera bundle del renderer con Vite (`vite build`)
3. Empaqueta el instalador con electron-builder

### Salida

```
release-builds/
└── Generador de Releases Setup 0.1.0.exe   # Instalador NSIS para Windows
```

### Configuración electron-builder

```json
{
  "appId": "com.generadordereleases.app",
  "productName": "Generador de Releases",
  "win": { "target": "nsis" },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true
  }
}
```

---

## 🗺️ Roadmap

### ✅ Completado
- [x] Scaffold Electron + Vite + React + TypeScript
- [x] Sistema de navegación y pantalla de inicio
- [x] Capa de persistencia JSON con caché en memoria
- [x] CRUD de repositorios con selector de carpeta nativo
- [x] Canvas de branches con React Flow (nodos y conexiones custom)
- [x] Editor de scripts Git por conexión
- [x] Consola embebida con streaming en tiempo real
- [x] Releases: CRUD, workspace, vista resumen, ejecución en lote
- [x] Manejo de errores y resiliencia (conflictos, errores no fatales)
- [x] UI/UX completa con Frutiger Aero (glassmorphism, gel buttons)
- [x] Suite de testing (Vitest)
- [x] **Ambientes Globales**: aislamiento completo por entorno de trabajo
- [x] Migración automática de datos al actualizar

### 🔄 En Progreso / Próximo
- [ ] Historial de ejecuciones con logs persistentes por release
- [ ] Export/Import de configuración (backup de `data.json`)
- [ ] Notificaciones nativas del sistema al completar un release
- [ ] Drag & drop de repositorios dentro del release para ordenar la ejecución

### 💡 Ideas Futuras
- [ ] Soporte para múltiples conexiones seleccionadas en un release por repo
- [ ] Plantillas de scripts reutilizables
- [ ] Integración con GitHub/GitLab API para crear releases remotos
- [ ] Modo oscuro/claro (actualmente siempre oscuro)
- [ ] Internacionalización (i18n)

---

## 📄 Licencia

MIT © 2024

---

<div align="center">
  <sub>Construido con ❤️ usando Electron, React y la estética Frutiger Aero</sub>
</div>
