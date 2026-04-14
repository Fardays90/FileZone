# FileZone 

A fast, secure, **peer-to-peer** file sharing app built with **WebRTC**, **React**, and **Go**. No file is ever uploaded to a server — everything is shared directly between connected users inside a room.


-  Real-time file sharing via WebRTC DataChannels
-  Join rooms and share with multiple peers
-  no centralized file storage
-  Lightweight Go WebSocket signaling server

## How It Works

1. A user creates or joins a room.
2. The app establishes WebRTC connections with all other peers in the room.
3. Files are sent directly through P2P WebRTC DataChannels.
4. Recipients can instantly download the shared files.

## Data flow of file transfer

```mermaid
sequenceDiagram
    participant PeerManager
    participant OPFSWorker
    participant OPFSStorage as Browser OPFS Storage
    participant BrowserMainThread as Main UI Thread
    participant ServiceWorker
    participant User

    PeerManager->>OPFSWorker: Send file chunk 1 + meta (fileName, offset)
    OPFSWorker->>OPFSStorage: Create/Get File Handle and Write chunk 1
    PeerManager->>OPFSWorker: Send file chunk 2 + meta
    OPFSWorker->>OPFSStorage: Write chunk 2
    Note over OPFSStorage: ... All chunks written sequentially by OPFSWorker ...
    PeerManager->>OPFSWorker: Send "done" signal (fileName)
    OPFSWorker->>OPFSStorage: Flush and close file handle
    OPFSWorker->>PeerManager: Post "done" message (fileName)
    PeerManager->>BrowserMainThread: Create temporary <a> tag for /download/fileName
    BrowserMainThread->>BrowserMainThread: Programmatically click <a> tag
    BrowserMainThread->>ServiceWorker: Browser attempts to fetch /download/fileName
    ServiceWorker->>ServiceWorker: Intercepts fetch request
    ServiceWorker->>OPFSStorage: Retrieve complete file (fileName) from OPFS
    OPFSStorage-->>ServiceWorker: Provides file stream
    ServiceWorker->>BrowserMainThread: Responds with file stream + download headers
    BrowserMainThread->>User: Initiates file download to user's computer
```

## Signaling Server flow

```mermaid
sequenceDiagram
    participant UserA as User A (Browser)
    participant SignalingServer as Signaling Server
    participant UserB as User B (Browser)

    UserA->>SignalingServer: Connects via WebSocket
    Note over SignalingServer: Assigns username 'alpha' to User A
    UserA->>SignalingServer: Sends "join" message for 'room123'
    UserB->>SignalingServer: Connects via WebSocket
    Note over SignalingServer: Assigns username 'beta' to User B
    UserB->>SignalingServer: Sends "join" message for 'room123'
    SignalingServer->>UserA: Sends 'usernames' update (including 'beta')
    SignalingServer->>UserB: Sends 'usernames' update (including 'alpha')

    UserA->>SignalingServer: Sends "offer" message (WebRTC type) for 'beta'
    Note over SignalingServer: Server processes 'offer', identifies 'beta' as recipient
    SignalingServer->>UserB: Forwards "offer" message to 'beta'
    Note over UserB: User B's browser receives the offer
```
## Design overview
- Signaling server: Handles websocket coordination for WebRTC setup and exchanging signaling data along with text messages.
- WebRTC data channels: Handles the file transfer. Files are broken into chunks and sent with identifiers (id, offset) to ensure correct reassembly from ArrayBuffers.
- OPFS: Stores incoming data chunks and reassembles them. Enabling sharing of large files without memory issues. A web worker is used to write to OPFS to prevent freezing the main thread.
- Service worker: Acts as a virtual download layer by intercepting HTTP requests and streaming files directly from OPFS to the browser’s download system.

## Tech Stack

| Layer      | Tech                       |
|------------|----------------------------|
| Frontend   | React, Zustand, Tailwind   |
| Backend    | Go (WebSocket server)      |
| P2P        | WebRTC                     |


