<a name="sockmafia.module_MafiaModController"></a>

## MafiaModController
sockMafia Mod controller

**Author:** Yamikuronue  
**License**: MIT  

* [MafiaModController](#sockmafia.module_MafiaModController)
    * [~MafiaModController](#sockmafia.module_MafiaModController..MafiaModController)
        * [new MafiaModController(d)](#new_sockmafia.module_MafiaModController..MafiaModController_new)
        * [.activate(forum)](#sockmafia.module_MafiaModController..MafiaModController+activate)
        * [.sendRoleCard(command)](#sockmafia.module_MafiaModController..MafiaModController+sendRoleCard) ⇒ <code>Promise</code>
        * [.setOption(command)](#sockmafia.module_MafiaModController..MafiaModController+setOption) ⇒ <code>Promise</code>
        * [.addHandler(command)](#sockmafia.module_MafiaModController..MafiaModController+addHandler) ⇒ <code>Promise</code>
        * [.setHandler(command)](#sockmafia.module_MafiaModController..MafiaModController+setHandler)
        * [.phaseHandler(command)](#sockmafia.module_MafiaModController..MafiaModController+phaseHandler) ⇒ <code>Promise</code>
        * [.dayHandler(command)](#sockmafia.module_MafiaModController..MafiaModController+dayHandler) ⇒ <code>Promise</code>
        * [.killHandler(command)](#sockmafia.module_MafiaModController..MafiaModController+killHandler) ⇒ <code>Promise</code>
        * [.listNAHandler(command)](#sockmafia.module_MafiaModController..MafiaModController+listNAHandler) ⇒ <code>Promise</code>
    * [~logRecoveredError(error)](#sockmafia.module_MafiaModController..logRecoveredError)
    * [~logDebug(statement)](#sockmafia.module_MafiaModController..logDebug)
    * [~advance()](#sockmafia.module_MafiaModController..advance) ⇒

<a name="sockmafia.module_MafiaModController..MafiaModController"></a>

### MafiaModController~MafiaModController
The controller class for Mafiabot

**Kind**: inner class of <code>[MafiaModController](#sockmafia.module_MafiaModController)</code>  

* [~MafiaModController](#sockmafia.module_MafiaModController..MafiaModController)
    * [new MafiaModController(d)](#new_sockmafia.module_MafiaModController..MafiaModController_new)
    * [.activate(forum)](#sockmafia.module_MafiaModController..MafiaModController+activate)
    * [.sendRoleCard(command)](#sockmafia.module_MafiaModController..MafiaModController+sendRoleCard) ⇒ <code>Promise</code>
    * [.setOption(command)](#sockmafia.module_MafiaModController..MafiaModController+setOption) ⇒ <code>Promise</code>
    * [.addHandler(command)](#sockmafia.module_MafiaModController..MafiaModController+addHandler) ⇒ <code>Promise</code>
    * [.setHandler(command)](#sockmafia.module_MafiaModController..MafiaModController+setHandler)
    * [.phaseHandler(command)](#sockmafia.module_MafiaModController..MafiaModController+phaseHandler) ⇒ <code>Promise</code>
    * [.dayHandler(command)](#sockmafia.module_MafiaModController..MafiaModController+dayHandler) ⇒ <code>Promise</code>
    * [.killHandler(command)](#sockmafia.module_MafiaModController..MafiaModController+killHandler) ⇒ <code>Promise</code>
    * [.listNAHandler(command)](#sockmafia.module_MafiaModController..MafiaModController+listNAHandler) ⇒ <code>Promise</code>

<a name="new_sockmafia.module_MafiaModController..MafiaModController_new"></a>

#### new MafiaModController(d)
The constructor


| Param | Type | Description |
| --- | --- | --- |
| d | <code>sockmafia.src.dao.MafiaDao</code> | The dao to use to persist the data |

<a name="sockmafia.module_MafiaModController..MafiaModController+activate"></a>

#### mafiaModController.activate(forum)
Activate the controller

**Kind**: instance method of <code>[MafiaModController](#sockmafia.module_MafiaModController..MafiaModController)</code>  

| Param | Type | Description |
| --- | --- | --- |
| forum | <code>Forum</code> | The forum to activate for |

<a name="sockmafia.module_MafiaModController..MafiaModController+sendRoleCard"></a>

#### mafiaModController.sendRoleCard(command) ⇒ <code>Promise</code>
Sends the contents of the post or chat containing the command to the target users as their role card.

If you, as a bastard mod, wish to omit information from the rolecard set the game option `stripCommands` to `enabled` 
to remove all commands from the role card when sending it to the player

Usage:

`!send-rolecard TargetUsername in TargetGame`

**Kind**: instance method of <code>[MafiaModController](#sockmafia.module_MafiaModController..MafiaModController)</code>  
**Returns**: <code>Promise</code> - A promise that will resolve when the command is complete  

| Param | Type | Description |
| --- | --- | --- |
| command | <code>Command</code> | The command being executed |

<a name="sockmafia.module_MafiaModController..MafiaModController+setOption"></a>

#### mafiaModController.setOption(command) ⇒ <code>Promise</code>
Sets various game level configuration options.

Aliases:

- set-value
- setvalue
- option

Usage:

`!set-option chats equal enabled in testMafia`

**Kind**: instance method of <code>[MafiaModController](#sockmafia.module_MafiaModController..MafiaModController)</code>  
**Returns**: <code>Promise</code> - A promise that will resolve when the command is complete  

| Param | Type | Description |
| --- | --- | --- |
| command | <code>Command</code> | The command being executed |

<a name="sockmafia.module_MafiaModController..MafiaModController+addHandler"></a>

#### mafiaModController.addHandler(command) ⇒ <code>Promise</code>
Add a thread or chat to the game so that commands can be executed in it. 
Examples:
 - !add thread 123 testmafia 
 - !add thread 123 to testMafia
 - !add chat 123 testMafia
 - !add chat 123 to testMafia
 - !add this testMafia
 - !add this to testMafia

**Kind**: instance method of <code>[MafiaModController](#sockmafia.module_MafiaModController..MafiaModController)</code>  
**Returns**: <code>Promise</code> - A promise that will resolve when the command is complete  

| Param | Type | Description |
| --- | --- | --- |
| command | <code>Command</code> | The command being executed |

<a name="sockmafia.module_MafiaModController..MafiaModController+setHandler"></a>

#### mafiaModController.setHandler(command)
Set: set a prperty for a player.
No game rules; this sets up rules for voting

**Kind**: instance method of <code>[MafiaModController](#sockmafia.module_MafiaModController..MafiaModController)</code>  

| Param | Type | Description |
| --- | --- | --- |
| command | <code>Sockbot.commands.command</code> | The command object |

<a name="sockmafia.module_MafiaModController..MafiaModController+phaseHandler"></a>

#### mafiaModController.phaseHandler(command) ⇒ <code>Promise</code>
Next-phase: A mod function that moves to the next phase
Must be used in the game thread.

Game rules:
 - A game can advance to night when it is in the day phase
 - A game can only be advanced by the mod
 - When the game is advanced to night, a new day does not start

**Kind**: instance method of <code>[MafiaModController](#sockmafia.module_MafiaModController..MafiaModController)</code>  
**Returns**: <code>Promise</code> - A promise that will resolve when the game is ready  

| Param | Type | Description |
| --- | --- | --- |
| command | <code>commands.command</code> | The command that was passed in. |

**Example**  
```js
!next-phase
```
<a name="sockmafia.module_MafiaModController..MafiaModController+dayHandler"></a>

#### mafiaModController.dayHandler(command) ⇒ <code>Promise</code>
New-day: A mod function that starts a new day
Must be used in the game thread.

Game rules:
 - A game can advance to day when it is in the night phase
 - A game can advance to night when it is in the day phase
 - A game can only be advanced by the mod
 - When the game is advanced to day, a new day starts
 - When the game is advanced to night, a new day does not start
 - When a new day starts, the vote counts from the previous day are reset
 - When a new day starts, the list of players is output for convenience
 - When a new day starts, the "to-lynch" count is output for convenience

**Kind**: instance method of <code>[MafiaModController](#sockmafia.module_MafiaModController..MafiaModController)</code>  
**Returns**: <code>Promise</code> - A promise that will resolve when the game is ready  

| Param | Type | Description |
| --- | --- | --- |
| command | <code>commands.command</code> | The command that was passed in. |

**Example**  
```js
!new-day
```
<a name="sockmafia.module_MafiaModController..MafiaModController+killHandler"></a>

#### mafiaModController.killHandler(command) ⇒ <code>Promise</code>
Kill: A mod function that modkills or nightkills a player.
Must be used in the game thread.

Game rules:
 - A player can only be killed if they are already in the game.
 - A player can only be killed if they are alive.
 - A player can only be !killed by the mod.

**Kind**: instance method of <code>[MafiaModController](#sockmafia.module_MafiaModController..MafiaModController)</code>  
**Returns**: <code>Promise</code> - A promise that will resolve when the game is ready  

| Param | Type | Description |
| --- | --- | --- |
| command | <code>commands.command</code> | The command that was passed in. |

**Example**  
```js
!kill playerName
```
<a name="sockmafia.module_MafiaModController..MafiaModController+listNAHandler"></a>

#### mafiaModController.listNAHandler(command) ⇒ <code>Promise</code>
List Night Actions: A mod function that lists the current night actions.
Useful when the mod is ready to take action on them, or for shits and grins
in club ded

**Kind**: instance method of <code>[MafiaModController](#sockmafia.module_MafiaModController..MafiaModController)</code>  
**Returns**: <code>Promise</code> - A promise that will resolve when the game is ready  

| Param | Type | Description |
| --- | --- | --- |
| command | <code>commands.command</code> | The command that was passed in. |

**Example**  
```js
!list-night-actions testMafia
```
**Example**  
```js
!list-night-actions 123
```
<a name="sockmafia.module_MafiaModController..logRecoveredError"></a>

### MafiaModController~logRecoveredError(error)
Log an error that was recovered from

**Kind**: inner method of <code>[MafiaModController](#sockmafia.module_MafiaModController)</code>  

| Param | Type | Description |
| --- | --- | --- |
| error | <code>Error</code> | The error to log |

<a name="sockmafia.module_MafiaModController..logDebug"></a>

### MafiaModController~logDebug(statement)
Log a debug statement

**Kind**: inner method of <code>[MafiaModController](#sockmafia.module_MafiaModController)</code>  

| Param | Type | Description |
| --- | --- | --- |
| statement | <code>String</code> | The statement to log |

<a name="sockmafia.module_MafiaModController..advance"></a>

### MafiaModController~advance() ⇒
Advance the day.

**Kind**: inner method of <code>[MafiaModController](#sockmafia.module_MafiaModController)</code>  
**Returns**: Promise that resolves when the action is complete  
