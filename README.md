# SnipQ — Real-Time Salon & Barber Slot Booking Platform

> Eliminate unpredictable queues at barbershops. Book a slot, pay ₹10 to confirm, track your position live.

## 🏗️ Architecture

| Component | Technology | Deployment |
|-----------|------------|------------|
| Frontend | Next.js 14 (App Router) | Vercel |
| Backend API | Node.js + Express + TypeScript | Railway |
| Database | PostgreSQL (Supabase) + Prisma ORM | Supabase |
| Cache/PubSub | Redis (Upstash) | Upstash |
| Real-Time | Socket.io + Redis Adapter | Railway |
| Payments | Razorpay (₹10 commitment fee) | Razorpay |
| Email | Resend (OTP + notifications) | Resend |
| Push | Firebase Cloud Messaging | Firebase |

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# Generate Prisma client & run migrations
cd apps/api
pnpm prisma generate
pnpm prisma migrate dev --name init

# Start development (both API + Web)
cd ../..
pnpm dev
```

| Service | URL |
|---------|-----|
| API | http://localhost:4000 |
| Frontend | http://localhost:3000 |
| Prisma Studio | http://localhost:5555 |
| Health Check | http://localhost:4000/health |

## 📁 Project Structure

```
snipq/
├── apps/
│   ├── api/          # Express backend (Port 4000)
│   └── web/          # Next.js 14 frontend (Port 3000)
├── packages/
│   └── types/        # Shared TypeScript types
└── .github/
    └── workflows/    # CI/CD pipelines
```

## 👥 User Roles

- **Customer**: Search salons, book slots, pay ₹10, track live queue
- **Barber**: Manage queue, add walk-ins, mark service complete
- **Owner**: Dashboard, salary tracker, revenue reports, manage barbers

## 📄 License

Private — Confidential
