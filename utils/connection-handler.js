const { joinVoiceChannel, createAudioPlayer } = require('@discordjs/voice');

const joinVoice = (queue) => {
	queue.connection = joinVoiceChannel(queue.voiceChannel);
	queue.audioPlayer = createAudioPlayer();
	queue.connection.subscribe(queue.audioPlayer);
};

const startTimedDisconnect = (que, callback) => {
	// verbose("Starting disconnect timeout.");
	que.timeout = setTimeout(() => callback(), 30000);
	que.playing = false;
	return;
};


const interruptDisconnection = (que) => {
	clearTimeout(que.timeout);
	// verbose("Timeout interrupted.");
	que.timeout = undefined;
	return;
};

module.exports = {
	joinVoice,
	startTimedDisconnect,
	interruptDisconnection,
};