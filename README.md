# Metascaloricas

Crie um aplicativo web responsivo (mobile-first) em português do Brasil para contagem de calorias, chamado "NutriTrack" (pode sugerir outro nome).



1. Login com Google

Tela inicial com o botão "Entrar com Google".



Configure a autenticação via Supabase Auth com o provedor Google (OAuth). Me guie passo a passo para ativar o provedor Google no Supabase e criar as credenciais no Google Cloud Console (Client ID e Secret).



Após o login, salve o perfil do usuário (nome, e-mail, foto) no banco.



2. Onboarding (primeiro acesso)

Peça ao usuário:



Dados básicos: sexo, idade, altura, peso atual e nível de atividade física.



Objetivo, com 3 opções em cards grandes: Perder peso, Manter peso ou Aumentar peso (ganhar massa).



País: detecte automaticamente pelo idioma/localização do navegador e peça confirmação, com opção de alterar manualmente.



Calcule a meta diária de calorias (fórmula Mifflin-St Jeor + fator de atividade): déficit de ~500 kcal para perder, manutenção para manter e superávit de ~300 a 500 kcal para ganhar. Mostre também a meta de macros (proteína, carboidrato e gordura).



Permita editar objetivo e dados a qualquer momento no perfil.



3. Busca de alimentos com imagem

Barra de pesquisa fixa no topo da tela principal, com busca em tempo real (debounce).



Use a API Open Food Facts (gratuita, base global com milhões de alimentos e fotos). Como complemento para alimentos genéricos/naturais, use a USDA FoodData Central.



Cada resultado deve mostrar: foto do alimento (com imagem placeholder se não houver), nome, marca e calorias por 100 g.



Ao tocar no alimento, abra uma tela de detalhes com calorias, proteínas, carboidratos e gorduras, seletor de quantidade (g/porção) e botão "Adicionar à refeição" (Café da manhã, Almoço, Jantar, Lanche).



Chame as APIs por uma Edge Function do Supabase para proteger chaves, se necessário.



4. Diário e painel

Tela inicial com: gráfico circular de calorias consumidas vs meta, barras de macros, lista das refeições do dia (com foto dos alimentos) e navegação entre datas.



Opção de editar ou remover itens.



Tela de progresso com gráfico semanal/mensal de calorias e registro de peso.



5. Recomendações de refeições por país

Aba "Sugestões" com refeições típicas e saudáveis do país do usuário, filtradas pelo objetivo (perder, manter ou ganhar peso) e pela meta calórica.



Use uma API de receitas (como Spoonacular ou TheMealDB) ou gere as sugestões com IA, mostrando foto, nome do prato, calorias e macros.



Botão "Adicionar ao diário" em cada sugestão.



6. Banco de dados (Supabase)

Tabelas com RLS ativado (cada usuário acessa só seus dados): profiles, goals, food_logs (alimento, quantidade, calorias, macros, refeição, data) e weight_logs.



7. Design

Visual moderno, limpo e saudável: tons de verde, cantos arredondados, cards com fotos grandes.



Barra de navegação inferior: Diário, Buscar, Sugestões, Progresso, Perfil.



Suporte a modo escuro, estados de carregamento e mensagens de erro amigáveis.



Comece pela estrutura completa e pelo login com Google, depois implemente as demais funcionalidades em ordem.



Quero que seja compatível para instalar em Android e IOS. Depois do aplicativo for feito, eu quero todos os códigos que foram feitos deste aplicativo para eu inserir no vs code e testar por lá também

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://metascaloricas.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c3efac6e-726f-4c68-82e5-9b9fabc9bae3).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
