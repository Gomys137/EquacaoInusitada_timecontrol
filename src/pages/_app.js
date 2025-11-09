// pages/_app.js
import '@/styles/globals.css';
import '@/styles/login.css';
import '@/styles/func_dashboard.css';
import { AuthProvider } from '../context/AuthContext';

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}
