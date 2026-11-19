# Cloud Media Vault

Aplicacion colaborativa para subir, consultar, filtrar, visualizar y eliminar imagenes, videos y documentos PDF. El binario vive en Cloudinary y MongoDB Atlas conserva solamente su URL, identificador y metadatos.

## Arquitectura elegida

Se usa la **Ruta A** del taller: un monolito fullstack con Next.js App Router.

```text
Navegador (React / Next.js)
          |
          v
Route Handlers /api/archivos
       |                |
       v                v
 Cloudinary        MongoDB Atlas
  binarios          metadatos
```

- Next.js 16 y React 19 para la aplicacion web.
- Route Handlers para la API REST.
- Cloudinary Node SDK para archivos fisicos.
- MongoDB Atlas y Mongoose para metadatos.
- Limite funcional acordado: 10 MiB por archivo.

## Equipo y responsabilidades

| Integrante | Rol | Entrega principal |
| --- | --- | --- |
| Andres | Arquitecto Cloud y Base de Datos | Proyecto base, Cloudinary, Atlas, modelo y variables |
| Sergio | Backend de ingesta | Validacion y `POST /api/archivos` |
| Elam | Backend CRUD | Persistencia, `GET` y `DELETE` sincronizado |
| Alejandro | Frontend y QA | Formulario, Drag & Drop, galeria, filtros y pruebas UI |

En un grupo de cuatro personas, los roles 4 y 5 del enunciado se fusionan. Cada integrante debe trabajar en su propia rama y conservar evidencia de sus commits.

## Estado actual

Entrega base de Andres:

- [x] Proyecto Next.js en JavaScript con App Router.
- [x] Dependencias `cloudinary` y `mongoose`.
- [x] Conexion reutilizable en `src/lib/mongodb.js`.
- [x] Cliente servidor en `src/lib/cloudinary.js`.
- [x] Modelo completo en `src/models/Archivo.js`.
- [x] `.env.example` y reglas de Git seguras.
- [x] Metadatos iniciales de la aplicacion.
- [ ] Crear las cuentas/recursos reales de Cloudinary y MongoDB Atlas.
- [ ] Completar `.env.local` con credenciales reales.
- [ ] Probar la conexion cuando se integren los primeros endpoints.

Los endpoints, componentes y flujos de subida/eliminacion no se implementan en esta rama porque corresponden a los demas roles.

## Preparacion local

Requisitos: Node.js 20.19 o superior, npm y Git. Next.js admite 20.9, pero la version instalada de Mongoose requiere 20.19.

```powershell
git clone https://github.com/Znex45/cloud-media-vault.git
cd cloud-media-vault
npm install
Copy-Item .env.example .env.local
npm run dev
```

Completa `.env.local` antes de probar la nube. Abre `http://localhost:3000`.

## Variables de entorno

```dotenv
MONGODB_URI=mongodb+srv://USUARIO:CONTRASENA@CLUSTER.mongodb.net/cloud_media_vault?retryWrites=true&w=majority
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

No uses el prefijo `NEXT_PUBLIC_`: estos valores se utilizan exclusivamente en el servidor. `.env.local` y cualquier otro archivo `.env` estan ignorados por Git; `.env.example` si se versiona porque no contiene secretos.

La configuracion manual paso a paso esta en [la guia de Andres](docs/README_ANDRES.md).

## Contrato de metadatos

La coleccion `archivos` usa esta forma:

```json
{
  "id": "ID_DE_MONGODB",
  "titulo": "Paisaje",
  "url": "https://res.cloudinary.com/...",
  "publicId": "cloud-media-vault/identificador",
  "tipoArchivo": "imagen",
  "mimeType": "image/jpeg",
  "tamanoBytes": 204800,
  "fechaSubida": "2026-11-18T18:00:00.000Z",
  "subidoPor": "Andres",
  "resourceType": "image"
}
```

Los valores validos de `tipoArchivo` son `imagen`, `video` y `pdf`. `resourceType` guarda literalmente el `resource_type` devuelto por Cloudinary para poder borrar el recurso correcto.

## Contrato de API compartido

| Metodo | Ruta | Respuesta exitosa |
| --- | --- | --- |
| POST | `/api/archivos` | `201 { "ok": true, "archivo": {...} }` |
| GET | `/api/archivos` | `200 { "ok": true, "archivos": [...] }` |
| GET | `/api/archivos?tipo=imagen&q=paisaje` | Lista filtrada |
| DELETE | `/api/archivos/:id` | `200 { "ok": true, "id": "...", "mensaje": "Archivo eliminado" }` |

Todos los errores deben responder `{ "ok": false, "error": "Mensaje claro" }`. El borrado se ejecuta primero en Cloudinary y despues en MongoDB; si falla Cloudinary, el registro no se elimina.

## Flujo de ramas recomendado

```powershell
git switch main
git pull origin main
git switch -c feature/nombre-de-la-entrega
```

Ramas acordadas:

- `feature/andres-cloud`
- `feature/sergio-upload`
- `feature/elam-crud`
- `feature/alejandro-frontend`

Antes de abrir un Pull Request:

```powershell
npm run lint
npm run build
git status
```

No se debe subir directamente a `main`, compartir secretos por GitHub ni incluir `node_modules` o `.next`.

## Criterios principales del taller

- Subida de JPG, PNG, WEBP, MP4, WEBM y PDF.
- Validacion frontend y backend de tipo y limite de 10 MiB.
- Vista previa multimedia, titulo, autor, peso, tipo y fecha.
- Filtros por categoria y busqueda por titulo.
- Eliminacion Cloudinary -> MongoDB y actualizacion inmediata de la galeria.
- Demostracion en vivo de maximo 8 minutos.
