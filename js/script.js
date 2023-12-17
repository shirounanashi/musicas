// ID da pasta do Google Drive que você quer listar
const FOLDER_ID = '1hyIxr6HQi8pUOXtuPUGLTTLit7wOHVno';
const API_KEY = 'AIzaSyAHYs6MKp4LyGLlRyMyxCtF_4hYClQ6Pqk';

// URL base da API do Google Drive
const apiUrl = `https://www.googleapis.com/drive/v3/files?q='${FOLDER_ID}'+in+parents&fields=files(id,name,mimeType,size)&key=${API_KEY}`;

function formatSize(size) {
    if (size < 1024) {
        return size + ' bytes';
    } else if (size < 1024 * 1024) {
        return (size / 1024).toFixed(2) + ' KB';
    } else {
        return (size / (1024 * 1024)).toFixed(2) + ' MB';
    }
}

// Função para carregar os arquivos ao carregar a página
window.onload = function () {
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            const fileList = document.getElementById('fileList');
            data.files.forEach(file => {
                const row = fileList.insertRow();
                row.innerHTML = `
                    <td>${file.name}</td>
                    <td>${formatSize(file.size)}</td>
                    <td>${file.mimeType}</td>
                    <td><a href="https://drive.google.com/uc?export=download&id=${file.id}" target="_blank">Baixar</a></td>
                `;
            });
        })
        .catch(error => console.error('Erro ao recuperar a lista de arquivos:', error));
};