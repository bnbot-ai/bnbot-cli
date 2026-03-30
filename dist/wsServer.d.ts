/**
 * Local WebSocket Server
 * Listens on localhost for BNBOT Chrome Extension connections and CLI client connections.
 * Provides request-response matching for action execution.
 *
 * Connection types:
 * - Extension: sends status/heartbeat messages, receives action requests
 * - CLI client: sends cli_action messages, receives action_result relayed from extension
 */
export declare class BnbotWsServer {
    private wss;
    private client;
    private pendingRequests;
    /** CLI client requests: maps internal requestId -> CLI client info */
    private cliPending;
    private extensionVersion;
    private port;
    private autoLoginDone;
    constructor(port?: number);
    /**
     * Start the WebSocket server
     */
    start(): Promise<void>;
    /**
     * Handle when a WebSocket is identified as the extension
     */
    private handleExtensionConnect;
    /**
     * Try to auto-login the extension using clawmoney API key.
     * Reads ~/.clawmoney/config.yaml, calls backend to get user tokens,
     * and sends inject_auth_tokens to the extension.
     */
    private tryAutoLogin;
    /**
     * Handle a cli_action message from a CLI client.
     * Forward it to the extension and relay the result back.
     */
    private handleCliAction;
    /**
     * Stop the WebSocket server
     */
    stop(): void;
    /**
     * Handle incoming message from the extension
     */
    private handleMessage;
    /**
     * Send an action to the extension and wait for the result.
     * Automatically retries on busy responses.
     */
    sendAction(actionType: string, params: Record<string, unknown>, timeout?: number): Promise<{
        success: boolean;
        data?: unknown;
        error?: string;
    }>;
    /**
     * Send a request and wait for the matching response
     */
    private sendAndWait;
    /**
     * Check if the extension is connected
     */
    isExtensionConnected(): boolean;
    /**
     * Get extension info
     */
    getExtensionInfo(): {
        connected: boolean;
        version: string | null;
    };
}
//# sourceMappingURL=wsServer.d.ts.map