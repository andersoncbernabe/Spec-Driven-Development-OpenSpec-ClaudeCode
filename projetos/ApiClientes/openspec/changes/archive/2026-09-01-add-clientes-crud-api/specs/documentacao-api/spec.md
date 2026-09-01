## Purpose

Garante que os endpoints da API sejam descobríveis e experimentáveis sem ferramentas externas: a API descreve a si mesma em um documento OpenAPI, oferece uma interface interativa para explorá-la, e leva o desenvolvedor direto a essa interface ao iniciar a aplicação em ambiente de desenvolvimento.

## ADDED Requirements

### Requirement: Documento OpenAPI da API

O sistema SHALL expor um documento OpenAPI descrevendo todos os endpoints públicos da API, seus parâmetros, corpos de requisição e possíveis códigos de resposta.

O documento MUST refletir os endpoints realmente registrados na aplicação, sem manutenção manual paralela.

#### Scenario: Documento disponível

- **WHEN** o endpoint do documento OpenAPI é requisitado
- **THEN** o sistema responde `200 OK` com um documento OpenAPI válido

#### Scenario: Todas as operações de cliente descritas

- **WHEN** o documento OpenAPI é obtido
- **THEN** ele descreve as cinco operações de cliente: criar, listar, obter por identificador, atualizar e remover

#### Scenario: Códigos de resposta descritos

- **WHEN** o documento OpenAPI é obtido
- **THEN** a operação de criação declara os códigos `201`, `400` e `409`
- **AND** as operações por identificador declaram o código `404`

### Requirement: Interface interativa de documentação

O sistema SHALL servir uma interface web interativa em `/swagger` que liste os endpoints da API e permita executar requisições contra eles a partir do navegador.

#### Scenario: Interface acessível

- **WHEN** um navegador acessa `/swagger`
- **THEN** o sistema responde `200 OK` com a interface de documentação

#### Scenario: Endpoints visíveis na interface

- **WHEN** a interface de documentação é carregada
- **THEN** as cinco operações de cliente estão listadas e podem ser expandidas

### Requirement: Abertura automática do navegador ao iniciar em desenvolvimento

Ao iniciar a aplicação em ambiente de desenvolvimento pelo fluxo padrão de execução do projeto, o sistema SHALL abrir automaticamente o navegador na interface interativa de documentação, sem que o desenvolvedor precise digitar a URL.

Esse comportamento MUST estar restrito à execução em desenvolvimento e NÃO SHALL ocorrer quando a aplicação é executada a partir de uma publicação.

#### Scenario: Navegador abre na documentação

- **WHEN** a aplicação é iniciada pelo fluxo padrão de execução em desenvolvimento
- **AND** o navegador é aberto automaticamente na URL `/swagger` da aplicação
- **THEN** a interface de documentação com os endpoints é exibida

#### Scenario: Publicação não abre navegador

- **WHEN** a aplicação publicada é executada como processo de servidor
- **THEN** nenhum navegador é aberto
- **AND** a aplicação inicia normalmente e atende requisições

#### Scenario: Documentação continua acessível sem abertura automática

- **WHEN** a aplicação está em execução e o navegador não foi aberto automaticamente
- **THEN** a interface de documentação continua acessível por acesso manual a `/swagger`
