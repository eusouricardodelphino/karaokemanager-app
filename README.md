# 🎤 Karaoke Manager - App Rooms

Sistema de gerenciamento de filas de Karaokê com suporte a multi-tenancy, permitindo que diferentes estabelecimentos (restaurantes/bares) gerenciem suas próprias filas de forma independente.

## 🚀 Funcionalidades

-   **Multi-tenancy**: Cada estabelecimento possui sua própria URL e fila exclusiva (`/:restaurantId`).
-   **Gerenciamento de Fila**: Adição de cantores, visualização em tempo real e controle de quem está no palco.
-   **Autenticação Multi-nível**:
    -   **Dono (Owner)**: Gerencia as configurações do estabelecimento e a fila.
    -   **Usuário (Singer)**: Entra na fila e acompanha o status.
-   **Sincronização em Tempo Real**: Alimentado por Firebase Firestore.
-   **Interface Responsiva**: Construída com Tailwind CSS e Radix UI (shadcn/ui).

## 🛠️ Tech Stack

-   **Frontend**: React + Vite + TypeScript
-   **State Management**: TanStack Query (React Query)
-   **Styling**: Tailwind CSS + shadcn/ui
-   **Backend/Database**: Firebase (Auth, Firestore, Analytics)
-   **Routing**: React Router DOM (v6)
-   **Testing**: Vitest + Testing Library

## 🏗️ Arquitetura e Dados

O projeto utiliza uma estrutura de dados no Firestore baseada no `restaurantId` (presente na URL) para filtrar as coleções:

-   `users`: Perfis de usuários e donos.
-   `queue`: Itens da fila de espera filtrados por `restaurantId`.
-   `onStage`: Controle de quem está cantando no momento.

## ⚙️ Configuração Local

### Pré-requisitos
-   Node.js (v18+)
-   Yarn ou npm

### Instalação

1.  Clone o repositório:
    ```bash
    git clone <repository-url>
    cd karaoke-manager/app-rooms
    ```

2.  Instale as dependências:
    ```bash
    yarn install
    # ou
    npm install
    ```

3.  Configure as variáveis de ambiente:
    Crie um arquivo `.env` na raiz do projeto baseado no `.env-example`:
    ```env
    VITE_FIREBASE_API_KEY=your_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
    ```

### Execução

-   **Desenvolvimento**: `yarn dev` ou `npm run dev`
-   **Build**: `yarn build` ou `npm run build`
-   **Testes**: `yarn test` ou `npm run test`
-   **Lint**: `yarn lint` ou `npm run lint`

## 📖 Como Usar

Para acessar a fila de um restaurante específico, utilize o padrão de URL:
`http://localhost:5173/nome-do-restaurante`

Os donos podem gerenciar as configurações em `/:restaurantId/settings` após o login.
