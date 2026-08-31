/* Mundos Sombrios — Online Services / v0.66
 * Uma única camada de domínio entre UI e Supabase.
 * Regras: Supabase é a fonte de verdade; estado de interface permanece local/efêmero.
 */
(function () {
  'use strict';

  const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  const db = () => window.MS_DB;
  const platform = () => window.MS_PLATFORM;
  const uid = () => String(window.currentUser?.id || window.currentUser?.authUserId || '');

  function ensureOnline() {
    if (!db()?.ready) throw new Error('O serviço online não está disponível.');
  }

  async function run(scope, task, meta = {}) {
    ensureOnline();
    platform()?.setStatus(scope, 'loading', null, meta);
    try {
      const result = await task();
      platform()?.setStatus(scope, 'success', null, meta);
      return result;
    } catch (error) {
      platform()?.setStatus(scope, 'error', error, meta);
      platform()?.toast(error?.message || 'Não foi possível concluir a operação online.', 'error');
      throw error;
    }
  }

  const AuthService = Object.freeze({
    session: () => db().getSession(),
    signIn: (identifier, password) => run('auth', () => db().signIn(identifier, password), { action: 'sign-in' }),
    signUp: payload => run('auth', () => db().signUp(payload), { action: 'sign-up' }),
    signOut: () => run('auth', () => db().signOut(), { action: 'sign-out' }),
    recover: (email, redirect) => run('auth', () => db().resetPasswordForEmail(email, redirect), { action: 'recover' }),
    updatePassword: password => run('auth', () => db().updatePassword(password), { action: 'password-update' })
  });

  const ProfileService = Object.freeze({
    getMe: () => run('persistence', () => db().fetchMyProfile(), { entity: 'profile' }),
    saveMe: profile => run('persistence', () => db().saveProfile(profile), { entity: 'profile' })
  });

  const CharacterService = Object.freeze({
    listMine: () => run('persistence', () => db().fetchMyCharacters(), { entity: 'characters' }),
    save: character => run('persistence', () => db().saveCharacter(character), { entity: 'character', id: character?.id }),
    delete: id => run('persistence', () => db().deleteMyCharacter(id), { entity: 'character', id }),
    getHistory: id => run('persistence', () => db().fetchCharacterVersions(id), { entity: 'character-history', id }),
    restore: (id, versionId) => run('persistence', () => db().restoreCharacterVersion(id, versionId), { entity: 'character-restore', id })
  });

  const GameService = Object.freeze({
    listMine: () => run('persistence', () => db().fetchMyTables(), { entity: 'tables' }),
    create: payload => run('persistence', () => db().createTableRemote(payload), { entity: 'table', action: 'create' }),
    join: (code, characterId) => run('persistence', () => db().joinTableRemote(code, characterId), { entity: 'table', action: 'join' }),
    leave: code => run('persistence', () => db().leaveTableRemote(code), { entity: 'table', action: 'leave' }),
    delete: id => run('persistence', () => db().deleteTableSecure(id), { entity: 'table', action: 'delete', id }),
    updateSettings: (id, settings) => run('persistence', () => db().updateTableSettingsSecure(id, settings), { entity: 'table', action: 'settings', id }),
    roster: id => run('persistence', () => db().fetchTableRoster(id), { entity: 'table-roster', id }),
    characters: id => run('persistence', () => db().fetchTableCharacters(id), { entity: 'table-characters', id }),
    setMemberStatus: (id, userId, status) => run('persistence', () => db().setTableMemberStatus(id, userId, status), { entity: 'table-member', action: status }),
    linkCharacter: (id, characterId) => run('persistence', () => db().linkTableCharacter(id, characterId), { entity: 'table-member', action: 'link-character' }),
    createInvite: (id, expiresAt, maxUses) => run('persistence', () => db().createTableInvite(id, expiresAt, maxUses), { entity: 'table-invite', action: 'create' })
  });

  const CampaignService = Object.freeze({
    get: id => run('persistence', () => db().fetchCampaign(id), { entity: 'campaign', id }),
    create: (tableId, name, description) => run('persistence', () => db().createCampaign(tableId, name, description), { entity: 'campaign', action: 'create' })
  });

  const SessionService = Object.freeze({
    list: id => run('persistence', () => db().fetchSessions(id), { entity: 'sessions', id }),
    create: (tableId, title, campaignId) => run('persistence', () => db().createSession(tableId, title, campaignId), { entity: 'session', action: 'create' }),
    updateStatus: (id, status) => run('persistence', () => db().updateSessionStatus(id, status), { entity: 'session', action: status })
  });

  const VTTService = Object.freeze({
    state: id => run('vtt', () => db().fetchTableState(id), { entity: 'vtt-state', id }),
    saveState: (id, state) => run('vtt', () => db().saveTableState(id, state), { entity: 'vtt-state', id }),
    event: (id, type, payload) => run('vtt', () => db().publishTableEvent(id, type, payload), { entity: 'vtt-event', type }),
    events: id => run('vtt', () => db().fetchTableEvents(id), { entity: 'vtt-events', id }),
    subscribe: (id, handlers) => db().subscribeTable(id, handlers)
  });

  const ContentService = Object.freeze({
    siteContent: () => db().fetchSiteContent('portal-official'),
    posts: () => db().fetchPosts()
  });

  window.MS_SERVICES = Object.freeze({
    version: '0.66.1',
    Auth: AuthService,
    Profile: ProfileService,
    Characters: CharacterService,
    Games: GameService,
    Campaigns: CampaignService,
    Sessions: SessionService,
    VTT: VTTService,
    Content: ContentService,
    clone,
    currentUserId: uid
  });

  platform()?.emit('ms:services:ready', { version: '0.66.1' });
})();
