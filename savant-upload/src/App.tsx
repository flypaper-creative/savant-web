import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import Home from './pages/Home';
import Work from './pages/Work';
import Services from './pages/Services';
import Contact from './pages/Contact';
import Apps from './pages/Apps';
import Admin from './pages/Admin';
import Settings from './pages/Settings';
import OS from './pages/OS';
import Journal from './pages/Journal';
import Branding from './pages/Branding';
import NotFound from './pages/NotFound';
import { AuthProvider } from './contexts/AuthContext';
import { BlogProvider } from './contexts/BlogContext';
import { LoadingProvider } from './contexts/LoadingContext';
import { MoodProvider } from './contexts/MoodContext';
import { Toaster } from 'sonner';
import { SmoothScroll } from './components/SmoothScroll';
import { Preloader } from './components/Preloader';
import { SavantPreloader3D } from './components/SavantPreloader3D';
import { CustomCursor } from './components/CustomCursor';
import { AmbientMusic } from './components/AmbientMusic';

export default function App() {
  return (
    <LoadingProvider>
      <AuthProvider>
        <MoodProvider>
          <BlogProvider>
            <CustomCursor />
            <SmoothScroll>
              <SavantPreloader3D />
              <Preloader />
              <AmbientMusic />
              <Router>
                <Toaster position="top-right" theme="dark" toastOptions={{
                  style: {
                    background: 'rgba(var(--color-current), 0.05)',
                    border: '1px solid rgba(var(--color-current), 0.1)',
                    color: 'currentColor',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '10px',
                    letterSpacing: '0.2em',
                    borderRadius: '0px',
                    backdropFilter: 'blur(20px)',
                  }
                }} />
                <Routes>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="work" element={<Work />} />
                    <Route path="services" element={<Services />} />
                    <Route path="contact" element={<Contact />} />
                    <Route path="apps" element={<Apps />} />
                    <Route path="admin" element={<Admin />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="journal" element={<Journal />} />
                    <Route path="branding" element={<Branding />} />
                    <Route path="os" element={<OS />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </Router>
            </SmoothScroll>
          </BlogProvider>
        </MoodProvider>
      </AuthProvider>
    </LoadingProvider>
  );
}

