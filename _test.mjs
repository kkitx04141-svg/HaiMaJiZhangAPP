import * as electron from 'electron/main';
console.log('electron keys:', Object.keys(electron).slice(0, 10));
console.log('app type:', typeof electron.app);
electron.app.whenReady().then(() => {
  console.log('SUCCESS! Electron ready!');
  electron.app.quit();
});
