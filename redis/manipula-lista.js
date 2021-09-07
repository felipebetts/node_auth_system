const { promisify } = require('util') // o promisefy transforma funcoes que esperam callbacks em promises

module.exports = lista => {
    const setAsync = promisify(lista.set).bind(lista)
    const existsAsync = promisify(lista.exists).bind(lista)
    const getAsync = promisify(lista.get).bind(lista)
    const delAsync = promisify(lista.del).bind(lista)
    

    return {
        adiciona: async (chave, valor, dataExpiracao) => {
            await setAsync(chave, valor)
            lista.expireat(chave, dataExpiracao)
        },
    
        contemChave: async chave => {
            const resultado = await existsAsync(chave)
            return resultado === 1 // se resultado é igual a 1 é pq existe o token na blocklist
        },

        buscaValor: async chave => {
            return getAsync(chave)
        },

        deleta: async chave => {
            await delAsync(chave)
        }
    }
}