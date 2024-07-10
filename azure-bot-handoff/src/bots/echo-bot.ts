import { ActivityHandler, EventFactory } from 'botbuilder';

export class EchoBot extends ActivityHandler {

    constructor() {
        super();
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {
            if (context.activity.text.toLowerCase().includes('human')) {
                const handoffContext = { Skill: 'credit cards' };
                const transcript = undefined;
                const handoffActivity = EventFactory.createHandoffInitiation(context, handoffContext, transcript);
                await context.sendActivity(handoffActivity);
            } else {
                const replyText = `Echo: ${ context.activity.text } conv:${context.activity.conversation.id} from:${context.activity.from.id} to:${context.activity.recipient.id}`;
                // const reply = MessageFactory.text(replyText, replyText);
                await context.sendActivity(replyText);
            }
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            const welcomeText = 'Hello and welcome! simple echo Bot! v6.0 7/03 1:29';
            for (const member of membersAdded) {
                if (member.id !== context.activity.recipient.id) {
                    // await context.sendActivity(MessageFactory.text(welcomeText, welcomeText));
                    await context.sendActivity(welcomeText);
                }
            }
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }
    
}
