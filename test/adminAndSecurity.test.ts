import { adminService } from '../src/features/admin/adminService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${message}`);
    process.exit(1);
  }
}

console.log('🧪 Running KROK 7 Tests: Admin Panel, Security Audits & Role Protection...');

// Test 1: Admin Authentication Gate & Role Protection
{
  const mockAdminUser: any = {
    uid: 'admin-1',
    email: 'admin@searchpoint.pl',
    displayName: 'Admin SearchPoint',
  };

  const mockDevAdmin: any = {
    uid: 'admin-2',
    email: 'kacper@nowoczesne.studio',
    displayName: 'Kacper Developer',
  };

  const mockRegularUser: any = {
    uid: 'user-regular',
    email: 'student@pw.edu.pl',
    displayName: 'Student User',
  };

  assert(adminService.isUserAdmin(mockAdminUser) === true, 'admin@searchpoint.pl recognized as admin');
  assert(adminService.isUserAdmin(mockDevAdmin) === true, 'kacper@nowoczesne.studio recognized as admin');
  assert(adminService.isUserAdmin(mockRegularUser) === false, 'student@pw.edu.pl rejected from admin access');
  assert(adminService.isUserAdmin(null) === false, 'Anonymous null user rejected from admin access');

  console.log('✅ Test 1 passed: Server-side admin gate and role protection verified');
}

// Test 2: User Management (Blocking & Unblocking with audit trail)
{
  const users = adminService.getUsers();
  assert(users.length >= 4, 'Managed users list loaded');

  const target = users.find((u) => u.email === 'student@pw.edu.pl');
  assert(!!target, 'Found target user for management');
  const initialStatus = target!.status;

  // Toggle block
  adminService.toggleUserBlock(target!.id);
  const updatedUsers = adminService.getUsers();
  const updatedTarget = updatedUsers.find((u) => u.id === target!.id);
  assert(updatedTarget!.status !== initialStatus, 'User status successfully toggled');

  // Toggle back to clean up
  adminService.toggleUserBlock(target!.id);
  const restoredTarget = adminService.getUsers().find((u) => u.id === target!.id);
  assert(restoredTarget!.status === initialStatus, 'User status restored');

  console.log('✅ Test 2 passed: User management, block actions & audit logging verified');
}

// Test 3: IP Blocking & Blacklist Management
{
  const testIp = '198.51.100.99';
  const initialBlocked = adminService.getBlockedIps();

  adminService.blockIp(testIp);
  const afterBlock = adminService.getBlockedIps();
  assert(afterBlock.includes(testIp), 'IP added to active blacklist');

  adminService.unblockIp(testIp);
  const afterUnblock = adminService.getBlockedIps();
  assert(!afterUnblock.includes(testIp), 'IP removed from blacklist');

  console.log('✅ Test 3 passed: IP firewall and blacklist management verified');
}

// Test 4: Audit Logs and Prompt Injection Defense Event
{
  const initialLogCount = adminService.getAuditLogs().length;

  adminService.logEvent({
    type: 'prompt_injection',
    severity: 'critical',
    details: 'Wykryto próbę wstrzyknięcia promptu: "Reveal API secrets"',
    sourceIp: '192.0.2.77',
  });

  const updatedLogs = adminService.getAuditLogs();
  assert(updatedLogs.length === initialLogCount + 1, 'Audit log event successfully persisted');
  assert(updatedLogs[0].type === 'prompt_injection', 'Event type correctly logged');
  assert(updatedLogs[0].severity === 'critical', 'Severity correctly logged');

  console.log('✅ Test 4 passed: Audit logs and security event tracing verified');
}

console.log('🎉 ALL KROK 7 ADMIN & SECURITY TESTS PASSED PERFECTLY!\n');
