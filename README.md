
# 📇 Agenda de Contatos

Aplicação desktop completa para gerenciamento de contatos pessoais, construída com **Electron** no frontend e **Spring Boot** no backend. Os dados são persistidos localmente em arquivo JSON, sem necessidade de banco de dados externo.

<div align="center">
<img src="https://github.com/user-attachments/assets/db57f49b-5aa8-4b2a-a810-2e0ac1d0cf72">
</div>

<div align="center">
<img src="https://github.com/user-attachments/assets/d708803f-4fc6-4565-9ec5-978a44152be6">
</div>

<div align="center">
<img src="https://github.com/user-attachments/assets/66dd443b-ad36-41bf-beea-1e19698d5f83">
</div>

<div align="center">
<img src="https://github.com/user-attachments/assets/c608e3d9-d1f2-4fc3-b590-a427e5ce097a">
</div>

---

## 🖥️ Demonstração

A aplicação oferece uma interface moderna com suporte a **tema claro e escuro**, notificação automática de aniversários e gerenciamento completo de contatos.

---

## 🛠️ Tecnologias Utilizadas

### Frontend
| Tecnologia | Versão | Função |
|---|---|---|
| [Electron](https://www.electronjs.org/) | ^28.0.0 | Framework para aplicação desktop |
| [electron-builder](https://www.electron.build/) | ^24.13.3 | Empacotamento e geração do instalador |
| HTML5 / CSS3 / JavaScript | — | Interface do usuário |

### Backend
| Tecnologia | Versão | Função |
|---|---|---|
| [Java](https://www.oracle.com/java/) | 17 (JDK) | Linguagem do servidor |
| [Spring Boot](https://spring.io/projects/spring-boot) | — | Framework REST API |
| [Maven](https://maven.apache.org/) | — | Gerenciador de dependências |
| [Gson](https://github.com/google/gson) | — | Serialização/deserialização JSON |

### IDEs
- [IntelliJ IDEA](https://www.jetbrains.com/idea/) — Backend (Java)
- [VS Code](https://code.visualstudio.com/) — Frontend (Electron)

---

## 📁 Estrutura do Projeto

```
agenda-de-contatos/
├── frontend/
│   ├── main.js              # Processo principal do Electron (IPC, backend, janela)
│   ├── renderer.js          # Lógica da interface (CRUD, busca, aniversários)
│   ├── index.html           # Estrutura HTML da aplicação
│   ├── styles.css           # Estilos (tema claro/escuro, animações)
│   ├── package.json         # Dependências e configuração do build
│   └── icon.ico             # Ícone da aplicação
└── backend/
    ├── pom.xml              # Configuração Maven
    └── src/main/
        ├── resources/
        │   └── application.properties
        └── java/com/agendacontatos/
            ├── Application.java             # Ponto de entrada Spring Boot
            ├── controller/
            │   └── ContatoController.java   # Endpoints REST
            ├── service/
            │   └── ContatoService.java      # Regras de negócio
            ├── repository/
            │   ├── ContatoRepository.java   # Persistência em JSON
            │   └── LocalDateAdapter.java    # Adaptador Gson para LocalDate
            └── model/
                ├── Contato.java             # Entidade principal
                └── Endereco.java            # Entidade de endereço
```

---

## ✨ Funcionalidades

- ✅ **CRUD completo** — Criar, visualizar, editar e excluir contatos
- 🔍 **Busca em tempo real** por nome (parcial, sem diferenciar maiúsculas/minúsculas)
- 📱 **Múltiplos telefones e e-mails** por contato
- 🏠 **Endereço completo** com preenchimento automático via **API ViaCEP** pelo CEP
- 🎂 **Notificação de aniversários** — exibe automaticamente os aniversariantes do dia
- 🌙 **Tema claro / escuro** com alternância por toggle
- 📤 **Exportar** contatos para arquivo JSON (com diálogo nativo do SO)
- 📥 **Importar** contatos de arquivo JSON (com diálogo nativo do SO)
- 💾 **Persistência local** — dados salvos em `Documents/AgendaContatos/database/contatos.json`
- 📦 **Instalador Windows** gerado via electron-builder (NSIS)

---

## 🚀 Como Executar (Desenvolvimento)

### Pré-requisitos

- [Java 17 JDK](https://www.oracle.com/java/technologies/downloads/#java17)
- [Apache Maven](https://maven.apache.org/download.cgi)
- [Node.js](https://nodejs.org/) (versão LTS recomendada)

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/agenda-de-contatos.git
cd agenda-de-contatos
```

### 2. Compile o Backend

```bash
cd backend
mvn clean package -DskipTests
cd ..
```

Isso gerará o arquivo `backend/target/agenda-contatos-backend-1.0.0.jar`.

### 3. Instale as dependências do Frontend

A pasta `node_modules` não está incluída no repositório. Execute o comando abaixo para que o npm a recrie automaticamente a partir do `package.json`:

```bash
cd frontend
npm install
```

### 4. Execute a aplicação

```bash
npm start
```

O Electron iniciará automaticamente o servidor Spring Boot (porta `8080`) e abrirá a janela da aplicação.

---

## 📦 Build — Gerar Instalador (Windows)

Com o JAR do backend já compilado, execute dentro da pasta `frontend`:

```bash
npm run build
```

O instalador será gerado em `frontend/dist/` com o nome `agenda-de-contatos-instalador-1.0.0.exe`.

> **Nota:** O JAR do backend é empacotado automaticamente dentro do instalador como recurso da aplicação.

---

## 🔌 API REST (Backend)

O servidor roda em `http://localhost:8080/api/contatos`.

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/contatos` | Lista todos os contatos |
| `GET` | `/api/contatos/{id}` | Busca contato por ID |
| `GET` | `/api/contatos/buscar?nome=valor` | Busca contatos por nome |
| `POST` | `/api/contatos` | Cria novo contato |
| `PUT` | `/api/contatos/{id}` | Atualiza contato existente |
| `DELETE` | `/api/contatos/{id}` | Remove contato |
| `GET` | `/api/contatos/exportar` | Exporta todos os contatos (JSON) |
| `POST` | `/api/contatos/importar` | Importa lista de contatos (JSON) |

### Exemplo de payload — Contato

```json
{
  "nome": "Maria Silva",
  "dataNascimento": "1990-06-15",
  "telefones": ["(11) 99999-0000"],
  "emails": ["maria@email.com"],
  "endereco": {
    "cep": "01310-100",
    "logradouro": "Avenida Paulista",
    "numero": "1000",
    "bairro": "Bela Vista",
    "cidade": "São Paulo",
    "estado": "SP"
  }
}
```

---

## 💾 Persistência de Dados

Os dados são armazenados em arquivo JSON no diretório do usuário: `~/Documents/AgendaContatos/database/contatos.json`

Os backups exportados pela aplicação são salvos em: `~/Documents/AgendaContatos/backups/`.

---

## 🖥️ Compatibilidade

| Sistema Operacional | Suporte | Observações |
|---|---|---|
| **Windows 10/11** | ✅ Completo | Plataforma principal do projeto. Instalador `.exe` gerado via NSIS. |
| **macOS** | ⚠️ Parcial | Requer ajustes no `package.json` (target de build para Mac) e ícone no formato `.icns`. |
| **Linux** | ⚠️ Parcial | Requer ajustes no `package.json` (target de build para Linux) e ícone no formato `.png`. |

> **Requisito em todos os sistemas:** o usuário precisa ter o **Java 17 JDK** instalado na máquina para que o backend funcione corretamente.

---

> 📌 **Sobre este projeto:** desenvolvido para fins de aprendizado e prática.
