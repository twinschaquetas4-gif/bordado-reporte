BORDADO REPORTE - VERSIÓN CON GUARDADO EN POSTGRESQL

Qué cambió:
- Empleados se guardan en PostgreSQL.
- Registros se guardan en PostgreSQL.
- Usuarios se guardan en PostgreSQL.
- El login ya valida contra la base de datos.
- Usuario inicial por defecto: admin / admin123

Qué debes hacer:
1. Descomprime este ZIP.
2. Reemplaza los archivos de tu repositorio por los de esta carpeta.
3. Sube todo a GitHub.
4. En Railway, asegúrate de que tu servicio bordado-reporte tenga la variable DATABASE_URL.
5. Railway hará deploy automático.

Comandos para subir:
  git add .
  git commit -m "version con postgres"
  git push

Si Railway no instala la nueva dependencia automáticamente, haz un redeploy desde Railway.
