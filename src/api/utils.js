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

exports.getGameForModActivity = (gameId, moderator, dao, forum) => exports.getActiveGame(gameId, dao)
    .then((game) => exports.getUser(moderator, game, forum).then((user) => [game, user]))
    .then((args) => {
        const game = args[0],
            user = args[1];
        if (!user.isModerator) {
            throw new Error('E_ACTOR_NOT_MODERATOR');
        }
        return game;
    });

exports.extractUsername = (user, forum) => Promise.resolve()
    .then(() => {
        if (typeof user === 'string' && user.length > 0) {
            return user;
        }
        if (user instanceof forum.User) {
            return user.username;
        }
        throw new Error('E_INVALID_USER');
    });

exports.getUser = (user, game, forum) => exports.extractUsername(user, forum)
    .then((username) => game.getPlayer(username));
