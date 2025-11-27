// public/app.js
document.addEventListener("DOMContentLoaded", () => {
  const storage = firebase.storage();
  const db = firebase.firestore();

  const uploadForm = document.getElementById("uploadForm");
  const fileInput = document.getElementById("fileInput");
  const fileLabel = document.getElementById("fileLabel");
  const statusEl = document.getElementById("status");
  const imagesGrid = document.getElementById("imagesGrid");
  const emptyState = document.getElementById("emptyState");
  const counterEl = document.getElementById("counter");
  const uploadButton = document.getElementById("uploadButton");

  // Mostrar nombre del archivo elegido
  fileInput.addEventListener("change", () => {
    if (fileInput.files[0]) {
      fileLabel.textContent = fileInput.files[0].name;
    } else {
      fileLabel.textContent =
        "Haz clic para elegir un archivo (JPG, PNG, etc.)";
    }
  });

  // Subir imagen a Storage y registrar metadatos en Firestore
  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const file = fileInput.files[0];
    if (!file) {
      statusEl.textContent = "Selecciona una imagen primero.";
      statusEl.className = "status error";
      return;
    }

    try {
      statusEl.textContent = "Subiendo imagen...";
      statusEl.className = "status";
      uploadButton.disabled = true;

      const fileName = `${Date.now()}_${file.name}`;
      const ref = storage.ref().child(`uploads/${fileName}`);

      await ref.put(file);
      const url = await ref.getDownloadURL();

      await db.collection("images").add({
        name: file.name,
        originalUrl: url,
        // La Cloud Function luego puede añadir thumbnailUrl, width, height, etc.
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      statusEl.textContent =
        "Imagen subida correctamente. La miniatura se generará en el backend.";
      statusEl.className = "status ok";

      uploadForm.reset();
      fileLabel.textContent =
        "Haz clic para elegir un archivo (JPG, PNG, etc.)";
    } catch (err) {
      console.error("Error al subir la imagen:", err);
      statusEl.textContent =
        "Ocurrió un error al subir la imagen. Revisa la consola.";
      statusEl.className = "status error";
    } finally {
      uploadButton.disabled = false;
    }
  });

  // Escuchar en tiempo real los documentos de Firestore
  db.collection("images")
    .orderBy("createdAt", "desc")
    .onSnapshot(
      (snapshot) => {
        imagesGrid.innerHTML = "";
        const docs = snapshot.docs;

        counterEl.textContent = `${docs.length} elemento${
          docs.length === 1 ? "" : "s"
        }`;

        if (docs.length === 0) {
          emptyState.style.display = "block";
          return;
        }

        emptyState.style.display = "none";

        docs.forEach((doc) => {
          const data = doc.data();
          const card = document.createElement("div");
          card.className = "image-card";

          const imgSrc = data.thumbnailUrl || data.originalUrl;
          const estado = data.thumbnailUrl ? "Miniatura generada" : "Procesando…";

          card.innerHTML = `
            <img src="${imgSrc}" alt="${data.name || "Imagen"}" />
            <div class="meta">
              <p class="name">${data.name || "Sin nombre"}</p>
              <p class="info">${estado}</p>
            </div>
          `;

          imagesGrid.appendChild(card);
        });
      },
      (err) => {
        console.error("Error al escuchar imágenes:", err);
        statusEl.textContent =
          "Error al conectar con Firestore (revisa emuladores y reglas).";
        statusEl.className = "status error";
      }
    );
});
