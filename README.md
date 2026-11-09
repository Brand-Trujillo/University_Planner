# University Planner

Gestión académica y de pendientes universitarios. **By Megabyte**

PWA instalable: dashboard, horario, calendario, pendientes con recordatorios, asistente IA simulado, importador de pantallazos, Pomodoro, compartir/importar, exportación a Google Calendar (.ics) y chat por materia. Todo se guarda en `localStorage`.

## Uso
Abre la página publicada en Chrome del celular → menú ⋮ → **Instalar app**.

En la foto de perfil, abre **Configuración → Color de la app** para elegir una paleta compatible con los modos claro y oscuro.

En **Más → Carné estudiantil** puedes guardar una imagen JPG, PNG, GIF o WebP, o un PDF de hasta 10 MB y consultarlo dentro de la app. El carné se guarda solamente en este dispositivo, separado por cuenta y sin sincronización en la nube; si borras los datos del navegador o de la app, tendrás que agregarlo de nuevo. El visor PDF utiliza PDF.js, distribuido bajo la licencia incluida en `vendor/PDFJS-LICENSE.txt`.

## Firebase (cuentas + datos en la nube + chat en vivo)
1. https://console.firebase.google.com → **Agregar proyecto**.
2. **Authentication** → Comenzar → Método de acceso → habilita **Google**. En Configuración → **Dominios autorizados** agrega `brand-trujillo.github.io`.
3. **Firestore Database** → Crear base de datos (modo producción) → pestaña **Reglas** → pega el contenido de `firestore.rules` → Publicar.
4. Configuración del proyecto (⚙️) → Tus apps → **Web (</>)** → registra la app y copia el objeto `firebaseConfig`.
5. Pégalo en `FIREBASE_CONFIG` al inicio del script de `index.html`, y haz `git add . && git commit && git push`.
6. (Opcional) Para restringir a una universidad: `ALLOWED_DOMAINS = ['cun.edu.co']`.

Los pendientes y el horario se sincronizan por cuenta (colección `users`). El chat en vivo usa un código de grupo compartido (`groups/{codigo}/messages`).

Demo: https://brand-trujillo.github.io/University_Planner/
