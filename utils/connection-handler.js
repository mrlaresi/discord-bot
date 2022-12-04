const { joinVoiceChannel } = require('@discordjs/voice');

const logger = require('./logger');

const joinVoice = (queue) => {
	queue.connection = joinVoiceChannel(queue.voiceChannel);
};

const startTimedDisconnect = (que) => {
	logger.debug('Starting disconnect timeout.');
	que.timeout = setTimeout(() => disconnect(que), 30000);
	que.playing = false;
	return;
};


const interruptDisconnection = (que) => {
	clearTimeout(que.timeout);
	logger.debug('Timeout was interrupted.');
	que.timeout = undefined;
	return;
};

const disconnect = (queue) => {
	queue.audioPlayer.stop();
	queue.connection.disconnect();
	queue.audioPlayer = undefined;
	queue.connection = undefined;
};

module.exports = {
	joinVoice,
	startTimedDisconnect,
	interruptDisconnection,
};