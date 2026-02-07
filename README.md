# `app/` Directory Documentation

This document provides a detailed overview of the `app/` directory in the My Internal Web project. It covers the structure, functionality, and key components of the application, with diagrams to help readers deeply understand the project.

## 1. Directory Structure

The `app/` directory is the core of the Next.js application, containing all the UI pages and API routes.

```
/app
├─── api/
│    ├─── Checksession/
│    ├─── GetUserRoles/
│    ├─── proxy-search-org/
│    └─── richmenu/
├─── components/
│    ├─── Login.jsx
│    └─── sidebar.jsx
├─── manage/
├─── manage-case/
├─── manage-flex-message/
├─── manage-org/
├─── manage-richmenu/
└─── search-org/
```

## 2. High-Level Architecture

The application follows a standard Next.js App Router structure.

-   **Frontend:** Built with React and Next.js, using server components for data fetching and client components for interactivity.
-   **Backend:** API routes are defined in the `app/api/` directory and are deployed as serverless functions.
-   **Database:** The application uses a PostgreSQL database hosted on Neon for data persistence.
-   **Authentication:** User authentication is handled by Firebase Authentication with Google as the provider.
-   **Authorization:** Role-based access control is managed by Permit.io.
-   **External Services:** The application interacts with the LINE API for managing Rich Menus and bots.

### Component Diagram

This diagram shows the main components of the system and how they interact.

```mermaid
graph TD
    subgraph "User Interface"
        A[Next.js Frontend]
    end

    subgraph "Backend & External Services"
        B[Next.js API Routes]
        C["PostgreSQL (Neon)"]
        D["Firebase Auth"]
        E["Permit.io"]
        F["LINE API"]
    end

    A -- "HTTP Requests" --> B
    B -- "DB Queries" --> C
    A -- "Authentication Flow" --> D
    B -- "Permission Checks" --> E
    B -- "Rich Menu Management" --> F
```

### Data Model (ER Diagram)

This diagram illustrates the relationships between the main database entities.

```mermaid
erDiagram
    admin_system {
        int admin_id PK
        string email
        string access_token
        boolean is_deleted
    }

    line_bots {
        int id PK
        string bot_name
        string bot_key
        string channel_token
        string picture_url
        int creator_id FK
    }

    bot_rich_menus {
        int id PK
        int bot_id FK
        string rich_menu_id
        string menu_name
        string image_url
        boolean is_active
    }

    admin_system ||--o{ line_bots : "creates"
    line_bots ||--o{ bot_rich_menus : "has"
```

### User Login Sequence Diagram

This diagram shows the sequence of events during the user login process.

```mermaid
sequenceDiagram
    participant User
    participant LoginPage as "Login Page (Client)"
    participant FirebaseAuth as "Firebase Auth"
    participant BackendAPI as "Backend API"
    participant Database

    User->>LoginPage: Clicks 'Sign in with Google'
    LoginPage->>FirebaseAuth: Initiates Google Sign-In Popup
    FirebaseAuth-->>LoginPage: Returns User Credentials & Token
    LoginPage->>BackendAPI: POST /api/login (sends user data)
    BackendAPI->>Database: SELECT/INSERT admin_system
    Database-->>BackendAPI: Returns admin_id and roles
    BackendAPI-->>LoginPage: Returns session data (cookies, roles)
    LoginPage->>User: Stores session in cookies/localStorage, redirects to /manage
```

## 3. Page Workflows

This section explains the workflow of each management page with a diagram.

### 3.1. Manage Emails (`/manage`)

This page allows admins to manage user access.

```mermaid
flowchart TD
    A[Start] --> B{Load Page};
    B --> C{Fetch users from /api/.../user};
    C --> D[Display User List];
    D --> E{Admin Action};
    E --> F[Add New User];
    E --> G[Delete User];
    F --> H{POST to /api/.../user};
    G --> I{DELETE to /api/.../user};
    H --> B;
    I --> B;
```

### 3.2. Manage Case (`/manage-case`)

This page is for managing support cases.

```mermaid
sequenceDiagram
    participant User
    participant ManageCasePage as "Manage Case Page"
    participant BackendAPI as "Backend API"

    User->>ManageCasePage: Enters Case ID and clicks Search
    ManageCasePage->>BackendAPI: GET /api/search-case?id=...
    BackendAPI-->>ManageCasePage: Returns case details and files
    ManageCasePage->>User: Displays case info and attached files
    User->>ManageCasePage: Selects a file to replace and uploads a new one
    ManageCasePage->>User: Enters reason for replacement
    User->>ManageCasePage: Clicks 'Update'
    ManageCasePage->>BackendAPI: PUT /api/manage-case?id=... (with new file and reason)
    BackendAPI-->>ManageCasePage: Confirms update
    ManageCasePage->>User: Shows success message
```

### 3.3. Manage Flex Message (`/manage-flex-message`)

This page is for creating and managing LINE Flex Messages.

```mermaid
flowchart TD
    A[Start] --> B{Load Page};
    B --> C{Fetch Flex Messages from API};
    C --> D[Display Message Grid];
    D --> E{User clicks 'Create New'};
    E --> F{Choose 'From Scratch' or 'Template'};
    F --> G[Open Editor Modal];
    G --> H{User edits JSON and details};
    H --> I{POST to /api/.../flex-message};
    I --> B;
```

### 3.4. Manage Org (`/manage-org`)

This page is for managing organization details.

```mermaid
sequenceDiagram
    participant User
    participant ManageOrgPage as "Manage Org Page"
    participant BackendAPI as "Backend API"

    User->>ManageOrgPage: Searches for an organization
    ManageOrgPage->>BackendAPI: GET /api/search-org?q=...
    BackendAPI-->>ManageOrgPage: Returns organization data
    ManageOrgPage->>User: Displays organization details
    User->>ManageOrgPage: Edits name, logo, or permissions
    User->>ManageOrgPage: Clicks 'Update'
    ManageOrgPage->>BackendAPI: PUT /api/manage-org?id=... (with updated data)
    BackendAPI-->>ManageOrgPage: Confirms update
    ManageOrgPage->>User: Shows success message
```

### 3.5. Manage Rich Menu (`/manage-richmenu`)

This page is for managing LINE Rich Menus.

```mermaid
sequenceDiagram
    participant User
    participant RichMenuPage as "Rich Menu Page"
    participant BackendAPI as "Backend API"
    participant LINE_API as "LINE API"

    User->>RichMenuPage: Selects a bot
    RichMenuPage->>BackendAPI: GET /api/richmenu/list?botKey=...
    BackendAPI-->>RichMenuPage: Returns list of menus
    User->>RichMenuPage: Fills out new menu form (name, image, actions)
    RichMenuPage->>BackendAPI: POST /api/richmenu/upload
    BackendAPI->>LINE_API: Create Rich Menu object
    LINE_API-->>BackendAPI: Returns richMenuId
    BackendAPI->>LINE_API: Upload image to richMenuId
    BackendAPI->>BackendAPI: Save menu to DB
    BackendAPI-->>RichMenuPage: Success
```

### 3.6. Search Org (`/search-org`)

This page is for finding duplicate organizations.

```mermaid
sequenceDiagram
    participant User
    participant SearchOrgPage as "Search Org Page"
    participant ProxyAPI as "/api/proxy-search-org"
    participant ExternalAPI as "External Search Service"

    User->>SearchOrgPage: Enters organization name
    SearchOrgPage->>ProxyAPI: GET /api/proxy-search-org?search=...
    ProxyAPI->>ExternalAPI: Forwards the search query
    ExternalAPI-->>ProxyAPI: Returns search results
    ProxyAPI-->>SearchOrgPage: Returns results to the client
    SearchOrgPage->>User: Displays list of similar organizations
```

## 4. Core Components & Functionality

### 4.1. API Routes (`app/api/`)

This directory contains the backend logic of the application, handling all server-side operations.

-   **`Checksession`**: Verifies the user's session by comparing the `access_token` from the client's cookie with the one stored in the `admin_system` table. This ensures that a user's session is still valid and hasn't been superseded by a login on another device.
-   **`GetUserRoles`**: Fetches the user's roles from the `admin_system` table and cross-references them with Permit.io for fine-grained permissions. It uses a `stale-while-revalidate` caching strategy to minimize latency for frequent requests.
-   **`proxy-search-org`**: Acts as a secure intermediary to an external organization search service. This proxy prevents exposing the external API endpoint to the client and bypasses potential CORS issues.
-   **`richmenu`**: A comprehensive suite of API routes for managing LINE Rich Menus.
    -   `add`: Inserts a new LINE bot's configuration (name, key, token) into the `line_bots` table.
    -   `bots`: Retrieves and lists all registered LINE bots from the database.
    -   `current`: Fetches the `richMenuId` of the currently active Rich Menu for a specific bot directly from the LINE API.
    -   `delete`: Removes a Rich Menu from both the LINE platform and the `bot_rich_menus` table.
    -   `details`: Fetches the detailed JSON structure of a specific Rich Menu from the LINE API.
    -   `image`: Serves the image content of a Rich Menu by fetching it from the LINE API and streaming it back to the client.
    -   `list`: Retrieves all Rich Menus associated with a bot from the `bot_rich_menus` table and syncs it with the list from the LINE API.
    -   `switch`: Sets a specific Rich Menu as the default for all users of a bot via the LINE API and updates the `is_active` flag in the database.
    -   `sync`: Synchronizes the list of Rich Menus from the LINE API with the local database, adding any menus that exist on LINE but not locally.
    -   `upload`: A multi-step process that first creates a Rich Menu object on LINE, then uploads the image content, and finally links it to the bot.
    -   `verify-token`: Validates a LINE bot's channel access token by making a request to the LINE API's `/v2/bot/info` endpoint.

### 4.2. UI Components (`app/components/`)

-   **`Login.jsx`**: The application's entry point for unauthenticated users. It utilizes Firebase UI for a seamless Google Sign-In experience. Upon successful authentication, it sends the user's profile and OAuth token to the backend to establish a session and retrieve application-specific roles.
-   **`sidebar.jsx`**: The primary navigation component. It dynamically renders menu items based on the user's roles fetched from the `GetUserRoles` API. It displays user profile information (avatar, name, roles) and includes a prefetching mechanism on mouse hover to reduce perceived latency when navigating between pages.

### 4.3. Management Pages

-   **`manage/`**: A page for administrators to manage user access. It lists all registered users, their roles, and provides functionality to add new users or revoke access.
-   **`manage-case/`**: An interface for support staff to handle specific cases. It allows searching for a case by its ID and provides tools to view, upload, or replace associated media files (images, videos, documents).
-   **`manage-flex-message/`**: A powerful tool for creating and managing LINE Flex Messages. It features a JSON editor for raw message creation, a gallery of pre-built templates (e.g., receipts, profiles, menus), and a live preview renderer.
-   **`manage-org/`**: A high-level management page for organization-specific settings. Admins can update an organization's name and logo, toggle permissions for CSV data exports, and generate unique QR codes that link to the LINE bot for issue reporting.
-   **`manage-richmenu/`**: A comprehensive dashboard for managing LINE Rich Menus. It provides a visual interface to create, upload, and switch between different Rich Menus for each registered bot. It includes a mapping tool to define tappable areas and their corresponding actions (link, text, API call).
-   **`search-org/`**: A utility page to help prevent data duplication. It uses a similarity search algorithm (via the `proxy-search-org` API) to find organizations with similar names.

## 5. Key Libraries & Technologies

-   **Next.js**: The core framework for the application.
-   **React**: For building the user interface.
-   **Tailwind CSS**: For styling the application.
-   **daisyUI**: A Tailwind CSS component library.
-   **Lucide React**: For icons.
-   **Firebase**: For authentication.
-   **Permit.io**: For authorization and role management.
-   **Neon**: For the PostgreSQL database.
-   **`@neondatabase/serverless`**: The serverless driver for Neon.
-   **`pg`**: The PostgreSQL client for Node.js.
-   **`sweetalert2`**: For displaying alerts and confirmations.

## 6. Getting Started

1.  Install the dependencies:
    ```bash
    npm install
    ```
2.  Create a `.env.local` file and add the necessary environment variables.
3.  Run the development server:
    ```bash
    npm run dev
    ```

The application will be available at `http://localhost:3000`.
