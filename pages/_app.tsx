import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data?.user;
      console.log('Supabase user:', user);
      if (user) {
        await fetch('/api/user-init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: user.id,
            email: user.email,
          }),
        });
        console.log('user-init sent');
      }
    });
  }, []);
  return <Component {...pageProps} />;
}

export default MyApp;
