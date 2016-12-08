<a name="module_sockmafia"></a>

## sockmafia
Mafiabot plugin

Helps run mafia games, providing features such as vote tracking and listing.

**Author:** Accalia, Dreikin, Yamikuronue  
**License**: MIT  

* [sockmafia](#module_sockmafia)
    * _static_
        * [.defaultConfig](#module_sockmafia.defaultConfig)
            * [.db](#module_sockmafia.defaultConfig.db) : <code>string</code>
        * [.activate()](#module_sockmafia.activate) ⇒ <code>Promise</code>
        * [.plugin(forum, config)](#module_sockmafia.plugin) ⇒ <code>Object</code>
        * [.createFromFile(plugConfig)](#module_sockmafia.createFromFile) ⇒ <code>Promise</code>
    * _inner_
        * [~registerMods(game, mods)](#module_sockmafia..registerMods)
        * [~registerPlayers(game, players)](#module_sockmafia..registerPlayers)

<a name="module_sockmafia.defaultConfig"></a>

### sockmafia.defaultConfig
Default plugin configuration

**Kind**: static property of <code>[sockmafia](#module_sockmafia)</code>  
<a name="module_sockmafia.defaultConfig.db"></a>

#### defaultConfig.db : <code>string</code>
File location for database.

**Kind**: static property of <code>[defaultConfig](#module_sockmafia.defaultConfig)</code>  
**Default**: <code>&quot;./mafiadb&quot;</code>  
<a name="module_sockmafia.activate"></a>

### sockmafia.activate() ⇒ <code>Promise</code>
Sockbot 3.0 Activation function

**Kind**: static method of <code>[sockmafia](#module_sockmafia)</code>  
**Returns**: <code>Promise</code> - A promise that will resolve when the activation is complete  
<a name="module_sockmafia.plugin"></a>

### sockmafia.plugin(forum, config) ⇒ <code>Object</code>
Sockbot 3.0 Plugin function

**Kind**: static method of <code>[sockmafia](#module_sockmafia)</code>  
**Returns**: <code>Object</code> - A temporary object representing this instance of the forum  

| Param | Type | Description |
| --- | --- | --- |
| forum | <code>Forum</code> | The forum provider's Forum class |
| config | <code>Object</code> | The plugin-specific configuration |

<a name="module_sockmafia.createFromFile"></a>

### sockmafia.createFromFile(plugConfig) ⇒ <code>Promise</code>
Create the game from the configuration file

**Kind**: static method of <code>[sockmafia](#module_sockmafia)</code>  
**Returns**: <code>Promise</code> - A promise that resolves when the creation is complete  

| Param | Type | Description |
| --- | --- | --- |
| plugConfig | <code>Object</code> | The configuration file |

<a name="module_sockmafia..registerMods"></a>

### sockmafia~registerMods(game, mods)
Register the mods listed in the configuration.

**Kind**: inner method of <code>[sockmafia](#module_sockmafia)</code>  

| Param | Type | Description |
| --- | --- | --- |
| game | <code>Number</code> | Thread number for the game. |
| mods | <code>Array.&lt;string&gt;</code> | Array of mod names to add to the game. |

<a name="module_sockmafia..registerPlayers"></a>

### sockmafia~registerPlayers(game, players)
Register the players listed in the configuration.

**Kind**: inner method of <code>[sockmafia](#module_sockmafia)</code>  

| Param | Type | Description |
| --- | --- | --- |
| game | <code>Number</code> | Thread number for the game. |
| players | <code>Array.&lt;string&gt;</code> | Array of player names to add to the game. |

