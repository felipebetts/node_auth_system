const blacklist = require('./blacklist')

const { promisify } = require('util') // o promisefy transforma funcoes que esperam callbacks em promises
const existsAsync = promisify(blacklist.exists).bind(blacklist)
const setAsync = promisify(blacklist.set).bind(blacklist)

const jwt = require('jsonwebtoken')
const { createHash } = require('crypto')

function geraTokenHash(token) {
    // aqui vamos gerar um token do payload do token recebido, para garantir que todos objetos inseridos tenham o mesmo tamanho e sejam pequenos
    return createHash('sha256')
        .update(token)
        .digest('hex')
}

module.exports = {
    adiciona: async token => {
        const dataExpiracao = jwt.decode(token).exp
        const tokenHash = geraTokenHash(token)
        await setAsync(tokenHash, '')
        blacklist.expireat(tokenHash, dataExpiracao)
    },

    contemToken: async token => {
        const resultado = await existsAsync(token)
        return resultado === 1 // se resultado é igual a 1 é pq existe o token na blacklist
    }
}