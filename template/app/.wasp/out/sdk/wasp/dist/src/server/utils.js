export function requireNodeEnvVar(name) {
    const value = process.env[name];
    if (value === undefined) {
        throw new Error(`Env var ${name} is undefined`);
    }
    else {
        return value;
    }
}
/**
 * @deprecated Use getEnvVar from envValidation.ts instead for better type safety
 */
export { requireNodeEnvVar as getRequiredEnvVar };
//# sourceMappingURL=utils.js.map