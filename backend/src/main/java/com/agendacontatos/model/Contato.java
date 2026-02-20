package com.agendacontatos.model;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Entidade que representa um contato na agenda.
 * Contém informações pessoais, endereço e dados de contato.
 */
public class Contato {

    // Atributos principais do contato
    private String id;
    private String nome;
    private LocalDate dataNascimento;
    private Endereco endereco;

    // Coleções de dados de contato (múltiplos valores permitidos)
    private List<String> telefones;
    private List<String> emails;

    /**
     * Construtor padrão.
     * Gera um ID único e inicializa as listas de telefones e emails.
     */
    public Contato() {
        this.id = UUID.randomUUID().toString();
        this.telefones = new ArrayList<>();
        this.emails = new ArrayList<>();
    }

    /**
     * Construtor completo com todos os atributos.
     * Gera um ID único automaticamente.
     */
    public Contato(String nome, LocalDate dataNascimento, Endereco endereco,
                   List<String> telefones, List<String> emails) {
        this.id = UUID.randomUUID().toString();
        this.nome = nome;
        this.dataNascimento = dataNascimento;
        this.endereco = endereco;
        this.telefones = telefones != null ? telefones : new ArrayList<>();
        this.emails = emails != null ? emails : new ArrayList<>();
    }

    // Getters e Setters

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public LocalDate getDataNascimento() {
        return dataNascimento;
    }

    public void setDataNascimento(LocalDate dataNascimento) {
        this.dataNascimento = dataNascimento;
    }

    public Endereco getEndereco() {
        return endereco;
    }

    public void setEndereco(Endereco endereco) {
        this.endereco = endereco;
    }

    public List<String> getTelefones() {
        return telefones;
    }

    public void setTelefones(List<String> telefones) {
        this.telefones = telefones;
    }

    public List<String> getEmails() {
        return emails;
    }

    public void setEmails(List<String> emails) {
        this.emails = emails;
    }
}