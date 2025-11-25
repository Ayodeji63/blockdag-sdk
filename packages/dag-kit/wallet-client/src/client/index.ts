// Function Signature
export function createSmartWalletClient<TAccount extends Address | undefined = undefined>(params: SmartWalletClientPararms<TAccount>): SmartWalletClient<TAccount>;

// Function Declaration
export function createSmartWalletClient(params:SmartWalletClientParams,):SmartWalletClient {
    const {transport, chain, account, signer} = params;

    const policyIds = params.policyId ? [params.policyId] : params.policyIds ? params.policyIds : undefined;

    // In TypeScript, the < > after a function name is for generics 
    // Generics allow you to tell a function what type it should work with
    const innerClient = createClient<Transport, Chain, JsonRpcAccount<Address> | undefined, WalletServerViemRpcSchema({
        transport: (opts) =>
            custom(
                Provider.from(transport(opts), {
                    schema: RpcSchema.from<WalletServerRpcSchemaType>(),
                }),
            )(opts),
        chain,
        account,
    }).extend(() => ({
        policyIds,
        internal: internalStateDecorator(),
    }));

    metrics.trackEvent({
        name: "client_created",
        data: {
            chainId: params.chain.id,
        },
    });
ie
    return innerClient.extend((client) => smartWalletClient)
}