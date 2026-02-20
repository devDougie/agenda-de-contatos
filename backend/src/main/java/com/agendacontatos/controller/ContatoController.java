package com.agendacontatos.controller;

import com.agendacontatos.model.Contato;
import com.agendacontatos.service.ContatoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller REST para gerenciamento de contatos.
 * Disponibiliza endpoints para operações CRUD e funcionalidades adicionais.
 */
@RestController
@RequestMapping("/api/contatos")
@CrossOrigin(origins = "*")
public class ContatoController {

    // Injeção de dependência do serviço de contatos
    @Autowired
    private ContatoService service;

    /**
     * Lista todos os contatos cadastrados.
     * GET /api/contatos
     */
    @GetMapping
    public ResponseEntity<List<Contato>> listarTodos() {
        return ResponseEntity.ok(service.listarTodos());
    }

    /**
     * Busca um contato específico pelo ID.
     * GET /api/contatos/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<Contato> buscarPorId(@PathVariable String id) {
        return service.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Busca contatos por nome (busca parcial, case-insensitive).
     * GET /api/contatos/buscar?nome=valor
     */
    @GetMapping("/buscar")
    public ResponseEntity<List<Contato>> buscarPorNome(@RequestParam String nome) {
        return ResponseEntity.ok(service.buscarPorNome(nome));
    }

    /**
     * Cria um novo contato.
     * POST /api/contatos
     */
    @PostMapping
    public ResponseEntity<Contato> criar(@RequestBody Contato contato) {
        Contato novoContato = service.criar(contato);
        return ResponseEntity.status(HttpStatus.CREATED).body(novoContato);
    }

    /**
     * Atualiza um contato existente.
     * PUT /api/contatos/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<Contato> atualizar(@PathVariable String id, @RequestBody Contato contato) {
        return service.atualizar(id, contato)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Remove um contato pelo ID.
     * DELETE /api/contatos/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable String id) {
        boolean deletado = service.deletar(id);
        return deletado ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    /**
     * Exporta todos os contatos em formato JSON.
     * GET /api/contatos/exportar
     */
    @GetMapping("/exportar")
    public ResponseEntity<List<Contato>> exportar() {
        return ResponseEntity.ok(service.exportar());
    }

    /**
     * Importa uma lista de contatos (substitui os dados existentes).
     * POST /api/contatos/importar
     */
    @PostMapping("/importar")
    public ResponseEntity<Void> importar(@RequestBody List<Contato> contatos) {
        service.importar(contatos);
        return ResponseEntity.ok().build();
    }
}