// ============================================================
// IMPORTAÇÕES E DEPENDÊNCIAS
// ============================================================

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// ============================================================
// VARIÁVEIS GLOBAIS DA APLICAÇÃO
// ============================================================

let mainWindow;       // Janela principal do Electron
let backendProcess;   // Processo do servidor Spring Boot (Java)

// ============================================================
// GERENCIAMENTO DE DIRETÓRIOS
// ============================================================

/**
 * Retorna o caminho do diretório de backups.
 * Localizado em Documents/AgendaContatos/backups do usuário.
 * @returns {string} Caminho absoluto do diretório de backups
 */
function getBackupDirectory() {
    const userHome = app.getPath('home');
    return path.join(userHome, 'Documents', 'AgendaContatos', 'backups');
}

/**
 * Garante que o diretório de backups existe.
 * Cria o diretório recursivamente se não existir.
 * @returns {string} Caminho do diretório de backups
 */
function ensureBackupDirectory() {
    const backupDir = getBackupDirectory();
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
        console.log('✅ Diretório de backups criado:', backupDir);
    }
    return backupDir;
}

// ============================================================
// HANDLERS IPC - COMUNICAÇÃO COM O RENDERER
// ============================================================

/**
 * Handler para salvar contatos em arquivo JSON.
 * Abre diálogo nativo do SO para escolher local e nome do arquivo.
 * Nome padrão: MM-DD-YYYY_backup_contatos.json
 */
ipcMain.handle('dialog:saveContatos', async (event, contatos) => {
    const backupDir = ensureBackupDirectory();
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const year = now.getFullYear();
    const defaultFileName = `${month}-${day}-${year}_backup_contatos.json`;
    
    const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Exportar Contatos',
        defaultPath: path.join(backupDir, defaultFileName),
        filters: [
            { name: 'Arquivos JSON', extensions: ['json'] },
            { name: 'Todos os Arquivos', extensions: ['*'] }
        ],
        properties: ['createDirectory', 'showOverwriteConfirmation']
    });

    if (!result.canceled && result.filePath) {
        try {
            fs.writeFileSync(result.filePath, JSON.stringify(contatos, null, 2), 'utf8');
            console.log('✅ Contatos exportados para:', result.filePath);
            return { success: true, filePath: result.filePath };
        } catch (error) {
            console.error('❌ Erro ao salvar arquivo:', error);
            return { success: false, error: error.message };
        }
    }
    
    return { success: false, canceled: true };
});

/**
 * Handler para abrir e ler arquivo JSON de contatos.
 * Abre diálogo nativo do SO para selecionar arquivo.
 * Valida e parseia o conteúdo JSON.
 */
ipcMain.handle('dialog:openContatos', async () => {
    const backupDir = ensureBackupDirectory();
    
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Importar Contatos',
        defaultPath: backupDir,
        filters: [
            { name: 'Arquivos JSON', extensions: ['json'] },
            { name: 'Todos os Arquivos', extensions: ['*'] }
        ],
        properties: ['openFile']
    });

    if (!result.canceled && result.filePaths.length > 0) {
        try {
            const fileContent = fs.readFileSync(result.filePaths[0], 'utf8');
            const contatos = JSON.parse(fileContent);
            console.log('✅ Contatos lidos de:', result.filePaths[0]);
            return { success: true, contatos, filePath: result.filePaths[0] };
        } catch (error) {
            console.error('❌ Erro ao ler arquivo:', error);
            return { success: false, error: error.message };
        }
    }
    
    return { success: false, canceled: true };
});

// ============================================================
// GERENCIAMENTO DO BACKEND (SPRING BOOT)
// ============================================================

/**
 * Determina o caminho do arquivo JAR do backend.
 * Em produção: usa resources da aplicação empacotada.
 * Em desenvolvimento: usa target do Maven.
 * @returns {string} Caminho absoluto do JAR
 */
function getJarPath() {
    if (app.isPackaged) {
        return path.join(process.resourcesPath, 'backend-app.jar');
    } else {
        return path.join(__dirname, '..', 'backend', 'target', 'agenda-contatos-backend-1.0.0.jar');
    }
}

/**
 * Inicia o servidor backend Spring Boot.
 * Executa o JAR com Java e configura modo de produção.
 * Aguarda 5 segundos para garantir inicialização completa.
 * @returns {Promise} Promise que resolve quando o backend estiver pronto
 */
function startBackend() {
    const jarPath = getJarPath();
    
    console.log('🚀 Iniciando backend...');
    console.log('📦 JAR Path:', jarPath);
    
    const javaArgs = [
        '-Dapp.mode=production',
        '-jar',
        jarPath
    ];
    
    backendProcess = spawn('java', javaArgs, {
        cwd: app.isPackaged ? process.resourcesPath : path.join(__dirname, '..', 'backend')
    });

    // Logs do backend
    backendProcess.stdout.on('data', (data) => {
        console.log(`[Backend] ${data}`);
    });

    backendProcess.stderr.on('data', (data) => {
        console.error(`[Backend Error] ${data}`);
    });

    backendProcess.on('close', (code) => {
        console.log(`[Backend] Processo finalizado com código ${code}`);
    });

    // Aguarda inicialização (Spring Boot precisa de alguns segundos)
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log('✅ Backend iniciado!');
            resolve();
        }, 5000);
    });
}

/**
 * Encerra o processo do backend Spring Boot.
 * Chamado ao fechar a aplicação.
 */
function stopBackend() {
    if (backendProcess) {
        console.log('🛑 Encerrando backend...');
        backendProcess.kill();
        backendProcess = null;
    }
}

// ============================================================
// CRIAÇÃO DA JANELA PRINCIPAL
// ============================================================

/**
 * Cria a janela principal do Electron.
 * Configurações:
 * - 1200x800px centralizada
 * - Node integration habilitado (para IPC)
 * - Menu bar escondido
 * - Ícone personalizado
 */
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        center: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: false,
            offscreen: false
        },
        icon: path.join(__dirname, 'icon.png'),
        show: false,
        backgroundColor: '#ffffff'
    });

    // Exibe janela apenas quando estiver pronta (evita flash branco)
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.focus();
    });

    mainWindow.loadFile('index.html');
    mainWindow.setMenuBarVisibility(false);

    // Garante foco ao ativar janela
    mainWindow.on('focus', () => {
        if (mainWindow && mainWindow.webContents) {
            mainWindow.webContents.focus();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Descomente para abrir DevTools durante desenvolvimento:
    // mainWindow.webContents.openDevTools();
}

// ============================================================
// CICLO DE VIDA DA APLICAÇÃO
// ============================================================

/**
 * Inicialização da aplicação.
 * 1. Inicia o backend Spring Boot
 * 2. Aguarda 5 segundos para o backend ficar pronto
 * 3. Cria a janela principal
 */
app.whenReady().then(async () => {
    await startBackend();
    createWindow();

    // macOS: recria janela ao clicar no dock
    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

/**
 * Encerra backend e aplicação quando todas as janelas forem fechadas.
 * Exceção para macOS (darwin) que mantém apps ativos sem janelas.
 */
app.on('window-all-closed', function () {
    stopBackend();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

/**
 * Garante que o backend seja encerrado antes da aplicação fechar.
 */
app.on('before-quit', () => {
    stopBackend();
});