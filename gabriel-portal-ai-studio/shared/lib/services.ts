export const services=['Communication Audit','Communication Project','Communication Implementation','Communication Optimization'];
export const recommendedPaths=[...services,'Não avançar'];
export const integrationLevels=['Project-based','Recurring / Embedded'];
export const integrationLabels:Record<string,string>={'Project-based':'Projeto com escopo definido','Recurring / Embedded':'Acompanhamento recorrente'};
export function integrationLabel(value:string){return integrationLabels[value]||value;}
export function integrationFor(service:string){return service==='Communication Optimization'?'Recurring / Embedded':'Project-based';}
export const serviceDescriptions:Record<string,string>={
 'Communication Audit':'Entenda o que precisa mudar. Diagnóstico e direção estratégica, com implementação contratada separadamente quando necessária.',
 'Communication Project':'Da clareza à implementação. Uma contratação e um projeto integrado de diagnóstico, direção estratégica e implementação, com escopo personalizado.',
 'Communication Implementation':'Transforme estratégia em comunicação. Execução apoiada em uma base estratégica já validada.',
 'Communication Optimization':'Evolua com base em evidências. Acompanhamento recorrente da comunicação já em funcionamento.'
};
export const integrationDescriptions:Record<string,string>={
 'Project-based':'Projeto fechado com transformação e entregáveis definidos. Reuniões pontuais podem fazer parte do escopo; participação recorrente na operação, gestão de fornecedores e disponibilidade contínua exigem uma contratação recorrente ou escopo adicional.',
 'Recurring / Embedded':'Acompanhamento e disponibilidade recorrentes, conforme frequência, responsabilidades e limites definidos no escopo.'
};
export const qualificationFields=['communicationProblem','investigationNeeded','implementWithUs','implementationPredictable','operationalCapacity','strategyValidated','runningCommunication','needsRecurring','recommendedPath','qualificationNotes','qualificationDone'];
export function recommendPath(d:Record<string,any>){
 if(d.communicationProblem==='Não')return 'Não avançar';
 if(d.communicationProblem!=='Sim')return '';
 if(d.investigationNeeded==='Sim'){
  if(d.implementWithUs==='Sim'&&d.implementationPredictable==='Sim'&&d.operationalCapacity==='Sim')return 'Communication Project';
  if(d.implementWithUs==='Não'||d.implementationPredictable==='Não'||d.operationalCapacity==='Não')return 'Communication Audit';
  return '';
 }
 if(d.strategyValidated==='Sim'&&d.runningCommunication==='Sim'&&d.needsRecurring==='Sim')return 'Communication Optimization';
 if(d.investigationNeeded==='Não'&&d.strategyValidated==='Sim'&&d.implementWithUs==='Sim'&&d.needsRecurring==='Não')return 'Communication Implementation';
 return '';
}
export function commercialFitGaps(d:Record<string,any>){const gaps:string[]=[];
 if(d.recommendedPath==='Não avançar'||d.communicationProblem==='Não')gaps.push('A qualificação indica não avançar. Revise o enquadramento antes de contratar.');
 if(d.service==='Communication Implementation'&&(d.investigationNeeded==='Sim'||d.strategyValidated==='Não'||(d.commercialVersion>=2&&(d.strategyValidated!=='Sim'||d.investigationNeeded!=='Não'))))gaps.push('Implementation exige uma base estratégica validada. Avalie Audit ou Communication Project.');
 if(d.service==='Communication Project'){
  if(!d.strategicScope?.trim()||!d.implementationScope?.trim())gaps.push('Defina as macrofases estratégica e de implementação na Proposta.');
  if(d.investigationNeeded!=='Sim'||d.implementWithUs!=='Sim'||d.implementationPredictable!=='Sim'||d.operationalCapacity!=='Sim')gaps.push('Confirme na qualificação a investigação, a intenção de implementar conosco, a previsibilidade e a capacidade operacional.');
 }
 return gaps;
}
