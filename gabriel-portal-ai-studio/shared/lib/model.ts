export type Kind = 'client'|'lead'|'project'|'task'|'action'|'stage'|'delivery'|'comment'|'approval'|'document'|'meeting'|'charge'|'receipt'|'refund'|'expense'|'update'|'member'|'activity';
export type Item = {id:string;kind:Kind;project:string|null;created:string;data:Record<string,any>};
export const kinds:Kind[]=['client','lead','project','task','action','stage','delivery','comment','approval','document','meeting','charge','receipt','refund','expense','update','member','activity'];
export const pipeline=['Novo lead','Discovery agendada','Discovery realizada','Qualificação / Escopo','Proposta enviada','Negociação','Ganho','Perdido'];
export function pipelineStage(stage:string){if(['Contrato','Entrada'].includes(stage))return 'Negociação';if(stage==='Fechado')return 'Ganho';if(['Diagnóstico Comercial Concluído','Qualificação / Escopo Concluído'].includes(stage))return 'Qualificação / Escopo';return stage||'Novo lead';}
export const pipelineLabel=(stage:string)=>pipelineStage(stage)==='Ganho'?'Fechado':pipelineStage(stage);
export const tabs=['Resumo','Plano e tarefas','Entregáveis','Documentos','Reuniões','Financeiro','Entrega final','Acesso'];
export const clientTabs=['Visão geral','Etapas','Entregáveis','Documentos','Reuniões','Pagamentos','Entrega final'];
export const money=(v:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format((v||0)/100);
export const date=(v:string)=>v?new Date(v.length===10?v+'T12:00:00':v).toLocaleDateString('pt-BR'):'Sem data';
export const isPublished=(r:Item)=>r.data.visibility==='published';
export function stripInternal(r:Item):Item { const keys=r.kind==='project'?['notes','client','lead']:r.kind==='meeting'?['notes']:[]; return {...r,data:Object.fromEntries(Object.entries(r.data).filter(([k])=>!keys.includes(k)))}; } 
export function clientSafe(items:Item[], projects:Set<string>){return items.filter(r=>r.kind==='project'?projects.has(r.id):!!r.project&&projects.has(r.project)&&(['stage','action','charge','receipt','refund','approval'].includes(r.kind)||(['delivery','document','meeting','update'].includes(r.kind)&&isPublished(r))||(r.kind==='comment'&&items.some(d=>d.id===r.data.delivery&&isPublished(d))))).map(stripInternal);}
