/**
 * ============================================================================
 * PROCESAMIENTO DE IMÁGENES CON ARQUITECTURA SERVERLESS
 * ============================================================================
 * Cloud Function para procesar automáticamente imágenes subidas a Firebase Storage
 * Genera miniaturas y almacena metadatos en Firestore
 * 
 * @author Equipo de Arquitectura de Software
 * @version 1.0.0
 */

// ============================================================================
// IMPORTACIÓN DE DEPENDENCIAS
// ============================================================================

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sharp = require("sharp");
const path = require("path");
const os = require("os");
const fs = require("fs");

// Inicializar Firebase Admin SDK
admin.initializeApp();

// Referencias a servicios de Firebase
const storage = admin.storage();
const firestore = admin.firestore();

// ============================================================================
// CONFIGURACIÓN GLOBAL
// ============================================================================

// Configuración de la miniatura
const THUMBNAIL_CONFIG = {
  width: 200,
  height: 200,
  fit: "cover", // Opciones: 'cover', 'contain', 'fill', 'inside', 'outside'
  quality: 80,  // Calidad de compresión (1-100)
};

// Carpeta donde se guardarán las miniaturas
const THUMBNAIL_FOLDER = "thumbnails";

// Prefijo para identificar miniaturas (prevención de bucle infinito)
const THUMBNAIL_PREFIX = "thumb_";

// ============================================================================
// CLOUD FUNCTION: PROCESAMIENTO AUTOMÁTICO DE IMÁGENES
// ============================================================================

/**
 * Función que se ejecuta automáticamente cuando se sube un archivo a Storage.
 * 
 * Trigger: onFinalize - Se activa cuando un archivo se finaliza en Storage.
 * 
 * Flujo:
 * 1. Valida que el archivo sea una imagen válida
 * 2. Previene procesamiento de miniaturas existentes
 * 3. Descarga la imagen original
 * 4. Redimensiona usando sharp
 * 5. Sube la miniatura a Storage
 * 6. Guarda metadatos en Firestore
 * 7. Limpia archivos temporales
 */
exports.generateThumbnail = functions.storage
  .object()
  .onFinalize(async (object) => {
    
    // ------------------------------------------------------------------------
    // PASO 1: EXTRACCIÓN DE METADATOS DEL ARCHIVO
    // ------------------------------------------------------------------------
    
    const filePath = object.name; // Ruta completa del archivo en Storage
    const contentType = object.contentType; // Tipo MIME del archivo
    const fileBucket = object.bucket; // Nombre del bucket de Storage
    const fileName = path.basename(filePath); // Nombre del archivo
    const fileDir = path.dirname(filePath); // Directorio del archivo
    
    console.log(`Nuevo archivo detectado: ${fileName}`);
    console.log(`Directorio: ${fileDir}`);
    console.log(`Content-Type: ${contentType}`);
    
    // ------------------------------------------------------------------------
    // PASO 2: VALIDACIONES PREVIAS
    // ------------------------------------------------------------------------
    
    // 2.1 Verificar que el archivo sea una imagen
    if (!contentType || !contentType.startsWith("image/")) {
      console.log("El archivo no es una imagen. Proceso cancelado.");
      return null;
    }
    
    // 2.2 PREVENCIÓN DE BUCLE INFINITO: No procesar si ya es una miniatura
    if (fileDir.includes(THUMBNAIL_FOLDER)) {
      console.log("El archivo ya es una miniatura. Proceso cancelado.");
      return null;
    }
    
    // 2.3 No procesar si el nombre del archivo ya tiene el prefijo de miniatura
    if (fileName.startsWith(THUMBNAIL_PREFIX)) {
      console.log("El archivo ya tiene prefijo de miniatura. Proceso cancelado.");
      return null;
    }
    
    console.log("Validaciones completadas. Iniciando procesamiento...");
    
    // ------------------------------------------------------------------------
    // PASO 3: CONFIGURACIÓN DE RUTAS LOCALES Y REMOTAS
    // ------------------------------------------------------------------------
    
    // Bucket de Firebase Storage
    const bucket = storage.bucket(fileBucket);
    
    // Archivo original en Storage
    const originalFile = bucket.file(filePath);
    
    // Ruta temporal local para descargar la imagen original
    const tempLocalFile = path.join(os.tmpdir(), fileName);
    
    // Nombre de la miniatura con prefijo
    const thumbnailFileName = `${THUMBNAIL_PREFIX}${fileName}`;
    
    // Ruta temporal local para la miniatura procesada
    const tempLocalThumbFile = path.join(os.tmpdir(), thumbnailFileName);
    
    // Ruta de destino en Storage para la miniatura
    const thumbnailFilePath = path.join(THUMBNAIL_FOLDER, thumbnailFileName);
    
    console.log(`Descargando a: ${tempLocalFile}`);
    console.log(`Subirá a: ${thumbnailFilePath}`);
    
    try {
      
      // ----------------------------------------------------------------------
      // PASO 4: DESCARGAR LA IMAGEN ORIGINAL
      // ----------------------------------------------------------------------
      
      console.log("⬇Descargando imagen original desde Storage...");
      await originalFile.download({ destination: tempLocalFile });
      console.log("Imagen descargada exitosamente.");
      
      // ----------------------------------------------------------------------
      // PASO 5: PROCESAMIENTO CON SHARP (REDIMENSIONAMIENTO)
      // ----------------------------------------------------------------------
      
      console.log("🖼️  Procesando imagen con sharp...");
      await sharp(tempLocalFile)
        .resize(THUMBNAIL_CONFIG.width, THUMBNAIL_CONFIG.height, {
          fit: THUMBNAIL_CONFIG.fit,
          position: "center",
        })
        .jpeg({ quality: THUMBNAIL_CONFIG.quality }) // Convertir a JPEG con calidad
        .toFile(tempLocalThumbFile);
      
      console.log(`Miniatura generada: ${THUMBNAIL_CONFIG.width}x${THUMBNAIL_CONFIG.height}px`);
      
      // ----------------------------------------------------------------------
      // PASO 6: SUBIR LA MINIATURA A FIREBASE STORAGE
      // ----------------------------------------------------------------------
      
      console.log("⬆Subiendo miniatura a Firebase Storage...");
      await bucket.upload(tempLocalThumbFile, {
        destination: thumbnailFilePath,
        metadata: {
          contentType: "image/jpeg",
          metadata: {
            originalFile: filePath,
            processedAt: new Date().toISOString(),
          },
        },
      });
      
      console.log("Miniatura subida exitosamente.");
      
      // ----------------------------------------------------------------------
      // PASO 7: GENERAR URLs PÚBLICAS (OPCIONAL - REQUIERE REGLAS DE ACCESO)
      // ----------------------------------------------------------------------
      
      // Obtener URLs firmadas o públicas
      const originalFileRef = bucket.file(filePath);
      const thumbnailFileRef = bucket.file(thumbnailFilePath);
      
      // Generar URLs públicas (requiere que el bucket tenga permisos públicos)
      const [originalUrl] = await originalFileRef.getSignedUrl({
        action: "read",
        expires: "03-01-2500", // Fecha de expiración lejana
      });
      
      const [thumbnailUrl] = await thumbnailFileRef.getSignedUrl({
        action: "read",
        expires: "03-01-2500",
      });
      
      console.log("🔗 URLs generadas correctamente.");
      
      // ----------------------------------------------------------------------
      // PASO 8: GUARDAR METADATOS EN FIRESTORE
      // ----------------------------------------------------------------------
      
      console.log("💾 Guardando metadatos en Firestore...");
      
      const imageMetadata = {
        fileName: fileName,
        originalUrl: originalUrl,
        thumbnailUrl: thumbnailUrl,
        originalPath: filePath,
        thumbnailPath: thumbnailFilePath,
        contentType: contentType,
        uploadedBy: "system", // Placeholder - reemplazar cuando haya autenticación
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: "PROCESADO",
        dimensions: {
          thumbnail: {
            width: THUMBNAIL_CONFIG.width,
            height: THUMBNAIL_CONFIG.height,
          },
        },
      };
      
      // Crear documento en la colección 'imagenes'
      await firestore.collection("imagenes").add(imageMetadata);
      
      console.log("Metadatos guardados en Firestore.");
      
      // ----------------------------------------------------------------------
      // PASO 9: LIMPIEZA DE ARCHIVOS TEMPORALES
      // ----------------------------------------------------------------------
      
      console.log("🧹 Limpiando archivos temporales...");
      
      // Eliminar archivo original descargado
      fs.unlinkSync(tempLocalFile);
      
      // Eliminar miniatura local
      fs.unlinkSync(tempLocalThumbFile);
      
      console.log("Archivos temporales eliminados.");
      
      // ----------------------------------------------------------------------
      // PASO 10: FINALIZACIÓN EXITOSA
      // ----------------------------------------------------------------------
      
      console.log("🎉 ¡Procesamiento completado exitosamente!");
      console.log(`📊 Original: ${originalUrl.substring(0, 50)}...`);
      console.log(`📊 Miniatura: ${thumbnailUrl.substring(0, 50)}...`);
      
      return {
        success: true,
        originalPath: filePath,
        thumbnailPath: thumbnailFilePath,
      };
      
    } catch (error) {
      
      // ----------------------------------------------------------------------
      // MANEJO DE ERRORES
      // ----------------------------------------------------------------------
      
      console.error("Error durante el procesamiento de la imagen:", error);
      
      // Intentar limpiar archivos temporales en caso de error
      try {
        if (fs.existsSync(tempLocalFile)) {
          fs.unlinkSync(tempLocalFile);
        }
        if (fs.existsSync(tempLocalThumbFile)) {
          fs.unlinkSync(tempLocalThumbFile);
        }
      } catch (cleanupError) {
        console.error("⚠️  Error al limpiar archivos temporales:", cleanupError);
      }
      
      // Guardar error en Firestore para análisis posterior
      try {
        await firestore.collection("errores").add({
          fileName: fileName,
          filePath: filePath,
          error: error.message,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          stack: error.stack,
        });
      } catch (firestoreError) {
        console.error("⚠️  No se pudo guardar el error en Firestore:", firestoreError);
      }
      
      // Re-lanzar el error para que Firebase Functions lo registre
      throw error;
    }
  });
