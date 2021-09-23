const passport = require('passport')
const Usuario = require('./usuarios-modelo')


const tokens = require('./tokens')


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
    },

    refresh: async (req, res, next) => {
        try {
            // o usuario enviara o refresh token no body do request
            const { refreshToken } = req.body
            const id = await tokens.refresh.verifica(refreshToken)
            await tokens.refresh.invalida(refreshToken)
            req.user = await Usuario.buscaPorId(id)
            return next()
        } catch (error) {
            if (error.name === 'InvalidArgumentError') {
                return res.status(401).json({ erro: error.message })
            }
            return res.status(500).json({ erro: error.message })
        }
    },

    verificacaoEmail: async (req, res, next) => {
        try {
            const { token } = req.params
    
            const id = await tokens.verificacaoEmail.verifica(token)
            const usuario = await Usuario.buscaPorId(id)
            req.user = usuario
            next()
        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ erro: error.message })
            }
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    erro: error.message,
                    expiradoEm: error.expiredAt
                })
            }
            return res.status(500).json({ erro: error.message })
        }
    }
}