import assert from 'assert';

console.log('🧪 Running Anti-Spam Notifications & Quiet Mode Tests...');

// Mock the anti-spam notification filtering logic
function processNotification({
  title,
  message,
  type = 'info',
  isQuietMode = false,
  silentToast = false,
  lastToastedMap,
  activeToasts,
}: {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  isQuietMode?: boolean;
  silentToast?: boolean;
  lastToastedMap: Map<string, number>;
  activeToasts: Array<{ title: string; message: string }>;
}): { addedToHistory: boolean; addedToToasts: boolean } {
  const dedupKey = `${title.trim()}:::${message.trim()}`;
  const now = Date.now();
  const lastSeen = lastToastedMap.get(dedupKey) || 0;

  // 1. Anti-spam deduplication within 3500ms
  if (now - lastSeen < 3500) {
    return { addedToHistory: false, addedToToasts: false };
  }
  lastToastedMap.set(dedupKey, now);

  // 2. Micro-action filter
  const isTrivialMicroAction =
    /^(Dodano blok|AI analizuje|AI przekszta|Skopiowano|Zamieniono tekst|Pobieranie|Odblokowano sekcj|Zablokowano sekcj|Szablony)/i.test(title) ||
    /^(Tekst skopiowany|Polecenie skopiowane|Kod Mermaid|Wstawiono:|Przetwarzam tre|Transformacja zaznaczenia)/i.test(message);

  const shouldToast =
    !silentToast &&
    !isTrivialMicroAction &&
    (!isQuietMode || type === 'error' || type === 'warning');

  if (shouldToast) {
    activeToasts.unshift({ title, message });
    if (activeToasts.length > 2) activeToasts.splice(2);
  }

  return { addedToHistory: true, addedToToasts: shouldToast };
}

async function runTests() {
  const lastToastedMap = new Map<string, number>();
  let activeToasts: Array<{ title: string; message: string }> = [];

  // Test 1: Deduplication within 3.5s
  const res1 = processNotification({
    title: 'Zapisano dokument',
    message: 'Zmiany zapisane lokalnie w SQLite',
    type: 'success',
    lastToastedMap,
    activeToasts,
  });
  assert.strictEqual(res1.addedToHistory, true, 'First notification must be recorded');
  assert.strictEqual(res1.addedToToasts, true, 'First notification should show toast');

  const res2 = processNotification({
    title: 'Zapisano dokument',
    message: 'Zmiany zapisane lokalnie w SQLite',
    type: 'success',
    lastToastedMap,
    activeToasts,
  });
  assert.strictEqual(res2.addedToHistory, false, 'Duplicate within 3.5s must be blocked (0 spam)');
  assert.strictEqual(res2.addedToToasts, false, 'Duplicate toast must be suppressed');
  console.log('✅ Test 1 passed: Anti-spam deduplication blocks rapid duplicates');

  // Test 2: Trivial micro-actions never show toasts
  const microActions = [
    { title: 'Dodano blok', message: 'Wstawiono: Akapit' },
    { title: 'AI analizuje...', message: 'Przetwarzam treść bloku...' },
    { title: 'Skopiowano', message: 'Tekst skopiowany do schowka.' },
    { title: 'Pobieranie', message: 'Rozpoczęto pobieranie pliku...' },
    { title: 'Zablokowano sekcję', message: 'Zablokowałeś ten blok...' },
  ];

  for (const ma of microActions) {
    const res = processNotification({
      title: ma.title,
      message: ma.message,
      type: 'info',
      lastToastedMap,
      activeToasts,
    });
    assert.strictEqual(res.addedToToasts, false, `Trivial micro-action "${ma.title}" must NEVER trigger popup toast`);
  }
  console.log('✅ Test 2 passed: All trivial micro-actions are suppressed from toasts');

  // Test 3: Quiet Mode (Tryb Skupienia)
  const resQuietInfo = processNotification({
    title: 'Nowa strona',
    message: 'Utworzono nową stronę',
    type: 'info',
    isQuietMode: true,
    lastToastedMap,
    activeToasts,
  });
  assert.strictEqual(resQuietInfo.addedToHistory, true, 'Quiet mode should keep notification in history');
  assert.strictEqual(resQuietInfo.addedToToasts, false, 'Quiet mode must suppress popup toast for info');

  const resQuietError = processNotification({
    title: 'Błąd synchronizacji',
    message: 'Nie udało się połączyć',
    type: 'error',
    isQuietMode: true,
    lastToastedMap,
    activeToasts,
  });
  assert.strictEqual(resQuietError.addedToToasts, true, 'Quiet mode allows critical errors to notify user');
  console.log('✅ Test 3 passed: Quiet mode suppresses non-critical toasts while keeping error alerts');

  // Test 4: Toast queue throttling to max 2 items
  activeToasts = [];
  const items = [
    { title: 'Ważne A', message: 'Komunikat A' },
    { title: 'Ważne B', message: 'Komunikat B' },
    { title: 'Ważne C', message: 'Komunikat C' },
  ];
  for (const item of items) {
    processNotification({
      title: item.title,
      message: item.message,
      type: 'info',
      lastToastedMap,
      activeToasts,
    });
  }
  assert.strictEqual(activeToasts.length, 2, 'Active toasts must be throttled to at most 2 items');
  assert.strictEqual(activeToasts[0].title, 'Ważne C', 'Most recent toast must be first');
  console.log('✅ Test 4 passed: Active toasts queue correctly throttled to maximum 2 items');

  console.log('\n🎉 ALL ANTI-SPAM NOTIFICATION TESTS PASSED PERFECTLY!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
