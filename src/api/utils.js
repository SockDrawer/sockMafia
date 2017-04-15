exports.getGame = (gameId, dao) =>
    new Promise((resolve) => {
        if (!gameId) {
            throw new Error('E_MISSING_GAME_IDENTIFIER');
        }
        resolve();
    })
    .then(() => dao.getGameById(gameId));

exports.getUser = (user, game, forum) => Promise.resolve()
    .then(() => {
        if (typeof user === 'string' && user.length > 0) {
            return game.getPlayer(user);
        }
        if (user instanceof forum.User) {
            return game.getPlayer(user.username);
        }
        throw new Error('E_INVALID_USER');
    });
