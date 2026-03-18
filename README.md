# KaraokeManager — App Rooms

Sistema completo para gerenciamento de filas de karaokê. Cada estabelecimento possui sua própria fila isolada, acessível via QR Code ou código de acesso curto.

Produção: **https://app.karaokemanager.com.br**

---

## Funcionalidades

### Para cantores (singers)
- Entrada na fila informando nome, música, banda e link do YouTube
- Verificação server-side via Cloud Function (transação Firestore) que impede duplicata de cantor na fila
- Rate limiting de 30 segundos entre adições consecutivas
- Autenticação Google ou acesso anônimo (guest)

### Para o estabelecimento (owner / staff)
- Gerenciamento de sessões diárias (abrir/fechar fila)
- Controle do palco: chamar próximo cantor, marcar como cantado, remover da fila
- Visualização da fila em tempo real via Firestore listeners
- QR Code da loja para download em JPEG
- Código de acesso curto (`store.code`) com cópia e download como JPEG
- Edição do perfil da loja (nome, endereço, CNPJ, telefones)

### Configurações
- Página de configurações com **tabs** no desktop e **accordion** no mobile
- Suporte a temas claro e escuro

---

## Roles

| Role | Descrição |
|------|-----------|
| `owner` | Dono da loja — acesso total, incluindo perfil e relatórios |
| `staff` | Operador — gerencia a fila e o palco, sem acesso a dados financeiros |
| `singer` | Cantor — entra na fila e acompanha em tempo real |

---

## Tech Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| UI | Tailwind CSS + shadcn/ui (Radix UI) |
| Roteamento | React Router DOM v6 |
| Backend | Firebase Firestore + Auth + Analytics |
| Testes | Vitest + Testing Library |
| Deploy | Firebase Hosting |

---

## Estrutura Firestore

```
users/{userId}
stores/{storeId}
  └── rooms/{roomId}            # roomId fixo: "main"
        ├── queue/{queueId}     # entradas da fila
        ├── stage/current       # cantor no palco (documento único)
        └── sessions/{date}     # sessão do dia (ID = "YYYY-MM-DD")
  └── reports/{reportId}        # gerados apenas por Cloud Functions
```

---

## Configuração Local

### Pré-requisitos
- Node.js 20+
- npm

### Instalação

```bash
git clone <repository-url>
cd karaoke-manager/app-rooms
npm install
```

### Variáveis de ambiente

Crie `.env` na raiz baseado no `.env-example`:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

### Scripts

```bash
npm run dev          # servidor de desenvolvimento (porta 8080)
npm run build        # build de produção
npm run test         # testes com Vitest
npm run lint         # ESLint
npm run deploy       # build + firebase deploy (hosting + functions)
```

## Segurança

- **Firestore Rules**: controle de acesso por role em todas as coleções; `userId` em entradas da fila deve corresponder ao `request.auth.uid`
- **Trial e assinatura**: lojas só operam com trial ativo ou assinatura paga (`storeIsOperational`)
