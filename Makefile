.PHONY: install dev fmt lint test migrate clean

# Install dependencies
install:
	@echo "Installing dependencies..."
	python3 -m venv venv
	./venv/bin/pip install -r requirements.txt

# Run development server
dev:
	@echo "Starting development server..."
	./venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

# Format code (placeholder - would need black/ruff)
fmt:
	@echo "Code formatting not configured yet"

# Lint code (placeholder - would need ruff/mypy)
lint:
	@echo "Code linting not configured yet"

# Run tests (placeholder)
test:
	@echo "Tests not configured yet"

# Run database migrations (placeholder - would need alembic)
migrate:
	@echo "Database migrations not configured yet"

# Clean cache files
clean:
	@echo "Cleaning cache files..."
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name ".coverage" -delete
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".mypy_cache" -exec rm -rf {} +

# Quick start for development
start: install dev 