import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { AuthPage } from './components/AuthPage';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { AdvancedUpload } from './components/AdvancedUpload';
import { Viewer3D } from './components/Viewer3D';
import { Configurator } from './components/Configurator';
import { ProductCatalog } from './components/ProductCatalog';
import { JobTracker } from './components/JobTracker';
import { UploadGallery } from './components/UploadGallery';
import { SearchImages } from './components/SearchImages';
import { MarketplaceSyndication } from './components/MarketplaceSyndication';
import { AugmentedReality } from './components/AugmentedReality';
import { PromotionalTags } from './components/PromotionalTags';
import { AIPromptOptimization } from './components/AIPromptOptimization';
import { ClientManagement } from './components/ClientManagement';
import { ToastContainer, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Toaster } from 'sonner';
import { BrowserRouter, Routes,Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

function AppContent() {
  const [currentView, setCurrentView] = useState('dashboard');



  return (
    <Layout currentView={currentView} onNavigate={setCurrentView}>
      {/* <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        transition={Bounce}
      /> */}
      <Toaster position="bottom-right" richColors />
      <div className="space-y-6">
        {currentView === 'dashboard' && <Dashboard />}

        {currentView === 'upload' && (
          <>
            <AdvancedUpload />
            <UploadGallery />
            <JobTracker />
          </>
        )}

        {currentView === 'search' && <SearchImages />}

        {currentView === 'catalog' && <ProductCatalog />}

        {currentView === 'marketplace' && <MarketplaceSyndication />}

        {currentView === 'ar' && <AugmentedReality />}

        {currentView === 'tags' && <PromotionalTags />}

        {currentView === 'ai-optimize' && <AIPromptOptimization />}

        {currentView === 'clients' && <ClientManagement />}

        {currentView === 'configurator' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <Configurator />
            <Viewer3D />
          </div>
        )}

        {currentView === 'viewer' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Viewer3D />
            </div>
            <div>
              <JobTracker />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

function App() {
  return (
    <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppContent />
              </ProtectedRoute>
            }
          />
      </Routes>
    </AuthProvider>
    </BrowserRouter>

  );
}

export default App;
  