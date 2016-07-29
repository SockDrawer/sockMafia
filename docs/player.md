# How to play Mafia

Welcome to Mafia! Mafia is a wonderful social game of intrigue, lies, and murder. You, the player, are given a role and a scenario by the DM and have to do your best to root out traitors... or betray the rest of the players.

## The rules

The game is run and moderated by a Game Master or Moderator, hereafter referred to as the GM. When the game begins, the GM will give you a *role*. This will usually consist of three things:
 - Your flavor: are you a villager in a town? A cook on a spaceship? Something else?
 - Your win condition, or what you have to do to win the game
 - Any powers you might have in addition to the usual lynch vote

The GM will also post in a *game thread* the opening scene: what you find yourself doing and why. Typically, someone will be dead; by convention, this is usually the GM. 

### Factions
Usually, there are two factions: Town and Scum. (These are generic terms; they will usually be called something appropriate to the game flavor in the game, like Villager and Mafia, or Samurai and Ronin.)

*Town* has a simple win condition: kill all the Scum. It is usually phrased something like "You win when all threats to your society are destroyed".

*Scum* have a similarly simple win condition: control the vote. Scum will win when there are as many Scum players remaining as Town players; this is to prevent a boring cycle of Scum voting all the rest of the Town to death at the end of the game.

*Third Party* factions can exist, and may have different win conditions, like "survive until the end no matter who wins" or "Kill all other players".

### Day phase
After the opening post, the game proceeds to the *day phase*. During the day, all players may converse openly. There is typically one game mechanic in play: the lynch vote. The players may collectively lynch one player; this is a democratic process, decided by a simple majority.

When a player is lynched, they are removed from the game. In addition, their role card is (usually) revealed to the group. If you are Town faction, your goal is to use this lynch mechanic to kill the Scum players; if you are Scum, your goal is to lynch Town players or force a "no lynch" scenario where nobody dies.

To vote for a player to be lynched, use the `vote` command or the `for` command, like so:

`!vote Trump`

`@vote for Trump` (if the bot's name is @vote, which is common)

To see the list of votes, use the `list-votes` command. This will tell you what votes have been cast and revoked, link to the posts in which they were cast, and show how close someone is to dying as well as the number of votes needed to lynch them.

### Night phase
After a lynch, or when time expires, the game moves to the *night phase*. During this phase, usually, the Scum get a "faction kill". This means that, as a group, they can decide on one person to kill that night. 

Other roles may have night powers that target players as well; for example, a Cop can target a player and learn their alignment (Scum vs Town), and a Doctor can target a player to "save" (if they would be killed, they do not die).

To target a player, use the `target` command, like so:

`!target RobinHood`

Remember that Scum can only kill one person, so if subsequent `target` commands are issued by scum players, they will overwrite the previous target. 

# Bot command reference

The following commands are availible to players:

## List-players
**Alias:** `listPlayers`

Lists the currently living players in the game.

## List-all-players
**Alias**: `listAllPlayers`

Lists all players, including dead ones. 

## Join

Join the game. Can only be used before the game starts. 

## For

Vote for a player to be lynched. 

## Vote

Vote for a player to be lynched. If you are a doublevoter, this will use the "second vote" rather than the "first vote", and thus not overwrite your previous vote. Otherwise, this behaves identical to `for`

## List-votes
**Alias**: listVotes

List the current day's vote tally, including rescinded votes. Will also show how many are needed to lynch and when the day ends (if set).

## Unvote

Form 1: `!unvote`
Revokes your current vote. If you are a doublevoter, revokes both votes.

Form 2: `!unvote Trump`
Revokes any vote for Trump, but does not revoke any other votes. Important for doublevoters. 

## Nolynch
**Alias**: no-lynch

Votes to not lynch. If this option wins, the day will end prematurely. 

## Target

Registers an intent to target another player. This will be delivered to the GM to act upon, depending on your role.