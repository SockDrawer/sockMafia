# Moderator Reference
So you want to run a game of Mafia, eh? This is the place to start!

Actually, I lied. It's not the place to start. But it is the place to learn how to run the bot, which is pretty much all I'm qualified to teach you. Sorry for the mix-up :) 

## Getting Started

### Installation

You will need:
- A server capable of running Node and connecting to NPM
- Some basic understanding of the command line

The recommended installation steps are as follows:

1. Install Sockbot globally using `npm install -g sockbot`
2. Install Sockbot-mafia globally using `npm install -g sockbot-mafia`
3. *Optionally* Install [Randomizer](https://github.com/AccaliaDeElementia/sockbot-plugin-randomizer) if you want help assigning roles and picking players: `npm install -g sockbot-plugin-randomizer`
4. Create a configuration file (see below)
5. Run sockbot with the configuration file: `sockbot config.yml`

If you ever need to upgrade this plugin or sockbot, simply run the install command again. It will always pull the latest version from NPM. 

### Configuration

You will need to configure Sockbot's username and password, something like:

```
core:
  username: username
  password: password
  owner: yourname
```

Under that goes the plugins section. This is where you can configure sockmafia:

```
plugins:
  sockbot-mafia:
    thread: 52778
    mods:
     - mod
    players:
     - player1
     - player2
    db: './mafiadb'
    name: testMafia
    options:
      voteBars: bastard
      chats: disabled
      stripCommands: disabled
```


The above configuration is for a single game config, it is also possible to specify multiple games via the configuration. Below is an example of a multigame configuration.

```
plugins: 
  sockbot-mafia: 
    db: ./mafiadb
    games: 
      - 
        name: testMafia
        thread: 52778
        mods: 
          - mod
        players: 
          - player1
          - player2
        options: 
          chats: disabled
          stripCommands: disabled
          voteBars: bastard
      - 
        name: testMafia2
        thread: 8472
        mods: 
          - mod2
        players: 
          - player3
          - player4
        options: 
          chats: enabled
          stripCommands: enabled
          voteBars: hidden
```

Detailed config information can be found in the reference below. 

Recommended [randomizer](https://github.com/AccaliaDeElementia/sockbot-plugin-randomizer) settings are:

```
  sockbot-plugin-randomizer:
    pick: true
    shuffle: true
    decide: true
```

This will let you pick one player out of the group for things like random events, shuffle the players so you can assign them roles, and decide yes or no questions while moderating. Again, this is entirely optional, but many GMs find it useful. See the [Randomizer plugin docs](https://github.com/AccaliaDeElementia/sockbot-plugin-randomizer) for more detail about how to use those commands.

# Command reference

The following commands are availible to moderators. All can be executed from any game-linked thread, or can have `in gameName` appended to be executed from a non-game thread.

## Set

Assign a property to a player. The following properties have special meaning to the bot:

- Loved: Requires one more vote to lynch than normal
- Hated: Requires one fewer vote to lynch than normal
- Doublevoter: Can vote twice
- Lynchproof: Cannot be lynched
- Scum: Has a faction target at night instead of a regular target
- Scum2: Like Scum, but a separate faction target (for multiball games)

The following properties are allowed but carry no special meaning yet:
- Wanderer
- Cop
- CultLeader
- Cultist

Usage: `!set playerName property [in gameName]`

## Kill

Kill a player. Currently the only way to act on the scum's faction kill at night, to allow you to vet their choice and resolve any complicated situations. Also useful for modkills. 

Usage: `!kill playerName [in gameName]`

## New-day

Move to the beginning of the next day. 

Usage: `!new-day`

## Next-phase

Move to the next phase. Transitions night to day across day boundaries, and day to night. 

## List-night-actions

List the night actions that have been registered so far. Will list scum separate from individual actions. 

Usage: `!list-night-actions [in gameName]`

## Add

Adds a thread or chat to the game. Once a thread has been registered as part of a game, it will behave the same as the main thread, allowing player commands. A chat mostly works the same, except that you cannot vote within chats.

Usage:

`!add thread 123 to gameName`
`!add chat 123 to gameName`
`!add this to gameName` (adds the current thread or chat to the game)

## Set-option

Sets various game level configuration options.

Aliases:

- set-value
- setvalue
- option

Usage:

`!set-option chats equal enabled in testMafia`

## Send-rolecard

Sends the contents of the post or chat containing the command to the target users as their role card. 

Note that it does not prevent the bot from trying to interpret any other commands in the post, so be careful how you word the role card to avoid putting the command on a line by itself.

If you wish to omit information from the rolecard set the game option `stripCommands` to `enabled` to remove all commands from the role card when sending it to the player. 

If you wish to send the same role card to multiple people, stripping commands is **highly** recommended, as it will prevent them from seeing the commands.

Usage:

```
You are a **cop**! Each night you can investigate one person using `!target playerName in TargetGame`.

!send-rolecard TargetUsername in TargetGame
```

This will send the entire text listed above to TargetUsername if you have stripCommands disabled, or just the first line if you have stripCommands enabled.

# Configuration Reference

## Thread

The main game thread. Future updates will privilege this thread over other threads added later.

## Mods

A list of moderators. Moderators can use the mod commands above.

## Players

A list of players. Will be automatically added on bot start. When the bot is restarted, you may see errors indicating that the players already exist; this is normal.

## Options

A key value pair list of configuration options to be applied to the game. These options will only be applied on game creation, or if the option is not already set, in order to preserve any values that were set via commands.

### Well Known Game Options

#### VoteBars

Votebars are the little progress bar next to each player's name in the vote list. There are three options for `voteBars`:

- `hidden`: The votebar will not reflect reality in the case of Loved or Hated, but will treat them like they are normal. This means a Loved player's bar will never fill to 100%, and a Hated can go beyond it. 
- `open`: The votebar will not only reflect reality, but also show an exact count of how many votes are needed to lynch that person
- `bastard`: **Default** The votebar will reflect reality, but will not show a count. This means players can deduce Loved or Hated from the bars, but will have to be paying attention to notice. 

#### Chats

Certain games allow private messages between players to occur, this setting controlls whether or not that functionality is enabled for a given game.

There are two possible values for `chats`:

- `enabled`: private message threads between players are allowed and can be created with the `!chat` command.
- `disabled`: **default** private messages threads between players are not allowed and cannot be created with the `!chat` command

#### Postman

Postman Mode is a mode in which players can send messages to each other, but only through the bot; free chat is not allowed. If you wish to use the Postman Mode feature, this is the place to toggle it.

There are three possible values for `postman`:

- `off`: **default** If chats are enabled, they are free chats between players; no postmanning is done.
- `on`: Messages will be anonymised and sent to the recipiant. One chat per player will be created as an "inbox" (when the first message is sent to them), and all messages will come from "anonymous".
- `open`: Messages will be sent to the recipient. One chat per player will be created (upon receipt of the first message), but chats will maintain the name of the sender.

#### Postman-cc

If Postman mode is enabled, this allows a thread to be CC'd on all postman messages. This is meant for Club Ded usage (non-players and dead players watching the game proceed).

`postman-cc` should be supplied the ID or comma-separated list of IDs for the threads that should be cc'd on all messages. Messages will include context, regardless of the postman setting above.

#### Postman-public

If Postman mode is enabled, this will alert the main thread whenever a postman letter is sent. This will include both the sender and recipiant's names, but not the contents of the letter.

Possible values are:

- `none`: **default** No alerts will be sent to the game thread.
- A phase name such as `day`: alerts will be sent to the main thread during that phase
- `all`: Alerts will always be sent to the main thread

#### StripCommands

Cartain moderator commands use the text of the post or chat that triggers the command to send to players withing the game, this setting controlls whether any commands within the test are preserved or stripped.

There are two possible values for `stripCommands`:

- `enabled`: commands will be stripped when sending the text of the post or chat to the player. This will allow the moderator to send te same text to multiple players or to include commands in the text that the player does not know about.
- `disabled`: **default** commands will not be stripped and the text of the post or chat will be sent to the player as-is.

## DB

The file to use as a database. This is a human-readable JSON file that can be examined and debugged if the game enters an incorrect state; if you do, please shut the bot down first.

## Name

The name of the game, to be used in commands.

## Votebars

*Deprecated:* This config setting is deprecated and will be removed in future releases. Set this option via the options dictionary instead.

Votebars are the little progress bar next to each player's name in the vote list. There are three options for voting bars:

- Hidden: The votebar will not reflect reality in the case of Loved or Hated, but will treat them like they are normal. This means a Loved player's bar will never fill to 100%, and a Hated can go beyond it. 
- Open: The votebar will not only reflect reality, but also show an exact count of how many votes are needed to lynch that person
- Bastard: **Default** The votebar will reflect reality, but will not show a count. This means players can deduce Loved or Hated from the bars, but will have to be paying attention to notice. 
