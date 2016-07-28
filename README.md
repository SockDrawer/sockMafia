[![Stories in Ready](https://badge.waffle.io/SockDrawer/sockMafia.png?label=ready&title=Ready)](https://waffle.io/SockDrawer/sockMafia)
[![Dependency Status](https://david-dm.org/sockDrawer/sockMafia/master.svg)](https://david-dm.org/SockDrawer/sockMafia/master)
[![devDependency Status](https://david-dm.org/sockDrawer/sockMafia/master/dev-status.svg)](https://david-dm.org/SockDrawer/sockMafia/master#info=devDependencies)
[![optionalDependency Status](https://david-dm.org/sockDrawer/sockMafia/master/optional-status.svg)](https://david-dm.org/SockDrawer/sockMafia/master#info=optionalDependencies)
[![Build Status](https://travis-ci.org/SockDrawer/sockMafia.svg?branch=master)](https://travis-ci.org/SockDrawer/sockMafia)
[![Coverage Status](https://coveralls.io/repos/github/SockDrawer/sockMafia/badge.svg?branch=master)](https://coveralls.io/github/SockDrawer/sockMafia?branch=master)

#SockBot Mafia

Mafia plugin for [SockBot](https://sockbot.rtfd.org/en/latest/) version 3.1.1 or later.

##Usage

###Player Commands
*All player commands must be run in the thread the game is being played in, as they are a matter of public record.*

* **join**: Join a game. The game in question must be in the "Preparing" stage, not yet running or completed. 
* **list-players**: List the current living players in the game. 
* **list-all-players**: List all players in the current game, whether alive, dead, or moderator.
* **list-votes**: List the current day's votes. 
* **vote**: Vote for a player to be executed. Takes one parameter: the name of the player to be executed.
* **for**: Alternate form of **vote**. The two forms are identical unless the player in question is a doublevoter. 
* **nolynch**: Vote for the group to not lynch anyone this current day. If No-lynch wins a vote, no execution occurs and the day ends.
* **no-lynch**: Identical to **nolynch**. 
* **unvote**: Rescind your current vote.
* **target**: Target a player with your night action (if any). 

###Moderator commands

* **prepare**: Start a new game in the current thread. The person who executes this command becomes the moderator for the new game. Takes one argument: a descriptor for the game.
* **start**: Move the game from a preparation state to the running state, closing signups and allowing voting. Must be run in the game thread. 
* **set**: Set a voting property for a player. Takes two arguments: the target username, such as '@yamikuronue', and the propery, one of loved, hated, or doublevoter.
* **next-phase**: Move to the next game phase. Transitions night to day, and day to night. Must be used in the game thread. Takes no argumetns. 
* **new-day**: Move to the start of the next day. Takes no arguments. 
* **kill**: Kill a player. Does not transition the day. Takes one argument: the target username.
* **end**: Finish the game. This prevents further voting in the thread of a game that has concluded. Must be run in the game thread. 
* **add**: Add a thread or chat to the game. Syntax: `!add thread 1234 to testMafia` or `!add chat 123 to testMafia`. Also try `!add this to testMafia` from the thread or chat you wish to add. 
* **list-night-actions**: List all the actions being performed this night so you can resolve them and move to day. Does not resolve or move to day automatically. 

##Installation

*Note: This does not work on Node 6* for the time being, as our dependencies have not updated yet. Sorry for the inconvenience. 

The preferred method of installation is via NPM; simply run this command within the SockBot installation folder:
```
npm install sockbot-mafia
```

Other methods of installation are possible e.g. cloning the git repository, but only installation via NPM is supported.

###Post Install Setup

If you installed via NPM skip this step as NPM has already installed all necessary dependencies.
Otherwise you will need to run the following command in the folder where you installed SockBot Mafia:
```
npm install
```

##Configuration

ocumentation about configuration options for the bot!
YAML example:
```
---
core:
  username: username
  password: password
  owner: owner
plugins:
  sockbot-mafia: {}
```

JSON example:
```
{
  "core": {
    "username": "username",
    "password": "password",
    "owner": "owner"
  },
  "plugins": {
    "sockbot-mafia": {}
  }
}
```

Note that these examples assume an NPM-based installation; other installation methods may require the path to `Mafia.js` (without file extension) be specified explicitly.

YAML example:
```
---
core:
  username: username
  password: password
  owner: owner
plugins:
  '../path/to/Mafia': {}
    -
```

JSON example:
```
{
  "core": {
    "username": "username",
    "password": "password",
    "owner": "owner"
  },
  "plugins": {
    "../path/to/Mafia": {}
  }
}
```
