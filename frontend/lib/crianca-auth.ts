/**
 * Sessão da criança: cookie httpOnly próprio, separado do cookie do educador,
 * para que o mesmo tablet possa ter o painel aberto numa aba e o app na outra
 * sem um derrubar o outro.
 */
export const CRIANCA_COOKIE_NAME = "teia_crianca";

/** Onde o dispositivo guarda o código da turma pareada (não é segredo de login). */
export const CODIGO_TURMA_STORAGE_KEY = "teia:codigo-turma";
