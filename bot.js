// Run dotenv
require("dotenv").config();

const Discord = require('discord.js'); // Main library used for handling discord
const ytdl = require('ytdl-core'); // Tool used for playing Youtube videos
const usetube = require('usetube'); // Tool used for searching videos by parameter
const client = new Discord.Client();

// Stores the server id with corresponding song queue incase the bot will be
// used on multiple servers
const queue = new Map();

// Variable to store the timeout for disconnection
let timeout;
// Stores the messages sent by the bot
let nowPlaying = [];

const isDebug = true;


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
client.on("message", async function(message) {
	let msg = message;
	if (msg.author.bot) {
		if (msg.content.startsWith("Now playing") || msg.content.includes("i.ytimg.com")) {
			nowPlaying.push(msg);
		} else {
			setTimeout(function() {
				message.delete();
			},10000);
		}
		return;
	}
	else {
		message.delete();
	}

	const serverQueue = queue.get(msg.guild.id);

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
		case "earrape":
			earrape(msg, serverQueue);
			break;
		case "clear":
			clear(msg);
			break;
		case "ping":
			msg.reply("pong");
			break;
		case "help":
			msg.reply("I know the following commands:\
					  \n> skip: Skips the song currently playing\
					  \n> stop: Stops playing music and clears the queue\
					  \n> restart: Starts playing the same song again\
					  \n> remove [i]: removes the number i from queue\
					  \nIf no known command is given, I will try and search the text from Youtube.");
			break;
		case "pelataanko":
			msg.reply("" + doWePlay());
			break;
		default:
			msg.content = "play " + msg.content;
			handleSong(msg, serverQueue);
			break;
	}
});


/**
 * Dumb function that returns "should we play or not"
 * Will probably be deleted in the future
 */
function doWePlay() {
	let bool = Math.round(Math.random());
	if (bool) return "pelataan";
	return "ei pelata";
}


/**
 * Handles song requests made by users
 * @param {*} msg message sent by the user
 * @param {*} serverQueue song queue on the server
 */
async function handleSong(msg, serverQueue) {
	// If bot has no permission to join, speak or user entered invalid
	// input, stop handling.
	if (!verify(msg)) return;

	// Check if request was http(s) request or search query
	let id;
	let url = searchUrl(msg);
	if (!url.startsWith("http")) {
		id = await searchString(msg);
		url = "http://www.youtube.com/watch?v=" + id;
	}

	//
	//if (url.includes("didyoumean"))

	const voiceChannel = msg.member.voice.channel;
	try {
		// Check for if no video was found	
		if (id === "") {
			throw `Unable to find video.`;
		}
		debug(`Found address for query: ${url}`);

		// Get song info using ytdl from Youtube
		const songInfo = await ytdl.getInfo(url);
		const song = {
			title: songInfo.videoDetails.title,
			url: songInfo.videoDetails.video_url,
			thumbnail: songInfo.videoDetails.thumbnail.thumbnails[songInfo.videoDetails.thumbnail.thumbnails.length-1].url
		}
		debug(`Song found successfully from Youtube`);
		//console.log(queue);
		// If queue is empty, create a queue and add song to it
		if (!serverQueue) {
			// Base form for the queue
			const construct = {
				textChannel: msg.channel,
				voiceChannel: voiceChannel,
				connection: null,
				songs: [],
				volume: 5,
				playing: true
			};
			// Add queue to the guild where the message came from
			queue.set(msg.guild.id, construct);
			construct.songs.push(song);

			construct.connection = await voiceChannel.join();
			//console.log(construct);
			play(msg.guild, construct.songs[0]);

		} else { // Else add a song to the queue
			serverQueue.songs.push(song);
			//updateQueue(msg, serverQueue);
			msg.channel.send(`${song.title} has been added to the queue.`);
		}
	} catch (error) {
		debug(`No video found with: ${msg.content}`);
		console.log(error);
		queue.delete(msg.guild.id);
		msg.channel.send(`Unable to find a video with argument: ${msg.content.slice(5)}`);
	}
}


/**
 * Plays the song next in the queue
 * @param {*} guild server on discrod that it's connected to
 * @param {*} song requested song
 */
function play(guild, song) {
	const que = queue.get(guild.id);
	// If song doesn't exist
	if (!song) {
		timeout = setTimeout(function () {
			que.voiceChannel.leave();
		}, 30000);
		queue.delete(guild.id);
		return;
	}
	// If timeout is set, clear it and start playing
	if (timeout) {
		clearTimeout(timeout);
	}

	debug(`Playing song: ${song.title}`);
	const dispatch = que.connection.play(ytdl(song.url)).on("finish", function () {
		for (let msg of nowPlaying) {
			msg.delete();
		}
		nowPlaying = [];
		que.songs.shift();
		//console.log(que.songs);
		play(guild, que.songs[0]);
	}).on("error", function (error) {
		console.error(error)
	});

	dispatch.setVolumeLogarithmic(que.volume / 5);
	que.textChannel.send(song.thumbnail);
	que.textChannel.send(`Now playing: ${song.title}`);

}

function skip(msg, serverQue) {
	debug("Skipping currently playing song");
	msg.channel.send("Skipping song.")
	serverQue.connection.dispatcher.end();
}

function stop(msg, serverQue) {
	debug("Stopping playback and clearing queue");
	msg.channel.send("Stopping audio.");
	serverQue.songs = [];
	serverQue.connection.dispatcher.end();
}

function restart(msg, serverQue) {
	debug("Restarting currently playing song");
	serverQue.songs.unshift(serverQue.songs[0]);
	msg.channel.send(`Restarting song ${serverQue.songs[0].title}`);
	serverQue.connection.dispatcher.end();
}

function remove(msg, serverQue) {
	let index = msg.content.split(" ").splice(1);
	if (index > 0 && index < serverQue.songs.length) {
		msg.channel.send(`Song ${serverQue.songs[index].title} removed successfully.`)
		serverQue.songs.splice(index, 1)
	}
}

/**
 * Gets the http address for the video user wrote after the play command
 * @param {*} msg string, which the user wrote
 */
function searchUrl(msg) {
	const content = msg.content.split(" ");
	return content[1];
}

function updateQueue(serverQueue) {
	if (nowPlaying.length < 2) {
		nowPlaying[nowPlaying.length-1].delete();
	}

	let message = `Next in que:`;
	for (let i = 1; i < serverQueue.songs.length && i < 5; i++) {
		message += `\n>${serverQueue.songs[i].title}`;
	}
	//console.log(que.songs.length);
	serverQueue.textChannel.send(message);
}

/**
 * Searches the string user has entered after the play command on Youtube 
 * and return the first result found
 * @param {*} msg string, which the user wrote
 */
async function searchString(msg) {
	const content = msg.content.split(" ");
	let query = content[1];
	for (let i = 2; i < content.length; i++)
		query += " " + content[i];
	debug(`Query: ${query}`);

	// Search for Youtube video using usetube module
	let id = await usetube.searchVideo(query)
		.then(function(videos) {
			let id = "";
			for (let i = 0; i < videos.tracks.length; i++) {
				if (videos.tracks[i] === undefined) {
					continue;
				}

				id = videos.tracks[i].id;
				if (id !== "didyoumean") {
					return id;
				}
			}
			return id;
		})
		.catch(function(err) {
			console.log("Following error occurred:\n" + err);
		});

	return id;
}


/**
 * Verifies if the bot is allowed to play music
 * @param {*} msg message sent by user
 */
function verify(msg) {
	const args = msg.content.split(" ");
	if (args[1] === undefined) {
		debug("No argument was inserted");
		msg.channel.send("No search argument was given.");
		return false;
	}

	// Get the channel which the user who sent the message is connected to
	const voiceChannel = msg.member.voice.channel;

	if (!voiceChannel) {
		debug("User not in a voice channel");
		msg.channel.send("You need to be in a voice channel to play music!");
		return false;
	}

	const permissions = voiceChannel.permissionsFor(msg.client.user);

	// If no permission to join channel...
	if (!permissions.has("CONNECT")) {
		debug(`Not allowed to join ${voiceChannel.name}`);
		msg.channel.send("I don't have permission to join your channel.");
		return false;
	}

	// If no permission to speak on the channel...
	if (!permissions.has("SPEAK")) {
		debug(`Not allowed to join ${voiceChannel.name}`);
		msg.channel.send("I don't have permission to speak on your channel.");
		return false;
	}
	return true;
}


/**
 * If bot is started with argument 'debug', it will write debug logs to console
 * in order to help finding bugs in the program :^)
 */
function debug(string) {
	if (isDebug) console.log(string);
}


client.login(process.env.DISCORD_TOKEN);
