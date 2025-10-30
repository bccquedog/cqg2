import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';

// Use rules-unit-testing inside Playwright node context
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

let env: RulesTestEnvironment;

test.describe('Firestore Security Rules - Invites', () => {
  test.beforeAll(async () => {
    const rules = readFileSync('firestore.rules', 'utf8');
    env = await initializeTestEnvironment({
      projectId: 'demo-cqg',
      firestore: { rules },
    });
  });

  test.afterAll(async () => {
    await env?.cleanup();
  });

  test.beforeEach(async () => {
    await env.clearFirestore();
    // Seed one invite using admin bypass
    await env.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await db.collection('invites').doc('GOLD-TEST').set({
        code: 'GOLD-TEST',
        status: 'unused',
        createdBy: 'adminSeed',
        usedBy: null,
        createdAt: new Date(),
        usedAt: null,
      });
    });
  });

  test('Unauthenticated user cannot read or write invites', async () => {
    const ctx = env.unauthenticatedContext();
    const db = ctx.firestore();
    await assertFails(db.collection('invites').doc('GOLD-TEST').get());
    await assertFails(db.collection('invites').doc('NEW').set({ code: 'NEW' }));
  });

  test('Authenticated user can read invites but cannot create/delete', async () => {
    const ctx = env.authenticatedContext('user1');
    const db = ctx.firestore();
    await assertSucceeds(db.collection('invites').doc('GOLD-TEST').get());
    await assertFails(db.collection('invites').doc('NEW').set({ code: 'NEW' }));
    await assertFails(db.collection('invites').doc('GOLD-TEST').delete());
  });

  test('Authenticated user cannot redeem an invite for another player', async () => {
    const ctx = env.authenticatedContext('user1');
    const db = ctx.firestore();
    // Attempt to set used but with usedBy != uid
    await assertFails(db.collection('invites').doc('GOLD-TEST').update({ status: 'used', usedBy: 'otherUser' }));
    // Own redeem should succeed
    await assertSucceeds(db.collection('invites').doc('GOLD-TEST').update({ status: 'used', usedBy: 'user1' }));
  });

  test('Admin can create/delete invites', async () => {
    const adminCtx = env.authenticatedContext('adminUser', { token: { role: 'admin' } as any });
    const db = adminCtx.firestore();
    await assertSucceeds(db.collection('invites').doc('ADMIN-CODE').set({ code: 'ADMIN-CODE', status: 'unused' } as any));
    await assertSucceeds(db.collection('invites').doc('ADMIN-CODE').delete());
  });
});




