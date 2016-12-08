<a name="sockmafia.src.dao.module_MafiaUser"></a>

## MafiaUser
sockMafia User class

**Author:** Accalia  
**License**: MIT  

* [MafiaUser](#sockmafia.src.dao.module_MafiaUser)
    * [~MafiaUser](#sockmafia.src.dao.module_MafiaUser..MafiaUser)
        * [new MafiaUser(data, game)](#new_sockmafia.src.dao.module_MafiaUser..MafiaUser_new)
        * [.username](#sockmafia.src.dao.module_MafiaUser..MafiaUser+username) ⇒ <code>string</code>
        * [.userslug](#sockmafia.src.dao.module_MafiaUser..MafiaUser+userslug) ⇒ <code>string</code>
        * [.isAlive](#sockmafia.src.dao.module_MafiaUser..MafiaUser+isAlive) ⇒ <code>boolean</code>
        * [.isAlive](#sockmafia.src.dao.module_MafiaUser..MafiaUser+isAlive)
        * [.isModerator](#sockmafia.src.dao.module_MafiaUser..MafiaUser+isModerator) ⇒ <code>boolean</code>
        * [.getProperties([filterTo])](#sockmafia.src.dao.module_MafiaUser..MafiaUser+getProperties) ⇒ <code>array.&lt;string&gt;</code>
        * [.hasProperty(property)](#sockmafia.src.dao.module_MafiaUser..MafiaUser+hasProperty) ⇒ <code>boolean</code>
        * [.addProperty(property)](#sockmafia.src.dao.module_MafiaUser..MafiaUser+addProperty) ⇒ <code>Promise.&lt;boolean&gt;</code>
        * [.removeProperty(property)](#sockmafia.src.dao.module_MafiaUser..MafiaUser+removeProperty) ⇒ <code>Promise.&lt;boolean&gt;</code>
        * [.toJSON()](#sockmafia.src.dao.module_MafiaUser..MafiaUser+toJSON) ⇒ <code>object</code>

<a name="sockmafia.src.dao.module_MafiaUser..MafiaUser"></a>

### MafiaUser~MafiaUser
MafiaUser class

**Kind**: inner class of <code>[MafiaUser](#sockmafia.src.dao.module_MafiaUser)</code>  

* [~MafiaUser](#sockmafia.src.dao.module_MafiaUser..MafiaUser)
    * [new MafiaUser(data, game)](#new_sockmafia.src.dao.module_MafiaUser..MafiaUser_new)
    * [.username](#sockmafia.src.dao.module_MafiaUser..MafiaUser+username) ⇒ <code>string</code>
    * [.userslug](#sockmafia.src.dao.module_MafiaUser..MafiaUser+userslug) ⇒ <code>string</code>
    * [.isAlive](#sockmafia.src.dao.module_MafiaUser..MafiaUser+isAlive) ⇒ <code>boolean</code>
    * [.isAlive](#sockmafia.src.dao.module_MafiaUser..MafiaUser+isAlive)
    * [.isModerator](#sockmafia.src.dao.module_MafiaUser..MafiaUser+isModerator) ⇒ <code>boolean</code>
    * [.getProperties([filterTo])](#sockmafia.src.dao.module_MafiaUser..MafiaUser+getProperties) ⇒ <code>array.&lt;string&gt;</code>
    * [.hasProperty(property)](#sockmafia.src.dao.module_MafiaUser..MafiaUser+hasProperty) ⇒ <code>boolean</code>
    * [.addProperty(property)](#sockmafia.src.dao.module_MafiaUser..MafiaUser+addProperty) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [.removeProperty(property)](#sockmafia.src.dao.module_MafiaUser..MafiaUser+removeProperty) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [.toJSON()](#sockmafia.src.dao.module_MafiaUser..MafiaUser+toJSON) ⇒ <code>object</code>

<a name="new_sockmafia.src.dao.module_MafiaUser..MafiaUser_new"></a>

#### new MafiaUser(data, game)
Mafia User constructor. Creates a new MafiaUser instance


| Param | Type | Description |
| --- | --- | --- |
| data | <code>object</code> | Persisted user data |
| game | <code>MafiaGame</code> | MafiaGame this user is a part of |

<a name="sockmafia.src.dao.module_MafiaUser..MafiaUser+username"></a>

#### mafiaUser.username ⇒ <code>string</code>
Get the username of the MafiaUser

**Kind**: instance property of <code>[MafiaUser](#sockmafia.src.dao.module_MafiaUser..MafiaUser)</code>  
**Returns**: <code>string</code> - Username of the user  
<a name="sockmafia.src.dao.module_MafiaUser..MafiaUser+userslug"></a>

#### mafiaUser.userslug ⇒ <code>string</code>
Get the case normalized userslug of the user, useful for comparing users.

**Kind**: instance property of <code>[MafiaUser](#sockmafia.src.dao.module_MafiaUser..MafiaUser)</code>  
**Returns**: <code>string</code> - Userslug of the user  
<a name="sockmafia.src.dao.module_MafiaUser..MafiaUser+isAlive"></a>

#### mafiaUser.isAlive ⇒ <code>boolean</code>
Is the user a living player?

**Kind**: instance property of <code>[MafiaUser](#sockmafia.src.dao.module_MafiaUser..MafiaUser)</code>  
**Returns**: <code>boolean</code> - True if the user is a living player, false otherwise.  
<a name="sockmafia.src.dao.module_MafiaUser..MafiaUser+isAlive"></a>

#### mafiaUser.isAlive
set alive status of the User

TODO: this shouldn't be a setter as it does not save status when mutated.

**Kind**: instance property of <code>[MafiaUser](#sockmafia.src.dao.module_MafiaUser..MafiaUser)</code>  

| Param | Type | Description |
| --- | --- | --- |
| value | <code>boolean</code> | True to make the player live, false to make the player dead. |

<a name="sockmafia.src.dao.module_MafiaUser..MafiaUser+isModerator"></a>

#### mafiaUser.isModerator ⇒ <code>boolean</code>
Is the user a moderator?

**Kind**: instance property of <code>[MafiaUser](#sockmafia.src.dao.module_MafiaUser..MafiaUser)</code>  
**Returns**: <code>boolean</code> - true if user is a moderator of the game, false otherwise.  
<a name="sockmafia.src.dao.module_MafiaUser..MafiaUser+getProperties"></a>

#### mafiaUser.getProperties([filterTo]) ⇒ <code>array.&lt;string&gt;</code>
Get custom properties associated with the user.

Optionally filter the list to only those properties requested

**Kind**: instance method of <code>[MafiaUser](#sockmafia.src.dao.module_MafiaUser..MafiaUser)</code>  
**Returns**: <code>array.&lt;string&gt;</code> - Custom properties on the user, with any requested filtering applied  

| Param | Type | Description |
| --- | --- | --- |
| [filterTo] | <code>array.&lt;string&gt;</code> | Array or properties to filter results to. |

<a name="sockmafia.src.dao.module_MafiaUser..MafiaUser+hasProperty"></a>

#### mafiaUser.hasProperty(property) ⇒ <code>boolean</code>
Determine if custom property is associated with the user.

**Kind**: instance method of <code>[MafiaUser](#sockmafia.src.dao.module_MafiaUser..MafiaUser)</code>  
**Returns**: <code>boolean</code> - true if the user has the property, false otherwise  

| Param | Type | Description |
| --- | --- | --- |
| property | <code>string</code> | Array or properties to filter results to. |

<a name="sockmafia.src.dao.module_MafiaUser..MafiaUser+addProperty"></a>

#### mafiaUser.addProperty(property) ⇒ <code>Promise.&lt;boolean&gt;</code>
Add a custom property to the user.

**Kind**: instance method of <code>[MafiaUser](#sockmafia.src.dao.module_MafiaUser..MafiaUser)</code>  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - Resolves true if the property was added, false if it already existed on the user  

| Param | Type | Description |
| --- | --- | --- |
| property | <code>string</code> | The property to add to the user |

<a name="sockmafia.src.dao.module_MafiaUser..MafiaUser+removeProperty"></a>

#### mafiaUser.removeProperty(property) ⇒ <code>Promise.&lt;boolean&gt;</code>
Remove a custom operty from the user

**Kind**: instance method of <code>[MafiaUser](#sockmafia.src.dao.module_MafiaUser..MafiaUser)</code>  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - Resolves true if property was removed, false if property was not present to remove  

| Param | Type | Description |
| --- | --- | --- |
| property | <code>string</code> | the property to remove from the user |

<a name="sockmafia.src.dao.module_MafiaUser..MafiaUser+toJSON"></a>

#### mafiaUser.toJSON() ⇒ <code>object</code>
Create a serializeable representation of the DAO object.

**Kind**: instance method of <code>[MafiaUser](#sockmafia.src.dao.module_MafiaUser..MafiaUser)</code>  
**Returns**: <code>object</code> - A serializeable clone of this action's internal data store.  
