# discord-bot discordjs v14
Tiny bot for Discord that is built with Javascript. It can at the moment only play audio from videos found on Youtube, either by giving it a direct url or by searching with given text.

# How the bot works:
The bot will listen to discord slash command, and based on the command and query, it will act upon it.

## Known commands:

- play: Either plays the given url, or searches from youtube with given query
- skip: Skips the song currently playing
- stop: Skips the song currently playing and clears the queue
- restart: Restarts the song currently playing
- remove 1: Removes the 1st song from the queue. Can be replaced with any number


# Hosting the bot on your own machine

The bot isn't currently public, so in order for you to use it, you have to host it on your own machine. To do this, clone or download the source from the github repository to a folder on your computer. Then, install the requirements

## Requirements

- [Node.js v19 environment](https://nodejs.org/en/). Earlier versions haven't been tested.


## Setting up the bot

If you have Node.js installed, you should be able to setup the bot by typing the following command to your terminal of choice inside the folder where you have the program files in

`npm install`

To successfully host the bot on your own machine you have to create the following file in the project folder: 
> .env

Then, insert your Discord API key into the `.env` file like this:
`DISCORD_TOKEN=lorem ipsum`

Discord API token can be obtained [as shown here.](https://www.writebots.com/discord-bot-token/)

After all of that is done, simply start the bot with
`npm start`
And be greeted with message:
`Logged in as [username#discrodId]!`

