import { type Address, type Hex } from "viem";
export interface Quote {
    readonly grantId: Hex;
    readonly operationId: Hex;
    readonly provider: Address;
    readonly evaluator: Address;
    readonly token: Address;
    readonly adapter: Address;
    readonly amount: bigint;
    readonly quoteExpiresAt: bigint;
    readonly jobExpiresAt: bigint;
    readonly workHash: Hex;
    readonly nonce: Hex;
}
export declare const quoteTypes: {
    readonly Quote: readonly [{
        readonly name: "grantId";
        readonly type: "bytes32";
    }, {
        readonly name: "operationId";
        readonly type: "bytes32";
    }, {
        readonly name: "provider";
        readonly type: "address";
    }, {
        readonly name: "evaluator";
        readonly type: "address";
    }, {
        readonly name: "token";
        readonly type: "address";
    }, {
        readonly name: "adapter";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }, {
        readonly name: "quoteExpiresAt";
        readonly type: "uint256";
    }, {
        readonly name: "jobExpiresAt";
        readonly type: "uint256";
    }, {
        readonly name: "workHash";
        readonly type: "bytes32";
    }, {
        readonly name: "nonce";
        readonly type: "bytes32";
    }];
};
export declare function quoteTypedData(chainId: number, vault: Address, quote: Quote): {
    domain: {
        name: string;
        version: string;
        chainId: number;
        verifyingContract: `0x${string}`;
    };
    types: {
        readonly Quote: readonly [{
            readonly name: "grantId";
            readonly type: "bytes32";
        }, {
            readonly name: "operationId";
            readonly type: "bytes32";
        }, {
            readonly name: "provider";
            readonly type: "address";
        }, {
            readonly name: "evaluator";
            readonly type: "address";
        }, {
            readonly name: "token";
            readonly type: "address";
        }, {
            readonly name: "adapter";
            readonly type: "address";
        }, {
            readonly name: "amount";
            readonly type: "uint256";
        }, {
            readonly name: "quoteExpiresAt";
            readonly type: "uint256";
        }, {
            readonly name: "jobExpiresAt";
            readonly type: "uint256";
        }, {
            readonly name: "workHash";
            readonly type: "bytes32";
        }, {
            readonly name: "nonce";
            readonly type: "bytes32";
        }];
    };
    primaryType: "Quote";
    message: Quote;
};
export declare function quoteDigest(chainId: number, vault: Address, quote: Quote): Hex;
export declare function deriveCommitmentId(chainId: number, vault: Address, grantId: Hex, operationId: Hex): Hex;
