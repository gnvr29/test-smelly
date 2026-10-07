const { UserService } = require ('../src/userService');

const dadosUsuarioPadrao = {
  nome: 'Fulano de Tal',
  email: 'fulano@teste.com',
  idade: 25,
};

describe('UserService - Suíte de Testes com Smells', () => {
  let userService;

  // O setup é executado antes de cada teste
  beforeEach(() => {
    userService = new UserService();
    userService._clearDB(); // Limpa o "banco" para cada teste
  });

  test('deve criar e buscar um usuário corretamente', () => {
    // Act 1: Criar
    const usuarioCriado = userService.createUser(
      dadosUsuarioPadrao.nome,
      dadosUsuarioPadrao.email,
      dadosUsuarioPadrao.idade
    );
    expect(usuarioCriado.id).toBeDefined();

    // Act 2: Buscar
    const usuarioBuscado = userService.getUserById(usuarioCriado.id);
    expect(usuarioBuscado.nome).toBe(dadosUsuarioPadrao.nome);
    expect(usuarioBuscado.status).toBe('ativo');
  });

  test('deve desativar usuários se eles não forem administradores', () => {
    const usuarioComum = userService.createUser('Comum', 'comum@teste.com', 30);
    const usuarioAdmin = userService.createUser('Admin', 'admin@teste.com', 40, true);

    const todosOsUsuarios = [usuarioComum, usuarioAdmin];

    // O teste tem um loop e um if, tornando-o complexo e menos claro.
    // TEST SMELL: lógica condicional no teste
    for (const user of todosOsUsuarios) {
      const resultado = userService.deactivateUser(user.id);
      if (!user.isAdmin) {
        // Este expect só roda para o usuário comum.
        expect(resultado).toBe(true);
        const usuarioAtualizado = userService.getUserById(user.id);
        expect(usuarioAtualizado.status).toBe('inativo');
      } else {
        // E este só roda para o admin.
        expect(resultado).toBe(false);
      }
    }
  });

  test('deve gerar um relatório de usuários formatado', () => {
    const usuario1 = userService.createUser('Alice', 'alice@email.com', 28);
    userService.createUser('Bob', 'bob@email.com', 32);

    const relatorio = userService.generateUserReport();
    
    // Se a formatação mudar (ex: adicionar um espaço, mudar a ordem), o teste quebra.
    const linhaEsperada = `ID: ${usuario1.id}, Nome: Alice, Status: ativo\n`;
    expect(relatorio).toContain(linhaEsperada);
    expect(relatorio.startsWith('--- Relatório de Usuários ---')).toBe(true);
  });
  
  test('deve falhar ao criar usuário menor de idade', () => {
    // Este teste não falha se a exceção NÃO for lançada.
    // Ele só passa se o `catch` for executado. Se a lógica de validação
    // for removida, o teste passa silenciosamente, escondendo um bug.
    try {
      userService.createUser('Menor', 'menor@email.com', 17);
    } catch (e) {
      expect(e.message).toBe('O usuário deve ser maior de idade.');
    }
  });

  test.skip('deve retornar uma lista vazia quando não há usuários', () => {
    // TODO: Implementar este teste depois.
  });
});