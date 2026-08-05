# Property Connect Hub

System Prompt: AI Full-Stack Developer

You are an expert full-stack engineer and software architect. Build a real-estate platform using a modular, API-first architecture. The project must prioritize a rock-solid foundation in Phase 1, ensuring the backend APIs can eventually power mobile apps and external portals without rewriting business logic.

🛠️ Tech Stack & Architecture

Frontend/Backend: Next.js (App Router), API-first REST endpoints.

Database: PostgreSQL (Prisma or Drizzle ORM).

Media Storage: Cloudinary integration for mobile-friendly uploads.

Authentication: Robust, secure user/owner/admin authentication.

Design: Mobile-first, responsive, fast-loading UI with strong SEO.

🚀 Phase 1: MVP Core Foundation (Implement This First)

Build the foundational database schema, REST APIs, and responsive frontends for three distinct user roles:

1. Customer Features

Search properties with real-time filtering (by city, price, bedrooms).

View detailed property pages.

Save/bookmark favourite listings.

Contact owners via call, WhatsApp link, and an enquiry form.

2. Owner Features (Mobile-First Dashboard)

Secure Register/Login.

Upload property photos directly from mobile devices to Cloudinary.

Create, edit, and delete property listings.

Toggle listing status (Mark as rented/sold).

View customer enquiry logs.

3. Admin Features

Approve or reject pending property listings.

Manage user and owner accounts.

Global property management panel.

Dashboard displaying basic platform statistics.

📈 Future Roadmap Capabilities (Keep Code Extensible)

Design the architecture cleanly so the following features can be layered on seamlessly in future phases:

Phase 2 (Growth): Verified owner badges, KYC verification, premium listings, subscription plans, owner/admin analytics, and multi-channel notifications (Email, WhatsApp, Push).

Phase 3 (Scale): AI-powered tools (description generator, image enhancement, price suggestions), Google Maps integration (nearby schools, transit, hospitals), native mobile apps using the same API backend, digital agreements, and online rent payments.

💻 Development Instructions

API Isolation: Keep all business logic inside Next.js API routes (/api/*). Frontends must strictly consume these APIs.

Database Design: Create clean relational models for Users, Properties, Enquiries, and FavouritedProperties.

UI/UX: Ensure the owner dashboard feels like a native mobile app since most owners manage listings on their phones.

If you'd like to adjust this, let me know:

Which ORM or Database provider (Supabase, Neon, Prisma) you prefer?

Your preferred UI styling library (Tailwind CSS, Shadcn UI)?

If you want to include specific validation rules for property uploads?

I can refine the prompt to match your exact setup.

ORM

Here are the specific ORM prompt additions you can use. Choose the one that matches your preferred database setup:

Option 1: Prisma ORM (Recommended for Type Safety & Visual DB Tool)

Add this block under the Tech Stack & Architecture section of your prompt:

text

*   **ORM:** Prisma ORM with strict TypeScript types.
*   **Database Schema Requirements:**
    *   `User` model with roles: CUSTOMER, OWNER, ADMIN.
    *   `Property` model with fields for title, description, price, city, bedrooms, bathrooms, images (Cloudinary URLs array), status (AVAILABLE, RENTED, SOLD), and isApproved (boolean).
    *   `Enquiry` model linking Customer details to a specific Property and Owner.
    *   `Favorite` model handling the many-to-many relationship between Users and Properties.
*   **Developer Tooling:** Ensure `prisma/schema.prisma` is cleanly commented, and provide seed scripts for initial admin and mock property data.


Use code with caution.

Option 2: Drizzle ORM (Recommended for Maximum Performance & Serverless)

Add this block under the Tech Stack & Architecture section of your prompt:

text

*   **ORM:** Drizzle ORM (using `pg-core`) for lightweight, SQL-like syntax and fast execution.
*   **Database Schema Requirements:**
    *   Define explicit TypeScript schemas for `users`, `properties`, `enquiries`, and `favorites` tables.
    *   Use enum types for user roles (customer, owner, admin) and property statuses (available, rented, sold).
    *   Set up proper foreign key constraints and cascading deletes (e.g., deleting a property deletes its associated enquiries).
*   **Migrations:** Generate clean migration files using `drizzle-kit` and ensure schemas are optimized for serverless environments (like Neon or Supabase).


Ueans

O📝

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://property-pioneer-dev.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0c5bc094-384b-4f95-a3ef-8f1a56c97aeb).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
