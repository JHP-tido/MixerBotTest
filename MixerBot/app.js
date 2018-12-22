const Mixer = require('@mixer/client-node');
const ws = require('ws');
let userInfo;
const client = new Mixer.Client(new Mixer.DefaultRequestRunner());
// With OAuth we don't need to log in. The OAuth Provider will attach
// the required information to all of our requests after this call.
client.use(new Mixer.OAuthProvider(client, {
    tokens: {
        access: 'your_access_token',
        expires: Date.now() + (365 * 24 * 60 * 60 * 1000)
    },
}));
// Gets the user that the Access Token we provided above belongs to.
client.request('GET', 'users/current')
    .then(response => {
    userInfo = response.body;
    return new Mixer.ChatService(client).join(response.body.channel.id);
})
    .then(response => {
    const body = response.body;
    return createChatSocket(userInfo.id, userInfo.channel.id, body.endpoints, body.authkey);
})
    .catch(error => {
    console.error('Something went wrong.');
    console.error(error);
});
/**
* Creates a Mixer chat socket and sets up listeners to various chat events.
* @param {number} userId The user to authenticate as
* @param {number} channelId The channel id to join
* @param {string[]} endpoints An array of endpoints to connect to
* @param {string} authkey An authentication key to connect with
* @returns {Promise.<>}
*/
function createChatSocket(userId, channelId, endpoints, authkey) {
    // Chat connection
    const socket = new Mixer.Socket(ws, endpoints).boot();
    // Greet a joined user
    socket.on('UserJoin', data => {
        socket.call('msg', [`Hi ${data.username}! I'm a bot XDXD!`]);
    });
    const na = userInfo.username.toLowerCase();
    // React to our !pong command
    socket.on('ChatMessage', data => {
        if (data.message.message[0].data.toLowerCase().startsWith('!ping')) {
            socket.call('msg', [`@${data.user_name} PONG!`]);
            console.log(`Ponged ${data.user_name}`);
        }
        if (data.message.message[0].data.toLowerCase().startsWith('!level')) {
            socket.call('msg', [`@${data.user_name} has level ${data.user_level}`]);
            console.log(`Level ${data.user_name} ${data.user_level}`);
        }
        if (data.message.message[0].data.toLowerCase().search(new RegExp(na, 'i')) != -1) {
            socket.call('msg', ['Is someone talking about me!?!']);
            console.log(`Message talking about me ${userInfo.username}`);
        }
    });
    socket.on('UserLeave', data => {
        socket.call('msg', [`Bye ${data.username}, see you next time!`]);
    });
    socket.on('SkillAttribution', data => {
        socket.call('msg', [`Wow ${data.user_name} you have spent ${data.skill.cost} ${data.skill.currency}`]);
    });
    // Handle errors
    socket.on('error', error => {
        console.error('Socket error');
        console.error(error);
    });
    return socket.auth(channelId, userId, authkey)
        .then(() => {
        console.log('Login successful');
        return socket.call('msg', ['Bot Online!']);
    });
}
//# sourceMappingURL=app.js.map