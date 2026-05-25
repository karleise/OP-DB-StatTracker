# OP-DB-StatTracker

Aplicación personal para gestionar guías de mazos del **One Piece Card Game**, con emparejador aleatorio y tracking de estadísticas.

- **Guías**: catálogo público de guías escritas por el admin, con filtros dinámicos por color, dificultad y estilo de juego.
- **Emparejador aleatorio**: genera duelos `Leader A vs Leader B` entre líderes con guía, respetando ventajas/desventajas.
- **Estadísticas**: cada jugador registra sus partidas y consulta sus stats personales y un ranking global.

Inspirada visualmente en [en.onepiece-cardgame.com/cardlist](https://en.onepiece-cardgame.com/cardlist/) (estética dark-mode con acentos rojo/amarillo).

---

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS 4** (vía `@theme inline` en `globals.css`)
- **Prisma 6** + **MySQL** (local en desarrollo, hosteado en producción)
- **NextAuth v5** (Auth.js) con CredentialsProvider + bcrypt + JWT
- **Playwright** para scraping one-shot de leaders
- `react-hook-form` · `zod` · `react-markdown` · `sonner`

---

## Setup local

### 1. Requisitos

- Node.js ≥ 20
- MySQL 8 instalado y arrancado en `localhost:3306`. Opciones rápidas:

```bash
# Con Docker
docker run --name opdb-mysql -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=opdb_stattracker -p 3306:3306 -d mysql:8

# O instala MySQL Community Server y crea la BD:
mysql -u root -p -e "CREATE DATABASE opdb_stattracker;"
```

### 2. Variables de entorno

Copia `.env.example` a `.env` y ajusta:

```
DATABASE_URL="mysql://root:password@localhost:3306/opdb_stattracker"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<openssl rand -base64 32>"
```

### 3. Instalar dependencias

```bash
npm install
npx playwright install chromium   # solo la primera vez, para el scraper
```

### 4. Migrar y seedear la BD

```bash
npm run db:migrate          # crea las tablas
npm run scrape:leaders      # scrapea TODOS los líderes a prisma/seed-leaders.json
npm run db:seed             # admin + catálogos por defecto + leaders
```

> Si el scraper falla porque la web cambió los selectores, edita `scripts/scrape-leaders.ts` o pega un array de leaders en `prisma/seed-leaders.json` antes de seedear.

### 5. Levantar dev

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

---

## Cuentas

- **Admin**: `admin` / `admin` (sembrado por `db:seed`).
- Cualquier otro jugador puede crearse su cuenta en `/register`.

Solo el admin puede:
- Crear/editar/borrar guías.
- Gestionar los catálogos (colores, dificultades, estilos).

---

## Scripts disponibles

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build para producción (incluye `prisma generate`) |
| `npm run start` | Servidor de producción |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Crea/aplica migraciones en dev |
| `npm run db:deploy` | Aplica migraciones en producción |
| `npm run db:seed` | Siembra admin, catálogos y leaders |
| `npm run db:reset` | Reinicia BD y re-seedea |
| `npm run db:studio` | Prisma Studio (GUI de la BD) |
| `npm run scrape:leaders` | Ejecuta el scraper Playwright |

---

## Estructura del proyecto

```
prisma/
  schema.prisma            esquema de tablas
  seed.ts                  semilla (admin + catálogos + leaders desde JSON)
  seed-leaders.json        generado por el scraper
scripts/
  scrape-leaders.ts        Playwright que obtiene los Leader cards oficiales
src/
  app/
    (public-routes)        /guides, /randomizer, /stats
    (auth)/login, register
    admin/                 protegido por middleware (rol ADMIN)
    api/                   route handlers (REST JSON)
  components/
    layout/                Header
    leaders/               LeaderCard, LeaderPicker
    guides/                GuideCard, GuideFilters, GuideForm
    stats/                 MatchForm
    admin/                 CatalogEditor
  lib/
    prisma.ts              cliente singleton
    auth.ts                NextAuth + helpers requireAdmin/requireUser
    randomizer.ts          lógica del emparejador
    stats.ts               agregaciones para tabs Mías/Global
    validators/            esquemas zod
  middleware.ts            guard /admin y /stats/new
```

---

## Modelo de datos (resumen)

- **User** (`role: USER | ADMIN`)
- **Leader** (catálogo scrapeado) + N:M con **Color**
- **Color · Difficulty · PlayStyle** (catálogos editables por admin)
- **Guide** (1:1 Leader; FK color/difficulty/playstyle)
- **GuideMatchup** (Guide × Leader × `kind: GOOD | BAD`)
- **Match** (player, playerLeader, rival, rivalLeader, result, playedAt)

---

## Despliegue en Vercel

Vercel **no aloja MySQL**, así que hay que apuntar `DATABASE_URL` a un MySQL hosteado.

### Opción recomendada: TiDB Cloud Serverless

1. Crea un cluster gratuito en [tidbcloud.com](https://tidbcloud.com) (compatible MySQL, 5 GB free).
2. Copia el connection string (`mysql://user:pass@gateway01...:4000/dbname?sslaccept=strict`).
3. En Vercel → Import → este repo.
4. Environment variables:
   - `DATABASE_URL` = string TiDB
   - `NEXTAUTH_SECRET` = `openssl rand -base64 32`
   - `NEXTAUTH_URL` = la URL final de Vercel (o déjala vacía y Auth.js usará `VERCEL_URL`)
5. Build command (ya está en `package.json`): `prisma generate && next build`.
6. Tras el primer deploy, ejecuta localmente apuntando a TiDB:
   ```bash
   DATABASE_URL="<string TiDB>" npx prisma migrate deploy
   DATABASE_URL="<string TiDB>" npx prisma db seed
   ```

Otras alternativas MySQL: Aiven, Railway, Clever Cloud, PlanetScale (de pago).

---

## Flujo de ramas

`main` ← merges de feature branches:

- `feat/scaffold` · `feat/db-schema` · `feat/auth` · `feat/scraper` · `feat/guides` · `feat/admin` · `feat/randomizer` · `feat/stats` · `feat/polish-ui`

Cada cambio grande va en su rama y se mergea a `main` por PR.

---

## Verificación end-to-end

1. `localhost:3000` carga la landing.
2. `/login` con `admin/admin` → sesión activa, accede a `/admin/*`.
3. `/admin/catalogs/colors` muestra los 6 colores sembrados.
4. `/admin/guides/new` → crea una guía con 3 good + 3 bad matchups.
5. Logout → `/guides` muestra la guía públicamente con los filtros.
6. `/register` un user2 → login → `/randomizer` con toggle "Considerar matchups" ON.
7. `/stats/new` registrar 3 partidas → `/stats` Mías y Global muestran datos.
8. User normal en `/admin` → redirect a `/login`.

---

## Notas

- Las imágenes de los líderes se sirven directamente desde el CDN oficial (`en.onepiece-cardgame.com`). Si en producción hay throttling, descarga las imágenes a `public/leaders/` y referencia rutas locales.
- Este proyecto es un **fan project sin afiliación con Bandai** ni One Piece Card Game.
