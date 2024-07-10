
// This file describes the interface between Mitel Workflow's Generic Bot webhook and a Bot.
// version July 4 2024
export interface Attachement {
    name: string;
    contentType: string;
    contentUrl: string;
}


export interface User {
    id: string;
    name: string;
    role?: string;
}

// Transcript array should be sorted by timestamp, oldest first.
export interface Transcript {
    from: User,
    to: User,
    text: string;
    textFormat: "plain" | "markdown" | "xml";
    timestamp: string; // ISO 8601 format
}

// ***********  I M P O R T A N T ***********
// All messages/events recieved from Workflow must have
//  the from.role="agent"

// A text message is sent to/from Workflow
// {
//     "text": "hi 1",
//     "textFormat": "plain",
//     "type": "message",
//     "from": {
//       "id": "81af249a-cf92-4650-a9fd-4b5b241500ca",
//       "name": "User",
//       "role": "user"
//     },
//     "timestamp": "2024-07-04T17:42:00.359Z",
//     "conversation": {
//       "id": "b3bb18d0-3a2c-11ef-b520-7134a09df485|livechat"
//     },
//     "recipient": {
//       "id": "969d3fa0-3a2a-11ef-b520-7134a09df485",
//       "name": "Bot",
//       "role": "bot"
//     },
//     attachements: Attachement[]
//   }


// When a handoff to Agent is requested, will send this to Workflow
// At this point, interceptor will put this conversation in queued state (all
// messages from client dropped until agent joins)
// {
//     type: "handoff",
//     conversation: { id: string },
//     from: User,
//     transcript: Transcript[],
//     custom: {}  // any custom scope data from the bot, eg CoPilot bot name and Topic Escalate variables would appear in here
//  }

// When Agent is ready to join, Workflow will send this message to the client
// and interceptor will put this conversation in agent state (messages routed to Workflow)
// {
//     "type": "conversationUpdate",
//     "membersAdded": [
//       {
//         "id": "969d3fa0-3a2a-11ef-b520-7134a09df485",
//         "name": "Agent",
//         "role": "agent"
//       },
//     ],
//     "membersRemoved": [],
//     "conversation": {
//       "id": "b3bb18d0-3a2c-11ef-b520-7134a09df485|livechat"
//     },
//   }


// When Client leaves (perhaps because they no longer want to talk to an agent), will send this to Workflow
// also, when Agent leaves, Workflow sends this to the client
// {
//     "type": "conversationUpdate",
//     "from": User,
//     "membersAdded": [],
//     "membersRemoved": [
//       {
//         "id": "1234567789-3a2a-11ef-b520-7134a09df485",
//         "name": "User",
//         "role": "user"
//       },
//     ],
//     "conversation": {
//       "id": "b3bb18d0-3a2c-11ef-b520-7134a09df485|livechat"
//     },
//   }

// A typing indicator is sent to/from Workflow
// {
//     "type": "typing",
//     "from": {
//       "id": "81af249a-cf92-4650-a9fd-4b5b241500ca",
//       "name": "User",
//       "role": "user"
//     },
//     "conversation": {
//       "id": "b3bb18d0-3a2c-11ef-b520-7134a09df485|livechat"
//     },
//   }