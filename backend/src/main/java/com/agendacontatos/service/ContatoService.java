package com.agendacontatos.service;

import com.agendacontatos.model.Contato;
import com.agendacontatos.repository.ContatoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Camada de serviço para lógica de negócio de contatos.
 * Intermediária entre o Controller e o Repository.
 */
@Service
public class ContatoService {

    // Injeção de dependência do repositório
    @Autowired
    private ContatoRepository repository;

    // Operações de consulta

    /**
     * Lista todos os contatos cadastrados.
     */
    public List<Contato> listarTodos() {
        return repository.findAll();
    }

    /**
     * Busca um contato específico pelo ID.
     */
    public Optional<Contato> buscarPorId(String id) {
        return repository.findById(id);
    }

    /**
     * Busca contatos por nome (busca parcial).
     */
    public List<Contato> buscarPorNome(String nome) {
        return repository.buscarPorNome(nome);
    }

    // Operações de persistência

    /**
     * Cria um novo contato.
     */
    public Contato criar(Contato contato) {
        return repository.save(contato);
    }

    /**
     * Atualiza um contato existente.
     * Mantém o ID original e substitui os demais dados.
     */
    public Optional<Contato> atualizar(String id, Contato contatoAtualizado) {
        Optional<Contato> contatoExistente = repository.findById(id);

        if (contatoExistente.isPresent()) {
            contatoAtualizado.setId(id);
            return Optional.of(repository.save(contatoAtualizado));
        }

        return Optional.empty();
    }

    /**
     * Remove um contato pelo ID.
     * Retorna true se removido com sucesso, false se não encontrado.
     */
    public boolean deletar(String id) {
        return repository.deleteById(id);
    }

    // Operações de importação/exportação

    /**
     * Exporta todos os contatos em formato de lista.
     */
    public List<Contato> exportar() {
        return repository.findAll();
    }

    /**
     * Importa uma lista de contatos (substitui dados existentes).
     */
    public void importar(List<Contato> contatos) {
        repository.importarContatos(contatos);
    }
}