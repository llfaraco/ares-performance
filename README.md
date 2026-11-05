# ARES Performance | Registro de treinos e métricas

**Projeto de aplicação web · React · Vite · Supabase**

## Proposta

Reunir informações de treino e evolução em uma interface de acompanhamento pessoal. O projeto explora a relação entre produto, registros de atividade e leitura de métricas.

## O que aparece no código

- Interface React em `src/App.jsx`.
- Camada de acesso ao Supabase em `src/supabase.js`.
- Hook `src/useAresData.js` para carregar e salvar perfil, sessões e métricas.
- Integração com tabelas `profiles`, `workout_logs` e `metrics`.
- Manifesto e service worker em `public/`.

Esses itens descrevem a implementação encontrada. Autenticação, persistência, experiência mobile e instalação como PWA não foram validadas nesta revisão.

## Desenvolvimento local

```bash
git clone https://github.com/llfaraco/ares-performance.git
cd ares-performance
npm ci
npm run dev
```

A integração espera as variáveis:

```dotenv
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_KEY=SUA_CHAVE_PUBLICA_DE_CLIENTE
```

Use uma configuração local própria. A chave usada no frontend deve ser publicável; nunca use uma chave administrativa ou `service_role`. As tabelas e políticas de acesso precisam ser configuradas no Supabase. O repositório não contém migrações SQL na estrutura revisada.

## Comandos disponíveis

```bash
npm run build
npm run lint
npm run preview
```

Não há declaração de que esses comandos passaram nesta revisão documental.

## Organização

| Caminho | Responsabilidade |
| --- | --- |
| `src/App.jsx` | Interface e fluxos da aplicação |
| `src/useAresData.js` | Leitura e gravação de registros |
| `src/supabase.js` | Inicialização do cliente |
| `public/` | Recursos estáticos, manifesto e service worker |

## Evolução

Documentar o esquema e as políticas de acesso, validar autenticação e persistência, testar os fluxos principais e verificar os recursos de PWA em dispositivos reais.

Este é um projeto de software, sem alegação de validação clínica ou de resultados esportivos.

## Contato

[Lucas Faraco](https://www.linkedin.com/in/lucasrfaraco) · [E-mail](mailto:lucas.rfaraco@gmail.com) · [Perfil e portfólio](https://github.com/llfaraco)
