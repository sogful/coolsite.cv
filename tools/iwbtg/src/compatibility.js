/*//////////////////////////////////////////////////////////////////////*/

export function nativeactions(pkg) {
    const events = new Map((pkg.rawLogic.object_events || []).map(event => [event.block_id, event.actions]));
    for (const entry of pkg.loweredLogic.entries) {
        const messages = (events.get(entry.block_id) || []).filter(action => action.fn_name === "action_message");
        let cursor = 0;
        function visit(value) {
            if (!value || typeof value !== "object") {return value;}
            if (((value.kind === "raw" && /^action_message\(/.test(value.source || "")) || (value.kind === "function-call" && value.name === "show_message" && (events.get(entry.block_id) || []).length === 1)) && messages[cursor]) {
                const text = messages[cursor++].args[0] || "";
                return {kind: "function-call", name: "show_message", args: [{kind: "literal-text", value: text}]};
            }
            if (Array.isArray(value)) {return value.map(visit);}
            for (const key of Object.keys(value)) {value[key] = visit(value[key]);}
            return value;
        }
        entry.statements = visit(entry.statements);
    }
}
