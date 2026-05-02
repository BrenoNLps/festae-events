export function validatorUsername(username: string): boolean {
    return /^[a-zA-Z0-9._-]{3,30}$/.test(username);
}