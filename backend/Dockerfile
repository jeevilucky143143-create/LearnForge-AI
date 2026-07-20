# Multi-stage Docker build for FastAPI backend
FROM python:3.9-slim AS builder

WORKDIR /code

# Install system compiler tools for scikit-learn & numpy if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy app files and install dependencies
COPY app/ /code/app/
COPY alembic/ /code/alembic/

# Generate a list of requirements or copy dependencies from environment
# We install the core packages needed for the API
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
    fastapi==0.128.8 \
    uvicorn[standard]==0.39.0 \
    SQLAlchemy==2.0.51 \
    psycopg2-binary==2.9.9 \
    alembic==1.13.1 \
    python-jose[cryptography]==3.5.0 \
    python-multipart==0.0.20 \
    python-dotenv==1.0.0 \
    supabase==2.31.0 \
    httpx==0.28.1 \
    scikit-learn==1.5.2 \
    numpy==1.26.4 \
    pypdfium2==4.30.0

FROM python:3.9-slim AS runner

WORKDIR /code

# Copy packages from builder stage
COPY --from=builder /usr/local/lib/python3.9/site-packages /usr/local/lib/python3.9/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY --from=builder /code /code

ENV PORT=8000
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
