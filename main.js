const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');

const filters = [
  { name: 'Common files', extensions: ['txt', 'md', 'html', 'css', 'js', 'json', 'csv', 'xml', 'pdf', 'docx', 'xlsx', 'pptx', 'zip', 'rar', '7z', 'tar', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'mp3', 'wav', 'mp4', 'mov', 'csproj', 'db'] },
  { name: 'All files', extensions: ['*'] }
];

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1050,
    minHeight: 700,
    backgroundColor: '#0b1020',
    title: 'Universal X Studio',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  win.loadFile('index.html');
}

app.whenReady().then(() => {
  ipcMain.handle('file:open', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openFile'], filters });
    if (result.canceled || !result.filePaths[0]) return null;
    const filePath = result.filePaths[0];
    const stat = await fs.stat(filePath);
    if (stat.size > 5 * 1024 * 1024) return { error: 'Files larger than 5 MB are not loaded into the text editor.' };
    const ext = path.extname(filePath).toLowerCase();
    const textExtensions = new Set(['.txt', '.md', '.html', '.htm', '.css', '.js', '.json', '.csv', '.xml', '.cs', '.csproj', '.sql', '.log', '.svg']);
    if (!textExtensions.has(ext)) {
      return { path: filePath, name: path.basename(filePath), binary: true, size: stat.size };
    }
    return { path: filePath, name: path.basename(filePath), content: await fs.readFile(filePath, 'utf8'), size: stat.size };
  });

  ipcMain.handle('file:save', async (_event, payload) => {
    if (!payload || typeof payload.content !== 'string') throw new Error('Invalid file content.');
    let filePath = typeof payload.path === 'string' ? payload.path : null;
    if (!filePath) {
      const result = await dialog.showSaveDialog({
        defaultPath: payload.name || 'untitled.txt',
        filters
      });
      if (result.canceled || !result.filePath) return null;
      filePath = result.filePath;
    }
    await fs.writeFile(filePath, payload.content, 'utf8');
    return { path: filePath, name: path.basename(filePath) };
  });

  ipcMain.handle('file:create', async (_event, payload) => {
    const safeName = String(payload?.name || 'untitled.txt').replace(/[\\/:*?"<>|]/g, '-');
    const result = await dialog.showSaveDialog({ defaultPath: safeName, filters });
    if (result.canceled || !result.filePath) return null;
    await fs.writeFile(result.filePath, String(payload?.content || ''), 'utf8');
    return { path: result.filePath, name: path.basename(result.filePath) };
  });

  ipcMain.handle('app:openExternal', async (_event, url) => {
    const parsed = new URL(url);
    if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error('Only web links can be opened.');
    await shell.openExternal(parsed.toString());
  });

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
