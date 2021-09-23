const db = require('../../database');
const { InternalServerError } = require('../erros');

const { promisify } = require('util')
const dbRun = promisify(db.run).bind(db)
const dbGet = promisify(db.get).bind(db)
const dbAll = promisify(db.all).bind(db)

module.exports = {
  adiciona: async usuario => {
    try {
      await dbRun(
        `
          INSERT INTO usuarios (
            nome,
            email,
            senhaHash,
            emailVerificado
          ) VALUES (?, ?, ?, ?)
        `,
        [usuario.nome, usuario.email, usuario.senhaHash, usuario.emailVerificado]
      );
    } catch (error) {
      throw new InternalServerError('Erro ao adicionar o usuário!')
    }
  },

  buscaPorId: async id => {
    try {
      return await dbGet(
        `
          SELECT *
          FROM usuarios
          WHERE id = ?
        `,
        [id]
      );
    } catch (error) {
      throw new Error('Não foi possível encontrar o usuário!')
    }
  },

  buscaPorEmail: async email => {
    try {
      return await dbGet(
        `
          SELECT *
          FROM usuarios
          WHERE email = ?
        `,
        [email]
      );
    } catch (error) {
      throw new Error('Não foi possível encontrar o usuário!')
    }
  },

  lista: async () => {
    try {
      return await dbAll(
        `
          SELECT * FROM usuarios
        `
      );
    } catch (error) {
      throw new Error('Erro ao listar usuários')
    }
  },

  modificaEmailVerificado: async (usuario, emailVerificado) => {
    try {
      await dbRun(`
        UPDATE usuarios SET emailVerificado = ? WHERE id = ?
      `, [emailVerificado, usuario.id])
    } catch (error) {
      throw new InternalServerError('Erro ao modificar a verificação de email!')
    }
  },

  deleta: async usuario => {
    try {
      await dbRun(
        `
          DELETE FROM usuarios
          WHERE id = ?
        `,
        [usuario.id]
      );
    } catch (error) {
      throw new Error('Erro ao deletar o usuário')
    }
  }
};
