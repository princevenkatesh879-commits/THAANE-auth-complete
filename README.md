# THAANE Auth — Google + Mobile OTP

A premium, responsive React/Vite authentication screen for THAANE with:

- Google OAuth via Firebase Authentication
- Mobile-number OTP via Firebase Phone Auth
- Animated logo entrance, ambient background motion, floating light, card reveal, and micro-interactions
- Responsive desktop/tablet/mobile layouts that automatically reflow with viewport size
- Accessible labels, focus states, loading states, errors, resend countdown, and success state
- Luxury editorial visual language using the supplied THAANE logo and generated background

## 1. Requirements

- Node.js 20+
- A Firebase project

## 2. Install

```bash
npm install
```

## 3. Create Firebase app

In Firebase Console:

1. Create/open your project.
2. Add a **Web app** and copy its config values.
3. Go to **Authentication → Sign-in method**.
4. Enable **Google**.
5. Enable **Phone**.
6. Add your local domain (`localhost`) and production domain under **Authentication → Settings → Authorized domains** when needed.
7. For Phone Auth, Firebase uses reCAPTCHA protection. This project uses an invisible reCAPTCHA verifier.

> For production, configure Firebase's phone-auth anti-abuse settings and follow Google's/Firebase's current verification requirements. Test with Firebase's fictional phone numbers where appropriate rather than repeatedly sending real OTPs during development.

## 4. Environment variables

Copy `.env.example` to `.env.local` and fill in the Firebase Web App configuration:

```bash
cp .env.example .env.local
```

Vite exposes only variables prefixed with `VITE_`, so keep secrets such as server credentials out of the frontend. Firebase Web API keys are client configuration, but your Firebase security rules and auth settings still need to be configured correctly.

## 5. Run

```bash
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

## 6. Production build

```bash
npm run build
npm run preview
```

Deploy the `dist` folder to Vercel, Netlify, Cloudflare Pages, Firebase Hosting, or another static host.

## Auth flow

### Google
Click **Continue with Google** → Firebase popup → authenticated state.

### Mobile OTP
1. Select country code.
2. Enter a valid mobile number in international format.
3. Click **Send OTP**.
4. Firebase reCAPTCHA runs silently/invisibly when possible.
5. Enter the 6-digit code.
6. The UI switches to the authenticated welcome state.

The country selector is intentionally small and includes India, US, UK, UAE, Singapore, and Australia. Expand `COUNTRIES` in `src/components/AuthCard.tsx` if THAANE needs more regions.

## Customize

- Main UI: `src/components/AuthCard.tsx`
- Global design/motion: `src/styles.css`
- Firebase setup: `src/lib/firebase.ts`
- Brand assets: `public/assets/`
- Page copy: `src/components/BrandPanel.tsx` and `AuthCard.tsx`

## Notes on the animation

The animation is original CSS motion designed for a premium brand feel rather than a clone of CRED. It uses restrained movement: staggered logo reveal, background parallax/scale, light sweep, card lift-in, and button hover feedback. `prefers-reduced-motion` disables non-essential animation automatically.
