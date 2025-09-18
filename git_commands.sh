# 1. Inicializar repositorio Git (si no existe)
git init

# 2. Configurar información del usuario (si es la primera vez)
git config --global user.name "Tu Nombre"
git config --global user.email "tu-email@ejemplo.com"

# 3. Crear archivo .gitignore
echo "# Dependencias
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Archivos del sistema
.DS_Store
Thumbs.db

# Archivos de editor
.vscode/
.idea/
*.swp
*.swo

# Logs
logs/
*.log

# Archivos temporales
tmp/
temp/" > .gitignore

# 4. Añadir todos los archivos al staging
git add .

# 5. Hacer el primer commit
git commit -m "🚀 Initial commit: Asistente Personal Parte Diario v1.0.0

✨ Funcionalidades implementadas:
- 🎤 Dictado por voz en español
- 💾 Guardado automático completo
- 📊 Gestión inteligente de memoria
- 🔧 Edición de partes guardados
- 📄 Exportación PDF y CSV
- 📚 Historial completo con plantillas
- 🧹 Sistema de limpieza automática
- 📱 Diseño responsivo
- 🔒 Almacenamiento local seguro

🎯 Sistema profesional listo para producción"

# 6. Crear repositorio en GitHub (opción 1: usando GitHub CLI)
# Instalar GitHub CLI: https://cli.github.com/
gh repo create parte-diario-trabajo --public --description "Asistente personal completo para partes diarios de trabajo con dictado por voz"

# 7. Conectar con repositorio remoto (opción 2: manualmente)
# Primero crear el repo en github.com, luego:
git remote add origin https://github.com/michelsoler74/parte-diario-trabajo.git

# 8. Subir el código
git branch -M main
git push -u origin main

# 9. Configurar GitHub Pages (opcional - para hosting gratuito)
# Ir a Settings > Pages > Source: Deploy from branch > Branch: main

# 10. Crear release/tag de la versión
git tag -a v1.0.0 -m "🎉 Versión 1.0.0 - Primera release estable

🚀 Características principales:
- Sistema completo de partes diarios
- Dictado por voz integrado
- Guardado automático
- Gestión inteligente de memoria
- Exportación profesional (PDF/CSV)
- Historial editable con plantillas

✅ Listo para uso empresarial"

git push origin v1.0.0

# 11. Verificar que todo está subido correctamente
git status
git log --oneline -5