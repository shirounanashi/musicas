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



/*
function filterFiles() {
    const searchInput = document.getElementById('searchBox').value.toLowerCase();
    const filesTable = document.getElementById('fileList');
    const filesRows = filesTable.getElementsByTagName('tr');
  
    // Loop através todas as linhas da tabela e esconde aquelas que não correspondem à busca
    for (let i = 0; i < filesRows.length; i++) {
      let td = filesRows[i].getElementsByTagName('td')[0]; // Index 0, assumindo que o nome do arquivo está na primeira coluna
      if (td) {
        const fileName = td.textContent || td.innerText;
        if (fileName.toLowerCase().indexOf(searchInput) > -1) {
          filesRows[i].style.display = '';
        } else {
          filesRows[i].style.display = 'none';
        }
      }
    }
  }
*/

// URL base da API do Google Drive
const apiUrl = `https://www.googleapis.com/drive/v3/files?q='${FOLDER_ID}'+in+parents&fields=files(id,name,mimeType,size)&key=${API_KEY}`;

// Função para carregar os arquivos ao carregar a página
window.onload = function () {
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            const fileList = document.getElementById('fileList');
            data.files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
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

            data.files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

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

                let isMobile = window.matchMedia("only screen and (max-width: 600px)").matches;

                if (isMobile) {
                    // Se for um celular, insira apenas uma célula
                    backRow.insertCell();
                } else {
                    // Se não for um celular, insira duas células
                    for (let i = 0; i < 2; i++) {
                        backRow.insertCell();
                    }
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

function searchFileInAllFolders(folderId, query, path = '') {
    const folderApiUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&fields=files(id,name,mimeType,size)&key=${API_KEY}`;

    return fetch(folderApiUrl)
        .then(response => response.json())
        .then(data => {
            // Procurar o arquivo na lista de arquivos
            const foundFiles = data.files.filter(file =>
                file.name.toLowerCase().includes(query.toLowerCase())
            ).map(file => ({ ...file, path: path + '/' + file.name }));

            // Procurar nas subpastas
            const folderSearchPromises = data.files
                .filter(file => file.mimeType === 'application/vnd.google-apps.folder')
                .map(folder => searchFileInAllFolders(folder.id, query, path + '/' + folder.name));

            return Promise.all(folderSearchPromises)
                .then(results => {
                    // Combinar os arquivos encontrados na pasta atual e nas subpastas
                    const subFolderFiles = results.flat().filter(result => result !== null);
                    return [...foundFiles, ...subFolderFiles];
                });
        });
}

function onSearchButtonClick() {
    const searchInput = document.getElementById('searchBox').value;
    searchFileInAllFolders(FOLDER_ID, searchInput)
        .then(files => {
            // Ordena os arquivos para que as pastas apareçam primeiro
            files.sort((a, b) => {
                const aIsFolder = a.mimeType === 'application/vnd.google-apps.folder';
                const bIsFolder = b.mimeType === 'application/vnd.google-apps.folder';

                if (aIsFolder && !bIsFolder) {
                    return -1; // a vem antes de b
                }
                if (!aIsFolder && bIsFolder) {
                    return 1; // b vem antes de a
                }
                // Se ambos são pastas ou ambos não são pastas, compara os nomes
                return a.name.localeCompare(b.name); // compara os nomes em ordem alfabética
            });

            const fileList = document.getElementById('fileList');
            fileList.innerHTML = ''; // Limpa a lista de arquivos atual

            removeHeader();

            // Adiciona um cabeçalho de tabela para a coluna de caminho se uma pesquisa foi realizada
            if (searchInput) {
                const headerRow = fileList.insertRow();
                headerRow.innerHTML = `
                    <th>Caminho</th>
                    <th>Nome</th>
                    <th class="mimeType">Tamanho</th>
                    <th class="mimeType">Tipo</th>
                    <th>Ação</th>
                `;
            }

            // Cria um botão de voltar para a pasta raiz
            const rootButton = document.createElement('button');
            rootButton.textContent = 'Voltar';
            rootButton.classList.add('root-button');
            rootButton.addEventListener('click', () => {
                openFolder(FOLDER_ID);
                addOriginalHeader();
            });

            // Adiciona o botão de voltar para a pasta raiz a uma nova linha na tabela
            const rootRow = fileList.insertRow();

            rootRow.insertCell();

            // Adiciona a célula de texto
            const textCell = rootRow.insertCell();
            textCell.innerHTML = '<b>Voltar para o início</b>';

            // Adiciona tres células vazias

            let isMobile = window.matchMedia("only screen and (max-width: 600px)").matches;

            if (isMobile) {
            } else {
                // Se não for um celular, insira duas células
                for (let i = 0; i < 2; i++) {
                    rootRow.insertCell();
                }
            }

            // Adiciona a célula do botão
            const rootCell = rootRow.insertCell();
            rootCell.appendChild(rootButton);

            if (files.length > 0) {
                files.forEach(file => {
                    const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                    const row = fileList.insertRow();
                    let linkElement;

                    if (isFolder) {
                        linkElement = `<a href="javascript:void(0);" class="centered-link" onclick="openFolder('${file.id}', '${file.name}')">Abrir</a>`;
                    } else {
                        linkElement = `<a href="https://drive.google.com/uc?export=download&id=${file.id}" class="centered-link" target="_blank">Baixar</a>`;
                    }

                    // Verifica se a pesquisa foi feita para exibir a coluna de caminho
                    if (searchInput) {
                        row.innerHTML = `
                            <td>${file.path}</td> <!-- Nova célula para o caminho -->
                            <td>${file.name}</td>
                            <td class="mimeType">${file.size ? formatSize(file.size) : ''}</td>
                            <td class="mimeType">${file.mimeType}</td>
                            <td>${linkElement}</td>
                        `;
                    } else {
                        row.innerHTML = `
                            <td>${file.name}</td>
                            <td>${file.size ? formatSize(file.size) : ''}</td>
                            <td class="mimeType">${file.mimeType}</td>
                            <td>${linkElement}</td>
                        `;
                    }
                });
            } else {
                const row = fileList.insertRow();
                row.innerHTML = '<td colspan="4">Nenhum arquivo encontrado.</td>';
            }
        })
        .catch(error => console.error('Erro ao procurar o arquivo:', error));
}

function removeHeader() {
    const fileList = document.getElementById('theaddo');
    const headerRow = fileList.querySelector('tr'); // Obtém a primeira linha da tabela, que é o cabeçalho

    if (headerRow) {
        fileList.removeChild(headerRow); // Remove o cabeçalho
    }
}

function addOriginalHeader() {
    const fileList = document.getElementById('theaddo');
    const headerRow = fileList.insertRow();
    headerRow.innerHTML = `
        <th>Nome</th>
        <th>Tamanho</th>
        <th>Tipo</th>
        <th>Ação</th>
    `;
}