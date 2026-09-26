# Frontend (Next.js 16)

Este é o app web da Teia de Palavras: o painel do educador em `app/(painel)` e o app da
criança em `app/(crianca)`. Para subir o projeto, os comandos e as regras de negócio, leia o
[`README.md`](../README.md) e o [`CLAUDE.md`](../CLAUDE.md) na raiz do repositório.

```bash
npm ci            # dependências
npm run dev       # desenvolvimento (porta 3000; no compose, 3005)
npm test          # Vitest: lógica pura em lib/
npm run lint      # eslint
npm run build     # build de produção (standalone)
npm run test:e2e  # Playwright: missões completas só por toques (exige a API no ar)
```

O E2E prepara a turma de teste chamando `php artisan teia:preparar-e2e --json`. Por padrão ele
usa o compose de desenvolvimento (`docker compose exec -T backend …`); para rodar sem Docker,
defina `E2E_PREPARAR_CMD` com o comando local, por exemplo
`E2E_PREPARAR_CMD="php artisan teia:preparar-e2e --json"` executado a partir de `backend/laravel`.
