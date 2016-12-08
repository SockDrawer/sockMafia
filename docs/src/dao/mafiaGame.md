<a name="sockmafia.src.dao.module_MafiaGame"></a>

## MafiaGame
sockMafia Game class

**Author:** Accalia  
**License**: MIT  

* [MafiaGame](#sockmafia.src.dao.module_MafiaGame)
    * [~MafiaGame](#sockmafia.src.dao.module_MafiaGame..MafiaGame)
        * [new MafiaGame(data, dao)](#new_sockmafia.src.dao.module_MafiaGame..MafiaGame_new)
        * [.topicId](#sockmafia.src.dao.module_MafiaGame..MafiaGame+topicId) ⇒ <code>number</code>
        * [.name](#sockmafia.src.dao.module_MafiaGame..MafiaGame+name) ⇒ <code>string</code>
        * [.day](#sockmafia.src.dao.module_MafiaGame..MafiaGame+day) ⇒ <code>number</code>
        * [.phase](#sockmafia.src.dao.module_MafiaGame..MafiaGame+phase) ⇒ <code>string</code>
        * [.isDay](#sockmafia.src.dao.module_MafiaGame..MafiaGame+isDay) ⇒ <code>boolean</code>
        * [.isNight](#sockmafia.src.dao.module_MafiaGame..MafiaGame+isNight) ⇒ <code>boolean</code>
        * [.isActive](#sockmafia.src.dao.module_MafiaGame..MafiaGame+isActive) ⇒ <code>boolean</code>
        * [.livePlayers](#sockmafia.src.dao.module_MafiaGame..MafiaGame+livePlayers) ⇒ <code>Array.&lt;MafiaUser&gt;</code>
        * [.deadPlayers](#sockmafia.src.dao.module_MafiaGame..MafiaGame+deadPlayers) ⇒ <code>Array.&lt;MafiaUser&gt;</code>
        * [.allPlayers](#sockmafia.src.dao.module_MafiaGame..MafiaGame+allPlayers) ⇒ <code>Array.&lt;MafiaUser&gt;</code>
        * [.moderators](#sockmafia.src.dao.module_MafiaGame..MafiaGame+moderators) ⇒ <code>Array.&lt;MafiaUser&gt;</code>
        * [.aliases](#sockmafia.src.dao.module_MafiaGame..MafiaGame+aliases) ⇒ <code>Array.&lt;string&gt;</code>
        * [.setActive()](#sockmafia.src.dao.module_MafiaGame..MafiaGame+setActive) ⇒ <code>Promise.&lt;Game&gt;</code>
        * [.setInactive()](#sockmafia.src.dao.module_MafiaGame..MafiaGame+setInactive) ⇒ <code>Promise.&lt;Game&gt;</code>
        * [.save()](#sockmafia.src.dao.module_MafiaGame..MafiaGame+save) ⇒ <code>Promise.&lt;MafiaGame&gt;</code>
        * [.addPlayer(username)](#sockmafia.src.dao.module_MafiaGame..MafiaGame+addPlayer) ⇒ <code>Promise.&lt;MafiaUser&gt;</code>
        * [.addModerator(username)](#sockmafia.src.dao.module_MafiaGame..MafiaGame+addModerator) ⇒ <code>Promise.&lt;MafiaUser&gt;</code>
        * [.getModerator(mod)](#sockmafia.src.dao.module_MafiaGame..MafiaGame+getModerator) ⇒ <code>MafiaUser</code>
        * [.getPlayer(user)](#sockmafia.src.dao.module_MafiaGame..MafiaGame+getPlayer) ⇒ <code>MafiaUser</code>
        * [.killPlayer(user)](#sockmafia.src.dao.module_MafiaGame..MafiaGame+killPlayer) ⇒ <code>Promise.&lt;MafiaUser&gt;</code>
        * [.resurectPlayer(user)](#sockmafia.src.dao.module_MafiaGame..MafiaGame+resurectPlayer) ⇒ <code>Promise.&lt;MafiaUser&gt;</code>
        * [.nextPhase()](#sockmafia.src.dao.module_MafiaGame..MafiaGame+nextPhase) ⇒ <code>Promise.&lt;MafiaGame&gt;</code>
        * [.newDay()](#sockmafia.src.dao.module_MafiaGame..MafiaGame+newDay) ⇒ <code>Promise.&lt;MafiaGame&gt;</code>
        * [.getAction(actor, [target], [type], [actionToken], [day], [includeRevokedActions])](#sockmafia.src.dao.module_MafiaGame..MafiaGame+getAction) ⇒ <code>MafiaAction</code>
        * [.getActionOfType([type], [target], [actionToken], [day], [includeRevokedActions])](#sockmafia.src.dao.module_MafiaGame..MafiaGame+getActionOfType) ⇒ <code>MafiaAction</code>
        * [.getActions([type], [day], [includeDeadPlayers])](#sockmafia.src.dao.module_MafiaGame..MafiaGame+getActions) ⇒ <code>Array.&lt;MafiaAction&gt;</code>
        * [.registerAction(postId, actor, [target], [type], [actionToken])](#sockmafia.src.dao.module_MafiaGame..MafiaGame+registerAction) ⇒ <code>Promise.&lt;MafiaAction&gt;</code>
        * [.revokeAction(postId, actor, [target], [type], [actionToken])](#sockmafia.src.dao.module_MafiaGame..MafiaGame+revokeAction) ⇒ <code>Promise.&lt;MafiaAction&gt;</code>
        * [.getValue(key)](#sockmafia.src.dao.module_MafiaGame..MafiaGame+getValue) ⇒ <code>\*</code>
        * [.setValue(key, data)](#sockmafia.src.dao.module_MafiaGame..MafiaGame+setValue) ⇒ <code>Promise.&lt;\*&gt;</code>
        * [.addAlias(alias)](#sockmafia.src.dao.module_MafiaGame..MafiaGame+addAlias) ⇒ <code>Promise</code>
        * [.removeAlias(alias)](#sockmafia.src.dao.module_MafiaGame..MafiaGame+removeAlias) ⇒ <code>Promise.&lt;boolean&gt;</code>
        * [.addTopic(topicId)](#sockmafia.src.dao.module_MafiaGame..MafiaGame+addTopic) ⇒ <code>Promise</code>
        * [.removeTopic(topicId)](#sockmafia.src.dao.module_MafiaGame..MafiaGame+removeTopic) ⇒ <code>Promise.&lt;boolean&gt;</code>
        * [.addChat(chatId)](#sockmafia.src.dao.module_MafiaGame..MafiaGame+addChat) ⇒ <code>Promise</code>
        * [.removeChat(chatId)](#sockmafia.src.dao.module_MafiaGame..MafiaGame+removeChat) ⇒ <code>Promise.&lt;boolean&gt;</code>
        * [.toJSON()](#sockmafia.src.dao.module_MafiaGame..MafiaGame+toJSON) ⇒ <code>object</code>
    * [~getUserSlug(user)](#sockmafia.src.dao.module_MafiaGame..getUserSlug) ⇒ <code>string</code>
    * [~getUser(game, source, user)](#sockmafia.src.dao.module_MafiaGame..getUser) ⇒ <code>MafiaUser</code>
    * [~shuffle(arr)](#sockmafia.src.dao.module_MafiaGame..shuffle) ⇒ <code>Array.&lt;\*&gt;</code>
    * [~setDefault(value, fallback)](#sockmafia.src.dao.module_MafiaGame..setDefault) ⇒ <code>\*</code>

<a name="sockmafia.src.dao.module_MafiaGame..MafiaGame"></a>

### MafiaGame~MafiaGame
MafiaGame class

**Kind**: inner class of <code>[MafiaGame](#sockmafia.src.dao.module_MafiaGame)</code>  

* [~MafiaGame](#sockmafia.src.dao.module_MafiaGame..MafiaGame)
    * [new MafiaGame(data, dao)](#new_sockmafia.src.dao.module_MafiaGame..MafiaGame_new)
    * [.topicId](#sockmafia.src.dao.module_MafiaGame..MafiaGame+topicId) ⇒ <code>number</code>
    * [.name](#sockmafia.src.dao.module_MafiaGame..MafiaGame+name) ⇒ <code>string</code>
    * [.day](#sockmafia.src.dao.module_MafiaGame..MafiaGame+day) ⇒ <code>number</code>
    * [.phase](#sockmafia.src.dao.module_MafiaGame..MafiaGame+phase) ⇒ <code>string</code>
    * [.isDay](#sockmafia.src.dao.module_MafiaGame..MafiaGame+isDay) ⇒ <code>boolean</code>
    * [.isNight](#sockmafia.src.dao.module_MafiaGame..MafiaGame+isNight) ⇒ <code>boolean</code>
    * [.isActive](#sockmafia.src.dao.module_MafiaGame..MafiaGame+isActive) ⇒ <code>boolean</code>
    * [.livePlayers](#sockmafia.src.dao.module_MafiaGame..MafiaGame+livePlayers) ⇒ <code>Array.&lt;MafiaUser&gt;</code>
    * [.deadPlayers](#sockmafia.src.dao.module_MafiaGame..MafiaGame+deadPlayers) ⇒ <code>Array.&lt;MafiaUser&gt;</code>
    * [.allPlayers](#sockmafia.src.dao.module_MafiaGame..MafiaGame+allPlayers) ⇒ <code>Array.&lt;MafiaUser&gt;</code>
    * [.moderators](#sockmafia.src.dao.module_MafiaGame..MafiaGame+moderators) ⇒ <code>Array.&lt;MafiaUser&gt;</code>
    * [.aliases](#sockmafia.src.dao.module_MafiaGame..MafiaGame+aliases) ⇒ <code>Array.&lt;string&gt;</code>
    * [.setActive()](#sockmafia.src.dao.module_MafiaGame..MafiaGame+setActive) ⇒ <code>Promise.&lt;Game&gt;</code>
    * [.setInactive()](#sockmafia.src.dao.module_MafiaGame..MafiaGame+setInactive) ⇒ <code>Promise.&lt;Game&gt;</code>
    * [.save()](#sockmafia.src.dao.module_MafiaGame..MafiaGame+save) ⇒ <code>Promise.&lt;MafiaGame&gt;</code>
    * [.addPlayer(username)](#sockmafia.src.dao.module_MafiaGame..MafiaGame+addPlayer) ⇒ <code>Promise.&lt;MafiaUser&gt;</code>
    * [.addModerator(username)](#sockmafia.src.dao.module_MafiaGame..MafiaGame+addModerator) ⇒ <code>Promise.&lt;MafiaUser&gt;</code>
    * [.getModerator(mod)](#sockmafia.src.dao.module_MafiaGame..MafiaGame+getModerator) ⇒ <code>MafiaUser</code>
    * [.getPlayer(user)](#sockmafia.src.dao.module_MafiaGame..MafiaGame+getPlayer) ⇒ <code>MafiaUser</code>
    * [.killPlayer(user)](#sockmafia.src.dao.module_MafiaGame..MafiaGame+killPlayer) ⇒ <code>Promise.&lt;MafiaUser&gt;</code>
    * [.resurectPlayer(user)](#sockmafia.src.dao.module_MafiaGame..MafiaGame+resurectPlayer) ⇒ <code>Promise.&lt;MafiaUser&gt;</code>
    * [.nextPhase()](#sockmafia.src.dao.module_MafiaGame..MafiaGame+nextPhase) ⇒ <code>Promise.&lt;MafiaGame&gt;</code>
    * [.newDay()](#sockmafia.src.dao.module_MafiaGame..MafiaGame+newDay) ⇒ <code>Promise.&lt;MafiaGame&gt;</code>
    * [.getAction(actor, [target], [type], [actionToken], [day], [includeRevokedActions])](#sockmafia.src.dao.module_MafiaGame..MafiaGame+getAction) ⇒ <code>MafiaAction</code>
    * [.getActionOfType([type], [target], [actionToken], [day], [includeRevokedActions])](#sockmafia.src.dao.module_MafiaGame..MafiaGame+getActionOfType) ⇒ <code>MafiaAction</code>
    * [.getActions([type], [day], [includeDeadPlayers])](#sockmafia.src.dao.module_MafiaGame..MafiaGame+getActions) ⇒ <code>Array.&lt;MafiaAction&gt;</code>
    * [.registerAction(postId, actor, [target], [type], [actionToken])](#sockmafia.src.dao.module_MafiaGame..MafiaGame+registerAction) ⇒ <code>Promise.&lt;MafiaAction&gt;</code>
    * [.revokeAction(postId, actor, [target], [type], [actionToken])](#sockmafia.src.dao.module_MafiaGame..MafiaGame+revokeAction) ⇒ <code>Promise.&lt;MafiaAction&gt;</code>
    * [.getValue(key)](#sockmafia.src.dao.module_MafiaGame..MafiaGame+getValue) ⇒ <code>\*</code>
    * [.setValue(key, data)](#sockmafia.src.dao.module_MafiaGame..MafiaGame+setValue) ⇒ <code>Promise.&lt;\*&gt;</code>
    * [.addAlias(alias)](#sockmafia.src.dao.module_MafiaGame..MafiaGame+addAlias) ⇒ <code>Promise</code>
    * [.removeAlias(alias)](#sockmafia.src.dao.module_MafiaGame..MafiaGame+removeAlias) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [.addTopic(topicId)](#sockmafia.src.dao.module_MafiaGame..MafiaGame+addTopic) ⇒ <code>Promise</code>
    * [.removeTopic(topicId)](#sockmafia.src.dao.module_MafiaGame..MafiaGame+removeTopic) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [.addChat(chatId)](#sockmafia.src.dao.module_MafiaGame..MafiaGame+addChat) ⇒ <code>Promise</code>
    * [.removeChat(chatId)](#sockmafia.src.dao.module_MafiaGame..MafiaGame+removeChat) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [.toJSON()](#sockmafia.src.dao.module_MafiaGame..MafiaGame+toJSON) ⇒ <code>object</code>

<a name="new_sockmafia.src.dao.module_MafiaGame..MafiaGame_new"></a>

#### new MafiaGame(data, dao)
Mafia Game constructor. Creates a new MafiaGame instance


| Param | Type | Description |
| --- | --- | --- |
| data | <code>object</code> | Persisted game data |
| data.name | <code>string</code> | Name of the game |
| data.topicId | <code>number</code> | Id of the topic the game is played in |
| data.day | <code>number</code> | Current day of the game |
| data.phases | <code>Array.&lt;string&gt;</code> | Configured day phases |
| data.phase | <code>string</code> | Current phase of day |
| data.isActive | <code>boolean</code> | Is Game Active? |
| data.livePlayers | <code>object.&lt;string, object&gt;</code> | Map of live players by userslug |
| data.deadPlayers | <code>object.&lt;string, object&gt;</code> | Map of dead players by userslug |
| data.moderators | <code>object.&lt;string, object&gt;</code> | Map of moderators by userslug |
| data.actions | <code>Array.&lt;object&gt;</code> | List of actions performed in this game |
| data.values | <code>object</code> | Key value map of custom values stored as part of the game |
| dao | <code>MafiaDao</code> | MafiaDao this game is a part of |

<a name="sockmafia.src.dao.module_MafiaGame..MafiaGame+topicId"></a>

#### mafiaGame.topicId ⇒ <code>number</code>
Get the topic id this game is playing in

**Kind**: instance property of <code>[MafiaGame](#sockmafia.src.dao.module_MafiaGame..MafiaGame)</code>  
**Returns**: <code>number</code> - the topicId the game is playing in  
<a name="sockmafia.src.dao.module_MafiaGame..MafiaGame+name"></a>

#### mafiaGame.name ⇒ <code>string</code>
Get the game name

**Kind**: instance property of <code>[MafiaGame](#sockmafia.src.dao.module_MafiaGame..MafiaGame)</code>  
**Returns**: <code>string</code> - The name of the game  
<a name="sockmafia.src.dao.module_MafiaGame..MafiaGame+day"></a>

#### mafiaGame.day ⇒ <code>number</code>
Get the day the game is in

**Kind**: instance property of <code>[MafiaGame](#sockmafia.src.dao.module_MafiaGame..MafiaGame)</code>  
**Returns**: <code>number</code> - The current day  
<a name="sockmafia.src.dao.module_MafiaGame..MafiaGame+phase"></a>

#### mafiaGame.phase ⇒ <code>string</code>
Gets the current phase of day the game is in

**Kind**: instance property of <code>[MafiaGame](#sockmafia.src.dao.module_MafiaGame..MafiaGame)</code>  
**Returns**: <code>string</code> - The current game phase  
<a name="sockmafia.src.dao.module_MafiaGame..MafiaGame+isDay"></a>

#### mafiaGame.isDay ⇒ <code>boolean</code>
Gets wether the game is in a day phase.

This is simply asking "does the current phase contain `day`?"

**Kind**: instance property of <code>[MafiaGame](#sockmafia.src.dao.module_MafiaGame..MafiaGame)</code>  
**Returns**: <code>boolean</code> - true if the current phase contains `day`, false otherwise  
<a name="sockmafia.src.dao.module_MafiaGame..MafiaGame+isNight"></a>

#### mafiaGame.isNight ⇒ <code>boolean</code>
Gets wether the game is in a night phase.

This is simply asking "does the current phase contain `night`?"

**Kind**: instance property of <code>[MafiaGame](#sockmafia.src.dao.module_MafiaGame..MafiaGame)</code>  
**Returns**: <code>boolean</code> - true if the current phase contains `night`, false otherwise  
<a name="sockmafia.src.dao.module_MafiaGame..MafiaGame+isActive"></a>

#### mafiaGame.isActive ⇒ <code>boolean</code>
gets wether the game is active

**Kind**: instance property of <code>[MafiaGame](#sockmafia.src.dao.module_MafiaGame..MafiaGame)</code>  
**Returns**: <code>boolean</code> - true if the game is active, false otherwise.  
<a name="sockmafia.src.dao.module_MafiaGame..MafiaGame+livePlayers"></a>

#### mafiaGame.livePlayers ⇒ <code>Array.&lt;MafiaUser&gt;</code>
Get a randomly ordered list of living players

**Kind**: instance property of <code>[MafiaGame](#sockmafia.src.dao.module_MafiaGame..MafiaGame)</code>  
**Returns**: <code>Array.&lt;MafiaUser&gt;</code> - A randomly ordered list of living players  
<a name="sockmafia.src.dao.module_MafiaGame..MafiaGame+deadPlayers"></a>

#### mafiaGame.deadPlayers ⇒ <code>Array.&lt;MafiaUser&gt;</code>
Get a randomly ordered list of dead players

**Kind**: instance property of <code>[MafiaGame](#sockmafia.src.dao.module_MafiaGame..MafiaGame)</code>  
**Returns**: <code>Array.&lt;MafiaUser&gt;</code> - A randomly ordered list of dead players  
<a name="sockmafia.src.dao.module_MafiaGame..MafiaGame+allPlayers"></a>

#### mafiaGame.allPlayers ⇒ <code>Array.&lt;MafiaUser&gt;</code>
Get a randomly ordered list of all players

**Kind**: instance property of <code>[MafiaGame](#sockmafia.src.dao.module_MafiaGame..MafiaGame)</code>  
**Returns**: <code>Array.&lt;MafiaUser&gt;</code> - A randomly ordered list of all players  
<a name="sockmafia.src.dao.module_MafiaGame..MafiaGame+moderators"></a>

#### mafiaGame.moderators ⇒ <code>Array.&lt;MafiaUser&gt;</code>
Get an ordered list of game moderators

**Kind**: instance property of <code>[MafiaGame](#sockmafia.src.dao.module_MafiaGame..MafiaGame)</code>  
**Returns**: <code>Array.&lt;MafiaUser&gt;</code> - An ordered list of game moderators  
<a name="sockmafia.src.dao.module_MafiaGame..MafiaGame+aliases"></a>

#### mafiaGame.aliases ⇒ <code>Array.&lt;string&gt;</code>
Get a list of the aliases for this game

**Kind**: instance property of <code>[MafiaGame](#sockmafia.src.dao.module_MafiaGame..MafiaGame)</code>  
**Returns**: <code>Array.&lt;string&gt;</code> - A list of aliases for this game.  
<a name="sockmafia.src.dao.module_MafiaGame..MafiaGame+setActive"></a>

#### mafiaGame.setActive() ⇒ <code>Promise.&lt;Game&gt;</code>
sets the game to active state

**Kind**: instance method of <code>[MafiaGame](#sockmafia.src.dao.module_MafiaGame..MafiaGame)</code>  
**Returns**: <code>Promise.&lt;Game&gt;</code> - resloves to self on completion  
<a name="sockmafia.src.dao.module_MafiaGame..MafiaGame+setInactive"></a>

#### mafiaGame.setInactive() ⇒ <code>Promise.&lt;Game&gt;</code>
sets the game to active state

**Kind**: instance method of <code>[MafiaGame](#sockmafia.src.dao.module_MafiaGame..MafiaGame)</code>  
**Returns**: <code>Promise.&lt;Game&gt;</code> - resloves to self on completion  
<a name="sockmafia.src.dao.module_MafiaGame..MafiaGame+save"></a>

#### mafiaGame.save() ⇒ <code>Promise.&lt;MafiaGame&gt;</code>
Save game data to disk

**Kind**: instance method of <code>[MafiaGame](#sockmafia.src.dao.module_MafiaGame..MafiaGame)</code>  
**Returns**: <code>Promise.&lt;MafiaGame&gt;</code> - Resolves to self on completion.  
<a name="sockmafia.src.dao.module_MafiaGame..MafiaGame+addPlayer"></a>

#### mafiaGame.addPlayer(username) ⇒ <code>Promise.&lt;MafiaUser&gt;</code>
Add a new player to the list of living players

**Kind**: instance method of <code>[MafiaGame](#sockmafia.src.dao.module_MafiaGame..MafiaGame)</code>  
**Returns**: <code>Promise.&lt;MafiaUser&gt;</code> - Resolves to added user, Rejects if user already exists in game  

| Param | Type | Description |
| --- | --- | --- |
| username | <code>string</code> | Username of the new player |

<a name="sockmafia.src.dao.module_MafiaGame..MafiaGame+addModerator"></a>

#### mafiaGame.addModerator(username) ⇒ <code>Promise.&lt;MafiaUser&gt;</code>
Add a moderator to the game

**Kind**: instance method of <code>[MafiaGame](#sockmafia.src.dao.module_MafiaGame..MafiaGame)</code>  
**Returns**: <code>Promise.&lt;MafiaUser&gt;</code> - Resolves to added moderator, Rejects if moderator already exists in game  

| Param | Type | Description |
| --- | --- | --- |
| username | <code>string</code> | Username of the game moderator |

<a name="sockmafia.src.dao.module_MafiaGame..MafiaGame+getModerator"></a>

#### mafiaGame.getModerator(mod) ⇒ <code>MafiaUser</code>
Get a game moderator

**Kind**: instance method of <code>[MafiaGame](#sockmafia.src.dao.module_MafiaGame..MafiaGame)</code>  
**Returns**: <code>MafiaUser</code> - Requested MafiaUser, null if no matching user found  

| Param | Type | Description |
| --- | --- | --- |
| mod | <code>string</code> &#124; <code>MafiaUser</code> | Moderator to fetch |

<a name="sockmafia.src.dao.module_MafiaGame..MafiaGame+getPlayer"></a>

#### mafiaGame.getPlayer(user) ⇒ <code>MafiaUser</code>
Get a player

**Kind**: instance method of <code>[MafiaGame](#sockmafia.src.dao.module_MafiaGame..MafiaGame)</code>  
**Returns**: <code>MafiaUser</code> - Requested User  
**Throws**:

- <code>Error.&lt;E_USER_NOT_EXIST&gt;</code> Throes error if requested user is not part of the game


| Param | Type | Description |
| --- | --- | --- |
| user | <code>string</code> &#124; <code>MafiaUser</code> | User to fetch |

<a name="sockmafia.src.dao.module_MafiaGame..MafiaGame+killPlayer"></a>

#### mafiaGame.killPlayer(user) ⇒ <code>Promise.&lt;MafiaUser&gt;</code>
Kill a player in the game

**Kind**: instance method of <code>[MafiaGame](#sockmafia.src.dao.module_MafiaGame..MafiaGame)</code>  
**Returns**: <code>Promise.&lt;MafiaUser&gt;</code> - Resolves to terminated user, Rejects if target user was not alive to be killed.  

| Param | Type | Description |
| --- | --- | --- |
| user | <code>string</code> &#124; <code>MafiaUser</code> | User to kill |

<a name="sockmafia.src.dao.module_MafiaGame..MafiaGame+resurectPlayer"></a>

#### mafiaGame.resurectPlayer(user) ⇒ <code>Promise.&lt;MafiaUser&gt;</code>
Return a player to the laand of the living

**Kind**: instance method of <code>[MafiaGame](#sockmafia.src.dao.module_MafiaGame..MafiaGame)</code>  
**Returns**: <code>Promise.&lt;MafiaUser&gt;</code> - resolves to the resurected user, rejects if user was not dead to resurect.  

| Param | Type | Description |
| --- | --- | --- |
| user | <code>string</code> &#124; <code>MafiaUser</code> | Player to Lazarus |

<a name="sockmafia.src.dao.module_MafiaGame..MafiaGame+nextPhase"></a>

#### mafiaGame.nextPhase() ⇒ <code>Promise.&lt;MafiaGame&gt;</code>
Advance to the next phase of day

Advances automatically to the next day if in the last phase of the day

**Kind**: instance method of <code>[MafiaGame](#sockmafia.src.dao.module_MafiaGame..MafiaGame)</code>  
**Returns**: <code>Promise.&lt;MafiaGame&gt;</code> - Resolves to self after advancing phase.  
<a name="sockmafia.src.dao.module_MafiaGame..MafiaGame+newDay"></a>

#### mafiaGame.newDay() ⇒ <code>Promise.&lt;MafiaGame&gt;</code>
Advance to the first phase of the next day

This will skip any unplayed phases in the current day.

**Kind**: instance method of <code>[MafiaGame](#sockmafia.src.dao.module_MafiaGame..MafiaGame)</code>  
**Returns**: <code>Promise.&lt;MafiaGame&gt;</code> - Resolves to self after advancing day  
<a name="sockmafia.src.dao.module_MafiaGame..MafiaGame+getAction"></a>

#### mafiaGame.getAction(actor, [target], [type], [actionToken], [day], [includeRevokedActions]) ⇒ <code>MafiaAction</code>
Get a specific game action

**Kind**: instance method of <code>[MafiaGame](#sockmafia.src.dao.module_MafiaGame..MafiaGame)</code>  
**Returns**: <code>MafiaAction</code> - Action matching the provided query, null if no action matched query  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| actor | <code>string</code> &#124; <code>MafiaUser</code> |  | Actor for the requested action |
| [target] | <code>string</code> &#124; <code>MafiaUser</code> |  | Target for the requested action |
| [type] | <code>string</code> | <code>&quot;&#x27;vote&#x27;&quot;</code> | Action type of the requested action |
| [actionToken] | <code>string</code> |  | ActionToken of the requested action |
| [day] | <code>number</code> | <code>this.day</code> | Day of the game for the requested action |
| [includeRevokedActions] | <code>boolean</code> | <code>true</code> | If true include actions that have been revoked |

<a name="sockmafia.src.dao.module_MafiaGame..MafiaGame+getActionOfType"></a>

#### mafiaGame.getActionOfType([type], [target], [actionToken], [day], [includeRevokedActions]) ⇒ <code>MafiaAction</code>
Get latest game action of the given type

**Kind**: instance method of <code>[MafiaGame](#sockmafia.src.dao.module_MafiaGame..MafiaGame)</code>  
**Returns**: <code>MafiaAction</code> - Action matching the provided query, null if no action matched query  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [type] | <code>string</code> | <code>&quot;&#x27;vote&#x27;&quot;</code> | Action type of the requested action |
| [target] | <code>string</code> &#124; <code>MafiaUser</code> |  | Target for the requested action |
| [actionToken] | <code>string</code> |  | ActionToken of the requested action |
| [day] | <code>number</code> | <code>this.day</code> | Day of the game for the requested action |
| [includeRevokedActions] | <code>boolean</code> | <code>false</code> | If true include actions that have been revoked |

<a name="sockmafia.src.dao.module_MafiaGame..MafiaGame+getActions"></a>

#### mafiaGame.getActions([type], [day], [includeDeadPlayers]) ⇒ <code>Array.&lt;MafiaAction&gt;</code>
Get actions for a particular day of a particular type

**Kind**: instance method of <code>[MafiaGame](#sockmafia.src.dao.module_MafiaGame..MafiaGame)</code>  
**Returns**: <code>Array.&lt;MafiaAction&gt;</code> - List of actions that match the provided query  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [type] | <code>string</code> | <code>&quot;&#x27;vote&#x27;&quot;</code> | Action type to retrieve |
| [day] | <code>number</code> | <code>this.day</code> | Day to retrieve actions for |
| [includeDeadPlayers] | <code>boolean</code> | <code>false</code> | Include actions cast by players who are now dead? |

<a name="sockmafia.src.dao.module_MafiaGame..MafiaGame+registerAction"></a>

#### mafiaGame.registerAction(postId, actor, [target], [type], [actionToken]) ⇒ <code>Promise.&lt;MafiaAction&gt;</code>
Register a new action

Automatically revokes matching prior action by actor

**Kind**: instance method of <code>[MafiaGame](#sockmafia.src.dao.module_MafiaGame..MafiaGame)</code>  
**Returns**: <code>Promise.&lt;MafiaAction&gt;</code> - Resolves to created action  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| postId | <code>number</code> |  | Id of the post the ation was cast in |
| actor | <code>string</code> &#124; <code>MafiaUser</code> |  | Actor for the Action |
| [target] | <code>string</code> &#124; <code>MafiaAction</code> | <code>null</code> | Target for the Action |
| [type] | <code>string</code> | <code>&quot;&#x27;vote&#x27;&quot;</code> | Type of action to register |
| [actionToken] | <code>string</code> | <code>&quot;&#x27;vote&#x27;&quot;</code> | Token of the action to register |

<a name="sockmafia.src.dao.module_MafiaGame..MafiaGame+revokeAction"></a>

#### mafiaGame.revokeAction(postId, actor, [target], [type], [actionToken]) ⇒ <code>Promise.&lt;MafiaAction&gt;</code>
Revoke a registered  action

**Kind**: instance method of <code>[MafiaGame](#sockmafia.src.dao.module_MafiaGame..MafiaGame)</code>  
**Returns**: <code>Promise.&lt;MafiaAction&gt;</code> - Resolves to revoked action  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| postId | <code>number</code> |  | Id of the post the action was revokec in |
| actor | <code>string</code> &#124; <code>MafiaUser</code> |  | Actor for the Action |
| [target] | <code>string</code> &#124; <code>MafiaAction</code> | <code>null</code> | Target for the Action |
| [type] | <code>string</code> | <code>&quot;&#x27;vote&#x27;&quot;</code> | Type of action to revoke |
| [actionToken] | <code>string</code> | <code>&quot;&#x27;vote&#x27;&quot;</code> | Token of the action to revoke |

<a name="sockmafia.src.dao.module_MafiaGame..MafiaGame+getValue"></a>

#### mafiaGame.getValue(key) ⇒ <code>\*</code>
Get a custom value attached to the game

**Kind**: instance method of <code>[MafiaGame](#sockmafia.src.dao.module_MafiaGame..MafiaGame)</code>  
**Returns**: <code>\*</code> - Stored value for `key`  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | Value storage key |

<a name="sockmafia.src.dao.module_MafiaGame..MafiaGame+setValue"></a>

#### mafiaGame.setValue(key, data) ⇒ <code>Promise.&lt;\*&gt;</code>
Store a custom value attached to the game

**Kind**: instance method of <code>[MafiaGame](#sockmafia.src.dao.module_MafiaGame..MafiaGame)</code>  
**Returns**: <code>Promise.&lt;\*&gt;</code> - Resolves to prior stored value  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | Value storage key |
| data | <code>\*</code> | Value to store |

<a name="sockmafia.src.dao.module_MafiaGame..MafiaGame+addAlias"></a>

#### mafiaGame.addAlias(alias) ⇒ <code>Promise</code>
Add an alias to this game

**Kind**: instance method of <code>[MafiaGame](#sockmafia.src.dao.module_MafiaGame..MafiaGame)</code>  
**Returns**: <code>Promise</code> - Resolves when alias has been added, Rejects if alias would conflict.  

| Param | Type | Description |
| --- | --- | --- |
| alias | <code>string</code> | Alias to add to the game |

<a name="sockmafia.src.dao.module_MafiaGame..MafiaGame+removeAlias"></a>

#### mafiaGame.removeAlias(alias) ⇒ <code>Promise.&lt;boolean&gt;</code>
Remove an alias from this game

**Kind**: instance method of <code>[MafiaGame](#sockmafia.src.dao.module_MafiaGame..MafiaGame)</code>  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - Resolves true if alias existed, false otherwise  

| Param | Type | Description |
| --- | --- | --- |
| alias | <code>string</code> | Alias to remove from the game |

<a name="sockmafia.src.dao.module_MafiaGame..MafiaGame+addTopic"></a>

#### mafiaGame.addTopic(topicId) ⇒ <code>Promise</code>
Add a topic to this game

**Kind**: instance method of <code>[MafiaGame](#sockmafia.src.dao.module_MafiaGame..MafiaGame)</code>  
**Returns**: <code>Promise</code> - Resolves when topic has been added, Rejects if topic would conflict.  

| Param | Type | Description |
| --- | --- | --- |
| topicId | <code>number</code> | ID of topic to add to the game |

<a name="sockmafia.src.dao.module_MafiaGame..MafiaGame+removeTopic"></a>

#### mafiaGame.removeTopic(topicId) ⇒ <code>Promise.&lt;boolean&gt;</code>
Remove a topic from this game

**Kind**: instance method of <code>[MafiaGame](#sockmafia.src.dao.module_MafiaGame..MafiaGame)</code>  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - Resolves true if topic was member of game, false otherwise.  

| Param | Type | Description |
| --- | --- | --- |
| topicId | <code>number</code> | ID of topic to remove from the game |

<a name="sockmafia.src.dao.module_MafiaGame..MafiaGame+addChat"></a>

#### mafiaGame.addChat(chatId) ⇒ <code>Promise</code>
Add a chat thread to this game

**Kind**: instance method of <code>[MafiaGame](#sockmafia.src.dao.module_MafiaGame..MafiaGame)</code>  
**Returns**: <code>Promise</code> - Resolves when chat has been added, Rejects if chat would conflict.  

| Param | Type | Description |
| --- | --- | --- |
| chatId | <code>number</code> | ID of chat to add to the game |

<a name="sockmafia.src.dao.module_MafiaGame..MafiaGame+removeChat"></a>

#### mafiaGame.removeChat(chatId) ⇒ <code>Promise.&lt;boolean&gt;</code>
Remove a chat from this game

**Kind**: instance method of <code>[MafiaGame](#sockmafia.src.dao.module_MafiaGame..MafiaGame)</code>  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - Resolves true if chat was member of game, false otherwise.  

| Param | Type | Description |
| --- | --- | --- |
| chatId | <code>number</code> | ID of chat to remove from the game |

<a name="sockmafia.src.dao.module_MafiaGame..MafiaGame+toJSON"></a>

#### mafiaGame.toJSON() ⇒ <code>object</code>
Create a serializeable representation of the DAO object.

**Kind**: instance method of <code>[MafiaGame](#sockmafia.src.dao.module_MafiaGame..MafiaGame)</code>  
**Returns**: <code>object</code> - A serializeable clone of this action's internal data store.  
<a name="sockmafia.src.dao.module_MafiaGame..getUserSlug"></a>

### MafiaGame~getUserSlug(user) ⇒ <code>string</code>
Turn a string or a MafiaUser into a userslug.

used for indexes into objects and for matching users.

**Kind**: inner method of <code>[MafiaGame](#sockmafia.src.dao.module_MafiaGame)</code>  
**Returns**: <code>string</code> - Userslug for the input  

| Param | Type | Description |
| --- | --- | --- |
| user | <code>string</code> &#124; <code>MafiaUser</code> | Username of user or MafiaUser object |

<a name="sockmafia.src.dao.module_MafiaGame..getUser"></a>

### MafiaGame~getUser(game, source, user) ⇒ <code>MafiaUser</code>
Get a MafiaUser from a data dictionary

**Kind**: inner method of <code>[MafiaGame](#sockmafia.src.dao.module_MafiaGame)</code>  
**Returns**: <code>MafiaUser</code> - Mathing MafiaUser or null if no user matched  

| Param | Type | Description |
| --- | --- | --- |
| game | <code>MafiaGame</code> | The MafiaGame the user belongs to. |
| source | <code>object</code> | Serialized User Mapping to retrieve MafiaUser from |
| user | <code>string</code> &#124; <code>MafiaUser</code> | User to retrieve from `source` |

<a name="sockmafia.src.dao.module_MafiaGame..shuffle"></a>

### MafiaGame~shuffle(arr) ⇒ <code>Array.&lt;\*&gt;</code>
Perform an in place Fischer Yates shuffle on an array

**Kind**: inner method of <code>[MafiaGame](#sockmafia.src.dao.module_MafiaGame)</code>  
**Returns**: <code>Array.&lt;\*&gt;</code> - The shuffled input array, because why not?  

| Param | Type | Description |
| --- | --- | --- |
| arr | <code>Array.&lt;\*&gt;</code> | Array to shuffle. Will be modified in place |

<a name="sockmafia.src.dao.module_MafiaGame..setDefault"></a>

### MafiaGame~setDefault(value, fallback) ⇒ <code>\*</code>
Return the existing value, unless falsy then return fallback value

**Kind**: inner method of <code>[MafiaGame](#sockmafia.src.dao.module_MafiaGame)</code>  
**Returns**: <code>\*</code> - `value` if `value` is truthy, else `fallback`  

| Param | Type | Description |
| --- | --- | --- |
| value | <code>\*</code> | Existing value |
| fallback | <code>\*</code> | Fallback value |

