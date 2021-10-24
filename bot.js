// Run dotenv
require("dotenv").config();

const { Client, Intents } = require('discord.js'); // Main library used for handling discord
const { joinVoiceChannel, createAudioPlayer, createAudioResource, StreamType, AudioPlayerStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core'); // Tool used for playing Youtube videos
const usetube = require('usetube'); // Tool used for searching videos by parameter
const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES]});

// Stores the server id with corresponding song queue incase the bot will be
// used on multiple servers simultaneously
const queue = new Map();

let isVerbose = false;

let args = process.argv.slice(2)
for (let i = 0; i < args.length; i++) {
	switch (args[i]) {
		case "verbose":
			isVerbose = true;
			break;
		default:
			break;
	}
}

/**
 * When bot has started, send a message to console
 */
client.on("ready", function() {
	console.log(`Logged in as ${client.user.tag}!`);
	client.user.setActivity('DwarfBot, now ready to play music!');
});


/**
 * On message sent by user, do something
 */
client.on("messageCreate", async msg => {
	let message = msg;
	if (!msg.guild.me.permissionsIn(msg.channel).has("SEND_MESSAGES")) {
		verbose(`No permission to message to channel ${msg.channel}`);
		return;
	}
	if (msg.author.bot){
		if (msg.content.startsWith("Now playing") || msg.content.includes("i.ytimg.com")) {
			let que = queue.get(msg.guild.id);
			que.botMessages.push(msg);
		} else {
			setTimeout(() => {
				verbose("Deleted message via timeout.")
				msg.delete();
			},10000);
		}
		return;
	}
	
	if (msg.guild.me.permissionsIn(msg.channel).has("MANAGE_MESSAGES")) {
		msg.delete()
		.catch((error) => {
			console.log(error)
			verbose(`Tried deleting already deleted message`)
		});
	} else {
		msg.channel.send(`Sorry, I don't have permission to delete messages. For best
		results consider giving me ability to 'Manage messages'.`);
	}
	

	// server specific queue
	const serverQueue = queue.get(msg.guildId);
	const content = msg.content.split(" ")[0].toLowerCase();
	switch (content) {
		case "skip":
			skip(msg, serverQueue);
			break;
		case "stop":
			stop(msg, serverQueue);
			break;
		case "restart":
			restart(msg, serverQueue);
			break;
		case "remove":
			remove(msg, serverQueue);
			break;
		case "clear":
//			clear(msg);
			break;
		case "ping":
			msg.channel.send("pong");
			break;
		case "help":
			msg.channel.send("I know the following commands:\
					  \n> skip: Skips the song currently playing\
					  \n> stop: Stops playing music and clears the queue\
					  \n> restart: Starts playing the same song again\
					  \n> remove [i]: removes the ith video from the queue\
					  \nIf no known command is given, I will try and search the given text from Youtube.");
			break;
		default:
			msg.content = "play " + msg.content;
			handleSong(msg, serverQueue);
			break;
	}
});


/**
 * Handles song requests made by users
 * @param msg message sent by the user
 * @param serverQueue song queue on the server
 */
const handleSong = async (msg, serverQueue) => {
	if (!verify(msg)) return;

	// Check if request was http(s) request or search query
	let id;
	let url = getUrl(msg);
	try {	
		if (!url.startsWith("http")) {
			id = await searchString(msg);
			if ( id === "") {
				throw "No video found";
			}
			url = "http://www.youtube.com/watch?v=" + id;
		}


		verbose(`Found address for query: ${url}`);

		// Get song info using ytdl-core from Youtube
		const songInfo = await ytdl.getInfo(url);
		const song = {
			title: songInfo.videoDetails.title,
			url: songInfo.videoDetails.video_url,
			thumbnail: songInfo.videoDetails.thumbnails[songInfo.videoDetails.thumbnails.length-1].url,
			length: songInfo.videoDetails.lengthSeconds
		}
		verbose(`Song found successfully from Youtube`);
		// If queue is empty, create a queue and add song to it
		if (!serverQueue) {
			// Base form for the queue
			const baseQueue = {
				textChannel: msg.channel,
				voiceChannel: {
					channelId: msg.member.voice.channelId,
					guildId: msg.guildId,
					adapterCreator: msg.member.voice.guild.voiceAdapterCreator,
				},
				connection: null,
				songs: [],
				botMessages: [],
				playing: true,
				audioPlayer: createAudioPlayer(),
				timeout: undefined
			};
			// Add queue to the guild where the message came from
			queue.set(msg.guild.id, baseQueue);
			baseQueue.songs.push(song);
			baseQueue.connection = joinVoiceChannel(baseQueue.voiceChannel);
			baseQueue.connection.subscribe(baseQueue.audioPlayer);
			setupAudioPlayer(msg.guild);
			play(baseQueue, baseQueue.songs[0]);
			return;

		} 
		serverQueue.songs.push(song);
		//updateQueue(msg, serverQueue);
		// If bot has stopped playing audio before disconnecting, restart it
		if (!serverQueue.playing) {
			serverQueue.playing = true;
			interruptTimeout(serverQueue);
			play(serverQueue, serverQueue.songs[0]);
			return;
		}
		msg.channel.send(`${song.title} has been added to the queue.`);
		
	} catch (error) {
		verbose(`Unable to find video:`);
		verbose(`${error}`);
		queue.delete(msg.guild.id);
		msg.channel.send(`Unable to find a video with argument: ${msg.content.slice(5)}`);
	}
}


const setupAudioPlayer = (guild) => {
	verbose("Setting up AudioPlayer.")
	let que = queue.get(guild.id);
	que.audioPlayer
	.on(AudioPlayerStatus.Idle, () => {
		que.songs.shift();
		for (let msg of que.botMessages) {
			msg.delete();
		}
		que.botMessages = [];
		if (que.songs.length === 0) {
			startTimeout(guild); 
			return;
		}
		play(que, que.songs[0]);
	})
	.on("error", function (error) {
		verbose(error);
	});
}


const startTimeout = (guild) => {
	verbose("Starting disconnect timeout.");
	let que = queue.get(guild.id);
	que.timeout = setTimeout(function () {
		queue.delete(guild.id);
		que.audioPlayer.stop();
		que.connection.disconnect();
		verbose("Disconnected.");
	}, 30000);
	que.playing = false;
	queue.set(guild.id, que)
	return;
}


const interruptTimeout = (que) => {
	clearTimeout(que.timeout);
	verbose("Timeout interrupted.");
	que.timeout = undefined;
	return;
}


/**
 * Plays the next song in the queue
 * @param que necessary information associated with the server
 * @param song requested song
 */
const play = (que, song) => {
	verbose("Entering play function.")

	verbose(`Playing song: ${song.title}`);
	let resource = createAudioResource(
		ytdl(
			song.url, 
			{filter:"audioonly", quality: "highestaudio"}), 
		{inlineVolume: true}
	);
	
	que.audioPlayer.play(resource);
	resource.volume.setVolume(0.2);
	
	verbose("playback starting")
	que.textChannel.send(song.thumbnail);
	que.textChannel.send(`Now playing: ${song.title}`);

}


/**
 * Skips the currently playing song
 * @param msg message sent by the user
 * @param serverQue song queue on the server
 * @returns 
 */
const skip = (msg, serverQue) => {
	if (serverQue) {
		if (serverQue.playing) {
			serverQue.audioPlayer.stop();
			verbose("Skipping currently playing song");
			msg.channel.send("Skipping song.");
			return;
		}
	}
	msg.channel.send("Nothing is playing!");;
}


/**
 * Skips the currently playing song and clears queue
 * @param msg message sent by the user
 * @param serverQue song queue on the server
 */
const stop = (msg, serverQue) => {
	if (serverQue) {
		if (serverQue.playing) {
			serverQue.songs = [];
			serverQue.audioPlayer.stop();
			verbose("Stopping playback and clearing queue");
			msg.channel.send("Stopping audio.");
			return;
		}
	}
	msg.channel.send("Nothing is playing!");
}

const restart = (msg, serverQue) => {
	if (serverQue) {
		if (serverQue.playing) {
			verbose("Restarting currently playing song");
			serverQue.songs.unshift(serverQue.songs[0]);
			msg.channel.send(`Restarting song ${serverQue.songs[0].title}`);
			serverQue.audioPlayer.stop();
			return;
		}
	}
	msg.channel.send("Nothing is playing!");
}

const remove = (msg, serverQue) => {
	if (serverQue) {
		if (serverQue.playing) {
			let index = msg.content.split(" ").splice(1);
			if (index > 0 && index < serverQue.songs.length) {
				msg.channel.send(`Song ${serverQue.songs[index].title} removed successfully.`)
				serverQue.songs.splice(index, 1)
				return;
			}
			msg.channel.send(`Song doesn't exist on index ${index}`);
			return;
		}
	}
	msg.channel.send("Nothing is playing!")
}

/**
 * If user wrote http(s) address in the message, get it. Undefined.
 * @param msg string, which the user wrote
 */
const getUrl = msg => {
	const content = msg.content.split(" ");
	return content[1];
}

function updateQueue(serverQueue) {
	if (botMessages.length < 2) {
		botMessages[botMessages.length-1].delete();
	}

	let message = `Next in que:`;
	for (let i = 1; i < serverQueue.songs.length && i < 5; i++) {
		message += `\n>${serverQueue.songs[i].title}`;
	}
	//console.log(que.songs.length);
	serverQueue.textChannel.send(message);
}

/**
 * Searches Youtube with the text the user inserted, returning the video id
 * for the first result found
 * @param msg string, which the user wrote
 */
 const searchString = async msg => {
	const content = msg.content.split(" ");
	let query = content.slice(1).join(" ");
	verbose(`Query: ${query}`);

	// Search for Youtube video using usetube module
	let id = await 
		usetube.searchVideo(query)
		.then(videos => {
			let id = "";
			for (let i = 0; i < videos.videos.length; i++) {
				id = videos.videos[i].id;
				if (id !== undefined) {return id; }
			}
			return id;
		})
		.catch(error => {
			verbose(`${error}`);
			return "";
		});
	return id;
}


/**
 * Verifies if the bot is allowed to play music
 * @param msg message sent by user
 */
const verify = msg => {
	const args = msg.content.split(" ");
	if (args[1] === undefined) {
		verbose("No argument was inserted");
		msg.channel.send("No search argument was given.");
		return false;
	}

	// Get the channel which the user who sent the message is connected to
	const voiceChannel = msg.member.voice.channel;

	if (!voiceChannel) {
		verbose("User not in a voice channel");
		msg.channel.send("You need to be in a voice channel to play music!");
		return false;
	}

	const permissions = voiceChannel.permissionsFor(msg.client.user);

	// If no permission to join channel or speak on it...
	if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
		verbose(`Not allowed to join "${voiceChannel.name}"`);
		msg.channel.send("I don't have permission to join your channel.");
		return false;
	}
	return true;
}


/**
 * If bot is started with argument 'verbose', it will write more text to the
 * console in order to help finding bugs in the program :^)
 */
const verbose = string => {
	if (isVerbose) console.log(string);
}


client.login(process.env.DISCORD_TOKEN);
