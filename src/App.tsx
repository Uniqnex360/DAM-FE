import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './components/AuthPage';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Viewer3D } from './components/Viewer3D';
import { Configurator } from './components/Configurator';
import { ProductCatalog } from './components/ProductCatalog';
import { JobTracker } from './components/JobTracker';
import { UploadGallery } from './components/UploadGallery';
import { SearchImages } from './components/SearchImages';
import { MarketplaceSyndication } from './components/MarketplaceSyndication';
import { RoomVisualizer } from './components/AugmentedReality';
import { PromotionalTags } from './components/PromotionalTags';
import { AIPromptOptimization } from './components/AIPromptOptimization';
import { UserManagement } from './components/UserManagement';
import 'react-toastify/dist/ReactToastify.css';
import { Toaster } from 'sonner';
import { BrowserRouter, Routes,Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { AdvancedUpload } from './components/AdvancedUpload';
import { CombinedDashboard, ReportsDashboard } from './components/DAM';
import { UserSelectionProvider, useUserSelection } from './contexts/UserSelectionContext';
import { ThreeDGeneratorPage } from './components/ThreeDGeneratorPage';
import { Projects } from './components/Projects';

function AppContent() {
  const [currentView, setCurrentView] = useState('dashboard');
  const {loading}=useAuth()
  const { selectedUserId } = useUserSelection();
  const userId = selectedUserId === null ? undefined : selectedUserId;
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
        {currentView==='project' && <Projects/>}
        {currentView === 'upload' && (
          <>
            <AdvancedUpload />
            <UploadGallery 
              userId={userId} 
              allUsers={selectedUserId === null}
            />
            <JobTracker />
          </>
        )}
       {currentView === "DAM" && (
          <CombinedDashboard 
            userId={userId} 
            allUsers={selectedUserId === null}
          />
        )}


        {currentView === 'search' && <SearchImages />}

        {currentView === 'catalog' && <ProductCatalog />}

        {currentView === 'marketplace' && <MarketplaceSyndication />}

        {currentView === 'ar' && <RoomVisualizer />}
        {currentView === '3d-generator' && <ThreeDGeneratorPage />}  
        {currentView === 'tags' && <PromotionalTags />}

        {currentView === 'ai-optimize' && <AIPromptOptimization />}

        {currentView === 'clients' && <UserManagement />}

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
         <UserSelectionProvider> 
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
          </UserSelectionProvider>
    </AuthProvider>
    </BrowserRouter>

  );
}

export default App;
  