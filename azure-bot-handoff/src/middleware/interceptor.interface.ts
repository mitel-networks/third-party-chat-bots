import { ConversationReference } from "botbuilder";

export enum InterceptorState {
    bot,
    queued,
    agent
}

export interface InterceptorConversation {
    state: InterceptorState,
    conversationReference: Partial<ConversationReference>
}

export interface InterceptorStor {
    set(id: string, conversation: InterceptorConversation): Promise<InterceptorConversation>;
    get(id: string): Promise<InterceptorConversation | undefined>;
}