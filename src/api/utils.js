exports.getGame = (gameId, dao) =>
    new Promise((resolve) => {
        if (!gameId) {
            throw new Error('E_MISSING_GAME_IDENTIFIER');
        }
        resolve();
    })
    .then(() => dao.getGameById(gameId));

exports.getActiveGame = (gameId, dao) => exports.getGame(gameId, dao)
    .then(game => {
        if (!game.isActive) {
            throw new Error('E_GAME_NOT_ACTIVE');
        }
        return game;
    });

exports.getGameForModActivity = (gameId, moderator, dao, forum, tag) => exports.getActiveGame(gameId, dao)
    .then((game) => exports.getModerator(moderator, game, forum, tag).then(() => game));

exports.extractUsername = (user, forum, tag) => Promise.resolve()
    .then(() => {
        if (typeof tag !== 'string' || !tag) {
            tag = 'actor';
        }
        if (typeof user === 'string' && user.length > 0) {
            return user;
        }
        if (user instanceof forum.User) {
            return user.username;
        }
        throw new Error(`E_INVALID_${tag.toUpperCase()}`);
    });

exports.getUser = (user, game, forum, tag) => exports.extractUsername(user, forum, tag)
    .then((username) => game.getPlayer(username));

exports.getModerator = (moderator, game, forum, tag) => {
    if (typeof tag !== 'string' || !tag) {
        tag = 'actor';
    }
    return exports.getUser(moderator, game, forum, tag)
        .then((user) => {
            if (!user.isModerator) {
                throw new Error(`E_${tag.toUpperCase()}_NOT_MODERATOR`);
            }
            return user;
        });
};

exports.getLivePlayer = (player, game, forum, tag) => {
    if (typeof tag !== 'string' || !tag) {
        tag = 'actor';
    }
    return exports.getUser(player, game, forum, tag)
        .then((user) => {
            if (user.isModerator) {
                throw new Error(`E_${tag.toUpperCase()}_NOT_PLAYER`);
            }
            if (!user.isAlive) {
                throw new Error(`E_${tag.toUpperCase()}_NOT_ALIVE`);
            }
            return user;
        });
};
