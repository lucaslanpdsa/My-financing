# Decisões de Arquitetura — My Financing

## Camada de API

### Decisão atual: Vercel API Routes

O backend está implementado como **Vercel API Routes** (`/api/*`) no mesmo repositório do frontend Angular. Um único deploy serve os dois.

**Motivo:** Simplicidade. App pessoal, um desenvolvedor, sem necessidade de escalar backend e frontend de forma independente.

**Trade-offs aceitos:**
- Funções serverless têm cold start (~200ms na primeira chamada após inatividade)
- Limite de execução por função (Vercel free: 10s)
- Backend e frontend acoplados no mesmo repositório

---

### Migração futura: Node.js separado

Quando o projeto crescer ou a limitação das API Routes se tornar um problema, migrar para um backend **Node.js/Express ou Fastify** em repositório próprio.

**O que muda na migração:**
- Conteúdo das funções em `api/*.ts` move para rotas Express/Fastify
- Lógica de negócio, queries ao Supabase e autenticação permanecem idênticos
- Angular não muda — continua chamando os mesmos endpoints `/api/*`, apenas apontando para o novo servidor

**O que não muda:**
- Contrato da API (paths, request/response format)
- Integração com Supabase
- Frontend Angular

**Gatilhos para migrar:**
- Necessidade de WebSockets ou conexões persistentes
- Lógica complexa que ultrapassa o timeout das serverless functions
- Backend precisar servir múltiplos frontends
- Time crescer e precisar de repositórios independentes

---

### Fluxo de dados

```
Browser (Angular)
    ↓  HTTP
Vercel API Routes  (/api/*)   ← hoje
    ↓  Supabase JS (service role)
Supabase (PostgreSQL)
```

Após migração:

```
Browser (Angular)
    ↓  HTTP
Node.js / Express  (servidor próprio)
    ↓  Supabase JS (service role)
Supabase (PostgreSQL)
```
