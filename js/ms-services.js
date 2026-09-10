/* Mundos Sombrios — Online Services / V2.6
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
    save: character => run('persistence', () => unwrapDB(db().saveCharacter(character)), { entity: 'character', id: character?.id }),
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
    setMemberRole: (id, userId, role) => run('persistence', () => db().setTableMemberRole(id, userId, role), { entity: 'table-member', action: 'role:'+role }),
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

  const AtlasService = Object.freeze({
    points: () => run('persistence', () => db().fetchMapPoints(), { entity: 'master-atlas', action: 'fetch' }),
    savePoints: points => run('persistence', () => db().saveMapPoints(points), { entity: 'master-atlas', action: 'save' }),
    economy: () => run('persistence', () => db().fetchGlobalEconomy(), { entity: 'global-economy', action: 'fetch' }),
    saveEconomy: state => run('persistence', () => db().saveGlobalEconomy(state), { entity: 'global-economy', action: 'save' }),
    requestChange: payload => {
      const user = window.currentUser || {};
      const request = {
        id: `atlas-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
        userId: String(user.id || user.authUserId || ''),
        username: String(user.username || user.name || user.email || 'mestre'),
        status: 'pending',
        createdAt: new Date().toISOString(),
        data: { type: 'atlas_change', ...(payload || {}) }
      };
      return run('persistence', () => db().saveAdminRequest(request), { entity: 'atlas-request', action: 'create' });
    },
    resolveRequest: (request, status) => {
      const normalized = {
        ...(request || {}),
        id: String(request?.id || ''),
        userId: String(request?.userId || request?.user_id || ''),
        username: String(request?.username || 'desconhecido'),
        status: String(status || 'approved'),
        updatedAt: new Date().toISOString(),
        data: request?.data || {}
      };
      return run('persistence', () => db().updateAdminRequestStatus(normalized.id, normalized.status, normalized.data), { entity: 'atlas-request', action: normalized.status });
    }
  });

  async function unwrapDB(task) {
    const result = await task;
    if (result?.error) throw result.error;
    return result?.data !== undefined ? result.data : result;
  }

  const SoulService = Object.freeze({
    state: () => run('persistence', () => unwrapDB(db().fetchSoulAccountState()), { entity: 'soul-economy', action: 'state' }),
    touch: source => run('persistence', () => unwrapDB(db().touchSoulActivity(source)), { entity: 'soul-harvest', action: 'touch' }),
    tick: () => run('persistence', () => unwrapDB(db().tickSoulHarvest()), { entity: 'soul-harvest', action: 'tick' }),
    purchase: productKey => run('persistence', () => unwrapDB(db().purchaseSoulProduct(productKey)), { entity: 'soul-purchase', action: productKey }),
    adminAccount: profileId => run('persistence', () => unwrapDB(db().adminGetSoulAccount(profileId)), { entity: 'soul-admin', action: 'account' }),
    adminAdjustBalance: (profileId, amount, reason) => run('persistence', () => unwrapDB(db().adminAdjustSoulBalance(profileId, amount, reason)), { entity: 'soul-admin', action: amount >= 0 ? 'grant' : 'remove' }),
    adminSetEntitlement: (profileId, type, key, quantity, reason) => run('persistence', () => unwrapDB(db().adminSetSoulEntitlement(profileId, type, key, quantity, reason)), { entity: 'soul-admin', action: 'entitlement' })
  });

  window.MS_SERVICES = Object.freeze({
    version: '2.6.0',
    Auth: AuthService,
    Profile: ProfileService,
    Characters: CharacterService,
    Games: GameService,
    Campaigns: CampaignService,
    Sessions: SessionService,
    VTT: VTTService,
    Content: ContentService,
    Atlas: AtlasService,
    Soul: SoulService,
    clone,
    currentUserId: uid
  });

  platform()?.emit('ms:services:ready', { version: '2.6.0' });
})();
