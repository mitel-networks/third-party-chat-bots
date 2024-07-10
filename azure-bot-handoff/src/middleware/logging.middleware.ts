import { Middleware, TurnContext, Activity, ActivityTypes } from 'botbuilder';

class LoggingMiddleware implements Middleware {
    async onTurn(context: TurnContext, next: () => Promise<void>): Promise<void> {
        // Log incoming activity
        console.log(`rx>>>>>>>> Incoming activity: ${ context.activity.type } `, context.activity);
        // console.log(`Type: ${context.activity.type}`);
        // console.log(`Text: ${context.activity.text}`);
        // console.log(`From: ${context.activity.from?.id}`);

        // Store the current timestamp
        const startTime = new Date();

        // Capture outgoing activities
        const outgoingActivities: Activity[] = [];
        context.onSendActivities(async (ctx: TurnContext, activities: Partial<Activity>[], nextSend) => {
            // Log the activities we're about to send
            activities.forEach(activity => outgoingActivities.push(activity as Activity));
            return await nextSend();
        });

        // Allow bot logic to run
        await next();

        // Log outgoing activities
        if (outgoingActivities.length > 0) {
            // console.log('Outgoing activities:');
            outgoingActivities.forEach((activity, index) => {
                console.log(`tx>>>>>>>> ${index + 1}/${outgoingActivities.length} Type: ${activity.type} ${activity.name || ''}:`, activity);
                // console.log(`Type: ${activity.type} ${activity.name || ''}`);
                // console.log(`Text: ${activity.text}`);
            });
        } else {
            console.log('No outgoing activities');
        }

        // Log processing time
        const endTime = new Date();
        // console.log(`Processing time: ${endTime.getTime() - startTime.getTime()} ms`);
    }
}

export default LoggingMiddleware;
