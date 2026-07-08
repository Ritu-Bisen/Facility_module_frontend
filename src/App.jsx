import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import SessionToast from './components/common/SessionToast';

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <SessionToast />
    </BrowserRouter>
  );
}

export default App;