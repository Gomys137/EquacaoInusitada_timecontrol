<<<<<<< HEAD
// pages/_app.js
import '../styles/globals.css';
import { AuthProvider } from '../context/AuthContext';

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}
=======
import '@/styles/globals.css';
import '@/styles/login.css'; 
import '@/styles/func_dashboard.css';
import '@/styles/func_timetracker.css';
import '@/styles/sidebar.css';
import Head from 'next/head';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
          crossOrigin="anonymous"
        />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
>>>>>>> 531ceaf518ea6734da3d040e62bfcc1eb7ae4cf4
