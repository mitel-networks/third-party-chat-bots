import * as path from 'path';
import { config } from 'dotenv';
const ENV_FILE = path.join(__dirname, '..', '.env');
config({ path: ENV_FILE });
import * as restify from 'restify';
import { INodeSocket } from 'botframework-streaming';

// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
import {
    CloudAdapter,
    ConfigurationServiceClientCredentialFactory,
    createBotFrameworkAuthenticationFromConfiguration
} from 'botbuilder';

import { InterceptorConversation } from './middleware/interceptor.interface';
import InterceptorMiddleware from './middleware/interceptor.middleware';
import { RelayBotData } from './bots/relay-directline.interface';
import { RelayBotAxios } from './bots/relay-bot-axios';
import { EchoBot } from './bots/echo-bot';

console.log('poc-azure-bot-handoff v7.5 7/05 11:16');

// Create HTTP server.
const server = restify.createServer();
server.use(restify.plugins.bodyParser());

server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${server.name} listening to ${server.url}`);
    console.log('\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator');
    console.log('\nTo talk to your bot, open the emulator select "Open Bot"');
});

const credentialsFactory = new ConfigurationServiceClientCredentialFactory({
    MicrosoftAppId: process.env.MicrosoftAppId,
    MicrosoftAppPassword: process.env.MicrosoftAppPassword,
    MicrosoftAppType: process.env.MicrosoftAppType,
    MicrosoftAppTenantId: process.env.MicrosoftAppTenantId
});

const botFrameworkAuthentication = createBotFrameworkAuthenticationFromConfiguration(null, credentialsFactory);

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about adapters.
const adapter = new CloudAdapter(botFrameworkAuthentication);

// Catch-all for errors.
const onTurnErrorHandler = async (context, error) => {
    // This check writes out errors to console log .vs. app insights.
    // NOTE: In production environment, you should consider logging this to Azure
    //       application insights.
    console.error(`\n [onTurnError] unhandled error: ${error}`, { activity: context.activity });
    console.error(error.stack);
    

    // Send a trace activity, which will be displayed in Bot Framework Emulator
    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${ error }`,
        'https://www.botframework.com/schemas/error',
        'TurnError'
    );

    // Send a message to the user
    await context.sendActivity('The bot encountered an error or bug.');
};

// Set the onTurnError for the singleton CloudAdapter.
adapter.onTurnError = onTurnErrorHandler;
// adapter.use(new LoggingMiddleware());
const conversationStore = new Map<string, InterceptorConversation>();
const conversationStoreP = {
    set: async (id: string, conversation: InterceptorConversation) => {
        conversationStore.set(id, conversation);
        return conversation;
    },
    get: async (id: string) => {
        return conversationStore.get(id);
    },
    delete: async (id: string) => {
        conversationStore.delete(id);
    }
};
const mitelUrl = process.env.MITEL_ENDPOINT;
adapter.use(new InterceptorMiddleware(conversationStoreP, mitelUrl));

// Create the main dialog.
// const myBot = new EchoBot();
const dlStore = new Map<string, RelayBotData>();
const dlStoreP = {
    set: async (id: string, data: RelayBotData) => {
        dlStore.set(id, data);
        return data;
    },
    get: async (id: string) => {
        return dlStore.get(id);
    },
    delete: async (id: string) => {
        dlStore.delete(id);
    }
};
const secret = process.env.REMOTE_BOT_DIRECT_LINE_SECRET;
const myBot = new RelayBotAxios(adapter, dlStoreP, secret, (connectionId) => conversationStoreP.delete(connectionId));

// Listen for incoming requests.
server.post('/api/messages', async (req, res) => {
    // Route received a request to adapter for processing
    console.log(`rx> ${req.url} ${req.body.type} conv=${req.body?.conversation?.id}`);
    // console.log(req.body);
    await adapter.process(req, res, (context) => myBot.run(context));
});



// Listen for Upgrade requests for Streaming. (Web Socket)
server.on('upgrade', async (req, socket, head) => {
    console.log('rx> upgrade to WebSocket');
    // Create an adapter scoped to this WebSocket connection to allow storing session data.
    const streamingAdapter = new CloudAdapter(botFrameworkAuthentication);

    // Set onTurnError for the CloudAdapter created for each connection.
    streamingAdapter.onTurnError = onTurnErrorHandler;

    await streamingAdapter.process(req, socket as unknown as INodeSocket, head, (context) => myBot.run(context));
});
