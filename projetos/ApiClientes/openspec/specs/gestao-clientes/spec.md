## Purpose

Define o ciclo de vida de um cliente na API: criação, consulta, atualização e remoção, junto com as regras que garantem que todo cliente armazenado tenha nome preenchido, email em formato válido e email único no sistema, e que a data de cadastro seja sempre atribuída pelo próprio sistema.

## Requirements

### Requirement: Criação de cliente

O sistema SHALL permitir a criação de um cliente a partir de seu nome e email, atribuindo automaticamente um identificador numérico e a data de cadastro.

O identificador e a data de cadastro NÃO SHALL ser aceitos como entrada — se enviados no corpo da requisição, MUST ser ignorados.

#### Scenario: Criação bem-sucedida

- **WHEN** uma requisição `POST /clientes` é enviada com nome preenchido e email válido ainda não cadastrado
- **THEN** o sistema responde `201 Created`
- **AND** o corpo contém o cliente com `id` numérico maior que zero, o `nome` e o `email` enviados, e uma `dataCadastro` preenchida
- **AND** o cabeçalho `Location` aponta para `/clientes/{id}` do cliente criado

#### Scenario: Cliente criado fica imediatamente consultável

- **WHEN** um cliente é criado com sucesso e em seguida é feito `GET /clientes/{id}` com o identificador retornado
- **THEN** o sistema responde `200 OK` com os mesmos `nome` e `email` informados na criação

#### Scenario: Identificador enviado pelo cliente é ignorado

- **WHEN** uma requisição `POST /clientes` inclui um campo `id` no corpo
- **THEN** o sistema responde `201 Created` com um identificador gerado por ele mesmo
- **AND** o identificador retornado não é influenciado pelo valor enviado

### Requirement: Validação dos dados do cliente

O sistema SHALL rejeitar com `400 Bad Request` qualquer criação ou atualização cujo nome esteja ausente ou vazio, ou cujo email não esteja em formato válido.

Um email é considerado válido quando contém **exatamente um** caractere `@`, com pelo menos um caractere antes e pelo menos um caractere depois dele.

A validação MUST ocorrer antes de qualquer consulta ou gravação de dados.

#### Scenario: Nome ausente

- **WHEN** uma requisição de criação é enviada sem o campo `nome`
- **THEN** o sistema responde `400 Bad Request`
- **AND** o corpo identifica `nome` como o campo inválido

#### Scenario: Nome vazio ou apenas espaços

- **WHEN** uma requisição de criação é enviada com `nome` igual a `""` ou `"   "`
- **THEN** o sistema responde `400 Bad Request`

#### Scenario: Email sem arroba

- **WHEN** uma requisição de criação é enviada com `email` igual a `"anasouza"`
- **THEN** o sistema responde `400 Bad Request`
- **AND** o corpo identifica `email` como o campo inválido

#### Scenario: Email com arroba em posição inválida

- **WHEN** uma requisição de criação é enviada com `email` igual a `"ana@"`, `"@exemplo.com"` ou `"@"`
- **THEN** o sistema responde `400 Bad Request`

#### Scenario: Email com mais de uma arroba

- **WHEN** uma requisição de criação é enviada com `email` igual a `"ana@exemplo@com"`
- **THEN** o sistema responde `400 Bad Request`

#### Scenario: Email mínimo válido é aceito

- **WHEN** uma requisição de criação é enviada com `email` igual a `"a@b"`
- **THEN** o sistema responde `201 Created`

#### Scenario: Validação precede o efeito colateral

- **WHEN** uma requisição de criação é rejeitada por dados inválidos
- **THEN** nenhum cliente novo passa a existir
- **AND** uma listagem posterior retorna a mesma quantidade de clientes de antes da requisição

### Requirement: Unicidade de email

O sistema SHALL garantir que não existam dois clientes com o mesmo email e MUST responder `409 Conflict` à tentativa de criar ou atualizar um cliente com email já pertencente a outro cliente.

A comparação de unicidade MUST desconsiderar o próprio cliente durante uma atualização.

#### Scenario: Criação com email já cadastrado

- **WHEN** uma requisição `POST /clientes` usa um email que já pertence a um cliente existente
- **THEN** o sistema responde `409 Conflict`
- **AND** nenhum cliente novo é criado

#### Scenario: Atualização com email de outro cliente

- **WHEN** uma requisição `PUT /clientes/{id}` tenta atribuir um email que já pertence a um cliente diferente
- **THEN** o sistema responde `409 Conflict`
- **AND** os dados do cliente permanecem inalterados

#### Scenario: Atualização mantendo o próprio email

- **WHEN** uma requisição `PUT /clientes/{id}` reenvia o email que já é do próprio cliente, alterando apenas o nome
- **THEN** o sistema responde `200 OK`
- **AND** o nome é atualizado

#### Scenario: Email liberado após remoção

- **WHEN** um cliente é removido e em seguida um novo cliente é criado com o mesmo email
- **THEN** o sistema responde `201 Created`

### Requirement: Data de cadastro gerada pelo sistema

O sistema SHALL atribuir a data de cadastro no momento da criação do cliente, usando o instante corrente em UTC, e MUST tratá-la como imutável a partir daí.

A data de cadastro MUST ser representada nas respostas em formato ISO-8601 com indicação explícita de UTC, de forma idêntica tanto na resposta da criação quanto em consultas posteriores ao mesmo cliente.

#### Scenario: Data atribuída na criação

- **WHEN** um cliente é criado
- **THEN** a `dataCadastro` retornada corresponde ao instante da criação em UTC

#### Scenario: Representação estável entre criação e consulta

- **WHEN** um cliente é criado e em seguida consultado por `GET /clientes/{id}`
- **THEN** o valor de `dataCadastro` na consulta é idêntico, caractere a caractere, ao retornado na criação

#### Scenario: Atualização não altera a data de cadastro

- **WHEN** um cliente existente é atualizado por `PUT /clientes/{id}`
- **THEN** sua `dataCadastro` permanece igual ao valor anterior à atualização

### Requirement: Listagem de clientes

O sistema SHALL retornar `200 OK` com a coleção de todos os clientes cadastrados em `GET /clientes`, sem paginação.

Quando não houver nenhum cliente, o sistema MUST retornar `200 OK` com uma coleção vazia — nunca `404`.

#### Scenario: Listagem com clientes cadastrados

- **WHEN** uma requisição `GET /clientes` é feita e existem clientes cadastrados
- **THEN** o sistema responde `200 OK` com todos eles, cada um contendo `id`, `nome`, `email` e `dataCadastro`

#### Scenario: Listagem sem nenhum cliente

- **WHEN** todos os clientes foram removidos e uma requisição `GET /clientes` é feita
- **THEN** o sistema responde `200 OK` com uma coleção vazia

#### Scenario: Cliente removido não aparece na listagem

- **WHEN** um cliente é removido e a listagem é consultada em seguida
- **THEN** o cliente removido não está presente no resultado

### Requirement: Consulta de cliente por identificador

O sistema SHALL retornar `200 OK` com os dados do cliente em `GET /clientes/{id}` quando o identificador existir, e `404 Not Found` quando não existir.

#### Scenario: Cliente existente

- **WHEN** uma requisição `GET /clientes/{id}` usa o identificador de um cliente existente
- **THEN** o sistema responde `200 OK` com `id`, `nome`, `email` e `dataCadastro` desse cliente

#### Scenario: Cliente inexistente

- **WHEN** uma requisição `GET /clientes/{id}` usa um identificador que não corresponde a nenhum cliente
- **THEN** o sistema responde `404 Not Found`

### Requirement: Atualização de cliente

O sistema SHALL permitir atualizar o nome e o email de um cliente existente por `PUT /clientes/{id}`, respondendo `200 OK` com o cliente já atualizado.

O identificador e a data de cadastro NÃO SHALL ser alteráveis.

#### Scenario: Atualização bem-sucedida

- **WHEN** uma requisição `PUT /clientes/{id}` envia nome preenchido e email válido para um cliente existente
- **THEN** o sistema responde `200 OK` com os novos valores
- **AND** uma consulta posterior ao mesmo identificador reflete os valores atualizados

#### Scenario: Atualização de cliente inexistente

- **WHEN** uma requisição `PUT /clientes/{id}` usa um identificador que não corresponde a nenhum cliente
- **THEN** o sistema responde `404 Not Found`

#### Scenario: Atualização com dados inválidos

- **WHEN** uma requisição `PUT /clientes/{id}` para um cliente existente envia nome vazio ou email inválido
- **THEN** o sistema responde `400 Bad Request`
- **AND** os dados do cliente permanecem inalterados

#### Scenario: Identificador não é alterado pela atualização

- **WHEN** um cliente existente é atualizado com sucesso
- **THEN** o `id` retornado é o mesmo informado na URL

### Requirement: Remoção de cliente

O sistema SHALL remover o cliente indicado em `DELETE /clientes/{id}` e responder `204 No Content`, ou `404 Not Found` quando o identificador não existir.

#### Scenario: Remoção bem-sucedida

- **WHEN** uma requisição `DELETE /clientes/{id}` usa o identificador de um cliente existente
- **THEN** o sistema responde `204 No Content`
- **AND** uma consulta posterior ao mesmo identificador responde `404 Not Found`

#### Scenario: Remoção de cliente inexistente

- **WHEN** uma requisição `DELETE /clientes/{id}` usa um identificador que não corresponde a nenhum cliente
- **THEN** o sistema responde `404 Not Found`

#### Scenario: Remoção repetida

- **WHEN** um cliente é removido com sucesso e a mesma requisição de remoção é repetida
- **THEN** a segunda resposta é `404 Not Found`

### Requirement: Precedência entre condições de erro

Quando mais de uma condição de erro se aplicar à mesma requisição, o sistema MUST avaliá-las nesta ordem e responder com a primeira que falhar: validação de formato (`400`), existência do recurso (`404`), conflito de unicidade (`409`).

#### Scenario: Identificador inexistente com email duplicado

- **WHEN** uma requisição `PUT /clientes/{id}` usa um identificador inexistente **e** um email que já pertence a outro cliente
- **THEN** o sistema responde `404 Not Found`, não `409 Conflict`

#### Scenario: Dados inválidos com identificador inexistente

- **WHEN** uma requisição `PUT /clientes/{id}` usa um identificador inexistente **e** um email em formato inválido
- **THEN** o sistema responde `400 Bad Request`, não `404 Not Found`

### Requirement: Formato padronizado de erro

Toda resposta de erro `400`, `404` e `409` SHALL ter corpo no formato `ProblemDetails`, com `Content-Type` `application/problem+json` e o campo `status` coerente com o código HTTP da resposta.

#### Scenario: Corpo de erro de validação

- **WHEN** uma requisição é rejeitada com `400 Bad Request`
- **THEN** o corpo é um `ProblemDetails` cujo `status` é `400`
- **AND** os campos inválidos estão identificados no corpo

#### Scenario: Corpo de erro de conflito

- **WHEN** uma requisição é rejeitada com `409 Conflict` por email duplicado
- **THEN** o corpo é um `ProblemDetails` cujo `status` é `409`
- **AND** a mensagem indica que o email já está em uso

### Requirement: Clientes pré-cadastrados em base nova

O sistema SHALL entregar uma base de dados recém-criada já populada com exatamente três clientes, versionados junto ao schema, de modo que a API seja utilizável sem cadastro manual prévio.

Esses clientes MUST ter identificadores e datas de cadastro fixos e reproduzíveis — idênticos em qualquer máquina que crie a base do zero. Após a carga inicial, eles MUST se comportar como qualquer outro cliente, sem tratamento especial.

Os clientes iniciais são:

| Id | Nome | Email | Data de cadastro (UTC) |
| --- | --- | --- | --- |
| 1 | Ana Souza | `ana.souza@exemplo.com` | `2026-01-15T09:00:00Z` |
| 2 | Bruno Lima | `bruno.lima@exemplo.com` | `2026-02-20T14:30:00Z` |
| 3 | Carla Mendes | `carla.mendes@exemplo.com` | `2026-03-05T11:15:00Z` |

#### Scenario: Base nova já contém os três clientes

- **WHEN** a aplicação é iniciada sobre uma base de dados criada do zero e `GET /clientes` é consultado
- **THEN** o sistema responde `200 OK` com exatamente três clientes
- **AND** eles correspondem aos identificadores 1, 2 e 3 com os nomes, emails e datas de cadastro da tabela acima

#### Scenario: Datas de cadastro dos clientes iniciais são fixas

- **WHEN** a base é criada do zero em momentos ou máquinas diferentes
- **THEN** as datas de cadastro dos três clientes iniciais são sempre as mesmas, independentes do instante da criação da base

#### Scenario: Cliente criado após o seed recebe identificador seguinte

- **WHEN** um cliente é criado via `POST /clientes` sobre uma base recém-criada
- **THEN** ele recebe o identificador `4`

#### Scenario: Cliente inicial pode ser atualizado

- **WHEN** uma requisição `PUT /clientes/1` altera o nome do cliente inicial
- **THEN** o sistema responde `200 OK` com o nome atualizado

#### Scenario: Cliente inicial pode ser removido

- **WHEN** uma requisição `DELETE /clientes/2` é enviada
- **THEN** o sistema responde `204 No Content`
- **AND** a listagem passa a conter dois clientes

#### Scenario: Email de cliente inicial participa da regra de unicidade

- **WHEN** uma requisição `POST /clientes` tenta criar um cliente com o email `ana.souza@exemplo.com`
- **THEN** o sistema responde `409 Conflict`
