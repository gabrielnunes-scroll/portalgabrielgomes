# Instrução para o AI Studio

Importe este projeto completo e preserve a interface Studio Edition e os fluxos existentes. Este pacote já possui frontend React/Vite, servidor Node, autenticação Firebase, Firestore, armazenamento privado, importação e avisos via Resend. Não substitua por demo ou dados mockados.

Comece lendo README.md e config.example. Execute `npm ci`, `npm run check`, `npm test` e `npm run build`. O deploy usa `npm start` e a variável PORT; Dockerfile incluído para Cloud Run. Não precisa de chave Gemini para funcionar.

Configure Firebase Authentication (Google e e-mail/senha), Firestore e Storage. Aplique as regras privadas e as permissões da conta de serviço. Configure o UID Firebase verificado do administrador Gabriel, sem usar primeiro cadastro como administrador. Defina o endereço temporário em PORTAL_URL e autorize esse domínio no Firebase. Nunca aceite headers ChatGPT como identidade nem exponha chaves administrativas.

Solicite o backup privado separado exportado do Portal anterior. Não o publique no frontend. Use o script de importação com notificações desligadas, preservando IDs e referências, e confira todos os dados e anexos. Login de clientes usa e-mail verificado autorizado no respectivo projeto.

Configure um remetente Resend autorizado, seus segredos no servidor e Cloud Scheduler para processar a fila. Só ative NOTIFICATIONS_ENABLED após testar um cliente de teste. Avisos devem continuar sem detalhes privados, com checagem de acesso e preferência antes de enviar, fila transacional e idempotência. Não marcar e-mails como entregues só porque o provedor aceitou.

Valide o servidor no Cloud Run com administrador, cliente e usuário sem permissão, recuperação de senha, financeiro, aprovação, arquivos, agenda, encerramento, arquivamento/restauração e exclusão. Faça QA no desktop e mobile. Relate separadamente configurações externas pendentes. Preserve o Portal anterior até validar a nova versão; a migração não está concluída apenas porque o código compilou.
