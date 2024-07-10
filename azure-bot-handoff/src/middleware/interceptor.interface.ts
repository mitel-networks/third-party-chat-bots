import { ConversationReference } from "botbuilder";

export enum InterceptorState {
    bot,        // messages flow to the bot
    queued,     // awaiting a human agent
    agent       // messages flow to human agent 
}

export interface InterceptorConversation {
    state: InterceptorState,
    conversationReference: Partial<ConversationReference>
}

export interface InterceptorStor {
    set(id: string, conversation: InterceptorConversation): Promise<InterceptorConversation>;
    get(id: string): Promise<InterceptorConversation | undefined>;
}