La "Biblia" de **AllStars2**. Detalla todo lo que hemos construido, dónde estamos y el plan exacto para el futuro.

Copia este contenido y guárdalo en la raíz de tu proyecto (`~/allstars2/README.md`).

```markdown
# 🎸 AllStars2 - Hospitality OS

**SaaS de Gestión y Experiencia para Antros, Bares y Restaurantes.**

[![NestJS](https://img.shields.io/badge/nestjs-%23000000.svg?style=for-the-badge&logo=nestjs)](https://nestjs.com)
[![Next.js](https://img.shields.io/badge/next.js-%23000000?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/prisma-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Arquitectura del Proyecto](#arquitectura-del-proyecto)
- [Estructura de Carpetas y Archivos](#estructura-de-carpetas-y-archivos)
- [Instalación y Ejecución](#instalación-y-ejecución)
- [Características Implementadas (MVP)](#características-implementadas-mvp)
- [Estado Actual del Desarrollo](#estado-actual-del-desarrollo)
- [Roadmap y Objetivos Pendientes](#roadmap-y-objetivos-pendientes)

---

## 🎯 Descripción General

**AllStars2** es un Sistema Operativo de Hospitalidad (Hospitality OS) diseñado para modernizar la operación de antros, bares y restaurantes. A diferencia de un simple POS, **AllStars2** conecta la experiencia del cliente, la cocina, la barra y la administración en un solo ecosistema.

**Enfoque Principal:** No solo gestionar mesas y pagos, sino controlar el **"Vibe"** y la **Experiencia** mediante tecnología y datos.

---

## 🏗️ Arquitectura del Proyecto

El proyecto utiliza una arquitectura de **Monorepo** usando **Turborepo** para orquestar las aplicaciones.

*   **Frontend:** Next.js 15 (App Router), TailwindCSS, Socket.io Client.
*   **Backend:** NestJS, Prisma ORM, WebSockets (Socket.io), JWT Auth.
*   **Base de Datos:** PostgreSQL (Docker).
*   **Gestión de Paquetes:** pnpm.
*   **Infraestructura:** Docker Compose.

**Patrón de Arquitectura:** Monolito Modular.
*   `apps/api/src/core/`: Lógica fundamental invariable (Auth, Tenant, Menu, Orders).
*   `apps/api/src/plugins/`: Módulos premium y especializables (Door, DJ, Atmosphere, AI).

---

## 📂 Estructura de Carpetas y Archivos

Esta estructura refleja el estado actual del proyecto tras el desarrollo del MVP.

```text
allstars2/
│
├── 📁 apps/                           # Aplicaciones desplegadas
│   ├── 📁 api/                        # NESTJS BACKEND (Puerto 3000)
│   │   ├── 📁 src/
│   │   │   ├── 📁 common/             # Utilidades compartidas backend
│   │   │   │   ├── 📁 config/         # Configuración dinámica (Feature Flags)
│   │   │   │   ├── 📁 guards/         # Protección de rutas (JWT, Roles)
│   │   │   │   ├── 📁 interceptors/   # Lógica de Tenant y Logging
│   │   │   │   ├── 📁 decorators/     # Decoradores personalizados (@TenantId, @UserId)
│   │   │   │   └── 📁 middleware/     # Middleware de Express/Nest
│   │   │   │
│   │   │   ├── 📁 core/               # LÓGICA DE NEGOCIO FUNDAMENTAL
│   │   │   │   ├── 📁 auth/           # Módulo de Autenticación (Login, Register, JWT)
│   │   │   │   ├── 📁 tenant/         # Gestión de Antros (Tenants)
│   │   │   │   ├── 📁 user/           # Gestión de Usuarios
│   │   │   │   ├── 📁 menu/           # Gestión de Categorías y Productos
│   │   │   │   ├── 📁 order/          # Gestión de Órdenes y Pagos
│   │   │   │   └── 📁 inventory/      # Inventario (Traceability, Stock)
│   │   │   │
│   │   │   ├── 📁 plugins/            # MÓDULOS PREMIUM (Feature Flags)
│   │   │   │   ├── 📁 door/           # [PENDIENTE] Control de Acceso y Aforo
│   │   │   │   ├── 📁 dj/             # [PENDIENTE] Plataforma Interactiva para DJs
│   │   │   │   ├── 📁 atmosphere/     # [PENDIENTE] Vibe Manager (Luces, Música)
│   │   │   │   └── 📁 ai/             # [PENDIENTE] Servicios de Inteligencia Artificial
│   │   │   │
│   │   │   ├── 📁 lib/                # Clientes externos
│   │   │   │   ├── prisma-client.ts
│   │   │   │   └── redis-client.ts
│   │   │   │
│   │   │   ├── main.ts                # Punto de entrada de la app
│   │   │   └── app.module.ts          # Módulo raíz
│   │   │
│   │   ├── 📁 prisma/                 # Esquema de Base de Datos
│   │   │   └── schema.prisma         # Definición de modelos (Tenant, User, Product, Order...)
│   │   │
│   │   ├── 📁 test/                   # Pruebas (Unit, E2E)
│   │   ├── Dockerfile
│   │   ├── nest-cli.json
│   │   └── package.json
│   │
│   └── 📁 web/                        # NEXT.JS FRONTEND (Puerto 3001)
│       🚨 NOTA: Temporalmente movido a la raíz para solucionar sincronización Git. Refactor pendiente a `apps/web`.
│       ├── 📁 src/
│       │   ├── 📁 app/                # App Router
│       │   │   ├── page.tsx           # Página del Cliente (Menú, Categorías, Carrito)
│       │   │   ├── layout.tsx         # Layout raíz
│       │   │   ├── globals.css        # Estilos globales (Tailwind)
│       │   │   │
│       │   │   └── 📁 dashboard/     # Panel de Administración / Staff
│       │   │       ├── 📁 orders/      # KDS (Kitchen Display System) - Tiempo Real
│       │   │       │   └── page.tsx   # Tarjetas de pedidos activos
│       │   │       └── 📁 history/     # Historial de Ventas
│       │   │           └── page.tsx   # Tabla de cobros y auditoría
│       │   │
│       │   ├── 📁 components/         # Componentes React reutilizables
│       │   ├── 📁 lib/               # Lógica de cliente
│       │   │   └── api-client.ts      # Configuración de Axios + Interceptor Token
│       │   └── 📁 styles/             # Archivos CSS adicionales
│       │
│       ├── 📁 public/                 # Assets estáticos
│       ├── .env.local                 # Variables de entorno (NEXT_PUBLIC_API_URL)
│       ├── next.config.js
│       ├── tailwind.config.ts
│       └── package.json
│
├── 📁 packages/                       # Paquetes compartidos del Monorepo
│   ├── 📁 config/                     # Configuración global y Feature Flags
│   ├── 📁 types/                      # Definiciones TypeScript compartidas (User, Order, etc.)
│   └── 📁 ui/                         # Biblioteca de componentes UI (Shadcn - base)
│
├── 📁 infra/                          # Infraestructura como código
│   └── 📁 docker/
│       └── docker-compose.dev.yml     # Orquestación de PostgreSQL y Redis
│
├── 📄 README.md                       # Este archivo
├── 📄 turbo.json                      # Configuración de Turborepo
├── 📄 pnpm-workspace.yaml             # Espacio de trabajo de pnpm
└── 📄 package.json                    # Scripts de la raíz
```

---

## 🚀 Instalación y Ejecución

### Prerrequisitos
- Node.js (v18+)
- pnpm
- Docker & Docker Compose

### 1. Levantar Infraestructura (Base de Datos)
```bash
docker-compose -f infra/docker/docker-compose.dev.yml up -d
```
*Esto levanta PostgreSQL en el puerto 5433.*

### 2. Instalar Dependencias
```bash
pnpm install
```

### 3. Backend (NestJS)
```bash
cd apps/api
# Generar cliente Prisma (primera vez)
npx prisma generate
npx prisma db push

# Iniciar servidor
pnpm run start:dev
```
*Corre en http://localhost:3000*

### 4. Frontend (Next.js)
```bash
cd web
pnpm run dev
```
*Corre en http://localhost:3001*

### Nota sobre Autenticación
El sistema requiere un Token para hacer pedidos.
1.  Ve a `http://localhost:3000/auth/login` (Postman).
2.  Usa `dj@allstars.com` / `123456` o registra un usuario nuevo.
3.  Copia el `access_token`.
4.  En el navegador (F12 -> Application -> Local Storage), crea una llave `allstars_token` y pega el valor.

---

## ✅ Características Implementadas (MVP Alcanzado)

Hemos completado el ciclo de negocio fundamental para operar un local.

### 1. Multi-tenancy (Aislamiento de Datos)
*   **Implementación:** Cada entidad (Product, Order, User) está vinculada a un `Tenant`.
*   **Seguridad:** Uso de `@TenantId` decorator para filtrar todas las consultas automáticamente.
*   **Estado:** ✅ Funcional. Un usuario del "Club A" no puede ver los productos del "Club B".

### 2. Autenticación y Autorización
*   **Implementación:** JWT Strategy, Local Strategy, Hashing de contraseñas (Bcrypt).
*   **Estado:** ✅ Funcional. Login y Registro operativos.

### 3. Menú Inteligente por Categorías
*   **Implementación:** Estructura `Category` -> `Product`. Frontend con diseño de Acordeón.
*   **Estado:** ✅ Funcional. Visualización dinámica, añadir al carrito.

### 4. Sistema de Órdenes (Ciclo Completo)
*   **Implementación:** Creación de órdenes, cálculo de precios en tiempo real (server-side), deducción de stock.
*   **Estado:** ✅ Funcional. El cliente pide, se calcula el total y se guarda.

### 5. Tiempo Real (WebSockets)
*   **Implementación:** `OrderGateway` usando `socket.io`.
*   **Casos de Uso:**
    *   Cuando un cliente pide, la cocina lo ve al instante.
    *   Cuando la cocina cambia el estado (PENDING -> READY), la cocina se actualiza en todas las pantallas conectadas.
*   **Estado:** ✅ Funcional.

### 6. KDS (Kitchen Display System)
*   **Ubicación:** `web/src/app/dashboard/orders`
*   **Funciones:** Tarjetas visuales para pedidos activos, botones de flujo (Cocinar -> Listo -> Entregar).
*   **Estado:** ✅ Funcional.

### 7. Historial de Ventas y Cobros
*   **Ubicación:** `web/src/app/dashboard/history`
*   **Funciones:** Tabla de pedidos SERVED/PAID/CANCELLED, botón para marcar como PAGADO (Cobrar).
*   **Estado:** ✅ Funcional.

---

## 📍 Estado Actual del Desarrollo

Estamos en **Fase 2 (Operación Básica)** completada. El sistema es capaz de gestionar un local real en su día a día (Pedidos, Cocina, Caja).

### Técnico
*   **Backend:** Estable en Puerto 3000.
*   **Frontend:** Estable en Puerto 3001.
*   **BD:** Estable en Docker (Postgres 5433).
*   **Git:** Sincronizado en GitHub (Repositorio: `gerardo19720723/allstars2`).

### Deuda Técnica (Conocida)
*   **Estructura de Archivos:** La carpeta `web` se movió a la raíz (`allstars2/web`) para solucionar un conflicto de sincronización con Git.
    *   *Objetivo:* Refactorizar y devolverla a `apps/web` en el futuro para cumplir con el estándar estricto de Monorepo.
*   **Roles:** El sistema de Roles (`ADMIN`, `STAFF`, `KITCHEN`) está definido en el esquema pero **NO** implementado en los Guards (todavía se usa un `JwtAuthGuard` genérico).
*   **Validación:** Falta vincular el `tenantId` en la creación manual de productos en `Prisma Studio` (Actualmente se hace manualmente).

---

## 🗺️ Roadmap y Objetivos Pendientes

Este roadmap sigue la estrategia de "Círculos Concéntricos": Funcionalidad -> Diferenciadores -> IA.

### Fase 3: Control de Acceso (Plugin "Door") 🚪
**Objetivo:** Resolver el dolor principal de los antros (El control de la puerta).
*   **Endpoint:** `GET /door/scan/:code` (Validación de QR de cliente).
*   **Endpoint:** `POST /door/check-in` (Registro de entrada para aforo).
*   **Lógica:** Validar si el cliente es VIP, tiene invitaciones o paga cover charge.
*   **Frontend:** Página `app/(door)/scanner` (PWA para seguridad).

### Fase 4: Plataforma DJ 🎧
**Objetivo:** Diferenciador principal. Conectar cabina con pista.
*   **Backend:**
    *   `dj-room.gateway`: Cola de canciones en tiempo real.
    *   `music-integration`: Wrapper para Spotify API.
    *   Lógica de "Donation" para priorizar canciones (Pagar para saltar la cola).
*   **Frontend:**
    *   Panel DJ: Interfaz para aprobar/rechazar canciones.
    *   Cliente: Página para pedir/votar canciones (Web App accesible por QR).

### Fase 5: Vibe Manager (Plugin "Atmosphere") 🌈
**Objetivo:** Controlar la experiencia sensorial (Luces, Música, AC).
*   **Integración:**
    *   Philips Hue / LIFX (Luces).
    *   Spotify Business (Música).
*   **Lógica:**
    *   Cambiar color de luces según el estado del pedido (ej: Espera mesa = Rojo, Comiendo = Azul).
    *   Sincronizar BPM de la música con luces.

### Fase 6: Refactorización y Limpieza 🧹
**Objetivo:** Estandarización profesional.
*   **Tareas:**
    *   Mover `web/` de vuelta a `apps/web/`.
    *   Implementar Guards por Rol (`RoleGuard`).
    *   Separar lógica de negocio de lógica de presentación.
    *   Test unitarios básicos.

### Fase 7: IA y Analítica Avanzada 🧠
**Objetivo:** Optimización de costos y ventas.
*   **Bartender AI:** Generador de recetas basado en inventario vencido.
*   **Menu Engineering:** Análisis de rentabilidad por producto.
*   **Table Turn Predictor:** Predicción de tiempo de ocupación de mesa.

---

## 📄 Licencia

Este proyecto es propiedad exclusiva de **AllStars2**.
```

---

### Cómo usar este README

1.  **Para ti (Ahora):** Guárdalo. Es tu brújula. Si te olvidas de algo, léelo.
2.  **Para futuros desarrolladores:** Este archivo les explicará tu visión y la arquitectura sin que tú tengas que explicarlo 10 veces.

¡Buen trabajo hoy! ¡Hasta la próxima sesión de código! 🚀