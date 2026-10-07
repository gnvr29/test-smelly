const { UserService } = require('../src/userService');

const CABECALHO_RELATORIO = '--- Relatório de Usuários ---';
const IDADE_MINIMA = 18;

const criarUsuarioComum = (userService, sobrescritas = {}) => {
  const dados = {
    nome: 'Fulano de Tal',
    email: 'fulano@teste.com',
    idade: 25,
    isAdmin: false,
    ...sobrescritas,
  };
  return userService.createUser(dados.nome, dados.email, dados.idade, dados.isAdmin);
};

describe('UserService', () => {
  let userService;

  beforeEach(() => {
    userService = new UserService();
    userService._clearDB();
  });

  describe('createUser', () => {
    test('retorna o usuário criado com um id definido', () => {
      // Arrange & Act
      const usuario = criarUsuarioComum(userService);

      // Assert
      expect(usuario.id).toBeDefined();
    });

    test('cria o usuário com status ativo', () => {
      // Arrange & Act
      const usuario = criarUsuarioComum(userService);

      // Assert
      expect(usuario.status).toBe('ativo');
    });

    test('mantém os dados informados no usuário criado', () => {
      // Arrange & Act
      const usuario = criarUsuarioComum(userService, { nome: 'Alice', email: 'alice@email.com', idade: 28 });

      // Assert
      expect(usuario).toMatchObject({ nome: 'Alice', email: 'alice@email.com', idade: 28 });
    });

    test('aceita usuário com exatamente a idade mínima', () => {
      // Arrange & Act
      const usuario = criarUsuarioComum(userService, { idade: IDADE_MINIMA });

      // Assert
      expect(usuario.idade).toBe(IDADE_MINIMA);
    });

    test('lança erro ao criar usuário menor de idade', () => {
      // Arrange
      const idadeMenor = IDADE_MINIMA - 1;

      // Act
      const criarMenorDeIdade = () => criarUsuarioComum(userService, { idade: idadeMenor });

      // Assert
      expect(criarMenorDeIdade).toThrow('O usuário deve ser maior de idade.');
    });

    test('lança erro quando o nome não é informado', () => {
      // Arrange & Act
      const criarSemNome = () => criarUsuarioComum(userService, { nome: '' });

      // Assert
      expect(criarSemNome).toThrow('Nome, email e idade são obrigatórios.');
    });

    test('lança erro quando o email não é informado', () => {
      // Arrange & Act
      const criarSemEmail = () => criarUsuarioComum(userService, { email: '' });

      // Assert
      expect(criarSemEmail).toThrow('Nome, email e idade são obrigatórios.');
    });

    test('lança erro quando a idade não é informada', () => {
      // Arrange & Act
      const criarSemIdade = () => criarUsuarioComum(userService, { idade: undefined });

      // Assert
      expect(criarSemIdade).toThrow('Nome, email e idade são obrigatórios.');
    });
  });

  describe('getUserById', () => {
    test('retorna o usuário previamente criado', () => {
      // Arrange
      const usuarioCriado = criarUsuarioComum(userService, { nome: 'Alice' });

      // Act
      const usuarioBuscado = userService.getUserById(usuarioCriado.id);

      // Assert
      expect(usuarioBuscado.nome).toBe('Alice');
    });

    test('retorna null quando o id não existe', () => {
      // Arrange
      const idInexistente = 'id-inexistente';

      // Act
      const resultado = userService.getUserById(idInexistente);

      // Assert
      expect(resultado).toBeNull();
    });
  });

  describe('deactivateUser', () => {
    test('retorna true ao desativar um usuário comum', () => {
      // Arrange
      const usuarioComum = criarUsuarioComum(userService);

      // Act
      const resultado = userService.deactivateUser(usuarioComum.id);

      // Assert
      expect(resultado).toBe(true);
    });

    test('altera o status do usuário comum para inativo', () => {
      // Arrange
      const usuarioComum = criarUsuarioComum(userService);

      // Act
      userService.deactivateUser(usuarioComum.id);

      // Assert
      expect(userService.getUserById(usuarioComum.id).status).toBe('inativo');
    });

    test('retorna false ao tentar desativar um administrador', () => {
      // Arrange
      const usuarioAdmin = criarUsuarioComum(userService, { isAdmin: true });

      // Act
      const resultado = userService.deactivateUser(usuarioAdmin.id);

      // Assert
      expect(resultado).toBe(false);
    });

    test('mantém o administrador ativo após tentativa de desativação', () => {
      // Arrange
      const usuarioAdmin = criarUsuarioComum(userService, { isAdmin: true });

      // Act
      userService.deactivateUser(usuarioAdmin.id);

      // Assert
      expect(userService.getUserById(usuarioAdmin.id).status).toBe('ativo');
    });

    test('retorna false quando o usuário não existe', () => {
      // Arrange
      const idInexistente = 'id-inexistente';

      // Act
      const resultado = userService.deactivateUser(idInexistente);

      // Assert
      expect(resultado).toBe(false);
    });
  });

  describe('generateUserReport', () => {
    test('começa com o cabeçalho do relatório', () => {
      // Arrange
      criarUsuarioComum(userService);

      // Act
      const relatorio = userService.generateUserReport();

      // Assert
      expect(relatorio).toMatch(new RegExp(`^${CABECALHO_RELATORIO}`));
    });

    test('inclui id, nome e status de cada usuário cadastrado', () => {
      // Arrange
      const alice = criarUsuarioComum(userService, { nome: 'Alice', email: 'alice@email.com' });

      // Act
      const relatorio = userService.generateUserReport();

      // Assert
      expect(relatorio).toMatch(new RegExp(`${alice.id}.*Alice.*ativo`));
    });

    test('inclui todos os usuários cadastrados', () => {
      // Arrange
      criarUsuarioComum(userService, { nome: 'Alice', email: 'alice@email.com' });
      criarUsuarioComum(userService, { nome: 'Bob', email: 'bob@email.com' });

      // Act
      const relatorio = userService.generateUserReport();

      // Assert
      expect(relatorio).toContain('Alice');
      expect(relatorio).toContain('Bob');
    });

    test('reflete o status inativo de um usuário desativado', () => {
      // Arrange
      const usuario = criarUsuarioComum(userService, { nome: 'Alice' });
      userService.deactivateUser(usuario.id);

      // Act
      const relatorio = userService.generateUserReport();

      // Assert
      expect(relatorio).toMatch(new RegExp(`${usuario.id}.*Alice.*inativo`));
    });

    test('informa que não há usuários quando o banco está vazio', () => {
      // Arrange (banco vazio pelo beforeEach)

      // Act
      const relatorio = userService.generateUserReport();

      // Assert
      expect(relatorio).toContain('Nenhum usuário cadastrado.');
    });
  });
});
