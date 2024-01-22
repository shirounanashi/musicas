// ID da pasta do Google Drive que você quer listar
const FOLDER_ID = '1zUCarCfvpSWHOOqXrFR-OLvwtQSPrTCW';
const API_KEY = 'AIzaSyAHYs6MKp4LyGLlRyMyxCtF_4hYClQ6Pqk';

// Pilha para armazenar o histórico de navegação
let folderStack = [];

function formatSize(size) {
    if (size < 1024) {
        return size + ' bytes';
    } else if (size < 1024 * 1024) {
        return (size / 1024).toFixed(2) + ' KB';
    } else {
        return (size / (1024 * 1024)).toFixed(2) + ' MB';
    }
}

// URL base da API do Google Drive
const apiUrl = `https://www.googleapis.com/drive/v3/files?q='${FOLDER_ID}'+in+parents&fields=files(id,name,mimeType,size)&key=${API_KEY}`;

// Função para carregar os arquivos ao carregar a página
window.onload = function () {
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            const fileList = document.getElementById('fileList');
            data.files.sort((a, b) => a.name.localeCompare(b.name, undefined, {numeric: true}));
            data.files.forEach(file => {
                const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                const row = fileList.insertRow();
                let linkElement;

                if (isFolder) {
                    // Se for uma pasta, criar um link para abrir a pasta
                    linkElement = `<a href="javascript:void(0);" onclick="openFolder('${file.id}')">Abrir</a>`;
                } else {
                    // Se for um arquivo, criar um link para baixar o arquivo
                    linkElement = `<a href="https://drive.google.com/uc?export=download&id=${file.id}" target="_blank">Baixar</a>`;
                }

                row.innerHTML = `
                    <td>${file.name}</td>
                    <td>${file.size ? formatSize(file.size) : ''}</td>
                    <td class="mimeType">${file.mimeType}</td>
                    <td>${linkElement}</td>
                `;
            });
        })
        .catch(error => console.error('Erro ao recuperar a lista de arquivos:', error));
};

function openFolder(folderId, folderName) {
    // Empilhar o ID da pasta atual antes de abrir a nova pasta
    if (folderStack.length > 0 || folderId !== FOLDER_ID) {
        folderStack.push(folderId);
    }

    const folderApiUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&fields=files(id,name,mimeType,size)&key=${API_KEY}`;

    fetch(folderApiUrl)
        .then(response => response.json())
        .then(data => {
            const fileList = document.getElementById('fileList');
            fileList.innerHTML = ''; // Limpa a lista de arquivos atual

            data.files.sort((a, b) => a.name.localeCompare(b.name, undefined, {numeric: true}));

            // Adiciona um botão de voltar
            if (folderStack.length > 0) {

                // Adiciona um botão de voltar
                const backButton = document.createElement('button');
                backButton.textContent = 'Voltar';
                backButton.classList.add('back-button');
                backButton.addEventListener('click', () => {
                    // Desempilhar o último ID da pasta e abrir essa pasta
                    if (folderStack.length > 0) {
                        folderStack.pop(); // Remove current folder
                        const lastFolderId = folderStack.length > 0 ? folderStack.pop() : FOLDER_ID;
                        openFolder(lastFolderId);
                    }
                });

                // Adiciona o botão de voltar a uma nova linha na tabela
                const backRow = fileList.insertRow();
                backRow.insertCell().innerHTML = '<b>Voltar</b>';
                for (let i = 0; i < 2; i++) {
                    backRow.insertCell();
                }

                const backCell = backRow.insertCell();
                backCell.colSpan = 4; // Faz o botão de voltar ocupar toda a linha
                backCell.appendChild(backButton);
            }

            // Adiciona os arquivos da pasta atual à lista
            data.files.forEach(file => {
                const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                const row = fileList.insertRow();
                let linkElement;

                if (isFolder) {
                    linkElement = `<a href="javascript:void(0);" onclick="openFolder('${file.id}', '${file.name}')">Abrir</a>`;
                } else {
                    linkElement = `<a href="https://drive.google.com/uc?export=download&id=${file.id}" target="_blank">Baixar</a>`;
                }

                row.innerHTML = `
                    <td>${file.name}</td>
                    <td>${file.size ? formatSize(file.size) : ''}</td>
                    <td class="mimeType">${file.mimeType}</td>
                    <td>${linkElement}</td>
                `;
            });
        })
        .catch(error => console.error('Erro ao recuperar a lista de arquivos:', error));
}
