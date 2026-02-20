package com.agendacontatos.model;

/**
 * Classe que representa o endereço de um contato.
 * Contém informações completas de localização.
 */
public class Endereco {

    // Atributos de endereço
    private String estado;
    private String cidade;
    private String bairro;
    private String logradouro;
    private String numero;
    private String cep;

    /**
     * Construtor padrão vazio.
     */
    public Endereco() {}

    /**
     * Construtor completo com todos os campos de endereço.
     */
    public Endereco(String estado, String cidade, String bairro, String logradouro, String numero, String cep) {
        this.estado = estado;
        this.cidade = cidade;
        this.bairro = bairro;
        this.logradouro = logradouro;
        this.numero = numero;
        this.cep = cep;
    }

    // Getters e Setters

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getCidade() {
        return cidade;
    }

    public void setCidade(String cidade) {
        this.cidade = cidade;
    }

    public String getBairro() {
        return bairro;
    }

    public void setBairro(String bairro) {
        this.bairro = bairro;
    }

    public String getLogradouro() {
        return logradouro;
    }

    public void setLogradouro(String logradouro) {
        this.logradouro = logradouro;
    }

    public String getNumero() {
        return numero;
    }

    public void setNumero(String numero) {
        this.numero = numero;
    }

    public String getCep() {
        return cep;
    }

    public void setCep(String cep) {
        this.cep = cep;
    }
}