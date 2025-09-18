# 📋 Asistente Personal - Parte Diario de Trabajo

Una aplicación web completa para gestionar partes diarios de trabajo con funcionalidades avanzadas de dictado por voz, guardado automático y gestión inteligente de memoria.

## ✨ Características Principales

### 🎤 Dictado por Voz
- **Reconocimiento de voz en español** con Web Speech API
- **Botones de micrófono** en cada campo de texto
- **Indicadores visuales** durante el dictado
- **Compatibilidad** con Chrome, Safari y Edge

### 💾 Guardado Automático Completo
- **Guardado automático** cada 2 segundos
- **Recuperación automática** al reabrir el navegador
- **Indicador de estado** en tiempo real
- **Historial completo** con hasta 200 partes

### 📊 Gestión Inteligente de Memoria
- **Monitor de memoria** en tiempo real
- **Limpieza automática** cuando se llena
- **Configuración personalizable** de límites
- **Eliminación selectiva** por rangos de fechas

### 🔧 Funcionalidades Avanzadas
- **Edición de partes guardados** - Corrige errores fácilmente
- **Plantillas inteligentes** desde trabajos anteriores
- **Exportación múltiple** (PDF estructurado y CSV para análisis)
- **Estadísticas integradas** (horas, operarios, incidencias)

## 📋 Estructura del Parte Diario

1. **Información General** - Nombre del trabajo y fecha
2. **Trabajos Realizados** - Descripción detallada de actividades
3. **Operarios y Horas** - Personal con cálculo automático de totales
4. **Materiales Utilizados** - Lista con cantidades
5. **Incidencias** - Problemas o imprevistos
6. **Observaciones** - Comentarios adicionales
7. **Tareas Pendientes** - Planificación para el siguiente día
8. **Imágenes** - Documentación visual
9. **Resumen Inteligente** - Generación automática con estadísticas

## 🚀 Instalación y Uso

### Requisitos
- Navegador web moderno (Chrome, Safari, Edge recomendados)
- Micrófono para funcionalidad de dictado por voz

### Instalación
```bash
# Clonar el repositorio
git clone https://github.com/tuusuario/parte-diario-trabajo.git

# Navegar al directorio
cd parte-diario-trabajo

# Abrir index.html en tu navegador
```

### Uso Rápido
1. **Completar el formulario** paso a paso
2. **Usar dictado por voz** haciendo clic en los botones 🎤
3. **El guardado es automático** - no te preocupes por perder datos
4. **Exportar** en PDF o CSV al finalizar
5. **Gestionar historial** desde el botón "Historial"

## 🛠️ Tecnologías Utilizadas

- **React** - Framework principal
- **Tailwind CSS** - Estilos y diseño responsivo
- **Web Speech API** - Reconocimiento de voz
- **LocalStorage** - Persistencia de datos
- **Lucide React** - Iconografía
- **JavaScript ES6+** - Lógica de aplicación

## 📁 Estructura del Proyecto

```
parte-diario-trabajo/
├── README.md
├── index.html
├── src/
│   └── ParteDiarioTrabajo.jsx    # Componente principal
├── docs/
│   ├── screenshots/              # Capturas de pantalla
│   └── user-guide.md            # Guía de usuario
└── examples/
    ├── parte-ejemplo.pdf         # Ejemplo de parte exportado
    └── historial-ejemplo.csv     # Ejemplo de historial
```

## 💡 Casos de Uso

### Para Construcción
- Registro diario de obras
- Control de personal y horas
- Seguimiento de materiales
- Documentación de incidencias

### Para Mantenimiento
- Partes de reparaciones
- Inventario de repuestos utilizados
- Planificación de tareas

### Para Servicios
- Registro de intervenciones
- Control de tiempo por cliente
- Seguimiento de incidencias

## 🔒 Privacidad y Seguridad

- **Datos locales** - Toda la información se guarda únicamente en tu navegador
- **Sin servidores** - No se envían datos a terceros
- **Control total** - Tú decides qué eliminar y cuándo
- **Exportación** - Respaldo completo de tus datos

## 🚀 Funcionalidades Avanzadas

### Sistema de Memoria Inteligente
- **Monitor en tiempo real** del uso de almacenamiento
- **Limpieza automática** al aproximarse a límites
- **Configuración personalizable** de retención de datos
- **Alertas proactivas** de mantenimiento

### Exportación Profesional
- **PDF estructurado** para impresión y archivo
- **CSV completo** para análisis en Excel/Sheets
- **Historial masivo** exportable
- **Metadatos incluidos** (fechas, estadísticas)

### Plantillas Inteligentes
- **Reutilización** de operarios frecuentes
- **Materiales comunes** desde trabajos similares
- **Configuración base** para proyectos recurrentes

## 📱 Compatibilidad

### Navegadores Soportados
- ✅ **Chrome 60+** (Recomendado)
- ✅ **Safari 14+** 
- ✅ **Edge 79+**
- ⚠️ **Firefox** (sin dictado por voz)

### Dispositivos
- ✅ **Escritorio** (Windows, macOS, Linux)
- ✅ **Tablets** (iPad, Android)
- ✅ **Móviles** (iOS Safari, Chrome Android)

## 🔄 Actualizaciones y Roadmap

### Versión Actual: 1.0.0
- [x] Sistema completo de partes diarios
- [x] Dictado por voz integrado
- [x] Guardado automático
- [x] Gestión de memoria
- [x] Exportación múltiple
- [x] Historial editable

### Próximas Versiones
- [ ] Sincronización entre dispositivos
- [ ] Plantillas predefinidas por sector
- [ ] Integración con calendarios
- [ ] Reportes automáticos
- [ ] API para sistemas externos

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! 

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👨‍💻 Autor

Desarrollado con ❤️ para profesionales que necesitan documentar su trabajo diario de forma eficiente.

---

### 📞 Soporte

¿Tienes preguntas o sugerencias? 
- 🐛 Reporta bugs en [Issues](https://github.com/tuusuario/parte-diario-trabajo/issues)
- 💡 Sugiere funcionalidades en [Discussions](https://github.com/tuusuario/parte-diario-trabajo/discussions)

**¡Haz que tu documentación diaria sea más eficiente! 🚀**