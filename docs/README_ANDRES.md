# Guia de Andres - Cloud y Base de Datos

**Rama:** `feature/andres-cloud`  
**Rol:** Arquitecto Cloud y Base de Datos

Esta entrega deja el proyecto y el contrato tecnico listos para que Sergio, Elam y Alejandro trabajen sin crear configuraciones duplicadas.

## 1. Lo que ya esta implementado

- `src/lib/mongodb.js`: conexion Mongoose reutilizable y segura para hot reload.
- `src/lib/cloudinary.js`: cliente servidor, validacion de variables y carpeta compartida `cloud-media-vault`.
- `src/models/Archivo.js`: esquema completo e indices para fecha/tipo.
- `.env.example`: nombres de variables sin secretos.
- `.gitignore`: ignora todos los `.env` excepto el ejemplo.
- `src/app/layout.js`: idioma, titulo y descripcion del proyecto.

No modifiques en esta rama los endpoints o componentes que pertenecen a los otros integrantes.

## 2. Crear Cloudinary

1. Entra en `https://cloudinary.com` y crea una cuenta gratuita.
2. En el Dashboard identifica el **Cloud name** del Product Environment.
3. Abre **Settings -> API Keys** (tambien puede aparecer el boton **Go to API Keys**).
4. Copia **API Key** y revela/copia **API Secret**. Cloudinary puede pedir un codigo enviado al correo.
5. Abre **Settings -> Security** y activa **Allow delivery of PDF and ZIP files**. En cuentas gratuitas, la entrega publica de PDF esta bloqueada por defecto.
6. No necesitas crear manualmente la carpeta: el backend usara `cloud-media-vault` al hacer la primera subida.

Guarda los tres valores temporalmente en un gestor de contrasenas. No los envies por un canal publico ni los pegues en un commit.

## 3. Crear MongoDB Atlas

1. Entra en `https://www.mongodb.com/atlas` y crea una cuenta/proyecto.
2. Crea un deployment gratuito (Free/M0, o la opcion gratuita vigente) y espera a que quede disponible.
3. En **Database Access**, crea un usuario de base de datos. Este usuario es distinto del usuario con el que entras al panel de Atlas.
4. Usa una contrasena fuerte. Si contiene `@`, `:`, `/`, `?`, `#`, `[` o `]`, esos caracteres deben codificarse al ponerlos en la URI.
5. En **Network Access**, agrega tu IP actual. Agrega tambien la IP de cada companero que ejecutara el backend local.
6. En la vista del deployment pulsa **Connect -> Drivers**, selecciona Node.js y copia la URI `mongodb+srv://...`.
7. Sustituye `<db_password>` por la contrasena real y agrega `/cloud_media_vault` antes de las opciones `?`.

Ejemplo de forma (no es una credencial real):

```text
mongodb+srv://usuario:contrasena@cluster.ejemplo.mongodb.net/cloud_media_vault?retryWrites=true&w=majority
```

Atlas crea fisicamente la base y la coleccion cuando se guarda el primer documento; no es obligatorio crear la coleccion a mano.

## 4. Crear `.env.local`

Desde la raiz del proyecto:

```powershell
Copy-Item .env.example .env.local
```

Abre `.env.local` en VS Code y completa:

```dotenv
MONGODB_URI=mongodb+srv://...
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

Luego reinicia `npm run dev`. Next.js lee estas variables al iniciar; si editas el archivo con el servidor abierto, detenlo con `Ctrl + C` y vuelve a iniciarlo.

## 5. Verificaciones de seguridad

Ejecuta:

```powershell
git status
git check-ignore -v .env.local
git check-ignore -v .env.example
```

Resultado esperado:

- `.env.local` debe aparecer ignorado.
- `.env.example` no debe aparecer ignorado.
- Ningun secreto debe estar en `git diff` o `git status`.

Si una clave se publica accidentalmente, rotala inmediatamente en Cloudinary/Atlas. Borrar la linea en un commit posterior no retira el secreto del historial.

## 6. Entrega a cada companero

- A Sergio: `src/lib/cloudinary.js`, la constante `CARPETA_CLOUDINARY` y las tres variables Cloudinary por un canal privado.
- A Elam: `src/lib/mongodb.js`, `src/models/Archivo.js` y `MONGODB_URI` por un canal privado.
- A Alejandro: URL del repositorio y el contrato de API/metadatos; no necesita usar secretos desde el navegador.

Cada companero crea su propio `.env.local`; ese archivo nunca se envia por Pull Request.

## 7. Pruebas antes del Pull Request

```powershell
npm install
npm run lint
npm run build
git status
```

La compilacion valida el codigo y los imports, pero no demuestra por si sola que las cuentas cloud funcionen. La conexion real se prueba cuando Elam integre una consulta y Sergio una subida.

## 8. Sustentacion de Andres (aprox. 1 minuto)

Explica este recorrido:

```text
Navegador -> Next.js Route Handler -> Cloudinary (binario)
                                  -> MongoDB Atlas (metadatos)
```

Muestra `.env.example`, pero no abras `.env.local` durante la grabacion. Senala que el modelo guarda `publicId` y `resourceType` porque ambos se necesitan para eliminar correctamente el recurso en Cloudinary.
