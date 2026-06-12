# FixRight Listing

FixRight is a demo listing for an appliance repair service.

The project includes three parts:

- a public landing page with a repair request form;
- an admin panel for viewing submitted requests;
- a FastAPI backend with PostgreSQL storage.

## Features

- serves the marketing landing page at `http://localhost`;
- accepts repair requests from the website form;
- stores requests in PostgreSQL;
- exposes a REST API for creating and reading bookings;
- protects admin booking endpoints with Basic Auth;
- provides an admin interface at `http://localhost/admin`.

## Tech Stack

- `FastAPI`
- `SQLAlchemy 2`
- `PostgreSQL`
- `Pydantic 2`
- `Nginx`
- `Docker Compose`
- `HTML / CSS / JavaScript`

## Project Structure

```text
backend/
  auth.py              # Basic Auth for protected API endpoints
  base.py              # DeclarativeBase definition
  database.py          # DB connection and schema initialization
  main.py              # FastAPI app entry point
  models.py            # Pydantic schemas
  orm_models.py        # SQLAlchemy ORM models
  routers/
    bookings.py        # booking routes

frontend/
  nginx.conf           # routing and /api proxy config
  mainpage/            # public landing page
  admin/               # login page and admin dashboard

docker-compose.yml     # full project startup
README.md
```

## URLs

### Frontend

- `http://localhost` - public landing page
- `http://localhost/admin` - admin login

### Backend

- `http://localhost:8000/health` - API health check
- `http://localhost:8000/docs` - Swagger UI
- `http://localhost:8000/redoc` - ReDoc

## API

### Public endpoint

`POST /api/bookings`

Creates a new repair request.

Example request body:

```json
{
  "name": "Jane Smith",
  "phone": "+48 501 234 567",
  "problem_description": "My refrigerator stopped cooling overnight."
}
```

Validation rules:

- `name`: 2 to 120 characters;
- `phone`: must be a valid Polish mobile number;
- `problem_description`: 10 to 2000 characters.

### Admin endpoints

These routes require Basic Auth with `ADMIN_USERNAME` and `ADMIN_PASSWORD`.

- `GET /api/bookings` - list bookings
- `GET /api/bookings/{id}` - get booking by ID

Supported query parameters for `GET /api/bookings`:

- `limit` - from `1` to `500`, default `100`;
- `offset` - pagination offset, default `0`;
- `search` - search by name or phone.

## Admin Authentication Flow

The admin panel uses Basic Auth:

1. Open `/admin`.
2. Enter the admin username and password.
3. The frontend verifies credentials by calling `/api/bookings`.
4. If authentication succeeds, the token is stored in `sessionStorage`.
5. The dashboard loads the booking table.

## Environment Variables

Create a `.env` file in the project root before starting with Docker Compose:

```env
DB_NAME=fixright
DB_USER=fixright
DB_PASSWORD=fixright_password

ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

## Run the Project

### Docker Compose

```bash
docker compose up --build
```

After startup, these services will be available:

- website: `http://localhost`
- admin panel: `http://localhost/admin`
- backend API: `http://localhost:8000`

## How It Works

### Public site

The landing page lives in `frontend/mainpage/`. Its form submits a `POST` request to `/api/bookings` using `fetch`.

### API proxying

`frontend/nginx.conf` proxies all `/api/*` requests to the backend container, so the frontend can call the API through the same host.

### Backend startup

When the FastAPI app starts, it calls `init_db()`, which creates database tables from the SQLAlchemy models.

Main table:

- `bookings`
  - `id`
  - `name`
  - `phone`
  - `problem_description`
  - `created_at`

## Quick Check

1. Open `http://localhost`.
2. Submit a repair request from the form.
3. Open `http://localhost/admin`.
4. Sign in with `ADMIN_USERNAME` and `ADMIN_PASSWORD`.
5. Confirm that the request appears in the table.

## Possible Improvements

- add `.env.example`;
- switch schema management to Alembic migrations;
- store admin credentials more securely;
- add update and delete operations for bookings;
- add backend tests.
