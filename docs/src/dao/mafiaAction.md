<a name="sockmafia.src.dao.module_MafiaAction"></a>

## MafiaAction
sockMafia Action class

**Author:** Accalia  
**License**: MIT  

* [MafiaAction](#sockmafia.src.dao.module_MafiaAction)
    * [~MafiaAction](#sockmafia.src.dao.module_MafiaAction..MafiaAction)
        * [new MafiaAction(data, game)](#new_sockmafia.src.dao.module_MafiaAction..MafiaAction_new)
        * [.postId](#sockmafia.src.dao.module_MafiaAction..MafiaAction+postId) ⇒ <code>number</code>
        * [.actor](#sockmafia.src.dao.module_MafiaAction..MafiaAction+actor) ⇒ <code>MafiaUser</code>
        * [.target](#sockmafia.src.dao.module_MafiaAction..MafiaAction+target) ⇒ <code>MafiaUser</code>
        * [.action](#sockmafia.src.dao.module_MafiaAction..MafiaAction+action) ⇒ <code>string</code>
        * [.token](#sockmafia.src.dao.module_MafiaAction..MafiaAction+token) ⇒ <code>string</code>
        * [.isCurrent](#sockmafia.src.dao.module_MafiaAction..MafiaAction+isCurrent) ⇒ <code>boolean</code>
        * [.revokedId](#sockmafia.src.dao.module_MafiaAction..MafiaAction+revokedId) ⇒ <code>number</code>
        * [.day](#sockmafia.src.dao.module_MafiaAction..MafiaAction+day) ⇒ <code>number</code>
        * [.revoke(postId)](#sockmafia.src.dao.module_MafiaAction..MafiaAction+revoke) ⇒ <code>Promise.&lt;MafiaAction&gt;</code>
        * [.toJSON()](#sockmafia.src.dao.module_MafiaAction..MafiaAction+toJSON) ⇒ <code>object</code>

<a name="sockmafia.src.dao.module_MafiaAction..MafiaAction"></a>

### MafiaAction~MafiaAction
MafiaAction class

**Kind**: inner class of <code>[MafiaAction](#sockmafia.src.dao.module_MafiaAction)</code>  

* [~MafiaAction](#sockmafia.src.dao.module_MafiaAction..MafiaAction)
    * [new MafiaAction(data, game)](#new_sockmafia.src.dao.module_MafiaAction..MafiaAction_new)
    * [.postId](#sockmafia.src.dao.module_MafiaAction..MafiaAction+postId) ⇒ <code>number</code>
    * [.actor](#sockmafia.src.dao.module_MafiaAction..MafiaAction+actor) ⇒ <code>MafiaUser</code>
    * [.target](#sockmafia.src.dao.module_MafiaAction..MafiaAction+target) ⇒ <code>MafiaUser</code>
    * [.action](#sockmafia.src.dao.module_MafiaAction..MafiaAction+action) ⇒ <code>string</code>
    * [.token](#sockmafia.src.dao.module_MafiaAction..MafiaAction+token) ⇒ <code>string</code>
    * [.isCurrent](#sockmafia.src.dao.module_MafiaAction..MafiaAction+isCurrent) ⇒ <code>boolean</code>
    * [.revokedId](#sockmafia.src.dao.module_MafiaAction..MafiaAction+revokedId) ⇒ <code>number</code>
    * [.day](#sockmafia.src.dao.module_MafiaAction..MafiaAction+day) ⇒ <code>number</code>
    * [.revoke(postId)](#sockmafia.src.dao.module_MafiaAction..MafiaAction+revoke) ⇒ <code>Promise.&lt;MafiaAction&gt;</code>
    * [.toJSON()](#sockmafia.src.dao.module_MafiaAction..MafiaAction+toJSON) ⇒ <code>object</code>

<a name="new_sockmafia.src.dao.module_MafiaAction..MafiaAction_new"></a>

#### new MafiaAction(data, game)
Mafia Action constructor. Creates a new MafiaAction instance


| Param | Type | Description |
| --- | --- | --- |
| data | <code>object</code> | Persisted action data |
| game | <code>MafiaGame</code> | MafiaGame this action is a part of |

<a name="sockmafia.src.dao.module_MafiaAction..MafiaAction+postId"></a>

#### mafiaAction.postId ⇒ <code>number</code>
Get the postId this action was created for

**Kind**: instance property of <code>[MafiaAction](#sockmafia.src.dao.module_MafiaAction..MafiaAction)</code>  
**Returns**: <code>number</code> - Post Id  
<a name="sockmafia.src.dao.module_MafiaAction..MafiaAction+actor"></a>

#### mafiaAction.actor ⇒ <code>MafiaUser</code>
Get the MafiaUser who created this action

**Kind**: instance property of <code>[MafiaAction](#sockmafia.src.dao.module_MafiaAction..MafiaAction)</code>  
**Returns**: <code>MafiaUser</code> - Actor user.  
<a name="sockmafia.src.dao.module_MafiaAction..MafiaAction+target"></a>

#### mafiaAction.target ⇒ <code>MafiaUser</code>
Get the MafiaUser who created this action. May be null if action is targetless

**Kind**: instance property of <code>[MafiaAction](#sockmafia.src.dao.module_MafiaAction..MafiaAction)</code>  
**Returns**: <code>MafiaUser</code> - Target User or null if action is targetless  
<a name="sockmafia.src.dao.module_MafiaAction..MafiaAction+action"></a>

#### mafiaAction.action ⇒ <code>string</code>
Get the action type of this MafiaAction.

Default type is 'vote'

**Kind**: instance property of <code>[MafiaAction](#sockmafia.src.dao.module_MafiaAction..MafiaAction)</code>  
**Returns**: <code>string</code> - Action type  
<a name="sockmafia.src.dao.module_MafiaAction..MafiaAction+token"></a>

#### mafiaAction.token ⇒ <code>string</code>
Get the action token for this MafiaAction.

The default token is 'vote'

**Kind**: instance property of <code>[MafiaAction](#sockmafia.src.dao.module_MafiaAction..MafiaAction)</code>  
**Returns**: <code>string</code> - Action token  
<a name="sockmafia.src.dao.module_MafiaAction..MafiaAction+isCurrent"></a>

#### mafiaAction.isCurrent ⇒ <code>boolean</code>
Is this Action current?

Returns true if action is current, false if cancelled or overridden by a later action

**Kind**: instance property of <code>[MafiaAction](#sockmafia.src.dao.module_MafiaAction..MafiaAction)</code>  
**Returns**: <code>boolean</code> - True if action is current, false otherwise  
<a name="sockmafia.src.dao.module_MafiaAction..MafiaAction+revokedId"></a>

#### mafiaAction.revokedId ⇒ <code>number</code>
Get the post Id this action was revoked in, or undefined if this action has not been revoked

**Kind**: instance property of <code>[MafiaAction](#sockmafia.src.dao.module_MafiaAction..MafiaAction)</code>  
**Returns**: <code>number</code> - Post Id this MafiaAction was revoked in.  
<a name="sockmafia.src.dao.module_MafiaAction..MafiaAction+day"></a>

#### mafiaAction.day ⇒ <code>number</code>
Get the day this MafiaAction was created in

**Kind**: instance property of <code>[MafiaAction](#sockmafia.src.dao.module_MafiaAction..MafiaAction)</code>  
**Returns**: <code>number</code> - The Day this MafiaAction was created in  
<a name="sockmafia.src.dao.module_MafiaAction..MafiaAction+revoke"></a>

#### mafiaAction.revoke(postId) ⇒ <code>Promise.&lt;MafiaAction&gt;</code>
Revoke this MafiaAction as of a particular post.

**Kind**: instance method of <code>[MafiaAction](#sockmafia.src.dao.module_MafiaAction..MafiaAction)</code>  
**Returns**: <code>Promise.&lt;MafiaAction&gt;</code> - Resolves to the revoked action on success.  

| Param | Type | Description |
| --- | --- | --- |
| postId | <code>number</code> | The Id of the post that revoked the action |

<a name="sockmafia.src.dao.module_MafiaAction..MafiaAction+toJSON"></a>

#### mafiaAction.toJSON() ⇒ <code>object</code>
Create a serializeable representation of the DAO object.

**Kind**: instance method of <code>[MafiaAction](#sockmafia.src.dao.module_MafiaAction..MafiaAction)</code>  
**Returns**: <code>object</code> - A serializeable clone of this action's internal data store.  
