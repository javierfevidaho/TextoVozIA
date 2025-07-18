# 🎙️ TextoVozIA

Aplicación de escritorio construida con **Electron** que convierte texto en audio usando el servicio Text-to-Speech (TTS) de **Azure**, con soporte para voces en español y control avanzado de prosodia (velocidad, tono, emociones e intensidad).

---

## 🚀 Funcionalidades

- ✅ Selección dinámica de voces (filtradas por español).
- ✅ Conversión de texto a voz usando SSML (Speech Synthesis Markup Language).
- ✅ Control de velocidad y tono.
- ✅ Soporte para emociones y estilos (en voces neuronales compatibles).
- ✅ Guardado de archivos de audio MP3 en el disco local.
- ✅ Interfaz de usuario amigable basada en HTML y JavaScript.

---

## 🛠️ Tecnologías utilizadas

- **Electron**: para crear la aplicación de escritorio.
- **Node.js**: para la lógica de backend.
- **Axios**: para solicitudes HTTP al servicio de Azure TTS.
- **Azure Cognitive Services**: Text-to-Speech API.

---

## ⚙️ Configuración

### 1️⃣ Clonar el repositorio

git clone https://github.com/javierfevidaho/TextoVozIA.git
cd TextoVozIA

### 2️⃣ Instalar dependencias

npm install

### 3️⃣ Configurar variables de entorno

Crear un archivo .env en la raíz y agregar tu clave de suscripción de Azure:

AZURE_SUBSCRIPTION_KEY=tu_clave_de_azure_aqui

---

## ▶️ Ejecución

npm start

Si deseas abrir las herramientas de desarrollo (DevTools), puedes iniciar con:

npm start -- --dev

---

## 💬 Uso

- Ejecuta la aplicación.
- Selecciona una voz en español desde la lista.
- Ingresa el texto que deseas convertir.
- Ajusta velocidad, tono, emoción e intensidad si lo deseas.
- Haz clic en "Synthesize" para generar el audio.
- Guarda el archivo MP3 donde prefieras.

---

## 💡 Ejemplo de SSML personalizado

<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="es-ES">
  <voice name="es-ES-AlvaroNeural">
    <prosody rate="120%" pitch="+10%">
      ¡Hola! Esta es una demostración en español con velocidad y tono personalizados.
    </prosody>
  </voice>
</speak>

---

## 🛡️ Licencia

MIT License.

---

## ❤️ Autor

Creado por Javier Felix.
GitHub: https://github.com/javierfevidaho

---

## ⭐️ Contribuye

¡Pull requests y sugerencias son bienvenidas! Siéntete libre de abrir un issue o enviar mejoras.

---

## 💬 Contacto

Si tienes dudas o quieres soporte, puedes contactarme por GitHub o abrir un issue en el repositorio.

---

## 🚨 Nota

⚠️ No olvides configurar tu clave de Azure correctamente en el archivo .env antes de usar la aplicación.
