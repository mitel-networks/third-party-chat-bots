import { Activity, ActivityHandler, CloudAdapter, TurnContext } from 'botbuilder';
import axios from 'axios';
import { WebSocketDirectlineClient } from './ws-directline-client';
import { ConversationStore as RelayBotDirectlineStor, RelayBotData } from './relay-directline.interface';



/**
 * Will relay all messages to the remote bot via DirectLine REST API calls
 */
export class RelayBotAxios extends ActivityHandler {
    // REST API for Direct Line 3.0
    // https://learn.microsoft.com/en-us/azure/bot-service/rest-api/bot-framework-rest-direct-line-3-0-start-conversation?view=azure-bot-service-4.0

    /**
     * 
     * @param adapter 
     * @param conversations 
     * @param remoteBotSecret 
     * @param onClose called when the directline connection is closed
     */
    constructor(
        private adapter: CloudAdapter, 
        private conversations: RelayBotDirectlineStor, 
        private remoteBotSecret: string,
        private onClose?: (connectionId: string) => void) {
        super();
        if (!remoteBotSecret) {
            throw new Error('RelayBotAxios() remoteBotSecret is required');
        }
        if (!conversations) {
            throw new Error('RelayBotAxios() conversations is required');
        }
        // listen for messages from our client
        this.onMessage(async (context, next) => {
            const clientId = context.activity.conversation.id;
            let conversation = await this.conversations.get(clientId)
            if (conversation) {
                this.sendToBot(conversation.token, conversation.directlineConversationId, context.activity)
                    .catch(error => console.log(`RelayBotAxios.onMessage sendActivity error ${error} conv=${clientId}`));
            } else {
                conversation = await this.createConversation(context.activity); // also starts directline conversation
                this.sendToBot(conversation.token, conversation.directlineConversationId, context.activity)
                    .catch(error => console.log(`RelayBotAxios.onMessage createConversation error ${error} conv=${clientId}`));
            }
            await next();
        });
    }

    private async generateToken(): Promise<string> {
        const response = await axios.post('https://directline.botframework.com/v3/directline/tokens/generate', {}, {
            headers: { 'Authorization': `Bearer ${process.env.REMOTE_BOT_DIRECT_LINE_SECRET}` }
        });

        return response.data.token;
    }

    /**
     * 
     * @param token Note that the auth token is unique per conversation ID
     * @param directlineConversationId 
     * @param activity 
     */
    private async sendToBot(token: string, directlineConversationId: string, activity) {
        axios.post(`https://directline.botframework.com/v3/directline/conversations/${directlineConversationId}/activities`, activity, {
                headers: { 'Authorization': `Bearer ${token}` }
        }).catch(async error => {
            if (error.response && error.response.status === 401) {
                // Refresh the token
                this.generateToken().then( token => {
                    // Retry the request with the new token
                    axios.post(`https://directline.botframework.com/v3/directline/conversations/${directlineConversationId}/activities`, activity, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }).then(response => this.updateConversation(activity, { token: token }));
                });
            } else {
                // here with 403 if conversation is stale
                console.error('RelayBotAxios sendActivity() error:', error);
            }
        });
        // console.log(`RelayBotAxios Sent activity:`, { status: response.status, data: response.data });
    }

    private async startConversation() {
        const response = await axios.post(`https://directline.botframework.com/v3/directline/conversations`, {}, {
            headers: { 'Authorization': `Bearer ${this.remoteBotSecret}` }
        });
        // console.log(`startConversation:`, { status: response.status, data: response.data });
        if (response.status !== 201) {
            throw new Error(`Failed to start conversation: ${response.statusText}`);
        }
        
        const wsClient = new WebSocketDirectlineClient(
            this.adapter,
            this.conversations,
            response.data.streamUrl,
            () => {},   // onOpen
            () => {
                // onClose
                this.deleteConversation(response.data.conversationId);
                this.onClose && this.onClose(response.data.conversationId);
            },
            (error) => console.log(`WebSocket error directlineConvId=${response.data.conversationId}`, error),
        );
        wsClient.connect();
        
        // token is unique for each conversation
        return { id: response.data.conversationId, token: response.data.token };
    }

    private getConversation(id: string): Promise<RelayBotData> {
        return this.conversations.get(id);
    }
    private async createConversation(activity: Activity) {      
        const conversationReference = TurnContext.getConversationReference(activity);
        const {id, token} = await this.startConversation();
        const cfg: RelayBotData = {
            clientConversationId: activity.conversation.id,
            directlineConversationId: id,
            conversationReference: conversationReference,
            token: token
        }
        this.conversations.set(activity.conversation.id, cfg);
        this.conversations.set(id, cfg);
        return cfg;
    }
    private async updateConversation(activity: Activity, data: Partial<RelayBotData>) {    
        const cfg = await this.getConversation(activity.conversation.id);
        if (!cfg) {
            throw new Error(`RleayBotAxios: updateConversation() conversation not found ${activity.conversation.id}`);
        }
        this.conversations.set(activity.conversation.id, {...cfg, ...data});
        this.conversations.set(data.directlineConversationId, {...cfg, ...data});
    }  
    private async deleteConversation(id: string) {
        const cfg = await this.getConversation(id);
        if (cfg) {
            this.conversations.delete(cfg.directlineConversationId);
            this.conversations.delete(cfg.clientConversationId);
        } else {
            console.error(`RelayBotAxios.deleteConversation() conversation not found ${id}`);
        }
    }

}