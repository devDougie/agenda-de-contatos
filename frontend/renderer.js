// ============================================================
// CONFIGURAÇÕES E CONSTANTES
// ============================================================

const API_URL = 'http://localhost:8080/api/contatos';
const { ipcRenderer } = require('electron');

// Estado global - controla qual contato está sendo editado
let contatoEditando = null;

// ============================================================
// REFERÊNCIAS AOS ELEMENTOS DO DOM
// ============================================================

const listaContatos = document.getElementById('listaContatos');
const formularioContato = document.getElementById('formularioContato');
const formContato = document.getElementById('formContato');
const btnNovo = document.getElementById('btnNovo');
const btnCancelar = document.getElementById('btnCancelar');
const searchInput = document.getElementById('searchInput');
const tituloForm = document.getElementById('tituloForm');
const btnAddTelefone = document.getElementById('btnAddTelefone');
const btnAddEmail = document.getElementById('btnAddEmail');

// ============================================================
// FUNÇÕES DE INTERFACE - NOTIFICAÇÕES E MODAIS
// ============================================================

/**
 * Exibe notificação temporária no canto superior direito.
 * @param {string} mensagem - Texto a ser exibido
 * @param {string} tipo - Tipo da notificação: 'success', 'error' ou 'info'
 */
function mostrarNotificacao(mensagem, tipo = 'info') {
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: ${tipo === 'success' ? '#4caf50' : tipo === 'error' ? '#ef5350' : '#667eea'};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        z-index: 10000;
        font-family: 'Segoe UI', sans-serif;
        font-size: 14px;
        max-width: 400px;
        animation: slideIn 0.3s ease-out;
    `;
    notif.textContent = mensagem;

    document.body.appendChild(notif);

    // Remove notificação após 3 segundos
    setTimeout(() => {
        notif.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

/**
 * Exibe modal de confirmação personalizado.
 * @param {string} mensagem - Texto da confirmação
 * @param {function} callback - Função chamada com true/false conforme resposta
 */
function confirmarAcao(mensagem, callback) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 15px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        max-width: 400px;
        text-align: center;
    `;

    modal.innerHTML = `
        <h3 style="color: #667eea; margin-bottom: 15px;">Confirmação</h3>
        <p style="color: #333; margin-bottom: 25px; font-size: 14px;">${mensagem}</p>
        <div style="display: flex; gap: 10px; justify-content: center;">
            <button id="btnConfirmarSim" style="
                background: #667eea;
                color: white;
                border: none;
                padding: 10px 25px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
            ">Sim</button>
            <button id="btnConfirmarNao" style="
                background: #e0e0e0;
                color: #333;
                border: none;
                padding: 10px 25px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
            ">Não</button>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Event listeners para botões de confirmação
    document.getElementById('btnConfirmarSim').onclick = () => {
        overlay.remove();
        callback(true);
    };

    document.getElementById('btnConfirmarNao').onclick = () => {
        overlay.remove();
        callback(false);
    };

    // Fecha ao clicar fora do modal
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            overlay.remove();
            callback(false);
        }
    };
}

// ============================================================
// INICIALIZAÇÃO DA APLICAÇÃO
// ============================================================

/**
 * Inicializa a aplicação quando o DOM estiver carregado.
 * Configura animações, eventos, tema e verifica aniversários.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Adiciona estilos de animação para notificações
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    carregarContatos();
    configurarEventos();
    configurarEventosContatos();
    inicializarTema();
    verificarAniversarios();
});

// ============================================================
// CONFIGURAÇÃO DE EVENTOS
// ============================================================

/**
 * Configura event delegation para ações nos cards de contato.
 * Permite editar e deletar contatos, além de edição por duplo clique.
 */
function configurarEventosContatos() {
    // Event delegation para botões de editar e deletar
    listaContatos.addEventListener('click', (e) => {
        const btnEditar = e.target.closest('.btn-editar');
        const btnDeletar = e.target.closest('.btn-deletar');

        if (btnEditar) {
            const id = btnEditar.getAttribute('data-id');
            editarContato(id);
        }

        if (btnDeletar) {
            const id = btnDeletar.getAttribute('data-id');
            deletarContato(id);
        }
    });

    // Duplo clique em card abre edição
    listaContatos.addEventListener('dblclick', (e) => {
        const contatoCard = e.target.closest('.contato-card');

        if (contatoCard) {
            const btnEditar = contatoCard.querySelector('.btn-editar');
            if (btnEditar) {
                const id = btnEditar.getAttribute('data-id');
                editarContato(id);
            }
        }
    });
}

/**
 * Configura todos os event listeners da interface.
 * Inclui: novo contato, exportar, importar, busca, formulário, campos dinâmicos e CEP.
 */
function configurarEventos() {
    // Botão novo contato
    btnNovo.addEventListener('click', () => {
        contatoEditando = null;
        limparFormulario();
        tituloForm.textContent = 'Novo Contato';
        mostrarFormulario();
    });

    // Botões de importação/exportação e notificações
    document.getElementById('btnExportar').addEventListener('click', exportarContatos);
    document.getElementById('btnImportar').addEventListener('click', importarContatos);
    document.getElementById('btnFecharNotificacao').addEventListener('click', fecharNotificacaoAniversarios);

    // Botão cancelar formulário
    btnCancelar.addEventListener('click', () => {
        esconderFormulario();
        limparFormulario();
    });

    // Submit do formulário
    formContato.addEventListener('submit', salvarContato);

    // Busca em tempo real
    searchInput.addEventListener('input', (e) => {
        const termo = e.target.value;
        if (termo.length > 0) {
            buscarContatos(termo);
        } else {
            carregarContatos();
        }
    });

    // Adicionar campos dinâmicos de telefone
    btnAddTelefone.addEventListener('click', () => {
        const div = document.getElementById('telefones');
        const input = document.createElement('input');
        input.type = 'tel';
        input.className = 'telefone';
        input.placeholder = '(00) 00000-0000';
        div.appendChild(input);
    });

    // Adicionar campos dinâmicos de email
    btnAddEmail.addEventListener('click', () => {
        const div = document.getElementById('emails');
        const input = document.createElement('input');
        input.type = 'email';
        input.className = 'email';
        input.placeholder = 'exemplo@email.com';
        div.appendChild(input);
    });

    // Auto-preenchimento de CEP
    const cepInput = document.getElementById('cep');
    cepInput.addEventListener('blur', buscarCEP);
    cepInput.addEventListener('input', formatarCEP);
}

// ============================================================
// GERENCIAMENTO DE TEMA (DARK MODE)
// ============================================================

/**
 * Inicializa e configura o tema da aplicação.
 * Carrega preferência salva no localStorage e configura toggle.
 */
function inicializarTema() {
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const temaEscuro = localStorage.getItem('temaEscuro') === 'true';

    // Aplica tema salvo
    if (temaEscuro) {
        document.body.classList.add('dark-mode');
        themeToggle.checked = true;
        themeIcon.textContent = '☀️';
    }

    // Toggle de tema
    themeToggle.addEventListener('change', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        themeIcon.textContent = isDark ? '☀️' : '🌙';
        localStorage.setItem('temaEscuro', isDark);
    });
}

// ============================================================
// OPERAÇÕES CRUD - CONSULTA
// ============================================================

/**
 * Carrega todos os contatos do backend e renderiza na interface.
 */
async function carregarContatos() {
    try {
        const response = await fetch(API_URL);
        const contatos = await response.json();
        renderizarContatos(contatos);
    } catch (error) {
        console.error('Erro ao carregar contatos:', error);
        mostrarNotificacao('Erro ao carregar contatos.', 'error');
    }
}

/**
 * Busca contatos por nome no backend.
 * @param {string} nome - Termo de busca
 */
async function buscarContatos(nome) {
    try {
        const response = await fetch(`${API_URL}/buscar?nome=${encodeURIComponent(nome)}`);
        const contatos = await response.json();
        renderizarContatos(contatos);
    } catch (error) {
        console.error('Erro ao buscar contatos:', error);
        mostrarNotificacao('Erro ao buscar contatos.', 'error');
    }
}

/**
 * Renderiza lista de contatos na interface.
 * Exibe mensagem vazia se não houver contatos.
 * @param {Array} contatos - Array de objetos contato
 */
function renderizarContatos(contatos) {
    if (contatos.length === 0) {
        listaContatos.innerHTML = '<p class="mensagem-vazia">Nenhum contato encontrado.</p>';
        return;
    }

    listaContatos.innerHTML = contatos.map(contato => criarCardContato(contato)).join('');
}

/**
 * Cria HTML de um card de contato.
 * @param {Object} contato - Dados do contato
 * @returns {string} HTML do card
 */
function criarCardContato(contato) {
    const telefones = contato.telefones && contato.telefones.length > 0
        ? contato.telefones.filter(t => t.trim()).map(t => `<div>📞 ${t}</div>`).join('')
        : '<div style="color: #999;">Sem telefone</div>';

    const emails = contato.emails && contato.emails.length > 0
        ? contato.emails.filter(e => e.trim()).map(e => `<div>📧 ${e}</div>`).join('')
        : '<div style="color: #999;">Sem email</div>';

    const endereco = contato.endereco && (
        contato.endereco.logradouro ||
        contato.endereco.cidade ||
        contato.endereco.estado
    ) ? formatarEndereco(contato.endereco) : '<div style="color: #999;">Sem endereço</div>';

    const dataNascFormatada = contato.dataNascimento
        ? new Date(contato.dataNascimento + 'T00:00:00').toLocaleDateString('pt-BR')
        : 'Não informada';

    return `
        <div class="contato-card">
            <div class="contato-header">
                <h3>${contato.nome}</h3>
                <div class="contato-actions">
                    <button class="btn-editar" data-id="${contato.id}">✏️ Editar</button>
                    <button class="btn-deletar" data-id="${contato.id}">🗑️ Deletar</button>
                </div>
            </div>
            <div class="contato-info">
                <div><strong>📅 Data de Nascimento:</strong> ${dataNascFormatada}</div>
                <div><strong>Telefones:</strong> ${telefones}</div>
                <div><strong>Emails:</strong> ${emails}</div>
                <div><strong>📍 Endereço:</strong> ${endereco}</div>
            </div>
        </div>
    `;
}

/**
 * Formata objeto de endereço em string legível.
 * @param {Object} endereco - Dados do endereço
 * @returns {string} Endereço formatado
 */
function formatarEndereco(endereco) {
    const partes = [];
    if (endereco.logradouro) partes.push(endereco.logradouro);
    if (endereco.numero) partes.push(endereco.numero);
    if (endereco.bairro) partes.push(endereco.bairro);
    if (endereco.cidade) partes.push(endereco.cidade);
    if (endereco.estado) partes.push(endereco.estado);
    if (endereco.cep) partes.push(`CEP: ${endereco.cep}`);
    return partes.join(', ');
}

// ============================================================
// OPERAÇÕES CRUD - CRIAÇÃO E EDIÇÃO
// ============================================================

/**
 * Salva ou atualiza contato (submit do formulário).
 * @param {Event} e - Evento de submit
 */
async function salvarContato(e) {
    e.preventDefault();

    const contato = {
        nome: document.getElementById('nome').value,
        dataNascimento: document.getElementById('dataNascimento').value || null,
        telefones: Array.from(document.querySelectorAll('.telefone'))
            .map(input => input.value.trim())
            .filter(t => t !== ''),
        emails: Array.from(document.querySelectorAll('.email'))
            .map(input => input.value.trim())
            .filter(e => e !== ''),
        endereco: {
            estado: document.getElementById('estado').value,
            cidade: document.getElementById('cidade').value,
            bairro: document.getElementById('bairro').value,
            logradouro: document.getElementById('logradouro').value,
            numero: document.getElementById('numero').value,
            cep: document.getElementById('cep').value
        }
    };

    try {
        let response;
        if (contatoEditando) {
            // Atualização
            response = await fetch(`${API_URL}/${contatoEditando}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contato)
            });
        } else {
            // Criação
            response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contato)
            });
        }

        if (response.ok) {
            mostrarNotificacao(
                contatoEditando ? 'Contato atualizado com sucesso!' : 'Contato criado com sucesso!',
                'success'
            );
            esconderFormulario();
            limparFormulario();
            carregarContatos();
            verificarAniversarios();
        } else {
            mostrarNotificacao('Erro ao salvar contato.', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar contato:', error);
        mostrarNotificacao('Erro ao salvar contato.', 'error');
    }
}

/**
 * Carrega dados de um contato no formulário para edição.
 * @param {string} id - ID do contato
 */
async function editarContato(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        const contato = await response.json();

        contatoEditando = id;
        tituloForm.textContent = 'Editar Contato';

        // Preenche campos simples
        document.getElementById('nome').value = contato.nome || '';
        document.getElementById('dataNascimento').value = contato.dataNascimento || '';

        // Preenche telefones
        const divTelefones = document.getElementById('telefones');
        divTelefones.innerHTML = '';
        if (contato.telefones && contato.telefones.length > 0) {
            contato.telefones.forEach(telefone => {
                const input = document.createElement('input');
                input.type = 'tel';
                input.className = 'telefone';
                input.value = telefone;
                input.placeholder = '(00) 00000-0000';
                divTelefones.appendChild(input);
            });
        } else {
            divTelefones.innerHTML = '<input type="tel" class="telefone" placeholder="(00) 00000-0000">';
        }

        // Preenche emails
        const divEmails = document.getElementById('emails');
        divEmails.innerHTML = '';
        if (contato.emails && contato.emails.length > 0) {
            contato.emails.forEach(email => {
                const input = document.createElement('input');
                input.type = 'email';
                input.className = 'email';
                input.value = email;
                input.placeholder = 'exemplo@email.com';
                divEmails.appendChild(input);
            });
        } else {
            divEmails.innerHTML = '<input type="email" class="email" placeholder="exemplo@email.com">';
        }

        // Preenche endereço
        if (contato.endereco) {
            document.getElementById('estado').value = contato.endereco.estado || '';
            document.getElementById('cidade').value = contato.endereco.cidade || '';
            document.getElementById('bairro').value = contato.endereco.bairro || '';
            document.getElementById('logradouro').value = contato.endereco.logradouro || '';
            document.getElementById('numero').value = contato.endereco.numero || '';
            document.getElementById('cep').value = contato.endereco.cep || '';
        }

        mostrarFormulario();
    } catch (error) {
        console.error('Erro ao carregar contato para edição:', error);
        mostrarNotificacao('Erro ao carregar contato.', 'error');
    }
}

// ============================================================
// OPERAÇÕES CRUD - EXCLUSÃO
// ============================================================

/**
 * Deleta um contato após confirmação.
 * @param {string} id - ID do contato
 */
async function deletarContato(id) {
    confirmarAcao('Tem certeza que deseja deletar este contato?', async (confirmado) => {
        if (!confirmado) return;

        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                mostrarNotificacao('Contato deletado com sucesso!', 'success');
                carregarContatos();
                verificarAniversarios();
            } else {
                mostrarNotificacao('Erro ao deletar contato.', 'error');
            }
        } catch (error) {
            console.error('Erro ao deletar contato:', error);
            mostrarNotificacao('Erro ao deletar contato.', 'error');
        }
    });
}

// ============================================================
// IMPORTAÇÃO E EXPORTAÇÃO
// ============================================================

/**
 * Exporta todos os contatos para arquivo JSON.
 * Usa diálogo nativo do Electron para escolher local de salvamento.
 */
async function exportarContatos() {
    try {
        const response = await fetch(`${API_URL}/exportar`);
        if (!response.ok) {
            mostrarNotificacao('Erro ao buscar contatos para exportação.', 'error');
            return;
        }

        const contatos = await response.json();

        if (contatos.length === 0) {
            mostrarNotificacao('Não há contatos para exportar.', 'info');
            return;
        }

        const result = await ipcRenderer.invoke('dialog:saveContatos', contatos);

        if (result.success) {
            mostrarNotificacao(
                `✅ ${contatos.length} contato(s) exportado(s) com sucesso!\n\nArquivo salvo em:\n${result.filePath}`,
                'success'
            );
        } else if (!result.canceled) {
            mostrarNotificacao(
                `❌ Erro ao salvar arquivo: ${result.error || 'Desconhecido'}`,
                'error'
            );
        }

    } catch (error) {
        console.error('Erro ao exportar contatos:', error);
        mostrarNotificacao('Erro ao exportar contatos.', 'error');
    }
}

/**
 * Importa contatos de arquivo JSON.
 * Usa diálogo nativo do Electron e confirma antes de substituir dados.
 */
async function importarContatos() {
    try {
        const result = await ipcRenderer.invoke('dialog:openContatos');

        if (!result.success) {
            if (!result.canceled) {
                mostrarNotificacao(
                    `❌ Erro ao ler arquivo: ${result.error || 'Arquivo JSON inválido'}`,
                    'error'
                );
            }
            return;
        }

        const contatos = result.contatos;

        if (!Array.isArray(contatos)) {
            mostrarNotificacao('Arquivo JSON inválido. Deve conter um array de contatos.', 'error');
            return;
        }

        // Confirma antes de importar (substitui dados)
        confirmarAcao(
            `Você está prestes a importar ${contatos.length} contato(s).\n\nATENÇÃO: Isso irá SUBSTITUIR todos os contatos atuais!\n\nDeseja continuar?`,
            async (confirmado) => {
                if (!confirmado) return;

                try {
                    const response = await fetch(`${API_URL}/importar`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(contatos)
                    });

                    if (response.ok) {
                        mostrarNotificacao(
                            `✅ ${contatos.length} contato(s) importado(s) com sucesso!`,
                            'success'
                        );
                        carregarContatos();
                        verificarAniversarios();
                    } else {
                        mostrarNotificacao('Erro ao importar contatos no servidor.', 'error');
                    }
                } catch (error) {
                    console.error('Erro ao enviar contatos para o servidor:', error);
                    mostrarNotificacao('Erro ao importar contatos.', 'error');
                }
            }
        );
    } catch (error) {
        console.error('Erro ao importar contatos:', error);
        mostrarNotificacao('Erro ao importar contatos.', 'error');
    }
}

// ============================================================
// INTEGRAÇÃO COM API DE CEP (ViaCEP)
// ============================================================

/**
 * Busca dados de endereço pela API ViaCEP.
 * Preenche campos automaticamente quando CEP é válido.
 */
async function buscarCEP() {
    const cepInput = document.getElementById('cep');
    let cep = cepInput.value.replace(/\D/g, '');

    if (cep.length !== 8) {
        return;
    }

    try {
        cepInput.style.borderColor = '#ffa726';
        cepInput.disabled = true;

        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const dados = await response.json();

        if (dados.erro) {
            mostrarNotificacao('CEP não encontrado!', 'error');
            cepInput.style.borderColor = '#ef5350';
            cepInput.disabled = false;
            return;
        }

        // Preenche campos de endereço
        document.getElementById('estado').value = dados.uf || '';
        document.getElementById('cidade').value = dados.localidade || '';
        document.getElementById('bairro').value = dados.bairro || '';
        document.getElementById('logradouro').value = dados.logradouro || '';

        cepInput.style.borderColor = '#4caf50';

        // Foca no campo número após preenchimento
        setTimeout(() => {
            const numeroInput = document.getElementById('numero');
            if (numeroInput) {
                numeroInput.focus();
            }
        }, 100);

        // Restaura estilo do input
        setTimeout(() => {
            cepInput.style.borderColor = '';
            cepInput.disabled = false;
        }, 2000);

    } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        mostrarNotificacao('Erro ao buscar CEP. Verifique sua conexão com a internet.', 'error');
        cepInput.style.borderColor = '#ef5350';
        cepInput.disabled = false;
    }
}

/**
 * Formata CEP enquanto digita (00000-000).
 */
function formatarCEP() {
    const cepInput = document.getElementById('cep');
    let cep = cepInput.value.replace(/\D/g, '');

    if (cep.length > 5) {
        cep = cep.substring(0, 5) + '-' + cep.substring(5, 8);
    }

    cepInput.value = cep;
}

// ============================================================
// CONTROLE DE FORMULÁRIO
// ============================================================

/**
 * Exibe o formulário de contato e foca no campo nome.
 */
function mostrarFormulario() {
    formularioContato.classList.remove('hidden');
    formularioContato.scrollTop = 0;

    setTimeout(() => {
        const nomeInput = document.getElementById('nome');
        if (nomeInput) {
            nomeInput.focus();
        }
    }, 100);
}

/**
 * Esconde o formulário de contato.
 */
function esconderFormulario() {
    formularioContato.classList.add('hidden');
}

/**
 * Limpa todos os campos do formulário e reseta estado de edição.
 */
function limparFormulario() {
    formContato.reset();
    contatoEditando = null;

    // Reseta campos dinâmicos para um único campo vazio
    const divTelefones = document.getElementById('telefones');
    divTelefones.innerHTML = '<input type="tel" class="telefone" placeholder="(00) 00000-0000">';

    const divEmails = document.getElementById('emails');
    divEmails.innerHTML = '<input type="email" class="email" placeholder="exemplo@email.com">';
}

// ============================================================
// NOTIFICAÇÃO DE ANIVERSÁRIOS
// ============================================================

/**
 * Verifica se há aniversariantes do dia e exibe notificação.
 * Compara data de nascimento com data atual.
 */
async function verificarAniversarios() {
    try {
        const response = await fetch(API_URL);
        const contatos = await response.json();

        const hoje = new Date();
        const mesHoje = hoje.getMonth() + 1;
        const diaHoje = hoje.getDate();

        // Filtra contatos que fazem aniversário hoje
        const aniversariantes = contatos.filter(contato => {
            if (!contato.dataNascimento) return false;

            const dataNasc = new Date(contato.dataNascimento + 'T00:00:00');
            const mesNasc = dataNasc.getMonth() + 1;
            const diaNasc = dataNasc.getDate();

            return mesNasc === mesHoje && diaNasc === diaHoje;
        });

        if (aniversariantes.length > 0) {
            mostrarNotificacaoAniversarios(aniversariantes, hoje);
        }
    } catch (error) {
        console.error('Erro ao verificar aniversários:', error);
    }
}

/**
 * Exibe notificação com lista de aniversariantes do dia.
 * @param {Array} aniversariantes - Array de contatos aniversariantes
 * @param {Date} hoje - Data atual
 */
function mostrarNotificacaoAniversarios(aniversariantes, hoje) {
    const notificacao = document.getElementById('aniversariosNotificacao');
    const lista = document.getElementById('listaAniversariantes');

    lista.innerHTML = '';

    aniversariantes.forEach(contato => {
        const dataNasc = new Date(contato.dataNascimento + 'T00:00:00');
        const idade = hoje.getFullYear() - dataNasc.getFullYear();

        const item = document.createElement('div');
        item.className = 'aniversariante-item';
        item.innerHTML = `
            <div class="aniversariante-info">
                <div class="aniversariante-nome">${contato.nome}</div>
                <div class="aniversariante-idade">Fazendo ${idade} anos hoje! 🎉</div>
            </div>
            <div class="aniversariante-emoji">🎂</div>
        `;
        lista.appendChild(item);
    });

    notificacao.classList.remove('hidden');
}

/**
 * Fecha a notificação de aniversários.
 */
function fecharNotificacaoAniversarios() {
    const notificacao = document.getElementById('aniversariosNotificacao');
    notificacao.classList.add('hidden');
}