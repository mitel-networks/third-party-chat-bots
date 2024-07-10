import { ConversationReference } from "botbuilder";

export interface RelayBotData {
    conversationReference: Partial<ConversationReference>, // client conversation
    clientConversationId?: string,
    directlineConversationId?: string,
    token?: string,
}
export interface ConversationStore {
    set(id: string, data: RelayBotData): Promise<RelayBotData>;
    get(id: string): Promise<RelayBotData | undefined>;
    delete(id: string): Promise<void>;
}
