const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const axios = require('axios');
const fs = require('fs');

let mainWindow;
require('dotenv').config();


function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });

  mainWindow.loadFile('index.html');
  
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for Azure TTS
ipcMain.handle('get-voices', async () => {
  try {
    const response = await axios.get(
      'https://eastus.tts.speech.microsoft.com/cognitiveservices/voices/list',
      {
        headers: {
          'Ocp-Apim-Subscription-Key': process.env.AZURE_SUBSCRIPTION_KEY        }
      }
    );
    
    // Filter Spanish voices
    const spanishVoices = response.data.filter(voice => 
      voice.Locale.startsWith('es-')
    );
    
    return spanishVoices;
  } catch (error) {
    console.error('Error getting voices:', error);
    throw error;
  }
});

ipcMain.handle('synthesize-speech', async (event, { text, voiceName, speed = 1.0, pitch = '0%', emotion = 'neutral', intensity = '1.0' }) => {
  try {
    console.log('=== DEBUG INFO ===');
    console.log('Text:', text);
    console.log('Voice name:', voiceName);
    console.log('Speed:', speed);
    console.log('Pitch:', pitch);
    console.log('Emotion:', emotion);
    console.log('Intensity:', intensity);
    
    // Escape text to prevent XML issues
    const escapedText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
    
    // Determine if this is a neural voice
    const isNeuralVoice = voiceName.toLowerCase().includes('neural');
    console.log('Is Neural Voice:', isNeuralVoice);
    
    // Get locale from voice name - more robust detection
    let locale = 'es-ES'; // Default fallback
    if (voiceName.includes('-')) {
      const parts = voiceName.split('-');
      if (parts.length >= 2) {
        locale = `${parts[0]}-${parts[1]}`;
      }
    }
    console.log('Detected locale:', locale);
    
    // Fix speed format - Azure expects different formats
    let speedValue = speed;
    if (typeof speed === 'string') {
      speedValue = parseFloat(speed);
    }
    
    // Convert speed to percentage or rate format
    let rateValue;
    if (speedValue === 1.0) {
      rateValue = 'medium';
    } else if (speedValue < 1.0) {
      rateValue = `${Math.round(speedValue * 100)}%`;
    } else {
      rateValue = `${Math.round(speedValue * 100)}%`;
    }
    
    // Fix pitch format - ensure it has % sign
    let pitchValue = pitch;
    if (typeof pitch === 'number') {
      pitchValue = `${pitch}%`;
    } else if (typeof pitch === 'string' && !pitch.includes('%')) {
      pitchValue = `${pitch}%`;
    }
    
    console.log('Pitch value:', pitchValue);
    
    let ssml;
    
    // Start with the most basic SSML possible
    if (emotion === 'neutral' || !isNeuralVoice) {
      ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${locale}">
<voice name="${voiceName}">
<prosody rate="${rateValue}" pitch="${pitchValue}">
${escapedText}
</prosody>
</voice>
</speak>`;
    } else {
      // For neural voices with emotions - use only widely supported emotions
      // These are the most commonly supported emotions across Azure neural voices
      const basicSupportedEmotions = {
        'angry': 'angry',
        'cheerful': 'cheerful', 
        'excited': 'excited',
        'sad': 'sad',
        'assistant': 'assistant',
        'newscast': 'newscast'
      };
      
      // Map other emotions to basic supported ones
      const emotionMapping = {
        'angry': 'angry',
        'excited': 'excited', 
        'cheerful': 'cheerful',
        'sad': 'sad',
        'shouting': 'excited',  // Map shouting to excited (more widely supported)
        'whispering': 'gentle', // Will fallback to cheerful if gentle not supported
        'terrified': 'sad',     // Map to sad
        'unfriendly': 'angry',  // Map to angry
        'gentle': 'cheerful',   // Map to cheerful (more widely supported)
        'assistant': 'assistant',
        'newscast': 'newscast',
        'customerservice': 'cheerful'
      };
      
      const azureStyle = emotionMapping[emotion] || 'cheerful';
      
      // Ensure we only use basic supported emotions
      const finalStyle = basicSupportedEmotions[azureStyle] || 'cheerful';
      
      // Ensure intensity is a valid number
      let intensityValue = parseFloat(intensity);
      if (isNaN(intensityValue) || intensityValue < 0.01 || intensityValue > 2) {
        intensityValue = 1.0;
      }
      
      console.log(`Mapping emotion '${emotion}' -> '${azureStyle}' -> '${finalStyle}'`);
      
      ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="${locale}">
<voice name="${voiceName}">
<mstts:express-as style="${finalStyle}" styledegree="${intensityValue}">
<prosody rate="${rateValue}" pitch="${pitchValue}">
${escapedText}
</prosody>
</mstts:express-as>
</voice>
</speak>`;
    }
    
    console.log('SSML being sent:');
    console.log(ssml);
    console.log('Is Neural Voice:', isNeuralVoice);
    console.log('Using locale:', locale);
    console.log('Rate value:', rateValue);
    
    // First, try a completely basic SSML to test the voice name
    if (emotion !== 'neutral' && isNeuralVoice) {
      console.log('Attempting neural voice with emotion');
    } else {
      console.log('Using basic voice synthesis');
    }
    
    const config = {
      headers: {
        'Ocp-Apim-Subscription-Key': 'i4acpGpOTSQL0CPisdjhjhOLRLLZhxhJWbxMlEamGIxz6sbyVLTGJQQJ99BEACYeBjFXJ3w3AAAYACOGM8Oc',
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
        'User-Agent': 'Azure Voice Tester'
      },
      responseType: 'arraybuffer',
      timeout: 30000
    };
    
    console.log('Request config:', config);
    console.log('Endpoint:', 'https://eastus.tts.speech.microsoft.com/cognitiveservices/v1');

    const response = await axios.post(
      'https://eastus.tts.speech.microsoft.com/cognitiveservices/v1',
      ssml,
      config
    );

    console.log('Response received, status:', response.status);
    console.log('Response size:', response.data.byteLength);

    // Save audio file temporarily with timestamp and emotion info
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const emotionSuffix = emotion !== 'neutral' ? `_${emotion}_${intensity}` : '';
    const audioPath = path.join(__dirname, `temp_audio_${timestamp}${emotionSuffix}.mp3`);
    fs.writeFileSync(audioPath, response.data);
    
    console.log('Audio saved to:', audioPath);
    return audioPath;
    
  } catch (error) {
    console.error('=== ERROR DETAILS ===');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    
    if (error.response) {
      console.error('HTTP Status:', error.response.status);
      console.error('HTTP Status Text:', error.response.statusText);
      console.error('Response headers:', error.response.headers);
      
      // Log the exact error response from Azure
      try {
        if (error.response.data instanceof ArrayBuffer) {
          const errorText = new TextDecoder().decode(error.response.data);
          console.error('Azure Error Response:', errorText);
        } else {
          console.error('Azure Error Response:', error.response.data);
        }
      } catch (e) {
        console.error('Could not parse error response');
      }
    } else if (error.request) {
      console.error('No response received');
      console.error('Request details:', error.request);
    }
    
    // Add more specific error message
    let errorMessage = error.message;
    if (error.response && error.response.status === 400) {
      errorMessage = `Error 400: Problema con el SSML o configuración de voz. Voz: ${voiceName}, Emoción: ${emotion}`;
    }
    
    throw new Error(errorMessage);
  }
});

// Handle file saving
ipcMain.handle('save-audio-file', async (event, { audioPath, suggestedName }) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Guardar Audio',
      defaultPath: suggestedName || 'audio.mp3',
      filters: [
        { name: 'Audio MP3', extensions: ['mp3'] },
        { name: 'Todos los archivos', extensions: ['*'] }
      ]
    });

    if (!result.canceled && result.filePath) {
      // Copy temp file to chosen location
      const audioData = fs.readFileSync(audioPath);
      fs.writeFileSync(result.filePath, audioData);
      
      return { 
        success: true, 
        filePath: result.filePath 
      };
    }
    
    return { success: false };
  } catch (error) {
    console.error('Error saving file:', error);
    return { success: false, error: error.message };
  }
});