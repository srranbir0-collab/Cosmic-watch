
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import App from './App';
import { AuthProvider } from './context/AuthContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const PUBLISHABLE_KEY = (import.meta as any).env.VITE_CLERK_PUBLISHABLE_KEY;
const SIGN_IN_URL = (import.meta as any).env.VITE_CLERK_SIGN_IN_URL || '/login';
const SIGN_UP_URL = (import.meta as any).env.VITE_CLERK_SIGN_UP_URL || '/register';
const DASHBOARD_URL = (import.meta as any).env.VITE_CLERK_AFTER_SIGN_IN_URL || '/dashboard';

if (!PUBLISHABLE_KEY) {
  console.warn("Missing Publishable Key. Authentication features may not work.");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      signInUrl={SIGN_IN_URL}
      signUpUrl={SIGN_UP_URL}
      signInFallbackRedirectUrl={DASHBOARD_URL}
      signUpFallbackRedirectUrl={DASHBOARD_URL}
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#00F0FF',
          colorBackground: '#0F1629',
          colorText: '#F8FAFC',
          colorInputBackground: '#020408',
          colorInputText: '#fff'
        },
        elements: {
          card: "border border-white/10 shadow-2xl",
          logoBox: "h-12 w-12",
          formButtonPrimary: "bg-[#00F0FF] hover:bg-[#00F0FF]/80 text-[#020408] font-bold font-mono tracking-wider",
          footerActionLink: "text-[#00F0FF] hover:text-white",
          identityPreviewEditButtonIcon: "text-[#00F0FF]"
        }
      }}
    >
      <AuthProvider>
        <App />
      </AuthProvider>
    </ClerkProvider>
  </React.StrictMode>
);
