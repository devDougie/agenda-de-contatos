package com.agendacontatos;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Classe principal da aplicação Spring Boot.
 * Responsável por inicializar a API de Agenda de Contatos.
 */
@SpringBootApplication
public class Application {

    /**
     * Método de entrada da aplicação.
     * Inicia o servidor Spring Boot e exibe informações de acesso no console.
     */
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
        System.out.println("========================================");
        System.out.println("API Agenda de Contatos está rodando!");
        System.out.println("URL: http://localhost:8080/api/contatos");
        System.out.println("========================================");
    }
}