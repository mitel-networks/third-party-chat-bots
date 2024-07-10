import { CloudAdapter, ConversationReference, Activity } from "botbuilder";

export interface ProactiveData {
    conversationReference: Partial<ConversationReference>,
    message: string
}


export class Util {

    /**
     * 
     * @param adapter 
     * @param conversationReference the delivery information needed to send this to the original client.
     * @param message 
     * @returns 
     */
    static async sendProactiveMessage(
        adapter: CloudAdapter,
        conversationReference: Partial<ConversationReference>,
        message: string
    ) {
        // Check if the conversation reference is valid
        if (!conversationReference.serviceUrl || !conversationReference.conversation || !conversationReference.user || !conversationReference.bot) {
            console.log('sendProactiveMessage() Invalid conversation reference', conversationReference);
            return;
        }

        try {
            // https://github.com/pnp/teams-dev-samples/blob/main/samples/bot-proactive-messaging/src/nodejs-backend/index.js
            // Use the adapter to continue the conversation asynchronously and send the proactive message
            await adapter.continueConversationAsync(
                process.env.MicrosoftAppId,
                conversationReference,
                async (turnContext) => {
                    // Send the proactive message
                    // await turnContext.sendActivity(proactiveActivity);
                    // Try to send the proactive message
                    try {
                        await turnContext.sendActivity(message);
                    } catch (error) {
                        console.log('sendProactiveMessage() Error sending message to conversation', error);
                    }
                }
            );
        } catch (error) {
            console.log('sendProactiveMessage() Error sending proactive message',error);
        }
    }

    static async sendProactiveActivity(
        adapter: CloudAdapter,
        conversationReference: Partial<ConversationReference>,
        activity: Activity
    ) {
        // Check if the conversation reference is valid
        if (!conversationReference.serviceUrl || !conversationReference.conversation || !conversationReference.user || !conversationReference.bot) {
            console.log('sendProactiveActivity() Invalid conversation reference', conversationReference);
            return;
        }

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
                    await turnContext.sendActivity(activity);
                } catch (error) {
                    console.log('sendProactiveMessage() Error sending message to conversation', error);
                }
            }
        ).catch( error => console.log('sendProactiveMessage() Error sending proactive message',error));
    }
}