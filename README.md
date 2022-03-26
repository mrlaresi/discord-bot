# discord-bot
Tiny bot for Discord that is built with Javascript. It can at the moment only play audio from videos found on Youtube, either by giving it a direct url or by searching with given text.

# How the bot works:
By default, the bot reads all messages sent on all channels, so it is recommended to isolate it to a single channel and giving it it's own role.

The bot will delete the messages sent to the channel to keep it nice and tidy. To do this it requires "Manage messages" permission on the text channel it is reading. If the permission is not provided, it will only delete it's own messages.

## Known commands:

Typing a message in the chat triggers the bot to search for Youtube videos with that message contents. No need for commands and giving url link will fetch that song directly

- skip: Skips the song currently playing
- stop: Skips the song currently playing and clears the queue
- restart: Restarts the song currently playing
- remove 1: Removes the 1st song from the queue. Can be replaced with any number


# Hosting the bot on your own machine

The bot isn't currently public, so in order for you to use it, you have to host it on your own machine. To do this, clone or download the source from the github repository to a folder on your computer. Then, install the requirements

## Requirements

- [Node.js environment](https://nodejs.org/en/)
- Discord API token


## Setting up the bot

If you have Node.js installed, you should be able to setup the bot by typing the following command to your terminal of choice inside the folder where you have the program files in

`npm install`

To successfully host the bot on your own machine you have to create the following file in the project folder: 
> .env

Then, insert your Discord API key into the `.env` file like this:
`DISCORD_TOKEN=lorem ipsum`

Discord API token can be obtained [as shown here.](https://www.writebots.com/discord-bot-token/)

After all of that is done, simply start the bot with
`node bot.js`
And be greeted with message:
`Logged in as [username#discrodId]!`

