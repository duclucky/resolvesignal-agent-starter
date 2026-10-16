# ResolveSignal Agent Starter

A runnable starting point for one agent or application to call ResolveSignal
using an existing Circle Agent Wallet. No LLM key, new wallet, contract deployment,
budget deposit or Gateway setup is required. ResolveSignal's current service fee
is **0.06 USDC per admitted paid call**. Installing or running the demo is free.

This experimental starter prepares structured requests, uses the existing x402
client, saves the decision privately and inspects interrupted calls. It does not
chat, execute recommended business actions, retry purchases automatically or
manage a shared BudgetVault. Your system keeps execution authority.

## 1. Try the offline demo

Install Git and Node.js 22 or newer. Clone the public repository into a private
working directory:

```sh
git clone https://github.com/duclucky/resolvesignal-agent-starter.git
cd resolvesignal-agent-starter
```

```sh
node starter.mjs demo
```

The demo needs no packages, network or wallet. Its output is explicitly canned,
synthetic and unpaid. It illustrates checking an uncertain order's authoritative
status before considering a retry; it is not an actual model result.

## 2. Install the client and connect your existing wallet

```sh
npm ci --ignore-scripts
```

The repository includes the readable Agent Commitments SDK under `vendor/`.
npm installs it as a local dependency; the committed lockfile pins registry
dependencies. No archive download or build step is needed. See
[SDK provenance](vendor/README.md) for the exact source snapshot.
`--ignore-scripts` prevents dependency lifecycle scripts during installation.
Internet is needed to install registry dependencies.

Install Circle CLI separately if it is missing, using Circle's official setup.
Use its existing authenticated mainnet agent session. The starter never accepts
terms, logs in, asks for an OTP, exports a key, creates a wallet or funds one.

```sh
circle --version
circle wallet status --type agent --output json
circle wallet list --chain ARC --type agent --output json
```

If Circle asks for terms/login, complete that flow directly using Circle's
instructions. Do not share keys, OTPs or session files with this starter. Copy
the Arc wallet address you want to use from the wallet list.

```sh
node starter.mjs doctor --payer YOUR_CIRCLE_WALLET_ADDRESS
```

`doctor` only reads service readiness, Arc seller code/roles, mainnet session,
wallet membership and canonical ERC-20 USDC balance. It prints no account email
or session token. It does not sign or pay. Without `--payer`, wallet checks are
explicitly marked skipped. A balance check is not spending-policy approval;
Circle checks current funds and policy when a call is paid. Native 18-decimal
gas and the ERC-20 6-decimal view represent the same USDC, so never add them.

## 3. Prepare one task

Synthetic examples are `delivery-unknown` and `review-proposal`. The second adds
`proposed_action_id` to ask ResolveSignal to evaluate a declared action. Examples
create a fresh synthetic observation timestamp and are always labelled synthetic.

```sh
node starter.mjs init --payer YOUR_CIRCLE_WALLET_ADDRESS --task tasks/first-call --example delivery-unknown
```

For real data, supply your own complete V2 request instead:

```sh
node starter.mjs init --payer YOUR_CIRCLE_WALLET_ADDRESS --task tasks/real-operation --request /private/request.json
```

Real evidence timestamps are preserved. The starter performs lightweight local
shape checks; the API applies its full schema, evidence freshness and admission.
Do not manufacture fresh timestamps for stale evidence. The saved task binds the
request bytes, wallet, random operation ID, private salt and maximum fee. Its
default maximum is 0.06 USDC; `--max-fee` can lower it but cannot raise it above
0.06. An API price increase therefore fails closed until this starter is reviewed.

The task directory must be new. Initialization refuses to overwrite it. After
initialization, do not edit `request.json` or `task.json`. A business change is a
new operation; never make a new task merely to retry an uncertain paid call.

## 4. Make the paid call, when you choose

The following command can spend up to **0.06 USDC**. It requires the explicit
flag and is not run by demo, doctor, initialization or recovery.

```sh
node starter.mjs call --task tasks/first-call --confirm-paid-call
```

The SDK signs the admission proof, receives the admitted quote, validates its
chain/USDC/price/expiry/seller escrow, inspects it with Circle, then invokes the
paid command once. Circle uses the existing wallet and existing x402 rails.
There is no automatic business-action execution after the recommendation.

Successful output is saved as private `tasks/first-call/result.json` before any
further financial query. The terminal prints its path and call status, not the
business payload. Installing the kit is not authorization to execute that command.

## 5. Recover the same operation

```sh
node starter.mjs recover --task tasks/first-call
```

This inspects the original service call and seller escrow. It never signs, pays
or creates a new quote. A lost response, timeout or HTTP error can happen after
funds moved. Once payment intent is recorded, the SDK refuses another purchase.
Keep the same task and recovery files; inspect Circle's private payment logs and
token receipts. Seller escrow status is not independent proof that a refund was
received by your wallet. Existing ResolveSignal refund rules apply.

Only if the **unpaid quote response** was lost, an explicit resume can reuse the
same request keys; it still requires paid-call consent:

```sh
node starter.mjs call --task tasks/first-call --resume-quote --confirm-paid-call
```

This cannot repeat a call whose payment was already attempted. After a process
crash, `call.lock` or `result.pending.json` may remain. Do not delete them while
a process is active. First inspect the original operation through `recover()` and
Circle logs. A pending result may contain business output; preserve it. Never
reset SDK payment flags, remove the recovery directory or initialize a new task
to work around an unknown payment. Financial recovery cannot recreate a lost
business result after service retention ends.

## Files, privacy and limits

- `starter.mjs`: runnable Node CLI; supports `demo`, `doctor`, `init`, `call`, `recover`.
- `examples/`: synthetic V2 requests. Real payloads/results are never bundled.
- `vendor/`: readable, pinned SDK implementation and sources; no Circle session or credentials.
- `tasks/`: created by you, private, excluded from Git. Includes task/input,
  recovery state and output. Never place it in a web root or public backup.
- New POSIX directories/files use 0700/0600 modes. Set private ACLs separately
  on Windows. Use a private working directory and an encrypted backup when needed.

This alpha is locally verified with simulated Circle custody/CLI, model and
facilitator, including success/refund and lost-response recovery through the
actual API/escrow on an isolated chain. It is not an independent security audit
or evidence of live Circle payments through this starter. Source and SDK changes
should be reviewed before larger spending. Direct wallet payments bypass
Agent Commitments' BudgetVault accounting and shared-budget guarantees.

## Development and verification

```sh
npm ci --ignore-scripts
npm test
npm run test:sdk
```

CI runs on Node.js 22 and 24. Tests use synthetic requests and simulated wallet
operations; they never make real purchases. A read-only check of the live service
can be run separately with `npm run doctor`. A real paid call is deliberately
excluded from CI and requires the confirmation shown above.

Project-authored starter code is Apache-2.0. See LICENSE and NOTICE. Dependencies
retain their own licenses. No Circle/Arc endorsement is implied.

Documentation: [ResolveSignal developer guide](https://resolvesignal.com/integration/developer),
[SDK x402 guide](https://github.com/duclucky/agent-commitments/blob/main/docs/integrations/resolvesignal-x402.md).
