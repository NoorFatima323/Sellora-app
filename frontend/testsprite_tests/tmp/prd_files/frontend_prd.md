# Sellora Frontend Testing PRD

## Overview
Test the React/Vite frontend for the Sellora E-Commerce Intelligence app. The app communicates with a backend at `http://127.0.0.1:8000`.

## Key Pages and Flows
1. **Authentication (Login/Register)**
   - The user can log in with an email and password.
   - For tests, use `testqa@sellora.com` and `password123` to log in successfully.
   - Upon successful login, the user should be redirected to the Dashboard.

2. **Dashboard**
   - Displays a summary of the user's analyses and reports.
   - Should load and display data gracefully.

3. **Analysis Request Flow**
   - The user fills out a form (product name, category, price, platforms).
   - Upon submission, a loading indicator appears while analysis is simulated.
   - Finally, a detailed report is shown (Pricing, SEO, Ad Copies, etc.).

4. **Competitor Tracking**
   - A page to track competitors for a specific product.
   - Should display a list/table of competitor prices and platforms.

## UI Elements
- The UI uses Tailwind CSS (if configured) or custom CSS for modern aesthetics.
- Important UI interactions: clicking buttons, filling forms, and asserting the visibility of results (like "Competitors", "Pricing Insights").
