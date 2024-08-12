import { CloudAdapter, ConversationReference, Activity, MessageFactory, ActivityTypes } from "botbuilder";

export interface ProactiveData {
    conversationReference: Partial<ConversationReference>,
    message: string
}


export class Util {

    static whatsappAdapter: CloudAdapter;

    static async sendProactiveMessage(
        adapter: CloudAdapter,
        conversationReference: Partial<ConversationReference>,
        message: string
    ) {
        let msgActivity = {
            type: ActivityTypes.Message,
            text: message,
        }
        return this.sendProactiveActivity(adapter, conversationReference, msgActivity);
    }

    /**
     * 
     * @param adapter 
     * @param conversationReference the delivery information needed to send this to the original client.
     * @param message 
     * @returns 
     */
    static async sendProactiveActivity(
        adapter: CloudAdapter,
        conversationReference: Partial<ConversationReference>,
        activity: Partial<Activity>
    ) {
        // Check if the conversation reference is valid
        if (/*!conversationReference.serviceUrl ||*/ !conversationReference.conversation || !conversationReference.user || !conversationReference.bot) {
            console.log('sendProactiveActivity() Invalid conversation reference', conversationReference);
            return;
        }

        if (conversationReference.channelId === 'whatsapp' && Util.whatsappAdapter) {
            Util.whatsappContinueConversation(conversationReference, activity);
        } else {
            // https://github.com/pnp/teams-dev-samples/blob/main/samples/bot-proactive-messaging/src/nodejs-backend/index.js
            // Use the adapter to continue the conversation asynchronously and send the proactive message
            adapter.continueConversationAsync(
                process.env.MicrosoftAppId,
                conversationReference,
                async (turnContext) => {
                    // Send the proactive message
                    // await turnContext.sendActivity(proactiveActivity);
                    // Try to send the proactive message
                    try {
                        // There is a bug in the Bot Framework that causes a 5sec delay on proactive messages that have replyToId set
                        // see https://github.com/microsoft/BotFramework-WebChat/issues/3874#issuecomment-861945391
                        turnContext.activity.id = null;
                        await turnContext.sendActivity({...activity, id: null, replyToId: null});
                    } catch (error) {
                        console.log('sendProactiveActivity() Error sending message to conversation', error);
                    }
                }
            ).catch( error => console.log('sendProactiveActivity() Error sending proactive message',error));
        }
    }

    static async whatsappContinueConversation(
        conversationReference: Partial<ConversationReference>,
        activity: Partial<Activity>
    ) {
        if (!this.whatsappAdapter) {
            console.error('whatsappContinueConversation() whatsappAdapter is not set');
            return;
        }
        await Util.whatsappAdapter.continueConversation(conversationReference, async (context) => {
            await context.sendActivity(activity);
        });
    }
}