# PRCJ Jewellery — Backend API

Grand Indian Jewellery E-commerce Platform

## Tech Stack
- **FastAPI** + Python 3.12
- **PostgreSQL** + SQLAlchemy 2.0 (async)
- **Redis** — token blacklist, OTP store, rate limiting
- **Alembic** — database migrations
- **Cloudinary** — 8K product image CDN
- **Razorpay** — Indian payments (UPI, Cards, NetBanking)
- **Docker** — containerised deployment

## Quick Start

```bash
# 1. From repo root, start dependencies
docker-compose up postgres redis -d

# 2. Enter backend directory
cd backend

# 3. Create virtual environment
python -m venv venv && source venv/bin/activate

# 4. Install packages
pip install -r requirements.txt

# 5. Configure environment
cp ../.env.example ../.env
# Edit ../.env — set SECRET_KEY, DATABASE_URL etc.

# 6. Run migrations
alembic upgrade head

# 7. Seed Indian jewellery categories
python -m scripts.seed_data

# 8. Start the API
uvicorn app.main:app --reload --port 8000
```

API docs at: http://localhost:8000/docs

## Indian Jewelry Collections Covered

| Gender | Categories |
|--------|-----------|
| Women | Necklaces, Choker, Rani Haar, Mangalsutra, Earrings, Jhumka, Chandbali, Bangles, Rings, Maang Tikka, Nath, Payal, Haathphool, Kamarband, Bajuband |
| Men | Chains, Rings, Kadas, Earrings, Brooches, Cufflinks |
| Bridal | Full sets (Kundan, Polki, Diamond, Temple), Regional (Rajasthani, Bengali, South Indian, Punjabi, Maharashtrian, Hyderabadi) |
| Materials | 22K/18K Gold, Silver, Kundan, Polki, Jadau, Meenakari, Temple, Diamond, Navratna, Antique, Oxidised |

## Security Features
- JWT (15min access + 7 day refresh with rotation)
- bcrypt password hashing (cost 12)
- Redis-backed token blacklist
- Rate limiting (5 req/min login, 100 req/min general)
- Security headers (HSTS, CSP, X-Frame-Options)
- OTP email verification
- Admin audit log for all admin actions
- Role-based access (customer / admin / superadmin)

## API Endpoints
- `POST /api/v1/auth/register` — Register
- `POST /api/v1/auth/login` — Login
- `GET  /api/v1/products` — Browse products
- `GET  /api/v1/categories` — Category tree
- `POST /api/v1/cart/items` — Add to cart
- `POST /api/v1/orders/checkout` — Place order
- `GET  /api/v1/admin/dashboard` — Admin dashboard (admin JWT required)
