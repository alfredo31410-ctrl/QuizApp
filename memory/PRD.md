# CEFIN - Plataforma de Evaluación Fiscal e Innovación - PRD

## Problema Original
Construir una plataforma web de análisis y segmentación de usuarios como Progressive Web App (PWA) con:
- Formulario de evaluación con 10+ preguntas relacionadas con estudios fiscales, innovación y contabilidad
- Sistema de puntuación con 5 niveles
- Páginas de resultados con video VSL y programador Calendly (solo niveles 3-5)
- Panel de administración con gestión de usuarios, filtros, búsqueda y exportación CSV
- Integraciones simuladas para ActiveCampaign, WhatsApp y Calendly

## Personas de Usuario
1. **Usuario de Evaluación** - Profesionales de negocios evaluando las capacidades de su organización
2. **Usuario Admin** - Personal que gestiona y analiza las evaluaciones enviadas

## Requisitos Principales (Estáticos)
- PWA con manifest.json y service worker
- Diseño responsive mobile-first
- 10 preguntas de opción múltiple con 3 opciones cada una (1-3 puntos)
- Asignación de nivel basada en puntuación total
- Autenticación JWT para admin
- Persistencia de datos en MongoDB

## Lo Implementado

### 26 de Enero, 2026 - MVP Inicial
- Flujo de evaluación con 10 preguntas (fiscal/innovación/contabilidad)
- UX estilo Typeform con barra de progreso
- Sistema de puntuación con 5 niveles
- Páginas de resultados con video VSL
- Placeholder de Calendly para niveles 3-5
- Panel de admin con autenticación JWT
- Tabla de usuarios con filtros/búsqueda
- Funcionalidad de exportación CSV
- Configuración PWA (manifest.json, service worker)
- Integraciones simuladas (ActiveCampaign, WhatsApp, Calendly)

### 26 de Enero, 2026 - Captura de Email para Evaluaciones Abandonadas
- ✅ Información de usuario capturada ANTES de las preguntas (nombre, email, teléfono)
- ✅ Usuarios guardados con estado "abandonado" inicialmente
- ✅ Estado cambia a "completado" al enviar la evaluación
- ✅ Panel admin muestra columna de Estado con badges de colores
- ✅ Admin puede filtrar por estado (Todos/Completados/Abandonados)
- ✅ Estadísticas muestran conteos separados de completados/abandonados
- ✅ Detalle de usuario muestra estado y maneja "Sin Respuestas" para abandonados
- ✅ Exportación CSV incluye columna de estado

### 26 de Enero, 2026 - Diseño CEFIN
- ✅ Paleta de colores CEFIN implementada:
  - Fondo: Azul marino oscuro (#0F1219, #1A1F2E)
  - Acento: Rojo guindo (#C41E3A)
  - Texto: Blanco y grises
- ✅ Tipografía:
  - Títulos: Montserrat (bold)
  - Cuerpo: Open Sans
- ✅ Toda la interfaz traducida al español
- ✅ Íconos PWA actualizados con color CEFIN
- ✅ Diseño de tarjetas oscuro con bordes sutiles
- ✅ Estados de selección con color rojo CEFIN

### Esquema de Base de Datos (MongoDB)
- `users`: id, name, email, phone, score (nullable), level (nullable), status ("abandoned"/"completed"), created_at
- `responses`: id, user_id, question, answer, score
- `admins`: id, email, password (hasheado), name, created_at

## Backlog Priorizado

### P0 - Crítico (Completado)
- [x] Flujo de evaluación completo
- [x] Sistema de puntuación y asignación de niveles
- [x] Autenticación de admin
- [x] Gestión de usuarios
- [x] Captura de email para recuperación de leads
- [x] Diseño de marca CEFIN

### P1 - Alta Prioridad (Siguiente)
- [ ] Integración real de ActiveCampaign
- [ ] Integración real de API WhatsApp
- [ ] Integración real de embed Calendly
- [ ] Notificaciones por email para evaluaciones completadas

### P2 - Prioridad Media
- [ ] Emails de seguimiento automatizados para evaluaciones abandonadas
- [ ] Dashboard de analíticas de evaluaciones
- [ ] Testing A/B para preguntas
- [ ] Soporte multiidioma

### P3 - Nice to Have
- [ ] Exportación PDF de resultados
- [ ] Evaluaciones de equipo/organización
- [ ] Reportes de comparación histórica

## Siguientes Tareas
1. Integrar API real de ActiveCampaign cuando se proporcione la clave
2. Integrar API de WhatsApp Business para notificaciones al admin
3. Agregar URL real de embed Calendly
4. Configurar secuencia automatizada de emails para abandonados
5. Agregar seguimiento de repetición de evaluaciones
