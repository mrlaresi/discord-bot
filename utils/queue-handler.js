const { joinVoice, interruptDisconnection } = require('./connection-handler');

const queue = new Map();

/**
 * Initialize queue object for a guild
 * @param interaction object
 */
const initQueue = (interaction) => {
	const baseQueue = {
		textChannel: interaction.channel,
		voiceChannel: {
			channelId: interaction.member.voice.channelId,
			guildId: interaction.guildId,
			adapterCreator: interaction.member.voice.guild.voiceAdapterCreator,
		},
		connection: null,
		songs: [],
		botMessages: [],
		playing: false,
		audioPlayer: undefined,
		timeout: undefined,
	};

	queue.set(interaction.guildId, baseQueue);
	joinVoice(baseQueue);
};


/**
 * Adds song to guild specific queue
 * @param interaction object
 * @param song details
 * @returns queue object
 */
const addToQueue = (interaction, song) => {
	let que = queue.get(interaction.guildId);
	if (!que) {
		initQueue(interaction);
		que = queue.get(interaction.guildId);
	}
	if (!que.playing) {
		interruptDisconnection(que);
	}
	que.songs.push(song);
	return que;
};


const getQueue = (guildId) => {
	return queue.get(guildId);
};

const deleteQueue = (guildId) => {
	queue.delete(guildId);
};

module.exports = {
	addToQueue,
	getQueue,
	deleteQueue,
};