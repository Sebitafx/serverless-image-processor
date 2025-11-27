# 🚀 Procesamiento de Imágenes con Arquitectura Serverless

[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

> Proyecto universitario de Arquitectura de Software - Implementación de procesamiento automático de imágenes mediante arquitectura serverless y eventos en tiempo real.

---

## 📖 Descripción del Proyecto

Esta aplicación web permite a los usuarios subir imágenes que son procesadas automáticamente en la nube. El flujo completo es:

```
📤 Usuario sube imagen → ⚡ Cloud Function se activa → 🖼️ Se genera miniatura → 💾 Se almacena todo → 📊 Metadatos en Firestore
```

### Características Principales

- ✅ Subida de imágenes en tiempo real
- ✅ Procesamiento automático con generación de miniaturas
- ✅ Almacenamiento escalable en la nube
- ✅ Sincronización de metadatos en base de datos NoSQL
- ✅ Arquitectura 100% serverless (sin servidores que mantener)
- ✅ Despliegue automático mediante Firebase CLI

---

## 🏗️ Arquitectura del Sistema

Este proyecto utiliza una **arquitectura serverless orientada a eventos**, donde cada acción desencadena funciones específicas sin necesidad de gestionar infraestructura:

```
┌─────────────────┐
│  Firebase       │
│  Hosting        │  ← Frontend (HTML/CSS/JS)
└────────┬────────┘
         │
    ┌────▼─────────────────────────┐
    │   Firebase Storage           │  ← Almacenamiento de imágenes
    │   (Bucket de archivos)       │
    └────┬─────────────────────────┘
         │ (Evento: onFinalize)
         │
    ┌────▼─────────────────────────┐
    │   Cloud Functions            │  ← Procesamiento (Node.js + sharp)
    │   (Backend FaaS)             │
    └────┬─────────────────────────┘
         │
    ┌────▼─────────────────────────┐
    │   Cloud Firestore            │  ← Base de datos NoSQL
    │   (Metadatos)                │
    └──────────────────────────────┘
```

---

## 🛠️ Stack Tecnológico

| Categoría | Tecnología | Propósito |
|-----------|-----------|-----------|
| **Plataforma Cloud** | Google Firebase (Plan Blaze) | Infraestructura serverless completa |
| **Frontend** | HTML5 / CSS3 / JavaScript (Vanilla) | Interfaz de usuario |
| **Hosting** | Firebase Hosting | Servicio de alojamiento estático |
| **Backend (FaaS)** | Cloud Functions (Node.js 18+) | Lógica de procesamiento serverless |
| **Procesamiento** | Librería `sharp` (Node.js) | Redimensionamiento de imágenes |
| **Almacenamiento** | Firebase Storage | Bucket para imágenes originales y miniaturas |
| **Base de Datos** | Cloud Firestore | Base de datos NoSQL en tiempo real |
| **Versionado** | Git + GitHub | Control de versiones |

---

## 👥 Roles del Equipo

Este proyecto fue desarrollado por un equipo multidisciplinario con las siguientes responsabilidades:

| Rol | Nombre | Responsabilidades |
|-----|--------|-------------------|
| **Analista** | Juan M. Rengifo | Análisis de requerimientos y diseño de arquitectura |
| **Frontend Developer** | Gianmarco S. Contreras | Desarrollo de la interfaz de usuario (HTML/CSS/JS) |
| **Backend Developer (Lógica)** | Josué S. Oriundo | Implementación de Cloud Functions y lógica de procesamiento |
| **Backend Developer (Configuración)** | Juber R. Zegarra | Configuración de Firebase y servicios en la nube |
| **Documentadora** | Akemi A. Zambrano | Documentación técnica y guías de usuario |

---

## 🚀 Guía de Inicio Rápido

### Prerequisites (Requisitos Previos)

Antes de comenzar, asegúrate de tener instalado:

1. **Node.js** (versión 18 o superior)
   ```powershell
   node --version  # Debe mostrar v18.x.x o superior
   ```

2. **Firebase CLI** (herramienta de línea de comandos)
   ```powershell
   npm install -g firebase-tools
   firebase --version
   ```

3. **Git** (para clonar el repositorio)
   ```powershell
   git --version
   ```

---

### 📥 Paso 1: Clonar el Repositorio

```powershell
# Clonar el repositorio desde GitHub
git clone https://github.com/Sebitafx/serverless-image-processor.git

# Ingresar al directorio del proyecto
cd serverless-image-processor
```

---

### 📦 Paso 2: Instalar Dependencias

```powershell
# Instalar las dependencias del backend (Cloud Functions)
cd functions
npm install
cd ..
```

> **Nota:** Esto instalará la librería `sharp` y todas las dependencias necesarias para el procesamiento de imágenes.

---

### 🔐 Paso 3: Autenticación en Firebase

```powershell
# Iniciar sesión en tu cuenta de Google/Firebase
firebase login
```

Se abrirá una ventana del navegador para que autorices el acceso. Una vez autenticado, regresa a la terminal.

---

### 🧪 Paso 4: Probar Localmente con Emuladores

Para desarrollar sin afectar el entorno de producción, usa los emuladores de Firebase:

```powershell
# Iniciar los emuladores locales
firebase emulators:start
```

Esto iniciará:
- **Firebase Hosting** en `http://localhost:5000` (o el puerto configurado)
- **Firestore Emulator** en `http://localhost:8080`
- **Storage Emulator** en `http://localhost:9199`
- **Functions Emulator** en `http://localhost:5001`

> **Tip:** Abre `http://localhost:4000` para acceder a la UI de los emuladores y ver logs en tiempo real.

---

### 🌐 Paso 5: Despliegue a Producción

Una vez que hayas probado localmente y estés listo para desplegar:

```powershell
# Desplegar todo (Hosting + Functions + Firestore Rules + Storage Rules)
firebase deploy
```

O despliega componentes específicos:

```powershell
# Solo el frontend
firebase deploy --only hosting

# Solo las funciones
firebase deploy --only functions

# Solo las reglas de Firestore
firebase deploy --only firestore:rules
```

---

## 📁 Estructura del Proyecto

```
serverless-img-proc/
│
├── public/                      # Frontend (archivos estáticos)
│   ├── index.html              # Página principal
│   ├── 404.html                # Página de error
│   └── styles.css              # Estilos (si existen)
│
├── functions/                   # Backend (Cloud Functions)
│   ├── index.js                # Lógica de procesamiento de imágenes
│   ├── package.json            # Dependencias del backend (sharp, etc.)
│   └── node_modules/           # Librerías instaladas (no se sube a Git)
│
├── firebase.json               # Configuración principal de Firebase
├── firestore.rules             # Reglas de seguridad de Firestore
├── firestore.indexes.json      # Índices de Firestore
├── storage.rules               # Reglas de seguridad de Storage
├── .firebaserc                 # Configuración de proyectos Firebase
├── .gitignore                  # Archivos ignorados por Git
└── README.md                   # Este archivo
```

---

## 🔧 Comandos Útiles

| Comando | Descripción |
|---------|-------------|
| `firebase login` | Autenticarse en Firebase |
| `firebase logout` | Cerrar sesión |
| `firebase projects:list` | Listar proyectos disponibles |
| `firebase emulators:start` | Iniciar emuladores locales |
| `firebase deploy` | Desplegar todo a producción |
| `firebase deploy --only hosting` | Desplegar solo el frontend |
| `firebase deploy --only functions` | Desplegar solo las funciones |
| `firebase serve` | Servir el frontend localmente (sin emuladores) |
| `npm install` (en `/functions`) | Instalar dependencias del backend |

---

## 🐛 Solución de Problemas Comunes

### Error: "Firebase CLI not found"
```powershell
npm install -g firebase-tools
```

### Error: "Authentication required"
```powershell
firebase login --reauth
```

### Error: "Functions deployment failed"
- Verifica que estés en el **Plan Blaze** (no Spark)
- Asegúrate de que `functions/package.json` tenga todas las dependencias
- Revisa los logs con: `firebase functions:log`

### La función no se ejecuta al subir imágenes
- Verifica que el trigger esté configurado correctamente en `functions/index.js`
- Revisa los logs en Firebase Console → Functions → Logs
- Asegúrate de que Storage tenga permisos correctos en `storage.rules`

---

## 📚 Recursos Adicionales

- [Documentación oficial de Firebase](https://firebase.google.com/docs)
- [Cloud Functions for Firebase](https://firebase.google.com/docs/functions)
- [Documentación de sharp](https://sharp.pixelplumbing.com/)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)

---

## 📄 Licencia

Este proyecto es de uso académico para la asignatura de Arquitectura de Software.

---

## 📞 Contacto

Para consultas sobre el proyecto, contacta al equipo a través del repositorio de GitHub:

🔗 **Repositorio:** [https://github.com/Sebitafx/serverless-image-processor](https://github.com/Sebitafx/serverless-image-processor)

---

**Desarrollado con 💙 por el equipo de Arquitectura de Software**
