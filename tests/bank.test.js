import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { hashSeed, pickVariant, barnumLabel, createBank } from '../src/text/bank.js';

test('hashSeed deterministik ve 32 bit', () => {
  assert.equal(hashSeed('a|2026-09-02'), hashSeed('a|2026-09-02'));
  assert.notEqual(hashSeed('a|2026-09-02'), hashSeed('a|2026-09-03'));
  assert.ok(hashSeed('x') >= 0 && hashSeed('x') < 2 ** 32);
});

test('pickVariant seed ve tekrar önleme', () => {
  const v = ['a', 'b', 'c'];
  assert.equal(pickVariant(v, 0), 'a');
  assert.equal(pickVariant(v, 4), 'b');
  assert.equal(pickVariant(v, 0, ['a']), 'b');
  assert.equal(pickVariant(v, 0, ['a', 'b', 'c']), 'a');
  assert.equal(pickVariant([], 5), null);
});

test('barnumLabel Türkçe ek', () => {
  assert.equal(barnumLabel(0.35), "12 burcun 4'üne uyar");
  assert.equal(barnumLabel(0.6), "12 burcun 7'sine uyar");
  assert.equal(barnumLabel(0), "12 burcun 1'ine uyar");
  assert.equal(barnumLabel(1), "12 burcun 12'sine uyar");
});

test('createBank get/has/copy', () => {
  const bank = createBank({ 'planets-signs': { sun_aries: { hook: 'x' } }, 'ui-copy': { barnum_label: '12 burcun {n}\'e uyar', a: 'b' } });
  assert.equal(bank.get('planets-signs', 'sun_aries').hook, 'x');
  assert.equal(bank.get('planets-signs', 'yok'), null);
  assert.equal(bank.has('aspects', 'x'), false);
  assert.equal(bank.copy('a'), 'b');
  assert.equal(bank.copy('barnum_label', { n: 7 }), "12 burcun 7'e uyar");
  assert.equal(bank.copy('yok'), 'yok');
});

test('gerçek banka dosyaları yüklenir', () => {
  const files = Object.fromEntries(['planets-signs', 'planets-houses', 'aspects', 'archetypes', 'moon', 'ui-copy']
    .map((n) => [n, JSON.parse(readFileSync(new URL(`../data/tr/${n}.json`, import.meta.url), 'utf8'))]));
  const bank = createBank(files);
  assert.ok(bank.has('planets-signs', 'chiron_pisces'));
  assert.ok(bank.has('aspects', 'trueNode_opposition_chiron'));
  assert.equal(bank.get('aspects', 'sun_square_mercury').natal, null);
});
