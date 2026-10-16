import test from 'node:test';
import assert from 'node:assert/strict';
import {ResolveSignalX402Session} from '@agent-commitments/sdk';
import {CircleCliResolveSignalWallet, FileResolveSignalSessionStore} from '@agent-commitments/sdk/resolvesignal-node';

test('the installed local SDK exposes the session, file store and read-only wallet checks', async () => {
  assert.equal(typeof ResolveSignalX402Session, 'function');
  assert.equal(typeof FileResolveSignalSessionStore, 'function');
  const payer = '0x1111111111111111111111111111111111111111';
  const calls = [];
  const wallet = new CircleCliResolveSignalWallet({run: async args => {
    calls.push(args.slice(0, 2));
    return {data: args[1] === 'status' ? {mainnet: {tokenStatus: 'VALID'}} : {wallets: [{address: payer}]}};
  }});
  assert.deepEqual(await wallet.checkWallet(payer), {ready: true, chainId: 5042, payer});
  assert.deepEqual(calls, [['wallet', 'status'], ['wallet', 'list']]);
});
