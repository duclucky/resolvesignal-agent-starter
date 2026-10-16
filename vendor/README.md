# Vendored SDK provenance

The starter uses `@agent-commitments/sdk` version `0.1.0-alpha.2` as a
local file dependency, not an unpublished registry version. All runtime JavaScript,
TypeScript sources and declarations are checked in as readable text. No binary
archive is required. The SDK license is included in its directory.

Upstream: https://github.com/duclucky/agent-commitments
Baseline source commit: `87022e3b3a483b4f27618533c35c27f9f2a0a776`.
This snapshot also includes a read-only `CircleCliResolveSignalWallet.checkWallet`
helper and its validation, prepared after that commit. It is not claimed to be an
identical published upstream release. It does not add payment rails or contracts.
The original build archive SHA-256 was `99ad12e89d4fe8f2941e76bf53fc20a53f09c9e340ada688ea1611f7667ed386`;
the checked-in files and this repository's commit identify this unpacked snapshot.

`src/` contains the build sources, with the network-config import made local.
`dist/` is the matching unminified runtime and public declarations. SDK tests for
the consumed payment modules are in the starter's `test/sdk/` directory.
The upstream SDK also exposes budget primitives. This starter uses only its
ResolveSignal client, session, Circle CLI wallet and private file store; it never
deploys or sends transactions to those budget primitives.
