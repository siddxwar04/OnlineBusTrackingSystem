# Online Bus Tracking System — V3 (Spring Boot + MySQL)

## Project Structure

```
bus-tracking-v3-clean/
├── bus-tracking-springboot/   ← Java backend (Spring Boot + MySQL)
└── bus-tracking-react/        ← React frontend (Vite)
```

---

## MySQL Setup (Step by Step)

### Step 1 — Install MySQL
Download from https://dev.mysql.com/downloads/mysql/ and install.
Default port: 3306

### Step 2 — Create the database
Open MySQL Workbench or run in terminal:

```sql
CREATE DATABASE bus_tracking;
```

That's all. Tables are auto-created by Spring Boot (Hibernate) on first run.

### Step 3 — Edit application.properties
Open: bus-tracking-springboot/src/main/resources/application.properties

Change these lines:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/bus_tracking?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=your_password_here   ← PUT YOUR MySQL PASSWORD HERE
```

---

## Tables Created Automatically

When you run the app for the first time, Hibernate creates these tables:

### `users` table
Stores login credentials (admin + driver accounts).
Auto-seeded with default users on first startup.

| Column   | Type        | Example     |
|----------|-------------|-------------|
| id       | BIGINT (PK) | 1           |
| username | VARCHAR(50) | admin       |
| password | VARCHAR(100)| admin       |
| role     | VARCHAR(20) | admin       |

Default users inserted automatically:
- admin / admin → role: admin
- admin1 / admin1 → role: admin   (password2 variant)
- driver / driver → role: driver
- driver1 / driver1 → role: driver (password2 variant)

To add a new user via MySQL:
```sql
INSERT INTO users (username, password, role) VALUES ('driver2', 'mypassword', 'driver');
```

### `trip_logs` table
Stores every sensor reading captured while a trip is active.

| Column     | Type        | Example              |
|------------|-------------|----------------------|
| id         | BIGINT (PK) | 1                    |
| bus_id     | VARCHAR(20) | BUS001               |
| timestamp  | VARCHAR(25) | 2025-04-25 10:30:00  |
| temp       | VARCHAR(10) | 34                   |
| oil        | VARCHAR(5)  | 1                    |
| latitude   | VARCHAR(20) | 13.082700            |
| longitude  | VARCHAR(20) | 80.270700            |
| seat_count | VARCHAR(5)  | 42                   |
| ticket     | VARCHAR(10) | 50                   |
| speed      | VARCHAR(10) | 60                   |

---

## Running the Backend

```bash
cd bus-tracking-springboot
mvn spring-boot:run
```

Backend starts at: http://localhost:8080

---

## Running the Frontend

```bash
cd bus-tracking-react
npm install
npm run dev
```

Frontend starts at: http://localhost:3000

---

## API Endpoints

| Method | Endpoint            | Description                        |
|--------|---------------------|------------------------------------|
| POST   | /data/login         | Login (validates against MySQL)    |
| GET    | /data/logout        | Logout                             |
| GET    | /data/buses         | List all buses                     |
| GET    | /data/send          | IoT sensor data push               |
| GET    | /data/view          | Dashboard data poll (every 5s)     |
| POST   | /data/trip/start    | Start trip + begin MySQL logging   |
| POST   | /data/trip/stop     | Stop trip                          |
| GET    | /data/trip/status   | Trip status                        |
| GET    | /data/export        | Download CSV from MySQL trip_logs  |

---

## IoT Device URL Format

```
GET http://localhost:8080/data/send?busId=BUS001&temp=34&oil=1&ticket=50&latitude=1305.0000&longitude=8016.0000&seatCount=42&speed=60
```

oil=1 means OK, oil=0 means LOW.
latitude/longitude can be in NMEA format (auto-converted to decimal).
