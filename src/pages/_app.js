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