# discord-bot
Tiny bot for Discord that is built with Javascript.
It can at the moment only play audio from videos from Youtube.

# How to use:
The bot reads all messages on all channels, so it is recommended to isolate it
to a single channel.
The bot will delete the messages sent to the channel to keep it nice and tidy.
Requires "Manage messages" permission on the text channel it is reading but if
it is not provided, it will only delete it's own messages.


To successfully host the bot on your own machine you have to create a file called
.env to the project folder and insert your Discord API key into it like this:
 - DISCORD_TOKEN=lorem ipsum
