import { useNavigate } from 'react-router-dom'

function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg-primary)] p-8">
      {/* Header */}
      <header className="text-center mb-16">
        <h1 className="text-5xl font-bold text-[var(--color-text)] mb-3 tracking-tight">
          🚀 Generador de Releases
        </h1>
        <p className="text-lg text-[var(--color-text-muted)]">
          Gestión visual de transiciones de ramas Git y releases
        </p>
      </header>

      {/* Tarjetas principales — basado en Diapositiva 1 */}
      <main className="flex gap-12 justify-center items-stretch">
        {/* Tarjeta: Prepare Repositories */}
        <button
          onClick={() => navigate('/repositories')}
          className="group relative w-80 h-52 rounded-xl overflow-hidden
                     bg-[var(--color-primary)] border-2 border-[var(--color-primary-light)]
                     hover:border-[var(--color-accent)] hover:scale-105
                     transition-all duration-300 ease-out cursor-pointer
                     shadow-lg hover:shadow-2xl hover:shadow-[var(--color-accent)]/20"
        >
          {/* Decoración lateral izquierda */}
          <div className="absolute left-0 top-0 bottom-0 w-2 bg-[var(--color-sidebar)] 
                          group-hover:w-3 transition-all duration-300" />
          {/* Decoración lateral derecha */}
          <div className="absolute right-0 top-0 bottom-0 w-2 bg-[var(--color-sidebar)]
                          group-hover:w-3 transition-all duration-300" />
          
          <div className="flex flex-col items-center justify-center h-full px-6">
            <span className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
              🗂️
            </span>
            <span className="text-2xl font-semibold text-white text-center leading-tight">
              Prepare<br />Repositories
            </span>
          </div>
        </button>

        {/* Tarjeta: Prepare Release */}
        <button
          onClick={() => navigate('/releases')}
          className="group relative w-80 h-52 rounded-xl overflow-hidden
                     bg-[var(--color-primary)] border-2 border-[var(--color-primary-light)]
                     hover:border-[var(--color-accent)] hover:scale-105
                     transition-all duration-300 ease-out cursor-pointer
                     shadow-lg hover:shadow-2xl hover:shadow-[var(--color-accent)]/20"
        >
          {/* Decoración lateral izquierda */}
          <div className="absolute left-0 top-0 bottom-0 w-2 bg-[var(--color-sidebar)]
                          group-hover:w-3 transition-all duration-300" />
          {/* Decoración lateral derecha */}
          <div className="absolute right-0 top-0 bottom-0 w-2 bg-[var(--color-sidebar)]
                          group-hover:w-3 transition-all duration-300" />
          
          <div className="flex flex-col items-center justify-center h-full px-6">
            <span className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
              🚀
            </span>
            <span className="text-2xl font-semibold text-white text-center leading-tight">
              Prepare<br />Release
            </span>
          </div>
        </button>
      </main>

      {/* Footer */}
      <footer className="mt-auto pt-8 text-center text-[var(--color-text-muted)] text-sm">
        <p>v0.1.0 — Misión 2</p>
      </footer>
    </div>
  )
}

export default HomePage
