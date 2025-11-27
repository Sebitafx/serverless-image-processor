// v2 Functions + Storage trigger
const { setGlobalOptions } = require("firebase-functions/v2");
const { onObjectFinalized } = require("firebase-functions/v2/storage");
const logger = require("firebase-functions/logger");

const admin = require("firebase-admin");
const sharp = require("sharp");
const path = require("path");
const os = require("os");
const fs = require("fs");

// Opciones globales (región y límite de instancias)
setGlobalOptions({
  region: "us-central1",
  maxInstances: 10,
});

// Inicializar Admin SDK
admin.initializeApp();

const db = admin.firestore();

// Función que se dispara cuando se finaliza la subida de un archivo en Storage
exports.generateThumbnail = onObjectFinalized(async (event) => {
  const object = event.data;

  const bucketName = object.bucket;
  const filePath = object.name; // p.ej: uploads/12345_foto.png
  const contentType = object.contentType;

  logger.info("Evento de Storage recibido", { bucketName, filePath, contentType });

  // 1. Ignorar si no es imagen
  if (!contentType || !contentType.startsWith("image/")) {
    logger.info("No es una imagen, se omite:", filePath);
    return;
  }

  // 2. Evitar recursión si ya es una miniatura
  if (filePath.includes("thumbnails/")) {
    logger.info("Es una miniatura, se omite:", filePath);
    return;
  }

  const bucket = admin.storage().bucket(bucketName);

  const fileName = path.basename(filePath); // ej: 12345_foto.png
  const tempLocalFile = path.join(os.tmpdir(), fileName);
  const thumbFileName = `thumb_${fileName}`;
  const thumbFilePath = filePath.replace("uploads/", "thumbnails/");
  const tempLocalThumbFile = path.join(os.tmpdir(), thumbFileName);

  logger.info("Procesando imagen:", filePath);

  // 3. Descargar archivo original al /tmp
  await bucket.file(filePath).download({ destination: tempLocalFile });
  logger.info("Imagen descargada temporalmente en:", tempLocalFile);

  // 4. Generar miniatura con sharp (ejemplo: ancho 320px)
  await sharp(tempLocalFile)
    .resize({ width: 320 })
    .toFile(tempLocalThumbFile);
  logger.info("Miniatura generada en:", tempLocalThumbFile);

  // 5. Subir miniatura a Storage en carpeta thumbnails/
  await bucket.upload(tempLocalThumbFile, {
    destination: thumbFilePath,
    metadata: { contentType },
  });
  logger.info("Miniatura subida a:", thumbFilePath);

  // 6. Obtener URL firmada de la miniatura (para pruebas; en prod podrías usar reglas/https)
  const thumbFile = bucket.file(thumbFilePath);
  const [thumbUrl] = await thumbFile.getSignedUrl({
    action: "read",
    expires: "03-01-2100",
  });

  // 7. Registrar / actualizar documento en Firestore
  await db.collection("images").add({
    name: fileName,
    originalPath: filePath,
    thumbnailPath: thumbFilePath,
    thumbnailUrl: thumbUrl,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  logger.info("Metadatos guardados en Firestore.");

  // 8. Limpiar archivos temporales
  try {
    fs.unlinkSync(tempLocalFile);
    fs.unlinkSync(tempLocalThumbFile);
  } catch (err) {
    logger.warn("Error limpiando archivos temporales", err);
  }

  return;
});
