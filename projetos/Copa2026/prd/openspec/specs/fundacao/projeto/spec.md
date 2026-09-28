## Purpose

Configura e estabelece o projeto Blazor Web App (.NET 10) como base da aplicação PortalCopa26, definindo a estrutura de pastas e as dependências necessárias para todas as funcionalidades futuras.

## Requirements

### Requirement: Projeto Blazor Web App criado com .NET 10
A solução PortalCopa26 SHALL conter um único projeto Blazor Web App targeting .NET 10, com modo de renderização interativo configurado.

#### Scenario: Projeto inicializa sem erros
- **WHEN** o comando `dotnet run` é executado na raiz do projeto
- **THEN** a aplicação inicia sem erros de compilação e exibe a página padrão no navegador

### Requirement: Estrutura de pastas estabelecida
O projeto SHALL conter as pastas base: `Components/Pages`, `Models`, `Services`, `Data`, organizadas de forma a permitir futura migração para arquitetura em camadas.

#### Scenario: Estrutura de pastas presente
- **WHEN** o projeto é criado
- **THEN** as pastas `Components/Pages`, `Models`, `Services` e `Data` existem na raiz do projeto

### Requirement: Dependências NuGet configuradas
O projeto SHALL referenciar `Microsoft.EntityFrameworkCore.Sqlite` e `Microsoft.EntityFrameworkCore.Tools` com versões compatíveis com .NET 10.

#### Scenario: Pacotes NuGet restaurados com sucesso
- **WHEN** `dotnet restore` é executado
- **THEN** todos os pacotes são restaurados sem conflitos de versão

### Requirement: Bootstrap 5 disponível para uso na interface
O projeto SHALL incluir Bootstrap 5 via referência no layout principal para uso em todos os componentes de interface.

#### Scenario: Bootstrap 5 carregado na aplicação
- **WHEN** qualquer página da aplicação é carregada no navegador
- **THEN** os estilos e scripts do Bootstrap 5 estão disponíveis e funcionais
