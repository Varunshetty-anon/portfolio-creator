import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { router } from '@/router';

function App() {
  return (
    <AuthProvider>
      <ToastProvider />
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
