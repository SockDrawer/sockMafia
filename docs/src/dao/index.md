<a name="sockmafia.src.dao.module_MafiaDao"></a>

## MafiaDao
sockMafia DAO Provider

**Author:** Accalia  
**License**: MIT  

* [MafiaDao](#sockmafia.src.dao.module_MafiaDao)
    * [~MafiaDao](#sockmafia.src.dao.module_MafiaDao..MafiaDao)
        * [new MafiaDao(connection)](#new_sockmafia.src.dao.module_MafiaDao..MafiaDao_new)
        * [.createGame(topicId, [name], [active])](#sockmafia.src.dao.module_MafiaDao..MafiaDao+createGame) ⇒ <code>Promise.&lt;MafiaGame&gt;</code>
        * [.getGame(game)](#sockmafia.src.dao.module_MafiaDao..MafiaDao+getGame) ⇒ <code>Promise.&lt;MafiaGame&gt;</code>
        * [.getGameByTopicId(topicId)](#sockmafia.src.dao.module_MafiaDao..MafiaDao+getGameByTopicId) ⇒ <code>Promise.&lt;MafiaGame&gt;</code>
        * [.getGameByChatId(chatId)](#sockmafia.src.dao.module_MafiaDao..MafiaDao+getGameByChatId) ⇒ <code>Promise.&lt;MafiaGame&gt;</code>
        * [.getGameByName(name)](#sockmafia.src.dao.module_MafiaDao..MafiaDao+getGameByName) ⇒ <code>Promise.&lt;MafiaGame&gt;</code>
        * [.getGameByAlias(alias)](#sockmafia.src.dao.module_MafiaDao..MafiaDao+getGameByAlias) ⇒ <code>Promise.&lt;MafiaGame&gt;</code>
        * [.load()](#sockmafia.src.dao.module_MafiaDao..MafiaDao+load) ⇒ <code>Promise.&lt;Array&gt;</code>
        * [.save()](#sockmafia.src.dao.module_MafiaDao..MafiaDao+save) ⇒ <code>Promise</code>
        * [.toJSON()](#sockmafia.src.dao.module_MafiaDao..MafiaDao+toJSON) ⇒ <code>object</code>
    * [~readData(filename)](#sockmafia.src.dao.module_MafiaDao..readData) ⇒ <code>Promise.&lt;Array&gt;</code>
    * [~saveData(filename, data)](#sockmafia.src.dao.module_MafiaDao..saveData) ⇒ <code>Promise</code>

<a name="sockmafia.src.dao.module_MafiaDao..MafiaDao"></a>

### MafiaDao~MafiaDao
MafiaDao Class

**Kind**: inner class of <code>[MafiaDao](#sockmafia.src.dao.module_MafiaDao)</code>  

* [~MafiaDao](#sockmafia.src.dao.module_MafiaDao..MafiaDao)
    * [new MafiaDao(connection)](#new_sockmafia.src.dao.module_MafiaDao..MafiaDao_new)
    * [.createGame(topicId, [name], [active])](#sockmafia.src.dao.module_MafiaDao..MafiaDao+createGame) ⇒ <code>Promise.&lt;MafiaGame&gt;</code>
    * [.getGame(game)](#sockmafia.src.dao.module_MafiaDao..MafiaDao+getGame) ⇒ <code>Promise.&lt;MafiaGame&gt;</code>
    * [.getGameByTopicId(topicId)](#sockmafia.src.dao.module_MafiaDao..MafiaDao+getGameByTopicId) ⇒ <code>Promise.&lt;MafiaGame&gt;</code>
    * [.getGameByChatId(chatId)](#sockmafia.src.dao.module_MafiaDao..MafiaDao+getGameByChatId) ⇒ <code>Promise.&lt;MafiaGame&gt;</code>
    * [.getGameByName(name)](#sockmafia.src.dao.module_MafiaDao..MafiaDao+getGameByName) ⇒ <code>Promise.&lt;MafiaGame&gt;</code>
    * [.getGameByAlias(alias)](#sockmafia.src.dao.module_MafiaDao..MafiaDao+getGameByAlias) ⇒ <code>Promise.&lt;MafiaGame&gt;</code>
    * [.load()](#sockmafia.src.dao.module_MafiaDao..MafiaDao+load) ⇒ <code>Promise.&lt;Array&gt;</code>
    * [.save()](#sockmafia.src.dao.module_MafiaDao..MafiaDao+save) ⇒ <code>Promise</code>
    * [.toJSON()](#sockmafia.src.dao.module_MafiaDao..MafiaDao+toJSON) ⇒ <code>object</code>

<a name="new_sockmafia.src.dao.module_MafiaDao..MafiaDao_new"></a>

#### new MafiaDao(connection)
MafiaDao constructor. Creates a new MafiaDao instance


| Param | Type | Description |
| --- | --- | --- |
| connection | <code>string</code> | File Path of the data store this dao will use |

<a name="sockmafia.src.dao.module_MafiaDao..MafiaDao+createGame"></a>

#### mafiaDao.createGame(topicId, [name], [active]) ⇒ <code>Promise.&lt;MafiaGame&gt;</code>
Create a new MafiaGame and store it in this DAO

**Kind**: instance method of <code>[MafiaDao](#sockmafia.src.dao.module_MafiaDao..MafiaDao)</code>  
**Returns**: <code>Promise.&lt;MafiaGame&gt;</code> - Resolves to created game, rejects if preconditions or save state fails  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| topicId | <code>number</code> |  | Game topic. Must be an integer |
| [name] | <code>string</code> |  | Custom name for the game |
| [active] | <code>boolean</code> | <code>true</code> | Start the game in this active state |

<a name="sockmafia.src.dao.module_MafiaDao..MafiaDao+getGame"></a>

#### mafiaDao.getGame(game) ⇒ <code>Promise.&lt;MafiaGame&gt;</code>
Retrieve a previously created game by topicId or name

**Kind**: instance method of <code>[MafiaDao](#sockmafia.src.dao.module_MafiaDao..MafiaDao)</code>  
**Returns**: <code>Promise.&lt;MafiaGame&gt;</code> - Resolves to requested game, rejects when read error occurs or game not found  

| Param | Type | Description |
| --- | --- | --- |
| game | <code>number</code> &#124; <code>string</code> | Game identifier. |

<a name="sockmafia.src.dao.module_MafiaDao..MafiaDao+getGameByTopicId"></a>

#### mafiaDao.getGameByTopicId(topicId) ⇒ <code>Promise.&lt;MafiaGame&gt;</code>
Retrieve a previously created game by topicId

**Kind**: instance method of <code>[MafiaDao](#sockmafia.src.dao.module_MafiaDao..MafiaDao)</code>  
**Returns**: <code>Promise.&lt;MafiaGame&gt;</code> - Resolves to requested game, rejects when read error occurs or game not found  

| Param | Type | Description |
| --- | --- | --- |
| topicId | <code>number</code> | Game Topic identifier. Must be an integer |

<a name="sockmafia.src.dao.module_MafiaDao..MafiaDao+getGameByChatId"></a>

#### mafiaDao.getGameByChatId(chatId) ⇒ <code>Promise.&lt;MafiaGame&gt;</code>
Retrieve a previously created game by chatId

**Kind**: instance method of <code>[MafiaDao](#sockmafia.src.dao.module_MafiaDao..MafiaDao)</code>  
**Returns**: <code>Promise.&lt;MafiaGame&gt;</code> - Resolves to requested game, rejects when read error occurs or game not found  

| Param | Type | Description |
| --- | --- | --- |
| chatId | <code>number</code> | Chat identifier. Must be an integer |

<a name="sockmafia.src.dao.module_MafiaDao..MafiaDao+getGameByName"></a>

#### mafiaDao.getGameByName(name) ⇒ <code>Promise.&lt;MafiaGame&gt;</code>
Retrieve a previously created game by topicId

**Kind**: instance method of <code>[MafiaDao](#sockmafia.src.dao.module_MafiaDao..MafiaDao)</code>  
**Returns**: <code>Promise.&lt;MafiaGame&gt;</code> - Resolves to requested game, rejects when read error occurs or game not found  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Custom game name |

<a name="sockmafia.src.dao.module_MafiaDao..MafiaDao+getGameByAlias"></a>

#### mafiaDao.getGameByAlias(alias) ⇒ <code>Promise.&lt;MafiaGame&gt;</code>
Retrieve a previously created game by alias

**Kind**: instance method of <code>[MafiaDao](#sockmafia.src.dao.module_MafiaDao..MafiaDao)</code>  
**Returns**: <code>Promise.&lt;MafiaGame&gt;</code> - Resolves to requested game, rejects when read error occurs or game not found  

| Param | Type | Description |
| --- | --- | --- |
| alias | <code>string</code> | Custom game alias |

<a name="sockmafia.src.dao.module_MafiaDao..MafiaDao+load"></a>

#### mafiaDao.load() ⇒ <code>Promise.&lt;Array&gt;</code>
Load data from disk, once.

Cache read results to remove need to fetch from disk multiple times

**Kind**: instance method of <code>[MafiaDao](#sockmafia.src.dao.module_MafiaDao..MafiaDao)</code>  
**Returns**: <code>Promise.&lt;Array&gt;</code> - Resolves to read data, rejects on read error  
<a name="sockmafia.src.dao.module_MafiaDao..MafiaDao+save"></a>

#### mafiaDao.save() ⇒ <code>Promise</code>
Save DAO Data to disk

**Kind**: instance method of <code>[MafiaDao](#sockmafia.src.dao.module_MafiaDao..MafiaDao)</code>  
**Returns**: <code>Promise</code> - Resolves when data has been written to disk, rejects wehn write error occurs  
<a name="sockmafia.src.dao.module_MafiaDao..MafiaDao+toJSON"></a>

#### mafiaDao.toJSON() ⇒ <code>object</code>
Create a serializeable representation of the DAO object.

**Kind**: instance method of <code>[MafiaDao](#sockmafia.src.dao.module_MafiaDao..MafiaDao)</code>  
**Returns**: <code>object</code> - A serializeable clone of this dao's internal data store.  
<a name="sockmafia.src.dao.module_MafiaDao..readData"></a>

### MafiaDao~readData(filename) ⇒ <code>Promise.&lt;Array&gt;</code>
Read a serialized mafia configuration from disk and resolve to deserialized contents

Assumes an ENOENT error on read is okay and resolves to the empty array in this case.

**Kind**: inner method of <code>[MafiaDao](#sockmafia.src.dao.module_MafiaDao)</code>  
**Returns**: <code>Promise.&lt;Array&gt;</code> - Resolves to the deserialized mafia configurations. Rejects on read or parse error.  

| Param | Type | Description |
| --- | --- | --- |
| filename | <code>string</code> | Filename to read |

<a name="sockmafia.src.dao.module_MafiaDao..saveData"></a>

### MafiaDao~saveData(filename, data) ⇒ <code>Promise</code>
Save serialized data to disk

**Kind**: inner method of <code>[MafiaDao](#sockmafia.src.dao.module_MafiaDao)</code>  
**Returns**: <code>Promise</code> - Resolves when data has been written, rejects on serialization or file access error  

| Param | Type | Description |
| --- | --- | --- |
| filename | <code>string</code> | Filename to write |
| data | <code>\*</code> | Data to serialize and write |

