# Hub de Monitoramento

Aplicação de gestão de clientes solares desenvolvida com Electron, React e Firebase.

## Configuração do Ambiente

### Pré-requisitos
- Node.js (versão 16.x ou superior)
- npm (versão 8.x ou superior)

### Instalação

1. Clone o repositório:
```
git clone [URL_DO_REPOSITORIO]
cd hub_monitoramento
```

2. Instale as dependências:
```
npm install
```

3. Construa os arquivos CSS:
```
npm run build-css
```

## Desenvolvimento

Para iniciar a aplicação em modo de desenvolvimento:
```
npm start
```

Para compilar o CSS automaticamente quando houver mudanças:
```
npm run watch-css
```

## Produção

Para gerar o executável para Windows:
```
npm run build-win
```

## Problemas Comuns e Soluções

### Erro de Tailwind CSS
Se estiver vendo avisos do Tailwind CSS sobre não usar em produção:
1. Execute `npm run build-css` para gerar o arquivo CSS compilado
2. Substitua a importação do CDN no index.html pela importação do arquivo local

### Erro com Babel
Se ocorrerem problemas com a transformação do código React:
1. Verifique se a sintaxe JSX está correta
2. Confirme se as dependências do Babel estão instaladas corretamente

### Problema de Conexão com Firebase
Se houver problemas de conexão com o Firebase:
1. Verifique a configuração do firebaseConfig no index.html
2. Certifique-se de que as regras de segurança do Firebase permitem acesso aos dados
