import { TwilioWhatsAppAdapter, TwilioWhatsAppAdapterSettings } from "@botbuildercommunity/adapter-twilio-whatsapp";
import { Activity, ActivityImportance, BotFrameworkAdapterSettings } from "botbuilder";

export class TwilioWhatsAppCustomAdapter extends TwilioWhatsAppAdapter {

    constructor(settings: TwilioWhatsAppAdapterSettings, botFrameworkAdapterSettings?: BotFrameworkAdapterSettings) {
        super(settings);
    }

        /**
     * Transform Bot Framework Activity to a Twilio Message.
     * 
     * @param activity Activity to transform
     */
        protected parseActivity(activity: Partial<Activity>): any {
            let twilioMessage = super.parseActivity(activity);
            // a Twilio message  
            // https://www.twilio.com/docs/messaging/api/message-resource#send-a-whatsapp-message
            // {body: 'hello world', from: to: }
            if(activity.suggestedActions) {
                // quick-reply buttons
                // https://www.twilio.com/docs/whatsapp/buttons
                const interactive = {
                    type: "button",
                    body: activity.text,
                    action: {
                        buttons: 
                        // note: doc says max 3 buttons
                            activity.suggestedActions.actions.map((action) => {
                                return {
                                    type: "reply",
                                    reply: {
                                        id: action.value,
                                        title: action.title
                                    }
                            }}),
                    }
                }
                // twilioMessage = {
                //     from: twilioMessage.from,
                //     to: twilioMessage.to,
                //     type: "interactive",
                //     interactive: interactive,
                //     recipient_type: "individual",
                // }
                // twilioMessage = {
                //     ...twilioMessage,
                //     type: "interactive",
                //     body: interactive,
                // }
                // twilioMessage = {  // works, has location/map links
                //     ...twilioMessage,
                //     persistentAction: [
                //         'geo:37.7749,-122.4194|San Francisco',
                //         'geo:34.0522,-118.2437|Los Angeles'
                //       ]
                // }
                twilioMessage = {
                    ...twilioMessage,
                    persistentAction: [   // does nothing !!!!!!!
                        'reply:button_1|Option 1',
                        'reply:button_2|Option 2',
                        'reply:button_3|Option 3'
                      ]
                    //   contentVariables: JSON.stringify({
                    //     1: 'Option 1',
                    //     2: 'Option 2',
                    //     3: 'Option 3'
                    //   })
                }

                // Am stuck
                // TODO
                // https://www.twilio.com/docs/whatsapp/buttons#:~:text=Quick%20reply%20buttons%20can%20be,in%20a%2024%20hour%20session.
            }
            return twilioMessage;
        }
}