# University Planner

Gestión académica y de pendientes universitarios. **By Megabyte**

PWA instalable: dashboard, horario, calendario, pendientes con recordatorios, asistente IA simulado, importador de pantallazos, Pomodoro, compartir/importar, exportación a Google Calendar (.ics) y chat por materia. Todo se guarda en `localStorage`.

## Uso
Abre la página publicada en Chrome del celular → menú ⋮ → **Instalar app**.

## Login con Google
1. Entra a https://console.cloud.google.com → crea un proyecto.
2. APIs y servicios → Pantalla de consentimiento OAuth → tipo **Externo** → completa nombre y correo.
3. Credenciales → Crear credenciales → **ID de cliente de OAuth** → tipo **Aplicación web**.
4. En "Orígenes de JavaScript autorizados" agrega `https://brand-trujillo.github.io`.
5. Copia el ID y pégalo en `GOOGLE_CLIENT_ID` al inicio del script de `index.html`.
6. (Opcional) Para restringir a una universidad: `ALLOWED_DOMAINS = ['cun.edu.co']`.

Demo: https://brand-trujillo.github.io/University_Planner/
