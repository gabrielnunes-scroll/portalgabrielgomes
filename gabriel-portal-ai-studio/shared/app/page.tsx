import { requireChatGPTUser } from './chatgpt-auth';
import PortalApp from './portal-app';
export const dynamic='force-dynamic';
export default async function Page(){await requireChatGPTUser('/');return <PortalApp/>;}
