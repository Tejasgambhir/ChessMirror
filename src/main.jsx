// src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';

// Initialize PostHog with your Project API Key and options
posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
    capture_pageview: true,
});

const root = createRoot(document.getElementById('root'));

root.render(
    <StrictMode>
        <PostHogProvider client={posthog}>
            <App />
        </PostHogProvider>
    </StrictMode>
);
