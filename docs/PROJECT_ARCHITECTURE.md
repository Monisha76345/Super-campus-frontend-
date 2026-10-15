# Supercampus Mobile Frontend Architecture & Standard Guide

This project mirrors the **IEBA Feature-Sliced Client Structure** customized for **React Native & Expo Router**.

For the complete technical specification, technology stack decisions, and cross-platform guidelines, see:
👉 [docs/ARCHITECTURE_AND_CODE_STRUCTURE.md](docs/ARCHITECTURE_AND_CODE_STRUCTURE.md)

---

## Quick Reference Summary

### 3-Tier Layering Model

1. **Tier 1 — UI Primitives (`src/components/ui/`)**: Reusable widgets (`Button`, `Input`, `Card`, `Loader`, `Badge`). Write once, reuse everywhere.
2. **Tier 2 — Shell & Layouts (`src/layouts/` & `src/app/`)**: Responsive `ScreenContainer` handling `SafeAreaView` (iOS Dynamic Island & Android bars) and `KeyboardAvoidingView`.
3. **Tier 3 — Feature Slices (`src/features/<feature>/`)**: Domain-specific slices (`api/`, `components/`, `hooks/`, `types.ts`, `schemas.ts`, `index.ts`).

### Theme (Client Specification)
- **Obsidian Black Canvas**: `#080B11`
- **Elevated Card Surface**: `#0F172A`
- **Primary Brand Blue**: `#313491` (Royal Indigo Blue)
- **Accent Glow Blue**: `#4F55C9`
- **Electric Cyan/Indigo**: `#6366F1`
- **Focus Glow Border**: `#4F55C9`

### Implemented Features
- **Landing Screen (`src/features/landing/`)**: Animated concentric emblem, two-tone "SUPER CAMPUS" title, and left-to-right underline line ending in the graduation hat icon.
- **Authentication Screen (`src/features/auth/`)**: Pre-filled dummy credentials (`dr@supercampus.edu` / `campus2026`), email & password validation, remember me, forgot password, social logins.
- **Home Dashboard (`src/features/home/`)**: Complete campus intelligence portal matching client design (HomeHeader with campus selector `📍 NMIT campus`, `Good evening, Dr` banner with tilted `Learn Build Belong` card, `Around campus with Dr` community hero banner, horizontal quick-action category scroll, upcoming sports booking & outpass status cards, `Food for you` menu carousels, `Trending on SuperCampus` community post, `Internships for you` cards, and floating bottom navigation tab bar).


