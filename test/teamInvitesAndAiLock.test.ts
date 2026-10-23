import assert from 'node:assert';

// Mock localStorage for node test environment
const store: Record<string, string> = {};
(global as any).localStorage = {
  getItem: (key: string) => store[key] || null,
  setItem: (key: string, val: string) => {
    store[key] = String(val);
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => {
    Object.keys(store).forEach((k) => delete store[k]);
  },
};

import { sqliteDb } from '../src/services/sqliteDatabase';
import { buildTeamInviteJoinUrl, parseTeamInviteQuery } from '../src/features/team/teamEmailService';

console.log('🧪 Running Team Workspace Invites & SQLite Persistence Tests...');

// 1. Verify default team workspace creation in SQLite
const teams = sqliteDb.getAllTeams();
assert.ok(Array.isArray(teams), 'Teams should be an array');
assert.ok(teams.length > 0, 'Default team workspace should exist in SQLite');

const coreTeam = teams[0];
assert.strictEqual(coreTeam.name, 'SearchPoint Core Team');
assert.ok(coreTeam.members.length >= 1, 'Core team should have at least 1 member');
assert.strictEqual(coreTeam.members[0].role.toLowerCase(), 'owner');
console.log('✅ Test 1 passed: Default team workspace initialized in SQLite');

// 2. Test saving and updating a team in SQLite
const newTeamId = 'team-test-123';
sqliteDb.saveTeam({
  id: newTeamId,
  name: 'DevOps & AI Squad',
  ownerId: 'user-kacper',
  icon: '🚀',
  description: 'Zesp bada i wdroe AI',
  members: [
    {
      userId: 'user-kacper',
      email: 'kacper@searchpoint.pl',
      name: 'Kacper Nowicki',
      role: 'Owner',
      joinedAt: Date.now(),
    },
  ],
  createdAt: Date.now(),
});

const retrievedTeam = sqliteDb.getTeamById(newTeamId);
assert.ok(retrievedTeam, 'Team should be retrievable by ID');
assert.strictEqual(retrievedTeam?.name, 'DevOps & AI Squad');
assert.strictEqual(retrievedTeam?.members.length, 1);
console.log('✅ Test 2 passed: SQLite saveTeam & getTeamById verified');

// 3. Test direct member addition in SQLite
if (retrievedTeam) {
  const updatedMembers = [
    ...retrievedTeam.members,
    {
      userId: 'user-mateusz-99',
      email: 'mateusz@searchpoint.pl',
      name: 'Mateusz Tester',
      role: 'Editor' as const,
      joinedAt: Date.now(),
    },
  ];
  sqliteDb.saveTeam({
    ...retrievedTeam,
    members: updatedMembers,
  });

  const updatedTeam = sqliteDb.getTeamById(newTeamId);
  assert.strictEqual(updatedTeam?.members.length, 2);
  assert.strictEqual(updatedTeam?.members[1].email, 'mateusz@searchpoint.pl');
  assert.strictEqual(updatedTeam?.members[1].role, 'Editor');
  console.log('✅ Test 3 passed: Direct member addition in SQLite verified');
}

// 4. Test Universal Self-Contained Invite Link Generation
const inviteUrl = buildTeamInviteJoinUrl({
  inviteId: 'inv-456',
  teamId: 'team-test-123',
  teamName: 'DevOps & AI Squad',
  role: 'editor',
  email: 'anna@searchpoint.pl',
});

assert.ok(inviteUrl.includes('invite=inv-456'), 'URL must contain invite ID');
assert.ok(inviteUrl.includes('team=team-test-123'), 'URL must contain team ID');
assert.ok(inviteUrl.includes('role=editor'), 'URL must contain role');
assert.ok(inviteUrl.includes('email=anna%40searchpoint.pl'), 'URL must encode email');
assert.ok(inviteUrl.includes('team_name=DevOps+%26+AI+Squad') || inviteUrl.includes('DevOps'), 'URL must contain team name');
console.log('✅ Test 4 passed: Universal self-contained invite link generated correctly');

// 5. Test parsing universal invite URL parameters
const parsed = parseTeamInviteQuery(`?invite=inv-789&team=team-alpha&team_name=Projekt+Apollo&role=admin&email=jan%40domain.com`);
assert.strictEqual(parsed.inviteId, 'inv-789');
assert.strictEqual(parsed.teamId, 'team-alpha');
assert.strictEqual(parsed.teamName, 'Projekt Apollo');
assert.strictEqual(parsed.role, 'admin');
assert.strictEqual(parsed.email, 'jan@domain.com');
console.log('✅ Test 5 passed: Universal invite URL parsing verified');

// 6. Test invite persistence in SQLite
sqliteDb.saveInvite({
  id: 'inv-local-1',
  teamId: newTeamId,
  teamName: 'DevOps & AI Squad',
  inviterEmail: 'kacper@searchpoint.pl',
  inviterId: 'user-kacper',
  inviteeEmail: 'nowy@searchpoint.pl',
  role: 'Viewer',
  status: 'pending',
  createdAt: Date.now(),
});

const allInvites = sqliteDb.getAllInvites();
assert.ok(allInvites.some(inv => inv.id === 'inv-local-1'), 'Invite must be persisted in SQLite');
sqliteDb.deleteInvite('inv-local-1');
assert.strictEqual(sqliteDb.getAllInvites().some(inv => inv.id === 'inv-local-1'), false, 'Invite should be deleted');
console.log('✅ Test 6 passed: SQLite invite storage & deletion verified');

// Clean up test team
sqliteDb.deleteTeam(newTeamId);
assert.strictEqual(sqliteDb.getTeamById(newTeamId), undefined, 'Test team should be deleted');
console.log('✅ Test 7 passed: SQLite team deletion verified');

console.log('\n🎉 ALL TEAM WORKSPACE & INVITE TESTS PASSED 100%!');
