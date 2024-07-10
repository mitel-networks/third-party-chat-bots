import WebSocket from "ws";
import { ConversationStore as RelayBotDirectlineStor } from './relay-directline.interface';
import { CloudAdapter } from "botbuilder";
import { Util } from "../middleware/util";


export class WebSocketDirectlineClient {
    private ws: WebSocket | null = null;
    private readonly url: string;

    constructor(
        private adapter: CloudAdapter,
        private conversations: RelayBotDirectlineStor,
        url: string,
        private onOpen: () => void,
        private onClose: () => void,
        private onError: (Error) => void,
    ) {
        this.url = url;
    }

    public connect(): void {
        this.ws = new WebSocket(this.url);

        this.ws.on("open", this.onOpen.bind(this));
        this.ws.on("message", this.onMessage.bind(this));
        this.ws.on("close", this.onClose.bind(this));
        this.ws.on("error", this.onError.bind(this));
    }

    public send(message: string): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(message);
        } else {
            console.error("WebSocketDirectlineClient WebSocket is not open. Message not sent.");
        }
    }

    public disconnect(): void {
        if (this.ws) {
            this.ws.close();
        }
    }

    private onMessage(data: WebSocket.Data): void {
        const str = data.toString();
        // console.log("Received:", str);
        if (str === '') {
            // looks like some sort of keepalive
            return;
        }
        let parsed;
        try {
            parsed = JSON.parse(str);
        } catch (error) {
            console.log("WebSocketDirectlineClient.onMessage Error parsing", error);
        }
        // Handle incoming messages here
        let i = 0;
        parsed.activities.forEach(async (activity: any) => {
            // console.log(`wsrx> Activity(${++i}/${parsed.activities.length}):`, activity);
            const conversation = await this.conversations.get(activity.conversation.id);
            if (conversation) {
                Util.sendProactiveActivity(this.adapter, conversation.conversationReference, activity);
            } else {
                console.log('WebSocketDirectlineClient.onMessage activities, No conversation reference found for activity', activity);
            }
        });
    }
}
