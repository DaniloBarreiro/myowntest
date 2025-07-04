document.addEventListener('DOMContentLoaded', () => {
    
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;
    
    const initialDatabaseState = {
        users: {
            "admin": { password: "admin", name: "Administrador", isAdmin: true },
            "joao.silva": { password: "123", name: "João Silva", isAdmin: false },
            "maria.souza": { password: "456", name: "Maria Souza", isAdmin: false },
            "motorista3": { password: "789", name: "Carlos Pereira", isAdmin: false }
        },
        routes: { "joao.silva": [], "maria.souza": [], "motorista3": [] }
    };

    let fakeDatabase;
    const storedDb = localStorage.getItem('fakeDatabase');
    if (storedDb) {
        fakeDatabase = JSON.parse(storedDb);
    } else {
        fakeDatabase = JSON.parse(JSON.stringify(initialDatabaseState));
    }

    const loginScreen = document.getElementById('login-screen');
    const appScreen = document.getElementById('app');
    const adminScreen = document.getElementById('admin-app');
    const loginButton = document.getElementById('loginButton');
    const loginError = document.getElementById('login-error');
    const welcomeMessage = document.getElementById('welcomeMessage');
    const adminWelcomeMessage = document.getElementById('adminWelcomeMessage');
    const pdfUpload = document.getElementById('pdf-upload'); // This element doesn't exist in the provided HTML.
    const pdfFilename = document.getElementById('pdf-filename'); // This element doesn't exist in the provided HTML.
    const processPdfButton = document.getElementById('process-pdf-button'); // This element doesn't exist in the provided HTML.
    const adminResults = document.getElementById('admin-results'); // This element doesn't exist in the provided HTML.
    const startScanButton = document.getElementById('startScanButton');
    const resetDataButton = document.getElementById('reset-data-button'); // This element doesn't exist in the provided HTML.
    
    let routeData = [];
    let html5QrCode;
    let isScanCooldown = false;
    let audioContext = null;

    document.querySelectorAll('.logout-button').forEach(btn => btn.addEventListener('click', handleLogout));
    loginButton.addEventListener('click', handleLogin);
    // Removed resetDataButton listener as the button doesn't exist in the provided HTML for driver.html or admin.html's main app.
    // resetDataButton.addEventListener('click', handleResetSystem);
    document.getElementById('password').addEventListener('keyup', (e) => { if (e.key === 'Enter') handleLogin(); });
    
    function initAudioContext() {
        if (!audioContext && (window.AudioContext || window.webkitAudioContext)) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }
    function playSound(type) {
        if (!audioContext) return;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        if (type === 'success') {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        } else {
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        }
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }

    function handleLogin() {
        initAudioContext();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        const user = fakeDatabase.users[username];

        if (user && user.password === password) {
            loginScreen.classList.add('hidden');
            loginError.classList.add('hidden');
            if (user.isAdmin) {
                adminWelcomeMessage.textContent = `Bem-vindo, ${user.name}`;
                adminScreen.classList.remove('hidden');
                // The admin script is in admin.html, this script.js isn't being used by it.
                // So, no need to call rendering functions for admin here.
            } else {
                welcomeMessage.textContent = `Bem-vindo, ${user.name}!`;
                appScreen.classList.remove('hidden');
                loadUserRoute(username);
            }
        } else {
            playSound('error');
            loginError.classList.remove('hidden');
        }
    }
    
    function handleLogout() {
        if (html5QrCode && html5QrCode.isScanning) {
            html5QrCode.stop().catch(err => console.error(err));
        }
        // Ensure both admin and app screens are hidden on logout
        if (adminScreen) adminScreen.classList.add('hidden');
        if (appScreen) appScreen.classList.add('hidden');
        loginScreen.classList.remove('hidden');
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    }

    // This function is for admin features and is likely handled by admin.html's internal script now.
    // If it were to be used, the elements 'pdf-upload', 'pdf-filename', 'process-pdf-button', 'admin-results' need to exist.
    /*
    function handleResetSystem() {
        if (confirm("Você tem certeza que deseja apagar todas as rotas distribuídas?")) {
            localStorage.removeItem('fakeDatabase');
            alert("Sistema resetado com sucesso! A página será recarregada.");
            location.reload();
        }
    }

    // These event listeners are also for admin features and need the elements to exist.
    pdfUpload.addEventListener('change', () => {
        if (pdfUpload.files.length > 0) {
            pdfFilename.textContent = pdfUpload.files[0].name;
            processPdfButton.disabled = false;
        } else {
            pdfFilename.textContent = 'Nenhum arquivo selecionado';
            processPdfButton.disabled = true;
        }
    });

    processPdfButton.addEventListener('click', async () => {
        const file = pdfUpload.files[0];
        if (!file) return;
        adminResults.innerHTML = '<p>Processando PDF... Por favor, aguarde.</p>';
        processPdfButton.disabled = true;
        try {
            const allText = await extractTextFromPdf(file);
            const parsedRoutes = parseRoutesFromText(allText);
            distributeRoutes(parsedRoutes);
        } catch (error) {
            adminResults.innerHTML = `<p class="result-error">Erro ao processar o PDF: ${error.message}</p>`;
        } finally {
            processPdfButton.disabled = false;
        }
    });
    */
    
    // This function is for admin features and is likely handled by admin.html's internal script now.
    /*
    function extractTextFromPdf(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const pdf = await pdfjsLib.getDocument(event.target.result).promise;
                    let allText = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        allText += textContent.items.map(item => item.str).join(' ');
                    }
                    resolve(allText);
                } catch (err) { reject(err); }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    // This function is for admin features and is likely handled by admin.html's internal script now.
    function parseRoutesFromText(text) {
        const routes = {};
        // Regex para encontrar a linha de rota e os dados principais
        // Ex: SSP16 PM299_1 #N/A #N/A 1A 12345678901 Parati
        const lineRegex = /SSP16\s+(PM\d+_?\d+)\s+#N\/A\s+#N\/A\s+([\dA-Z]+)\s+(\d{11,})\s+Parati/g;
        let match;
        while ((match = lineRegex.exec(text)) !== null) {
            const routeName = match[1];
            const order = match[2];
            const shipmentCode = match[3];

            // Aqui você precisaria de uma lógica mais sofisticada para extrair
            // endereço, bairro e referências de textos de PDF reais,
            // pois o formato pode variar muito.
            // O exemplo atual assume que esses dados não estão no "lineRegex".
            // Para este exercício, o admin.html foi modificado para ter o parser.

            if (!routes[routeName]) routes[routeName] = [];
            routes[routeName].push({
                id: `item-${shipmentCode}`,
                ordem_parada: order,
                produto_codigo: shipmentCode,
                // Placeholder, pois esses dados não são extraídos pelo regex atual
                endereco: 'Endereço não disponível no PDF',
                referencias: 'N/A',
                scanned: false
            });
        }
        return routes;
    }

    // This function is for admin features and is likely handled by admin.html's internal script now.
    function distributeRoutes(parsedRoutes) {
        // Limpa rotas existentes antes de atribuir novas
        Object.keys(fakeDatabase.routes).forEach(driver => fakeDatabase.routes[driver] = []);

        let resultsHtml = '<h3>Distribuição Concluída</h3><ul>';

        // Lógica de distribuição baseada nos nomes de rota PM299_1 e PM2_3
        if(parsedRoutes['PM299_1']) {
            fakeDatabase.routes['joao.silva'] = parsedRoutes['PM299_1'];
            resultsHtml += `<li><b>PM299_1</b> (${parsedRoutes['PM299_1'].length} pacotes) foi atribuída a <b>joao.silva</b>.</li>`;
        } else {
            resultsHtml += `<li>Nenhuma rota <b>PM299_1</b> encontrada para joao.silva.</li>`;
        }

        if(parsedRoutes['PM2_3']) {
            fakeDatabase.routes['maria.souza'] = parsedRoutes['PM2_3'];
            resultsHtml += `<li><b>PM2_3</b> (${parsedRoutes['PM2_3'].length} pacotes) foi atribuída a <b>maria.souza</b>.</li>`;
        } else {
            resultsHtml += `<li>Nenhuma rota <b>PM2_3</b> encontrada para maria.souza.</li>`;
        }
        
        // Salva o estado atualizado do banco de dados falso no localStorage
        localStorage.setItem('fakeDatabase', JSON.stringify(fakeDatabase));

        resultsHtml += '</ul><p><b>Os dados da rota foram salvos no navegador.</b></p>';
        adminResults.innerHTML = resultsHtml;
    }
    */

    startScanButton.addEventListener('click', startScanner);

    function loadUserRoute(username) {
        routeData = fakeDatabase.routes[username] || [];
        html5QrCode = new Html5Qrcode("qr-reader");
        renderFullList();
        updateProgress();
    }
    
    function validateCode(code) {
        if (isScanCooldown) return;
        isScanCooldown = true;
        setTimeout(() => { isScanCooldown = false; }, 1500);

        const foundItem = routeData.find(item => item.produto_codigo === code);
        if (foundItem) {
            if (!foundItem.scanned) {
                foundItem.scanned = true;
                playSound('success');
                displayFeedback(`Código ${code} OK!`, "success");
                const itemElement = document.getElementById(foundItem.id);
                if(itemElement) itemElement.querySelector('.status-indicator').classList.add('scanned');
                updateProgress();
            } else {
                playSound('error');
                displayFeedback(`Código ${code} já foi verificado.`, "info");
            }
        } else {
            playSound('error');
            displayFeedback(`ERRO: Código ${code} não pertence a esta rota!`, "error");
        }
    }
    
    function startScanner() {
        if (html5QrCode && html5QrCode.isScanning) {
            html5QrCode.stop().then(() => {
                startScanButton.textContent = "📷 Iniciar Leitura";
                document.getElementById('qr-reader-placeholder').style.display = 'flex';
            }).catch(err => console.error(err));
            return;
        }
        document.getElementById('qr-reader-placeholder').style.display = 'none';
        startScanButton.disabled = true;
        startScanButton.textContent = "Carregando...";
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };
        html5QrCode.start({ facingMode: "environment" }, config, (decodedText) => validateCode(decodedText))
        .then(() => {
            startScanButton.disabled = false;
            startScanButton.textContent = "Parar Leitura";
        }).catch(err => {
            alert(`Erro ao iniciar a câmera: ${err}. Verifique as permissões.`);
            startScanButton.disabled = false;
            startScanButton.textContent = "📷 Iniciar Leitura";
            document.getElementById('qr-reader-placeholder').style.display = 'flex';
        });
    }
    
    const manualEntryButton = document.getElementById('manualEntryButton');
    const manualEntryModal = document.getElementById('manualEntryModal');
    const closeModalButton = document.querySelector('.close-button');
    const submitManualCode = document.getElementById('submitManualCode');
    const toggleListButton = document.getElementById('toggle-list-button');
    manualEntryButton.addEventListener('click', () => manualEntryModal.style.display = 'block');
    closeModalButton.addEventListener('click', () => manualEntryModal.style.display = 'none');
    submitManualCode.addEventListener('click', processManualCode);
    toggleListButton.addEventListener('click', toggleRouteList);
    window.addEventListener('click', (event) => { if (event.target == manualEntryModal) manualEntryModal.style.display = 'none'; });
    function renderFullList() { const listDiv = document.getElementById('full-route-list'); listDiv.innerHTML = ''; if (!routeData || routeData.length === 0) { listDiv.innerHTML = "<p style='padding: 15px; text-align: center;'>Nenhuma rota atribuída.</p>"; return; } routeData.forEach(item => { const itemDiv = document.createElement('div'); itemDiv.className = 'route-item'; itemDiv.id = item.id; const itemInfo = document.createElement('div'); itemInfo.className = 'item-info'; itemInfo.innerHTML = `<p><strong>Parada ${item.ordem_parada}:</strong> ${item.endereco}</p><p><small>Código: ${item.produto_codigo} | Ref: ${item.referencias}</small></p>`; const statusIndicator = document.createElement('div'); statusIndicator.className = 'status-indicator'; if (item.scanned) statusIndicator.classList.add('scanned'); itemDiv.appendChild(itemInfo); itemDiv.appendChild(statusIndicator); listDiv.appendChild(itemDiv); }); }
    function updateProgress() { const bar = document.getElementById('progressBar'); const text = document.getElementById('progressText'); const sButton = document.getElementById('startScanButton'); const mButton = document.getElementById('manualEntryButton'); if (!routeData || routeData.length === 0) { bar.style.width = '0%'; text.textContent = 'Nenhuma Rota'; sButton.disabled = true; mButton.disabled = true; return; } sButton.disabled = false; mButton.disabled = false; const scannedCount = routeData.filter(item => item.scanned).length; const percentage = Math.round((scannedCount / routeData.length) * 100); bar.style.width = `${percentage}%`; text.textContent = `${percentage}% (${scannedCount} de ${routeData.length})`; if (percentage === 100) { displayFeedback("🎉 Carga Completa!", "success", false); if (html5QrCode && html5QrCode.isScanning) { html5QrCode.stop().catch(err => console.error(err)); sButton.textContent = "Carga Verificada"; document.getElementById('qr-reader-placeholder').style.display = 'flex'; } sButton.disabled = true; } }
    function processManualCode() { const input = document.getElementById('manualCodeInput'); const code = input.value.trim(); if (code) { validateCode(code); input.value = ''; manualEntryModal.style.display = 'none'; } }
    document.getElementById('manualCodeInput').addEventListener('keyup', (e) => { if(e.key === 'Enter') processManualCode(); });
    const scanResultEl = document.getElementById('scan-result');
    function displayFeedback(message, type, autoClear = true) { scanResultEl.innerHTML = message; scanResultEl.className = `result-${type}`; if (autoClear) { setTimeout(() => { scanResultEl.innerHTML = ''; scanResultEl.className = ''; }, 4000); } }
    function toggleRouteList() { const listDiv = document.getElementById('full-route-list'); const isHidden = listDiv.classList.toggle('hidden'); toggleListButton.textContent = isHidden ? 'Mostrar Lista' : 'Esconder'; }
});