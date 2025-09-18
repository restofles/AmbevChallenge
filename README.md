# Ambev Challenge Project

This project contains a **.NET 8 backend**, a **Next.js frontend**, and a **SQL Server 2022 database running in Docker**.  
The stack is designed to run locally with minimal setup.

---

## 🚀 Quick Start – Run the project in 30 seconds

1. Start SQL Server in Docker:
   ```bash
   docker compose up -d
   ```

2. Run the backend API:
   ```bash
   cd backend
   dotnet run
   ```

3. Run the frontend app:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

- **Frontend:** http://localhost:3000  
- **Backend API:** http://localhost:5000  
- **Database (SQL Server):** localhost,1433  

---

## 📦 Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) (WSL2 on Windows recommended)  
- [.NET 8 SDK](https://dotnet.microsoft.com/en-us/download)  
- [Node.js 20+](https://nodejs.org/en/) (to run the frontend locally)  

---

## ▶️ Starting the Database with Docker

From the project root, run:

```bash
docker compose up -d
```

This will:

- Create a container named `ambev-sql` using `mcr.microsoft.com/mssql/server:2022-latest`
- Expose port `1433` on your host
- Persist data into `./infra/database/data`

Check if it is running:

```bash
docker ps
```

---

## 🔑 SQL Server Access

- **Host:** `localhost,1433`  
- **User:** `sa`  
- **Password:** `Str0ng!Passw0rd` (defined in `docker-compose.yml`)  
- **Database:** create it as needed (e.g., `AmbevDb`)  

You can connect using **Azure Data Studio**, **SQL Server Management Studio (SSMS)**, or from inside the container:

```bash
docker exec -it ambev-sql /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P Str0ng!Passw0rd
```

---

## 🛠️ Running the Backend

1. Go to the backend folder:
   ```bash
   cd backend
   ```

2. Update the connection string in `appsettings.Development.json` (or via environment variables):

   ```json
   "ConnectionStrings": {
     "Default": "Server=localhost,1433;Database=AmbevDb;User Id=sa;Password=Str0ng!Passw0rd;TrustServerCertificate=True;"
   }
   ```

3. Apply migrations (if available):
   ```bash
   dotnet ef database update
   ```

4. Run the API:
   ```bash
   dotnet run
   ```

The API will be available at `http://localhost:5000` (or the port defined in `launchSettings.json`).

---

## ⚛️ Running the Frontend

1. Go to the frontend folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set the `NEXT_PUBLIC_API_URL` environment variable to point to your API (e.g., `http://localhost:5000`).

4. Start the frontend:
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:3000`.

---

## 🐳 Resetting the Database

To remove all data and recreate the container:

```bash
docker compose down -v
docker compose up -d
```

---

## 📚 Project Structure

```
AmbevChallengeProject/
├─ backend/     # .NET 8 API
├─ frontend/    # Next.js app
├─ infra/       # Infrastructure files (e.g., database volume)
├─ docs/        # Documentation
├─ scripts/     # Helper scripts
├─ docker-compose.yml
└─ README.md
```

---

## 🚀 Useful Commands

- **View SQL Server logs:**
  ```bash
  docker compose logs -f sqlserver
  ```

- **Access the container shell:**
  ```bash
  docker exec -it ambev-sql bash
  ```

---

## 📝 Notes

- Never commit real passwords to the repository.  
- For production, always use environment variables (`.env`) instead of hardcoding secrets in `docker-compose.yml`.
