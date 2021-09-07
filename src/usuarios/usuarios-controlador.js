const Usuario = require('./usuarios-modelo');
const { InvalidArgumentError, InternalServerError } = require('../erros');

const jwt = require('jsonwebtoken')
const blocklist = require('../../redis/blocklist-access-token')
const allowlistRefreshToken = require('../../redis/allowlist-refresh-token')

const crypto = require('crypto')
const moment = require('moment')

function criaTokenJWT(usuario) {
  // access token
  const payload = {
    id: usuario.id
  }

  const token = jwt.sign(payload, process.env.CHAVE_JWT, {
    expiresIn: '15m' // expira em 15 minutos
  })
  return token
}

async function criaTokenOpaco(usuario) {
  // refresh token
  const tokenOpaco = crypto.randomBytes(24).toString('hex')
  const dataExpiracao = moment().add(5, 'd').unix() // expira 5 dias apos o momento de criacao do token

  await allowlistRefreshToken.adiciona(tokenOpaco, usuario.id, dataExpiracao) // registramos o refresh-token na allowlist do redis

  return tokenOpaco
}

module.exports = {
  adiciona: async (req, res) => {
    const { nome, email, senha } = req.body;

    try {
      const usuario = new Usuario({
        nome,
        email
      });

      await usuario.adicionaSenha(senha)

      await usuario.adiciona();

      res.status(201).json();
    } catch (erro) {
      if (erro instanceof InvalidArgumentError) {
        res.status(422).json({ erro: erro.message });
      } else if (erro instanceof InternalServerError) {
        res.status(500).json({ erro: erro.message });
      } else {
        res.status(500).json({ erro: erro.message });
      }
    }
  },

  login: async (req, res) => {
    const accessToken = criaTokenJWT(req.user) // o req.user é adicionado pela lib passport ao passar pela autenticacao
    const refreshToken = await criaTokenOpaco(req.user)
    res.set('Authorization', accessToken)
    res.json({ refreshToken })
  },

  logout: async (req, res) => {
    try {
      const token = req.token
      await blocklist.adiciona(token)
      res.status(204).end()
    } catch (error) {
      res.status(500).json({ erro: error.message })
    }
  },

  lista: async (req, res) => {
    const usuarios = await Usuario.lista();
    res.json(usuarios);
  },

  deleta: async (req, res) => {
    const usuario = await Usuario.buscaPorId(req.params.id);
    try {
      await usuario.deleta();
      res.status(200).send();
    } catch (erro) {
      res.status(500).json({ erro: erro });
    }
  }
};
