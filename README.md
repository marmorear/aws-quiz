# Simulador de Quiz de Certificação AWS

Esta é uma aplicação web interativa para simulação de exames de certificação AWS, focada nas certificações de Associate, Foundations e AI Practitioner.

## Funcionalidades

*   Seleção entre 4 certificações AWS (Solutions Architect - Associate, Developer - Associate, Cloud Practitioner - Foundations, AI Practitioner).
*   Banco de 60 questões variadas por certificação.
*   Feedback imediato após cada resposta.
*   Cálculo e exibição da pontuação final.
*   Análise de desempenho por domínio.
*   Sugestão de tópicos para estudo com base nos erros.
*   Persistência do histórico de tentativas e ciclo de questões para evitar repetições imediatas.
*   Timer para o quiz (1 hora).
*   Modo de revisão de respostas.

## Como Executar Localmente

1.  Clone este repositório (ou tenha os arquivos em uma pasta local).
2.  Abra o arquivo `index.html` diretamente em seu navegador web.

A aplicação utiliza módulos ES6 e CDNs para React e Tailwind CSS, portanto, não requer um passo de build complexo para execução local básica.

## Estrutura dos Arquivos

*   `index.html`: Arquivo HTML principal.
*   `index.tsx`: Ponto de entrada da aplicação React.
*   `App.tsx`: Componente principal da aplicação.
*   `types.ts`: Definições de tipos TypeScript.
*   `data/sampleQuestions.ts`: Banco de questões estáticas.
*   `components/`: Contém os componentes React reutilizáveis (CertificationSelector, QuizView, QuestionCard, ScoreScreen, Timer, icons).
*   `services/geminiService.ts`: (Atualmente vazio) Previsto para integração com API Gemini.
*   `metadata.json`: Metadados da aplicação.
*   `README.md`: Este arquivo.

Divirta-se estudando!

---

## Aviso Legal (Disclaimer)
Este é um projeto não oficial, criado para fins de estudo e aprendizado sobre os serviços da Amazon Web Services (AWS). Este projeto não é afiliado, endossado ou patrocinado pela AWS.
As perguntas contidas neste quiz foram criadas de forma independente e não são representações de perguntas reais dos exames de certificação da AWS.
"AWS" e o logotipo da AWS são marcas registradas da Amazon.com, Inc. ou de suas afiliadas.