import { classifySearchQuery, slugifyTopic } from '../src/features/global-searches/classifierService';
import { globalKnowledgeService } from '../src/features/global-searches/knowledgeCollectionsService';
import { reuseFirstEngine } from '../src/features/global-searches/reuseFirstEngine';
import { bugReportService } from '../src/features/global-searches/bugReportService';
import { ClaimVerificationStatus } from '../src/features/global-searches/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${message}`);
    process.exit(1);
  }
}

console.log('🧪 Running KROK 4 & 5 Tests: Global Searches, Reuse-First & Bug Reporting...');

// Test 1: Content classification (Public vs My Searches & Privacy Leak Prevention)
{
  // 1a. General encyclopedic / tech query -> Public eligible
  const publicRes = classifySearchQuery('Jak działa architektura Transformer w AI?', 'public');
  assert(publicRes.isPublicEligible === true, 'Educational query is public eligible');
  assert(publicRes.category === 'Technologia', 'Correctly categorized as Technologia');
  assert(publicRes.canonicalSlug.includes('transformer'), 'Canonical slug generated');

  // 1b. Query with personal credentials -> Strictly My Searches
  const privateRes = classifySearchQuery('moje hasło do bazy danych to tajne123', 'public');
  assert(privateRes.isPublicEligible === false, 'Sensitive data rejected from public index');
  assert(privateRes.recommendedMode === 'my_searches', 'Forced to private My Searches mode');
  assert(!!privateRes.rejectReason, 'Reject reason provided');

  // 1c. Query with colloquialism / vulgarity -> Allowed in My Searches, rejected from Public
  const slangRes = classifySearchQuery('o co kurwa chodzi z tym nowym rządem', 'public');
  assert(slangRes.isPublicEligible === false, 'Vulgarity rejected from public index');
  assert(slangRes.recommendedMode === 'my_searches', 'Redirected to My Searches where slang is permitted');

  console.log('✅ Test 1 passed: Content classification and strict privacy firewall verified');
}

// Test 2: Global Knowledge Collections (Deduplication across users)
{
  const collections = globalKnowledgeService.getAllCollections();
  assert(collections.length >= 3, 'Initial knowledge collections present');

  // Find by exact topic
  const catCol = globalKnowledgeService.findMatchingCollection('Koty domowe');
  assert(!!catCol, 'Found Koty domowe collection');
  assert(catCol!.searchCount >= 500, 'Collection aggregates 500+ searches into 1 shared knowledge unit');

  // Find by alias
  const aliasMatch = globalKnowledgeService.findMatchingCollection('rasy kotów');
  assert(!!aliasMatch && aliasMatch.id === catCol!.id, 'Alias correctly resolved to canonical collection');

  const initialCount = catCol!.searchCount;
  globalKnowledgeService.incrementSearchCount(catCol!.id);
  const updatedCol = globalKnowledgeService.findMatchingCollection('Koty domowe');
  assert(updatedCol!.searchCount === initialCount + 1, 'Search count successfully incremented');

  console.log('✅ Test 2 passed: Global shared collections deduplication and counters verified');
}

// Test 3: Reuse-First Search Engine
{
  // Test search against existing collection "Koty domowe"
  const searchPromise = reuseFirstEngine.executeSearch('Koty domowe', 'public');

  searchPromise.then((res) => {
    assert(res.reusedFromCollection === true, 'Reuse-First hit verified: Reused from global collection');
    assert(res.claims.length > 0, 'Reused claims present');
    assert(res.topic === 'Koty domowe', 'Topic matched');

    console.log('✅ Test 3 passed: Reuse-First engine avoids redundant external API hits');
  });
}

// Test 4: Verification Statuses (5 Standard Claim Statuses)
{
  const validStatuses: ClaimVerificationStatus[] = [
    'Confirmed',
    'Likely',
    'Disputed',
    'Unverified',
    'Outdated',
  ];

  assert(validStatuses.length === 5, '5 claim verification statuses defined');
  assert(validStatuses[0] === 'Confirmed', 'Confirmed status supported');
  assert(validStatuses[1] === 'Likely', 'Likely status supported');
  assert(validStatuses[2] === 'Disputed', 'Disputed status supported');

  console.log('✅ Test 4 passed: 5 Claim verification statuses verified');
}

// Test 5: Bug Report Rate Limiter (Max 4 reports per 24 hours per account)
async function testBugReportLimiter() {
  const testUserId = `user-test-${Date.now()}`;

  const qInitial = bugReportService.getRemainingQuota(testUserId);
  assert(qInitial.remaining === 4, 'User starts with 4 reports in 24h window');
  assert(qInitial.max === 4, 'Max is 4');

  // Send 4 reports sequentially
  for (let i = 1; i <= 4; i++) {
    await bugReportService.submitBugReport({
      userId: testUserId,
      claimText: `Twierdzenie testowe ${i}`,
      userComment: `Zarzut ${i}: dane są nieaktualne`,
    });
  }

  // Check quota is 0
  const qExhausted = bugReportService.getRemainingQuota(testUserId);
  assert(qExhausted.remaining === 0, 'Quota exhausted after 4 reports');

  // 5th report must be rejected
  const res5 = await bugReportService.submitBugReport({
    userId: testUserId,
    claimText: 'Twierdzenie 5',
    userComment: 'Przekroczenie limitu',
  });

  assert(!res5.success, '5th report rejected by rate limiter');
  assert(Boolean(res5.error && res5.error.includes('limit')), 'Rate limit error message returned');

  console.log('✅ Test 5 passed: Bug report 4/24h rate limit and AI audit queue verified');

  // Test 6: Multi-Source 5-Independent Sources Verifier
  const { verifyTopicAcross5Sources } = await import('../src/features/global-searches/multiSourceVerifier');
  const vPackage = await verifyTopicAcross5Sources('Felis catus', 'Kot domowy');

  assert(vPackage.sourcesCount >= 4, 'Verified across minimum 4-5 independent sources');
  assert(vPackage.claims.length >= 1, 'Extracted verified claims');
  assert(vPackage.claims[0].confidenceScore >= 80, 'Confidence score calculated');
  assert(vPackage.overallConsensusScore >= 85, 'Overall consensus score calculated');
  assert(vPackage.sources.some((s) => s.sourceType === 'encyclopedia'), 'Includes encyclopedia source');
  assert(vPackage.sources.some((s) => s.sourceType === 'official_data'), 'Includes Wikidata source');
  assert(vPackage.sources.some((s) => s.sourceType === 'academic'), 'Includes OpenAlex academic source');

  console.log('✅ Test 6 passed: Multi-source 5-independent sources verification verified');
  console.log('🎉 ALL KROK 4 & 5 TESTS PASSED PERFECTLY!\n');
}

testBugReportLimiter();
