# Supercampus Mobile – Enterprise Feature-Sliced Architecture (IEBA Standard)

> **Document Version:** 1.0.0  
> **Target Audience:** Client Technical Leads, Mobile Architects, Engineering Team  
> **Platforms Supported:** iOS & Android (Cross-Platform)  
> **Theme:** Obsidian Black & Electric Blue (`#080B11` / `#2563EB`)

---

## 1. Executive Summary & Tech Stack

This document defines the production engineering standard, code structure, and architectural boundaries for the **Supercampus Mobile Application**. The structure is modeled after the proven **IEBA (Feature-Sliced Enterprise)** frontend architecture, customized specifically for modern **React Native** and **Expo Router**.

### Core Technology Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | Expo SDK | `~57.0.25` | Native runtime, OTA updates, Continuous Native Generation (CNG) |
| **Engine** | React Native | `0.86.3` (React 19) | Cross-platform native rendering for iOS & Android |
| **Routing** | Expo Router | `~57.0.23` | File-system-based, deep-link ready, fully typed navigation |
| **Language** | TypeScript | `~6.0.3` | Strict type safety across components, models, and APIs |
| **Styling & Theme** | Design Token System / Tailwind CSS Paradigm | - | Obsidian Black & Electric Blue design tokens with responsive scaling |
| **Layout & Ergonomics** | React Native Safe Area Context | `~5.7.0` | Safe padding for iPhone Dynamic Island, notches, and Android system bars |
| **Motion** | React Native Reanimated | `4.5.1` | 60/120 FPS native thread animations & glow transitions |

---

## 2. Architectural Blueprint: 3-Tier Layering

The codebase is organized into three strictly separated tiers to ensure **maintainability**, **zero code duplication**, and **clean client handoffs**:

```
src/
├── components/          ← TIER 1: Shared UI Primitives (Write once, reuse everywhere)
│   └── ui/              ← Buttons, Inputs, Cards, Loaders, Badges
├── layouts/             ← TIER 2: Shell Layouts & Screen Wrappers (Safe areas, keyboard)
├── app/                 ← TIER 2: Expo Router Navigation Tree (Thin screen routes)
│   ├── _layout.tsx      ← Root theme & auth provider wrapper
│   ├── (auth)/          ← Public / Guest screens (login, register)
│   └── (tabs)/          ← Authenticated dashboard screens
├── features/            ← TIER 3: Domain Features (Self-contained business modules)
│   ├── auth/            ← Authentication module
│   ├── feed/            ← Campus feed module
│   └── profile/         ← User profile module
├── constants/           ← Design tokens, colors, layout metrics
├── hooks/               ← Global cross-feature custom hooks
├── lib/                 ← Core infrastructure (API client, storage, formatters)
└── types/               ← Shared global types
```

---

## 3. Tier Breakdown & Directory Standard

### Tier 1 — Shared UI Primitives (`src/components/ui/`)
**Rule:** Implement common UI components **only once** in this folder. Modifying a component here propagates improvements across the entire application without touching screen code.

| Component | Responsibility |
| :--- | :--- |
| `Button.tsx` | Electric blue primary button, outline button, loading state, haptic press feedback |
| `Input.tsx` | Black surface input field with focus glow ring, clear button, password reveal toggle |
| `Card.tsx` | Elevated container with subtle glass border and dark slate fill |
| `Badge.tsx` | Status tags and chips with electric cyan/blue accents |
| `Loader.tsx` | Smooth loading spinner for async operations |

*Feature-specific UI (like a dedicated login widget or campus card) belongs inside `src/features/<feature-name>/components/`, never in Tier 1.*

---

### Tier 2 — App Shell & Layouts (`src/layouts/` & `src/app/`)

1. **`src/layouts/ScreenContainer.tsx`**:
   - Manages notch & safe area insets via `react-native-safe-area-context`.
   - Handles platform-specific keyboard behavior:
     ```tsx
     behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
     ```
   - Automatically dismisses the keyboard when touching outside interactive fields.
2. **`src/app/` (Expo Router)**:
   - Routes act purely as **thin orchestrators**. They import the feature components from `src/features/` and render them inside the layout.
   - Example route `src/app/(auth)/login.tsx` simply renders `<LoginFeature />`.

---

### Tier 3 — Feature Slices (`src/features/<feature-name>/`)

Every business capability is an isolated, self-contained feature slice following the **IEBA canonical pattern**:

```text
src/features/auth/
├── api/            ← Pure API functions (Axios / Fetch)
│   └── authApi.ts
├── components/     ← Feature-specific UI components
│   ├── LoginForm.tsx
│   ├── SocialLoginRow.tsx
│   └── AuthHeader.tsx
├── hooks/          ← Custom React hooks / TanStack Query hooks
│   └── useLogin.ts
├── schemas.ts      ← Form validation rules (Zod / custom validator)
├── types.ts        ← Data models (LoginRequest, AuthUser, Session)
└── index.ts        ← Clean public barrel export
```

#### The Golden Data Flow Rule:
```
Screen Component (Route)
  ↓
Feature Component (e.g. LoginForm)
  ↓
Feature Hook (e.g. useLogin)
  ↓
Feature API (e.g. authApi.login)
  ↓
Backend Service
```
*UI components NEVER make direct HTTP/API calls. They consume feature hooks.*

---

## 4. Visual Design System: Black & Electric Blue Theme

Designed for high-contrast readability, sleek modern aesthetics, and battery efficiency on OLED displays (iPhone and modern Android devices).

### Color Tokens (`src/constants/colors.ts`)

| Token | Hex Value | Semantic Usage |
| :--- | :--- | :--- |
| `palette.black.900` | `#080B11` | Deep obsidian canvas background |
| `palette.black.800` | `#0F172A` | Elevated card & surface container |
| `palette.black.700` | `#111827` | Field input backgrounds |
| `palette.slate.600` | `#1E293B` | Subtle card borders & dividers |
| `palette.blue.primary` | `#313491` | Primary brand Royal Indigo Blue (Client specification) |
| `palette.blue.light` | `#4F55C9` | Active input border & glow highlight |
| `palette.cyan.accent` | `#6366F1` | Neon accent for tags & links |
| `palette.white` | `#F8FAFC` | High-contrast title and body text |
| `palette.slate.400` | `#94A3B8` | Muted placeholders & secondary labels |
| `palette.red.500` | `#EF4444` | Validation and system error alerts |

---

## 5. Cross-Platform Guidelines (iOS & Android)

1. **Notches, Islands & Navigation Bars**:
   - All root views integrate `useSafeAreaInsets()`.
   - Android navigation gesture bars are given explicit bottom spacing.
   - iOS Dynamic Island / status bar is safeguarded with light content:
     ```tsx
     <StatusBar style="light" />
     ```
2. **Keyboard Management**:
   - `keyboardShouldPersistTaps="handled"` on all scroll containers.
   - Keyboard dismissing through `TouchableWithoutFeedback`.
3. **Touch Targets**:
   - All interactive touch items satisfy the **minimum 48×48 dp** standard recommended by Google Material & Apple Human Interface Guidelines.
4. **Platform-Specific Polish**:
   - Shadows on iOS use `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`.
   - Android shadows use `elevation` with subtle border fallback for consistent black surfaces.

---

## 6. Component Reuse & Theme Consumption Guidelines

To maintain visual consistency and rapid feature velocity across both iOS and Android, all development strictly adheres to the **Component Reuse Contract**:

### Rule 1: Never Hardcode Hex Colors
- **Prohibited:** `backgroundColor: '#2563EB'`, `color: '#F8FAFC'` in feature files.
- **Enforced:** Always import semantic tokens from `@/constants/colors`:
  ```tsx
  import { Colors } from '@/constants/colors';

  const styles = StyleSheet.create({
    banner: {
      backgroundColor: Colors.background.surface,
      borderColor: Colors.border.subtle,
      shadowColor: Colors.primary.glow,
    },
  });
  ```

### Rule 2: Tier 1 Shared UI Primitive Standard
Every standard form element, interactive touch target, and container is built inside `src/components/ui/` with full theme integration and cross-platform handling:

```tsx
import { Button, Input, Card, Checkbox, Badge } from '@/components/ui';

// Example: Reusable Usage in Any Screen
<Card>
  <Input
    label="Email Address"
    placeholder="you@campus.edu"
    leftIcon="mail"
    value={email}
    onChangeText={setEmail}
    error={errors.email}
  />
  <Checkbox
    label="Remember credentials"
    checked={rememberMe}
    onToggle={setRememberMe}
  />
  <Button
    title="Sign In"
    variant="primary"
    loading={isLoading}
    onPress={handleLogin}
  />
</Card>
```

### Rule 3: Tier 1 vs. Tier 3 Separation
- **Tier 1 (`src/components/ui/`)**: Completely generic, zero business logic, zero API references. Accepts generic callbacks (`onPress`, `onChangeText`, `value`).
- **Tier 3 (`src/features/<feature>/components/`)**: Feature-specific compositions that bind data, validation state, and feature hooks.

### Rule 4: Universal Google Fonts Usage
- All typography strictly utilizes the **Outfit** Google Font suite through `@/constants/fonts`:
  - `Typography.regular`: `Outfit_400Regular` (body text, inputs)
  - `Typography.medium`: `Outfit_500Medium` (checkboxes, dividers, errors)
  - `Typography.semiBold`: `Outfit_600SemiBold` (buttons, labels, links)
  - `Typography.bold`: `Outfit_700Bold` (section titles, headers)
  - `Typography.black`: `Outfit_900Black` (brand display titles)

---

## 7. Client Handoff & Quality Checklist

Before submitting code reviews or deploying builds:
- [x] **Strict TypeScript**: Run `npx tsc --noEmit` — zero compilation errors.
- [x] **Linting**: Run `npx expo lint` — clean rules pass.
- [x] **Folder Consistency**: All new features follow `src/features/<feature-name>/`.
- [x] **No Inline Styles Duplication**: Shared controls use `src/components/ui/`.
- [x] **Both Platforms Verified**: Verified on Android and iOS layouts.

