export function format_number(
    input: number,
    notation: 'standard' | 'scientific' | 'engineering' | 'compact' | undefined = undefined,
    default_value = ''
) {
    if (input === undefined) return default_value;

    return Number(input.toFixed(10)).toLocaleString('en', {
        notation: notation,
        compactDisplay: 'short'
    });
}
