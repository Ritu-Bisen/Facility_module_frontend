import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import SessionToast from './components/common/SessionToast';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <BrowserRouter
      basename="/ReactFac"
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true
      }}
    >
      <AppRoutes />
      <SessionToast />
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
    </BrowserRouter>
  );
}

export default App;