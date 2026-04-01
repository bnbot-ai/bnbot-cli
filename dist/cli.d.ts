/**
 * CLI Client - Connect to a running BNBot WebSocket server and send a tool command.
 *
 * Usage:
 *   bnbot <tool-name> [--param value ...]
 *
 * Example:
 *   bnbot get-extension-status
 *   bnbot scrape-timeline --limit 10 --scrollAttempts 3
 *   bnbot post-tweet --text "Hello world"
 *   bnbot navigate-to-search --query "AI agents"
 */
/** All known CLI tool names */
export declare const CLI_TOOL_NAMES: string[];
/**
 * Run a CLI tool command by connecting to the WS server as a client.
 */
export declare function runCliTool(toolName: string, argv: string[]): Promise<void>;
/**
 * Send an action to the WS server and print the result.
 */
export declare function runCliAction(actionType: string, params: Record<string, unknown>, port: number): Promise<void>;
//# sourceMappingURL=cli.d.ts.map