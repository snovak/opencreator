const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');

contextBridge.exposeInMainWorld('electronAPI', {
  openFileDialog: (options) => ipcRenderer.invoke('open-file-dialog', options),
  
  saveImage: async ({ fileName, base64Data, mimeType }) => {
    try {
      // Create a directory for generated images
      const appDataPath = path.join(os.homedir(), '.opencreator', 'images')
      
      // Ensure directory exists
      if (!fs.existsSync(appDataPath)) {
        fs.mkdirSync(appDataPath, { recursive: true })
      }
      
      // Generate unique filename
      const timestamp = Date.now()
      const safeName = fileName.replace(/[^a-z0-9.-]/gi, '_')
      const filePath = path.join(appDataPath, `${timestamp}-${safeName}`)
      
      // Convert base64 to buffer and save
      const buffer = Buffer.from(base64Data, 'base64')
      fs.writeFileSync(filePath, buffer)
      
      return filePath
    } catch (error) {
      console.error('Error saving image:', error)
      throw error
    }
  }
});