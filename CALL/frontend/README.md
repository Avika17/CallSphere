# CallSphere - Frontend (Next.js 15 + TypeScript)

This project has been updated from a basic Vite template to a production-ready **Next.js 15 App Router** application with **TypeScript**, **Tailwind CSS**, **TanStack Query**, and native **WebRTC** signaling.

## 🚀 Getting Started

Follow these steps to install packages and start the frontend application:

### 1. Install Dependencies
Navigate to the `frontend` folder and run:
```bash
npm install
```

### 2. Configure Environment Variables (Optional)
If your backend is running on a port other than `8000`, create a `.env.local` file in the `frontend` root:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1/users
NEXT_PUBLIC_SOCKET_URL=http://localhost:8000
```

### 3. Start Development Server
Run the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Architecture

```
frontend/
├── src/
│   ├── app/                   # Next.js 15 App Router pages & layouts
│   │   ├── auth/              # Login / Register forms (Zod + React Hook Form)
│   │   ├── dashboard/         # User main dashboard, history, and settings layout
│   │   │   ├── history/       # Fetch & display past meeting codes (TanStack Query)
│   │   │   └── settings/      # User preferences (camera/mic toggles) & profiles
│   │   ├── meeting/
│   │   │   └── [code]/        # Dynamic meeting room (Waiting Room & Active call)
│   │   ├── globals.css        # Global CSS variables & Tailwind directives
│   │   └── layout.tsx         # Root layout with fonts & context Providers
│   ├── components/            # Shared layouts and UI components
│   │   ├── layout/            # Sidebar.tsx & Navbar.tsx
│   │   └── ui/                # Button.tsx & Input.tsx & ToastProvider.tsx
│   ├── hooks/                 # Custom reusable react hooks
│   ├── lib/                   # Axios HTTP client configuration
│   ├── providers/             # AuthProvider, ToastProvider, and QueryProvider
│   ├── services/              # API caller services mapping backend routes
│   └── types/                 # TypeScript interfaces (User, Meeting, ChatMessage)
```

---

## 🛠️ Tech Stack Features

1. **Authentication Persistence**: The `AuthProvider` handles token persistence using `localStorage`. Since the backend has no `/profile` or `/me` endpoint, it stores the authenticated user's metadata locally.
2. **TanStack React Query**: Configured for caching and optimistic refetching of meeting history logs from the Express endpoint.
3. **Native WebRTC Integration**: Implements a standard Peer-to-Peer network topology with `RTCPeerConnection`, automatic SDP exchange, and ICE candidates routing over Socket.IO.
4. **Chat Replays & Broadcasts**: Features real-time chat sync with automated room replays from the server on join.
5. **Interactive Controls**: Supports mic toggles, camera blocks, screen-sharing streams, and fallback placeholders.
