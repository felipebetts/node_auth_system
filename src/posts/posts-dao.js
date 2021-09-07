const db = require('../../database');

const { promisify } = require('util')
const dbRun = promisify(db.run).bind(db)
const dbAll = promisify(db.all).bind(db)

module.exports = {
  adiciona: async post => {
    try {
      await dbRun(
        `
        INSERT INTO posts (
          titulo, 
          conteudo
        ) VALUES (?, ?)
      `,
        [post.titulo, post.conteudo]
      );
    } catch (error) {
      throw new Error('Erro ao adicionar o post!')
    }
  },

  lista: async () => {
    try {
      return await dbAll(`SELECT * FROM posts`);
    } catch (error) {
      throw new Error('Erro ao listar os posts!')
    }
  }
};
