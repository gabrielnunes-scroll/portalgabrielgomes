import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Gabriel Gomes — Studio Edition',description:'Client Portal e gestão de projetos de comunicação estratégica.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>;}
