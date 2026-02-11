Microservices Backend System 🚀
A Dockerized Node.js microservices architecture built with RabbitMQ, MongoDB, and an API Gateway.
The system follows an event-driven design, where services communicate asynchronously while remaining independently deployable.


🧩 Services Overview
| Service              | Responsibility                               |
| -------------------- | -------------------------------------------- |
| **API Gateway**      | Single entry point for all client requests   |
| **Identity Service** | Authentication, authorization, user identity |
| **Post Service**     | Create, update, and manage posts             |
| **Media Service**    | Media upload, processing, and storage        |
| **Search Service**   | Indexing and search across posts/media       |


🗂 Project Structure
microservices-api/
├── docker-compose.yml
├── .gitignore
├── .env.example
├── README.md

├── api-gateway/
│   ├── Dockerfile
│   ├── .env.example
│   └── src/

├── identity/
│   ├── Dockerfile
│   ├── .env.example
│   └── src/

├── post/
│   ├── Dockerfile
│   ├── .env.example
│   └── src/

├── media/
│   ├── Dockerfile
│   ├── .env.example
│   └── src/

└── search/
    ├── Dockerfile
    ├── .env.example
    └── src/

🔐 Environment Configuration
Each service manages its own environment variables.
Create env files
cp .env.example .env
cp api-gateway/.env.example api-gateway/.env
cp identity/.env.example identity/.env
cp post/.env.example post/.env
cp media/.env.example media/.env
cp search/.env.example search/.env

🐳 Running the Project with Docker
Build and start all services
docker compose up --build
docker compose down


📨 Inter-Service Communication
Services publish and consume events via RabbitMQ
Topic exchanges and routing keys are used
Enables loose coupling and async processing
Improves scalability and fault tolerance

✅ Key Features
Event-driven microservices
Centralized API Gateway
Secure identity management
Independent service scaling
Docker-based local development
Clean environment handling
