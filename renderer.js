const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const editor = $('#editor');
let currentPath = null;
let currentName = 'untitled.txt';
let savedContent = '';
let cameraStream = null;
let cameraTimer = null;

function toast(message) {
  const element = $('#toast');
  element.textContent = message;
  element.classList.remove('hidden');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => element.classList.add('hidden'), 2800);
}
function showView(name) {
  $$('.view').forEach((view) => view.classList.toggle('active', view.id === `view-${name}`));
  $$('.nav-item').forEach((button) => button.classList.toggle('active', button.dataset.view === name));
  const labels = { home: 'Home', files: 'Files & editor', qr: 'QR scanner', build: 'Build & package', ai: 'AI builder', integrations: 'Integrations' };
  $('#crumb').textContent = labels[name] || 'Home';
}
$$('.nav-item').forEach((button) => button.addEventListener('click', () => showView(button.dataset.view)));
$$('[data-goto]').forEach((button) => button.addEventListener('click', () => showView(button.dataset.goto)));

function updateEditorMeta() {
  $('#charCount').textContent = `${editor.value.length.toLocaleString()} characters`;
  $('#dirtyMark').classList.toggle('hidden', editor.value === savedContent);
}
editor.addEventListener('input', updateEditorMeta);
async function openFile() {
  try {
    const file = await window.uxs.openFile();
    if (!file) return;
    if (file.error) return toast(file.error);
    if (file.binary) {
      toast(`${file.name} is a binary file. Open it with an installed application.`);
      await window.uxs.openExternal(`file://${file.path.replaceAll('\\', '/')}`);
      return;
    }
    currentPath = file.path;
    currentName = file.name;
    editor.value = file.content;
    savedContent = file.content;
    $('#fileName').textContent = currentName;
    $('#fileStatus').textContent = currentPath;
    updateEditorMeta();
    showView('files');
  } catch (error) { toast(error.message || 'Could not open file.'); }
}
async function saveFile() {
  try {
    const result = await window.uxs.saveFile({ path: currentPath, name: currentName, content: editor.value });
    if (!result) return;
    currentPath = result.path;
    currentName = result.name;
    savedContent = editor.value;
    $('#fileName').textContent = currentName;
    $('#fileStatus').textContent = currentPath;
    updateEditorMeta();
    toast('File saved.');
  } catch (error) { toast(error.message || 'Could not save file.'); }
}
async function createFile(template = 'txt') {
  const samples = {
    txt: { name: 'note.txt', content: '' },
    md: { name: 'notes.md', content: '# Notes\n\n' },
    html: { name: 'index.html', content: '<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>My page</title>\n  <link rel="stylesheet" href="styles.css">\n</head>\n<body>\n  <h1>Hello, world!</h1>\n</body>\n</html>\n' },
    css: { name: 'styles.css', content: '/* Add your styles */\nbody {\n  font-family: system-ui, sans-serif;\n}\n' },
    csv: { name: 'data.csv', content: 'Name,Value\nExample,1\n' },
    json: { name: 'data.json', content: '{\n  "name": "My project"\n}\n' }
  };
  const sample = samples[template] || samples.txt;
  try {
    const result = await window.uxs.createFile(sample);
    if (!result) return;
    currentPath = result.path;
    currentName = result.name;
    editor.value = sample.content;
    savedContent = sample.content;
    $('#fileName').textContent = currentName;
    $('#fileStatus').textContent = currentPath;
    updateEditorMeta();
    showView('files');
    toast(`${currentName} created.`);
  } catch (error) { toast(error.message || 'Could not create file.'); }
}
$('#openTop').addEventListener('click', openFile);
$('#openFile').addEventListener('click', openFile);
$('#newTop').addEventListener('click', () => createFile('txt'));
$('#newFile').addEventListener('click', () => createFile('txt'));
$('#startCreate').addEventListener('click', () => createFile('txt'));
$('#saveFile').addEventListener('click', saveFile);
$$('[data-template]').forEach((button) => button.addEventListener('click', () => createFile(button.dataset.template)));
document.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); saveFile(); }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'o') { event.preventDefault(); openFile(); }
});

$('#previewBtn').addEventListener('click', () => {
  const extension = currentName.split('.').pop().toLowerCase();
  if (!['html', 'htm', 'svg'].includes(extension)) return toast('Preview is available for HTML and SVG files.');
  const preview = window.open('', '_blank', 'width=900,height=700');
  if (!preview) return toast('Allow pop-ups to preview this file.');
  preview.document.open();
  preview.document.write(editor.value);
  preview.document.close();
});

function decodeImage(image) {
  const canvas = $('#qrCanvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  canvas.width = image.naturalWidth || image.videoWidth;
  canvas.height = image.naturalHeight || image.videoHeight;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  const decoded = window.jsQR?.(pixels.data, pixels.width, pixels.height, { inversionAttempts: 'attemptBoth' });
  if (decoded) {
    $('#qrResult').innerHTML = `<strong>QR code found</strong><br><span></span>`;
    $('#qrResult span').textContent = decoded.data;
    $('#qrResult').classList.remove('hidden');
    return true;
  }
  return false;
}
$('#qrUpload').addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const image = new Image();
  image.onload = () => {
    if (!decodeImage(image)) toast('No QR code found in that image. Try a clear, well-lit picture.');
    URL.revokeObjectURL(image.src);
  };
  image.src = URL.createObjectURL(file);
  event.target.value = '';
});
$('#cameraButton').addEventListener('click', async () => {
  if (!navigator.mediaDevices?.getUserMedia) return toast('Camera access is not available on this device.');
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    const video = $('#cameraVideo');
    video.srcObject = cameraStream;
    await video.play();
    $('.qr-placeholder').classList.add('hidden');
    video.classList.remove('hidden');
    $('#cameraButton').classList.add('hidden');
    $('#stopCamera').classList.remove('hidden');
    cameraTimer = setInterval(() => {
      if (video.readyState >= 2 && decodeImage(video)) stopCamera();
    }, 350);
  } catch (error) { toast(`Camera could not start: ${error.message}`); }
});
function stopCamera() {
  clearInterval(cameraTimer);
  if (cameraStream) cameraStream.getTracks().forEach((track) => track.stop());
  cameraStream = null;
  const video = $('#cameraVideo');
  video.srcObject = null;
  video.classList.add('hidden');
  $('.qr-placeholder').classList.remove('hidden');
  $('#cameraButton').classList.remove('hidden');
  $('#stopCamera').classList.add('hidden');
}
$('#stopCamera').addEventListener('click', stopCamera);
window.addEventListener('beforeunload', stopCamera);

$$('[data-url]').forEach((button) => button.addEventListener('click', async () => {
  try { await window.uxs.openExternal(button.dataset.url); }
  catch (error) { toast(error.message || 'Could not open link.'); }
}));
