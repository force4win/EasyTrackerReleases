import { useEffect } from 'react'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import RepositoriesPage from './pages/RepositoriesPage'
import ReleasesPage from './pages/ReleasesPage'
import { ToastContainer } from './components/Toast'
import { useAppStore } from './store/useAppStore'
import './index.css'

function App() {
  const initializeApp = useAppStore(s => s.initializeApp)

  useEffect(() => {
    initializeApp()
  }, [initializeApp])

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/repositories" element={<RepositoriesPage />} />
        <Route path="/releases" element={<ReleasesPage />} />
      </Routes>
      <ToastContainer />
    </Router>
  )
}

export default App
