package com.agendacontatos.repository;

import com.agendacontatos.model.Contato;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.reflect.TypeToken;
import org.springframework.stereotype.Repository;

import java.io.*;
import java.lang.reflect.Type;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Repositório para persistência de contatos em arquivo JSON.
 * Gerencia operações de leitura e escrita no banco de dados em arquivo.
 */
@Repository
public class ContatoRepository {

    // Configurações de persistência
    private final String FILE_PATH;
    private final Gson gson;

    /**
     * Construtor do repositório.
     * Inicializa o Gson com adaptador de LocalDate e determina o caminho do arquivo de dados.
     */
    public ContatoRepository() {
        this.gson = new GsonBuilder()
                .setPrettyPrinting()
                .registerTypeAdapter(LocalDate.class, new LocalDateAdapter())
                .create();
        this.FILE_PATH = determinarCaminhoBancoDados();
        inicializarArquivo();
    }

    /**
     * Determina o caminho do arquivo de banco de dados.
     * Em produção: usa Documents do usuário. Em desenvolvimento: usa pasta local.
     */
    private String determinarCaminhoBancoDados() {
        String userHome = System.getProperty("user.home");
        boolean isProduction = System.getProperty("app.mode", "dev").equals("production");

        String caminho;
        if (isProduction) {
            caminho = Paths.get(userHome, "Documents", "AgendaContatos", "database", "contatos.json").toString();
            System.out.println("🔒 [PRODUÇÃO] Banco de dados em: " + caminho);
        } else {
            caminho = "database/contatos.json";
            System.out.println("🔧 [DEV] Banco de dados em: " + new File(caminho).getAbsolutePath());
        }

        return caminho;
    }

    /**
     * Inicializa o arquivo de banco de dados.
     * Cria o diretório e arquivo se não existirem.
     */
    private void inicializarArquivo() {
        try {
            Path path = Paths.get(FILE_PATH);
            Path diretorio = path.getParent();

            // Cria diretório se não existir
            if (diretorio != null && !Files.exists(diretorio)) {
                Files.createDirectories(diretorio);
                System.out.println("✅ Diretório criado: " + diretorio);
            }

            // Cria arquivo vazio se não existir
            if (!Files.exists(path)) {
                salvarContatos(new ArrayList<>());
                System.out.println("✅ Arquivo de banco criado: " + FILE_PATH);
            } else {
                System.out.println("✅ Banco de dados encontrado: " + FILE_PATH);
            }
        } catch (Exception e) {
            System.err.println("❌ Erro ao inicializar arquivo: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // Métodos de consulta (leitura)

    /**
     * Retorna todos os contatos do banco de dados.
     */
    public List<Contato> findAll() {
        try {
            String json = new String(Files.readAllBytes(Paths.get(FILE_PATH)));
            if (json.trim().isEmpty()) {
                return new ArrayList<>();
            }
            Type listType = new TypeToken<ArrayList<Contato>>(){}.getType();
            List<Contato> contatos = gson.fromJson(json, listType);
            return contatos != null ? contatos : new ArrayList<>();
        } catch (Exception e) {
            System.err.println("❌ Erro ao ler contatos: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Busca um contato específico pelo ID.
     */
    public Optional<Contato> findById(String id) {
        return findAll().stream()
                .filter(c -> c.getId().equals(id))
                .findFirst();
    }

    /**
     * Busca contatos cujo nome contenha o texto fornecido (case-insensitive).
     */
    public List<Contato> buscarPorNome(String nome) {
        return findAll().stream()
                .filter(c -> c.getNome().toLowerCase().contains(nome.toLowerCase()))
                .collect(Collectors.toList());
    }

    // Métodos de persistência (escrita)

    /**
     * Salva ou atualiza um contato.
     * Se o ID já existir, substitui o contato. Caso contrário, adiciona um novo.
     */
    public Contato save(Contato contato) {
        List<Contato> contatos = findAll();

        Optional<Contato> existente = contatos.stream()
                .filter(c -> c.getId().equals(contato.getId()))
                .findFirst();

        if (existente.isPresent()) {
            contatos.remove(existente.get());
        }

        contatos.add(contato);
        salvarContatos(contatos);
        return contato;
    }

    /**
     * Remove um contato pelo ID.
     * Retorna true se o contato foi removido, false se não foi encontrado.
     */
    public boolean deleteById(String id) {
        List<Contato> contatos = findAll();
        boolean removido = contatos.removeIf(c -> c.getId().equals(id));
        if (removido) {
            salvarContatos(contatos);
        }
        return removido;
    }

    /**
     * Importa uma lista completa de contatos (substitui todos os dados existentes).
     */
    public void importarContatos(List<Contato> contatos) {
        salvarContatos(contatos);
    }

    /**
     * Método auxiliar para salvar a lista de contatos no arquivo JSON.
     * Usa formatação pretty-print para melhor legibilidade.
     */
    private void salvarContatos(List<Contato> contatos) {
        try (FileWriter writer = new FileWriter(FILE_PATH)) {
            gson.toJson(contatos, writer);
            System.out.println("💾 Contatos salvos com sucesso!");
        } catch (IOException e) {
            System.err.println("❌ Erro ao salvar contatos: " + e.getMessage());
            throw new RuntimeException("Erro ao salvar contatos: " + e.getMessage());
        }
    }
}