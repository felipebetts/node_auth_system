const passport = require('passport')

module.exports = {
    local: (req, res, next) => {
        passport.authenticate(
            'local',
            { session: false },
            (erro, usuario, info) => {
                // caso erro
                if (erro && erro.name === 'InvalidArgumentError') {
                    return res.status(401).json({ erro: erro.message })
                }
                if (erro) {
                    return res.status(500).json({ erro: erro.message })
                }
                if (!usuario) {
                    return res.status(401).end()
                }
                // caso sucesso
                req.user = usuario
                return next()
            }
        )(req, res, next)
    },

    bearer: (req, res, next) => {
        passport.authenticate(
            'bearer',
            { session: false },
            (erro, usuario, info) => {
                // caso erro
                if (erro && erro.name === 'JsonWebTokenError') {
                    return res.status(401).json({ erro: erro.message })
                }
                if (erro && erro.name === 'TokenExpiredError') {
                    return res.status(401).json({ erro: erro.message, expiredAt: erro.expiredAt })
                }
                if (erro) {
                    res.status(500).json({ erro: erro.message })
                }
                if (!usuario) {
                    return res.status(401).end()
                }
                // caso sucesso
                req.token = info.token
                req.user = usuario
                return next()
            }
        )(req, res, next)
    }
}