const jwt = require('jsonwebtoken')
const allowlistRefreshToken = require('../../redis/allowlist-refresh-token')
const blocklistAccessToken = require('../../redis/blocklist-access-token')

const crypto = require('crypto')
const moment = require('moment')
const { InvalidArgumentError } = require('../erros')

function criaTokenJWT(id, [tempoQuantidade, tempoUnidade]) {
  // access token
  const payload = { id }

  const token = jwt.sign(payload, process.env.CHAVE_JWT, {
    expiresIn: `${tempoQuantidade}${tempoUnidade}`
  })
  return token
}

async function verificaTokenJWT(token, nome, blocklist) {
  await verificaTokenNaBlocklist(token, nome, blocklist)
  const { id } = jwt.verify(token, process.env.CHAVE_JWT)
  return id
}

async function verificaTokenNaBlocklist(token, nome, blocklist) {

  if (!blocklist) {
    // no caso de nao haver blocklist para o token, vamos apenas sair da funcao com return
    return
  }

  const tokenNaBlocklist = await blocklist.contemToken(token)
  if (tokenNaBlocklist) {
      throw new jwt.JsonWebTokenError(`${nome} token inválido por logout`)
  }
}

function invalidaTokenJWT(token, blocklist) {
  return blocklist.adiciona(token)
}

async function criaTokenOpaco(id, [tempoQuantidade, tempoUnidade], allowlist) {
  // refresh token
  const tokenOpaco = crypto.randomBytes(24).toString('hex')
  const dataExpiracao = moment().add(tempoQuantidade, tempoUnidade).unix() // expira 5 dias apos o momento de criacao do token

  await allowlist.adiciona(tokenOpaco, id, dataExpiracao) // registramos o refresh-token na allowlist do redis

  return tokenOpaco
}

async function verificaTokenOpaco(token, nome, allowlist) {
  verificaTokenEnviado(token, nome)
  const id = await allowlist.buscaValor(token)
  verificaTokenValido(id, nome)
  return id
}

async function invalidaTokenOpaco(token, allowlist) {
  await allowlist.deleta(token)
}

function verificaTokenValido(id, nome) {
  if (!id) {
    throw new InvalidArgumentError(`${nome} token inválido`)
  }
}

function verificaTokenEnviado(token, nome) {
  if (!token) {
    throw new InvalidArgumentError(`${nome} token não foi enviado`)
  }
}


module.exports = {
  access: {
    nome: 'access',
    lista: blocklistAccessToken,
    expiracao: [15, 'm'], // 15 minutos
    cria(id) {
      return criaTokenJWT(id, this.expiracao)
    },
    verifica(token) {
      return verificaTokenJWT(token, this.nome, this.lista)
    },
    invalida(token) {
      return invalidaTokenJWT(token, this.lista)
    },
  },
  refresh: {
    nome: 'refresh',
    lista: allowlistRefreshToken,
    expiracao: [5, 'd'], // 5 dias
    cria(id) {
      return criaTokenOpaco(id, this.expiracao, this.lista)
    },
    verifica(token) {
      return verificaTokenOpaco(token, this.nome, this.lista)
    },
    invalida(token) {
      return invalidaTokenOpaco(token, this.lista)
    },
  },
  verificacaoEmail: {
    nome: 'token de verificação de email',
    expiracao: [1, 'h'], // expira em 1 hora
    cria(id) {
      return criaTokenJWT(id, this.expiracao)
    },
    verifica(token) {
      return verificaTokenJWT(token, this.nome)
    }
  }
}