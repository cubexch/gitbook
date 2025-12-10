import { mnemonicToEntropy } from "bip39";

export function mpcSecretKeyFromMnemonicPhrases(rawPhrases: string) {
    const cleaned = rawPhrases
        .split(/\r?\n/)
        .map(line => line.replace(/^\s*\d+\.\s*/, "").trim())
        .filter(Boolean);

    if (cleaned.length !== 48) {
        throw new Error("Expected 48 words (24 secp + 24 ed25519)");
    }

    const secpWords = cleaned.slice(0, 24);
    const curveWords = cleaned.slice(24);

    const secpEntropyHex = mnemonicToEntropy(secpWords.join(" "));
    const curveEntropyHex = mnemonicToEntropy(curveWords.join(" "));

    return new Uint8Array([
        ...Buffer.from(secpEntropyHex, "hex"),
        ...Buffer.from(curveEntropyHex, "hex"),
    ]);
}
