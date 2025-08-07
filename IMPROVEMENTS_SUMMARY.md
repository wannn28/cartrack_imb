# Cartrack IMB - Improvements Summary

## 🎯 **Berdasarkan Pola Smart Nota Online**

Docker Compose telah diperbaiki mengikuti pola yang sama dengan aplikasi Smart Nota Online Anda.

## ✅ **Perubahan yang Dibuat:**

### 1. **Container Naming Convention**
- ✅ `be-cartrack-imb` (Backend)
- ✅ `fe-cartrack-imb` (Frontend)
- ✅ `db-cartrack-imb` (Database)
- ✅ `redis-cartrack-imb-dev` (Redis Development)

### 2. **Network Naming**
- ✅ `cartrack-network` (Production)
- ✅ `cartrack-network-dev` (Development)

### 3. **Volume Management**
- ✅ `uploads_data` - Persistent storage untuk uploads
- ✅ `logs_data` - Volume untuk logs
- ✅ `db_data` - Database persistence
- ✅ `redis_data_dev` - Redis cache (development)

### 4. **Environment Variables**
- ✅ Menggunakan `env_file` untuk backend
- ✅ File `.env` terpisah untuk konfigurasi
- ✅ Environment variables yang konsisten

### 5. **Service Structure**
- ✅ Backend service dengan volume mounts
- ✅ Frontend service dengan target production
- ✅ Database service dengan migrations
- ✅ Redis service untuk development

## 📋 **Docker Compose Structure**

### Production (`docker-compose.yml`)
```yaml
services:
  backend:
    container_name: be-cartrack-imb
    env_file: ./backend/.env
    volumes:
      - uploads_data:/app/uploads
      - logs_data:/app/logs

  frontend:
    container_name: fe-cartrack-imb
    target: production
    volumes:
      - ./TrackingTruck/logs/nginx:/var/log/nginx

  db:
    container_name: db-cartrack-imb
    volumes:
      - db_data:/var/lib/postgresql/data
      - ./backend/db/migrations:/docker-entrypoint-initdb.d
```

### Development (`docker-compose.dev.yml`)
```yaml
services:
  backend:
    container_name: be-cartrack-imb-dev
    command: ["go", "run", "./cmd/app/main.go"]
    volumes:
      - ./backend:/app
      - uploads_data_dev:/app/uploads

  frontend:
    container_name: fe-cartrack-imb-dev
    command: ["npm", "run", "dev"]
    volumes:
      - ./TrackingTruck:/app
      - /app/node_modules

  redis:
    container_name: redis-cartrack-imb-dev
```

## 🔧 **Environment Configuration**

### Backend (.env)
```bash
ENV=production
PORT=8003
POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_USER=cartrack_user
POSTGRES_PASSWORD=cartrack_password
POSTGRES_DATABASE=cartrack_db
JWT_SECRET_KEY=your-super-secret-jwt-key
MIGRATION_PATH=db/migrations
```

## 🚀 **Scripts Available**

1. **`setup-env.bat`** - Setup environment files
2. **`start-local.bat`** - Run without Docker
3. **`start-docker.bat`** - Run with Docker
4. **`build-docker.bat`** - Build Docker images

## 🌐 **Access URLs**

- **Frontend:** http://localhost:3004
- **Backend API:** https://trackerapi.indiramaju.com
- **Database:** localhost:5432
- **Redis:** localhost:6379 (development)

## 📁 **Volume Structure**

```
volumes/
├── db_data/           # Database persistence
├── uploads_data/      # File uploads
├── logs_data/         # Application logs
└── redis_data_dev/    # Redis cache (dev)
```

## 🎉 **Benefits**

1. **Consistency** - Mengikuti pola yang sama dengan Smart Nota Online
2. **Scalability** - Mudah untuk scaling dan deployment
3. **Maintainability** - Struktur yang jelas dan terorganisir
4. **Development** - Hot reload dan development tools
5. **Production** - Optimized untuk production environment

## 🎯 **Next Steps**

1. **Setup Environment:**
   ```bash
   setup-env.bat
   ```

2. **Start Development:**
   ```bash
   start-docker.bat
   ```

3. **Access Application:**
   - Frontend: http://localhost:3004
   - Backend: https://trackerapi.indiramaju.com

**Aplikasi Cartrack IMB sekarang mengikuti pola yang sama dengan Smart Nota Online! 🚀**
