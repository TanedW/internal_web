# `app/` Directory Documentation

This document provides a detailed overview of the `app/` directory in the My Internal Web project. It covers the structure, functionality, and key components of the application.

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

### Mermaid ER Diagram

This diagram illustrates the relationships between the main entities in the system.

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

    subgraph "External Services"
        Firebase {
            string uid
            string email
        }
        "Permit.io" {
            string user_id
            string role
        }
        "LINE API" {
            string richMenuId
            string channelToken
        }
    end

    admin_system -- Firebase : "authenticates with"
    admin_system -- "Permit.io" : "has roles in"
    line_bots -- "LINE API" : "interacts with"
    bot_rich_menus -- "LINE API" : "represents"

```

## 3. Core Components & Functionality

### 3.1. API Routes (`app/api/`)

This directory contains the backend logic of the application.

-   **`Checksession`**: Verifies the user's session by checking the access token against the database.
-   **`GetUserRoles`**: Fetches the user's roles from the database and Permit.io. It uses a `stale-while-revalidate` caching strategy for performance.
-   **`proxy-search-org`**: A proxy API to an external service for searching organizations. This is done to hide the actual API endpoint and to avoid CORS issues.
-   **`richmenu`**: A collection of API routes for managing LINE Rich Menus.
    -   `add`: Adds a new LINE bot to the database.
    -   `bots`: Lists all the LINE bots.
    -   `current`: Gets the currently active Rich Menu for a bot.
    -   `delete`: Deletes a Rich Menu.
    -   `details`: Gets the details of a Rich Menu.
    -   `image`: Serves the image of a Rich Menu.
    -   `list`: Lists all the Rich Menus for a bot.
    -   `switch`: Switches the active Rich Menu for a bot.
    -   `sync`: Syncs the Rich Menus from the LINE API to the database.
    -   `upload`: Uploads a new Rich Menu.
    -   `verify-token`: Verifies a LINE bot's channel access token.

### 3.2. UI Components (`app/components/`)

-   **`Login.jsx`**: The main login component. It uses Firebase for Google authentication and then sends the user's data to the backend for session creation.
-   **`sidebar.jsx`**: The application's sidebar. It handles navigation between pages and displays the user's profile information and roles. It also implements a prefetching strategy to improve navigation speed.

### 3.3. Management Pages

-   **`manage/`**: A page for managing user emails and their roles.
-   **`manage-case/`**: A page for managing support cases, including uploading and replacing files associated with a case.
-   **`manage-flex-message/`**: A page for creating and managing LINE Flex Messages. It includes a visual editor and a template gallery.
-   **`manage-org/`**: A page for managing organizations. It allows admins to update organization details, logos, and generate QR codes for reporting issues.
-   **`manage-richmenu/`**: A dashboard for managing LINE Rich Menus. It provides an interface to create, upload, and switch between different Rich Menus for each bot.
-   **`search-org/`**: A page for searching for duplicate organizations in the database.

## 4. Key Libraries & Technologies

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

## 5. Getting Started

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