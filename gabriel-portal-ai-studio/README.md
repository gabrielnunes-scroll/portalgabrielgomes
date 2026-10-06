# Portal independente — Gabriel Gomes

Este é o pacote para importar no Google AI Studio. Aplicação React/Vite com servidor Node, Firebase Authentication, Firestore e armazenamento privado do Firebase/Google Cloud. Preserva os fluxos do Portal Studio Edition. Não depende de login ChatGPT, D1, R2 ou Sites em produção.

## Comece aqui

1. Importe o conteúdo inteiro deste pacote. Leia `AI-STUDIO.md`.
2. Instale Node >=22.13 e execute `npm ci`.
3. Execute `npm run check`, `npm test` e `npm run build`.
4. Copie `config.example` para `.env` apenas localmente; no Cloud Run configure variáveis e segredos.
5. Configure os serviços abaixo. Execute `npm start`. O servidor escuta `PORT` (8080 por padrão).

O código foi compilado e testado com armazenamento simulado e os fluxos reais das rotas. Login real, importação real, recebimento de e-mails e QA visual de desktop/mobile dependem de configurar e validar os serviços do destino. Não há credenciais nem dados privados neste pacote. Não é uma promessa de publicação sem configuração.

## Configuração externa necessária

- Firebase: habilite **Google** e **E-mail/senha** em Authentication; autorize o endereço temporário e, futuramente, o domínio próprio. Configure os templates de confirmação e recuperação em português. Habilite proteção contra enumeração de e-mails e política de senha de pelo menos 8 caracteres.
- Crie um usuário administrador no Firebase e confirme seu e-mail. Consulte o **UID**, configure `FIREBASE_OWNER_UID` e confira que corresponde a Gabriel. Nenhum visitante pode se tornar administrador por ser o primeiro a entrar. O e-mail atual é `gabrielgomes.strategy@gmail.com`; o UID ChatGPT antigo não deve ser reutilizado como UID Firebase.
- Configure `FIREBASE_PROJECT_ID`, `FIREBASE_WEB_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_APP_ID` e `FIREBASE_STORAGE_BUCKET`. A configuração Web é pública; não é a chave administrativa.
- Firestore em modo Native e bucket privado: aplique `firestore.rules` e `storage.rules` (acesso direto de clientes negado; o servidor usa Admin SDK). A conta de serviço do Cloud Run deve ter acesso ao Firestore, ao bucket e à verificação de usuários do Firebase. Use Application Default Credentials; jamais entregue JSON administrativo no frontend ou no ZIP.
- `PORTAL_URL`: endereço público HTTPS do Cloud Run/AI Studio; para teste local, `http://localhost:8080`. Atualize ao mudar de endereço.
- Resend: configure e verifique o domínio/remetente, `MAIL_FROM` e `RESEND_API_KEY` no servidor. Gere um segredo longo para `MAIL_JOB_TOKEN` (por exemplo `openssl rand -hex 32`). A conta remetente não é a caixa Gmail de Gabriel. O domínio pode ser exclusivamente para envio; não precisa aguardar o domínio próprio do Portal.
- Mantenha `NOTIFICATIONS_ENABLED=false` até concluir importação e testes. Depois defina `true`.
- Cloud Scheduler: configure POST a cada minuto para `https://ENDERECO/api/notifications/process`, com o header `Authorization: Bearer MAIL_JOB_TOKEN`. Esse token só processa a fila; não dá acesso ao Portal. Não use esse segredo no navegador. O agendador é necessário para envio automático e novas tentativas, inclusive sem ninguém abrir o Portal.
- Use Secret Manager para a chave Resend e o token do agendador. As variáveis públicas do Firebase são lidas de `/api/config` em execução; não há segredo no bundle do navegador.

## Login e recuperação de senha

A tela oferece Google, e-mail/senha, criação de acesso, confirmação de e-mail e “Esqueci minha senha”. O Firebase envia os links de confirmação e recuperação. Contas Google recuperam o acesso no Google; não possuem automaticamente uma senha própria do Portal. Uma conta criada não libera nenhum projeto: o e-mail verificado precisa estar autorizado nos registros `member`.

O navegador envia ID tokens Firebase nas chamadas de API. O servidor valida assinatura, emissor, revogação e e-mail verificado, sem confiar em headers ChatGPT ou e-mail informado livremente. O token é renovado pelo SDK. Logout encerra a sessão do navegador. Não guardamos senhas no banco do Portal.

## Migrar dados e anexos

1. No Portal atual, abra Configurações → **Baixar dados e anexos**. Evite mudanças enquanto exporta.
2. Guarde o ZIP e extraia em uma pasta privada usando um extrator de confiança. Não publique esse backup como ativo do site.
3. Com o Firebase vazio, administrador configurado/verificado e notificações desligadas:

```sh
npm run import:backup -- /pasta-extraida/dados.json
```

O script valida IDs, referências, arquivos e o usuário administrador antes de escrever; preserva IDs, histórico e chaves dos arquivos. A importação tem marcador de progresso e bloqueia o Portal durante a transferência. Pode ser retomada com o mesmo backup após uma falha; não mistura backups diferentes e não sobrescreve um destino previamente usado. A retomada deve acontecer antes de liberar alterações aos usuários. Conferir dados e arquivos no destino antes de trocar o endereço usado pelos clientes. Senhas não são migradas: usuários entram com Google ou criam acesso no Firebase com o mesmo e-mail.

A configuração independente preserva o cadastro do proprietário e aliases antigos no histórico, mas autoriza o administrador exclusivamente pelo UID configurado. O backup do Portal permanece disponível depois da migração.

## E-mails automáticos

Quando uma mudança visível ao cliente é gravada, a mesma transação cria a fila de envio. Cobertura: entregas publicadas, atualizações publicadas, solicitações, etapas, documentos publicados, reuniões publicadas, cobranças, recebimentos, alterações visíveis de escopo/status e entrega final. Mudanças agrupadas na mesma transação geram um aviso por projeto e destinatário. Não há e-mail de rascunhos, notas internas, CRM, tarefas internas, arquivamento ou exclusão; não enviamos lembretes por vencimento nesta versão.

O destinatário é o e-mail `member` autorizado no projeto, usado também no login. Duplicatas são consolidadas. Antes de enviar, o processador verifica novamente acesso, preferência e projeto. Contatos revogados ou com avisos desligados não recebem pendências. O Admin pode ajustar a preferência no cadastro; o cliente pode usar **Avisos por e-mail** para desligar/ligar seus avisos. Projetos arquivados não geram envios.

O aviso é discreto: informa que há novidades e traz o link protegido do Portal. Não inclui textos do projeto, notas, valores ou anexos. O Admin vê fila e estados, e pode processá-la manualmente. “Aceito pelo provedor” não comprova entrega na caixa de entrada; verificar spam e o painel Resend.

Fila persistente, lease de processamento, chave de idempotência e até cinco tentativas com intervalo crescente. A chave evita duplicatas durante a janela do provedor; jobs com mais de 20 horas ou resultado incerto após o limite ficam para conferência manual, sem reenvio automático fora da janela. Falhas HTTP permanentes são registradas. Para reenvio de uma pendência `needs_review`, conferir primeiro no provedor e tratar manualmente; a interface não faz reenvio inseguro. Alterar `MAIL_FROM` ou `PORTAL_URL` com envios em processamento exige interromper a fila e conferir pendências.

## Persistência e limites

A ponte `server/database.ts` implementa somente as consultas usadas pelo Portal sobre Firestore, com transações reais; SQL não reconhecido falha. Não é banco SQLite em memória/disco do Cloud Run. Arquivos ficam no bucket privado e são baixados após autorização pela API. Arquivos públicos do build ficam no container.

Como a V1 original, as consultas do Portal leem os registros da operação inteira antes da filtragem no servidor; adequado a uma operação pequena, com custo proporcional ao volume. Transações acima de 450 gravações são recusadas integralmente para preservar atomicidade. Para projetos com centenas de registros, ampliar o fluxo de exclusão com job paginado antes de excluir; nunca dividir uma exclusão financeira em transações silenciosas. Há proteção contra gravações com snapshot desatualizado de outra sessão, com solicitação de atualização.

## Validação final no destino

Testar administrador, cliente de cada projeto e conta sem autorização; Google e e-mail/senha; confirmação, recuperação e troca de contas; notas e arquivos privados; importação e backup; aprovação, financeiro, agenda, finalização, arquivar/restaurar e dupla confirmação de exclusão. Depois ativar o remetente e agendador, testar publicação → aviso para um cliente de teste, preferência desligada, acesso revogado e falha do provedor. Conferir desktop e celular. Não enviar os primeiros avisos para clientes reais antes dessa validação.

As configurações de Firebase, Cloud Run, Scheduler e Resend podem exigir faturamento, permissões e verificações de conta. O endereço temporário do AI Studio/Cloud Run é suficiente para começar; um domínio próprio poderá ser conectado depois.

## Financeiro mensal e estornos

Inclui filtro de mês/ano, visão de todo o período, gráfico de movimentação de caixa, ranking de modalidades por projetos/receita e previsão clicável de seis meses. O lucro registrado usa recebimentos menos estornos menos despesas cadastradas; não considera custos fora do Portal. Serviços são contados pelo projeto criado no período (cada novo projeto conta uma contratação, incluindo ciclos recorrentes). A previsão usa saldo atual por vencimento, não um snapshot histórico.

`/api/finance` registra cancelamento e estorno total/parcial após revisão. Cancelar não devolve dinheiro; apenas remove o saldo aberto. Estornar registra devolução já realizada ou correção de recebimento, preserva o registro original e pode cancelar o saldo remanescente. Sem cancelar a cobrança, o estorno volta ao saldo a pagar. Estornos são históricos imutáveis; limite por recebimento, guarda transacional e idempotência impedem duplicidade/excesso. A migração deve manter registros `refund`, campos de cancelamento e despesas gerais com `project: null`.

Cancelamentos e estornos visíveis ao cliente também criam avisos na fila quando o serviço de e-mail estiver ativado. O cliente consulta pagamentos/devoluções dos seus projetos; despesas e lucro da operação ficam exclusivos do administrador.
