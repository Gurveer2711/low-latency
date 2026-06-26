# Video Transcoding and Adaptive Playback Engine

This system manages video uploads, queues encoding jobs, transcodes videos into multiple resolutions asynchronously, and streams them back to users with manual quality selection. 

For a non-technical user, the application operates like a private streaming platform: you select a local video file, upload it, wait for processing, and can then watch the video in different resolutions. Technically, the system is a decoupled architecture consisting of a Next.js frontend, an Express API gateway, a Redis-backed BullMQ job queue, a standalone Node.js transcoding worker utilizing FFmpeg, and an AWS S3 object store for asset persistence.

## System Architecture

The following diagram illustrates how a video files moves through the system, from initial upload request to final playback:

```mermaid
sequenceDiagram
    autonumber
    actor Client as Frontend Client
    participant API as Express API
    participant S3 as AWS S3 Bucket
    participant DB as PostgreSQL (Prisma)
    participant Redis as Redis (BullMQ)
    participant Worker as Transcoding Worker

    Client->>API: POST /upload/request { title, contentType }
    API->>Client: Returns uploadUrl (presigned S3 PUT URL), videoId, rawKey
    Client->>S3: PUT raw video file binary
    Client->>API: POST /webhook/s3-upload { videoId, rawKey, title, userId }
    API->>DB: Create Video row (status: "pending")
    API->>Redis: Enqueue transcode-video job { videoId, rawKey }
    API->>Client: Return status (pending), jobId
    Note over Client: Polling status via /videos/:id/status
    
    Worker->>Redis: Dequeue transcode job
    Worker->>DB: Update Video status: "processing"
    Worker->>S3: Download raw video file to local temporary storage
    Worker->>Worker: Run FFmpeg to generate 480p, 720p, 1080p MP4s
    Worker->>Worker: Run FFmpeg to generate thumbnail image from 480p MP4
    Worker->>S3: Upload processed variants and thumbnail
    Worker->>DB: Update Video status: "processed" (variant & thumb keys)
    Worker->>Worker: Delete temporary local files

    Note over Client: Video status is now "processed"
    Client->>API: GET /videos/:id/play?format=1080p
    API->>DB: Check video status and variant availability
    API->>API: Generate S3 presigned GET URL for selected variant (expires in 1 hr)
    API->>Client: Return playUrl, thumbUrl, and availableFormats
    Client->>S3: Stream video chunks directly to HTML5 video element
```

### Request Lifecycle

1. **Presigned Upload Requests**: To avoid proxying large video files through the Node.js API server, the frontend requests a presigned PUT URL from `POST /upload/request`. The API generates a unique video UUID and yields a temporary S3 URL valid for 15 minutes.
2. **Direct S3 Upload**: The frontend uploads the raw binary file directly to S3 via HTTP PUT. This keeps the API server lightweight and limits network overhead.
3. **Queue Notification**: Once the upload completes, the frontend sends a POST request to `/webhook/s3-upload`. The API records a new Video row in PostgreSQL with a `pending` status and enqueues a transcode job to the BullMQ queue.
4. **Asynchronous Transcoding**: The worker dequeues the job, updates the database status to `processing`, and downloads the file from S3 to local temporary storage. It invokes FFmpeg to transcode the video into 480p, 720p, and 1080p MP4 formats and extract a thumbnail. The outputs are uploaded to S3, and the database status updates to `processed`.
5. **Playback**: When playing a video, the client requests a signed playback URL from `GET /videos/:id/play?format=...`. The backend generates a temporary presigned GET URL (valid for 1 hour) pointing directly to the target resolution variant in S3.

## Tech Stack

| Technology | Purpose | Selection Rationale / Alternatives Considered |
| :--- | :--- | :--- |
| **Next.js (React 18)** | Frontend UI & routing | Chosen over React SPAs (like Vite) because it integrates routing structures and server components, while TypeScript prevents type mismatch errors at build time. |
| **Express.js** | API Gateway | Chosen over Python/FastAPI or Go because it uses JavaScript/TypeScript, letting the project share models and interfaces with the frontend, and runs natively with Node-based BullMQ libraries. |
| **Redis & BullMQ** | Message Queue | Chosen over a simple cron job or AWS SQS. A cron job cannot run in response to immediate user uploads without continuous polling, whereas BullMQ runs jobs immediately, supports automatic backoffs, and registers job states in Redis without AWS SQS/SNS configuration. |
| **Node.js & FFmpeg** | Transcoding Worker | Chosen over cloud media transcoding APIs (like AWS MediaConvert) because local FFmpeg enables zero-cost scaling of transcoding tasks on our own compute resources and runs locally for development. |
| **AWS S3** | Object Storage | Chosen over local filesystem storage because it decouples compute from storage, allowing the API and worker processes to scale independently and read/write assets concurrently. |
| **PostgreSQL (Supabase)** | Relational Database | Chosen over MongoDB because video metadata, user profiles, and ownership mappings have strict relations and require transactional consistency. Prisma ORM is utilized for migrations and type-safe database queries. |

## Database Schema

The database contains two primary tables managed by Prisma:

### User
* `id` (String, UUID, Primary Key)
* `email` (String, Unique)
* `password` (String, Hashed)
* `role` (String, defaults to "user")
* `videos` (Relation to Video model)
* `createdAt` / `updatedAt` (DateTime)

### Video
* `id` (String, UUID, Primary Key)
* `title` (String)
* `description` (String, Optional)
* `status` (String, pending, uploaded, processing, processed, failed)
* `rawKey` (String, S3 key for original file)
* `thumbKey` (String, S3 key for thumbnail)
* `variants` (Json, maps resolutions like "480p" to S3 keys)
* `visibility` (String, public or private)
* `userId` (String, Foreign Key mapping to User)
* `createdAt` / `updatedAt` (DateTime)

## API Endpoints

### Authentication
* `POST /auth/register`: Create user account and return JWT token.
* `POST /auth/login`: Validate credentials and return JWT token.
* `GET /auth/me`: Retrieve current authenticated user profile.

### Video Operations
* `POST /upload/request`: Generate S3 presigned upload URL (`rawKey` and `uploadUrl`).
* `POST /webhook/s3-upload`: Finalize database record creation and queue transcoding job.
* `GET /videos`: Retrieve all public videos.
* `GET /videos/mine`: Retrieve logged-in user's videos.
* `GET /videos/:id/play`: Generate S3 presigned GET URL for selected resolution (`format` query parameter).
* `GET /videos/:id/status`: Poll current transcode state.
* `PATCH /videos/:id`: Edit title, description, and visibility.
* `DELETE /videos/:id`: Delete DB record and remove S3 files.

### Administration
* `GET /admin/videos`: Fetch metadata for all videos.
* `GET /admin/users`: Fetch metadata for all registered users.
* `DELETE /admin/videos/:id`: Administrative video removal.
* `DELETE /admin/users/:id`: Administrative user removal (cascades to their videos).

## Local Development Setup

### Prerequisites
* Node.js (v18 or higher)
* Docker (to run Redis)
* AWS Account with an S3 Bucket (or LocalStack equivalent)
* PostgreSQL Database (local or Supabase instance)
* FFmpeg installed locally (the worker runs `ffmpeg` commands via shell execution)

### 1. Configuration
Create a `.env` file in the project root directory using the following template:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/video_engine"
REDIS_URL="redis://localhost:6379"
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
S3_BUCKET="your-s3-bucket-name"
PORT=3000
JWT_SECRET="your-development-jwt-secret"
```

### 2. Database Migration
Navigate to the `api` directory, install dependencies, and run Prisma migrations:
```bash
cd api
npm install
npx prisma migrate dev
```

### 3. Run Infrastructure
Start Redis using Docker:
```bash
docker run -d --name video-redis -p 6379:6379 redis:7
```

### 4. Start the Application
Run each service in a separate terminal window:

**API Server**:
```bash
cd api
npm run dev
```

**Transcoding Worker**:
```bash
cd worker
npm install
npm run dev
```

**Frontend Application**:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` (or the port output by the Next.js process) to access the application.

## Known Limitations and Incomplete Implementation

This system is a proof-of-concept pipeline and has several structural limitations:

* **Client-Triggered Upload Webhook**: Instead of using S3 Event Notifications (SNS/SQS) to trigger the transcoding pipeline, the client notifies the API via `POST /webhook/s3-upload` after a successful upload. This trusts the client to report upload success, which is a security risk in a production system.
* **Simulated Adaptive Playback**: Adaptive quality switching is simulated client-side. The player reloads the source URL with a different resolution MP4 file and restores the `currentTime` timestamp. The project does not segment videos into HLS (.m3u8) or DASH (.mpd) playlists.
* **Worker Local Disk Storage**: The worker downloads the entire raw video to the operating system's temp directory before processing. For large files or high concurrency, this could exhaust disk space. A streaming FFmpeg approach or partitioned block storage would be required to scale.
* **Dead-Letter Queue (DLQ) Integration**: Fully implemented. When a transcoding job exhausts all 3 attempts, the worker programmatically registers the failure payload inside the `transcode-dlq` queue for debugging, while marking the DB video status as `"failed"`.
* **Authentication Scope**: Token-based authentication using JWTs is active, but lacks production security measures such as secure HTTP-only cookies, token expiration refreshing, and email verification.