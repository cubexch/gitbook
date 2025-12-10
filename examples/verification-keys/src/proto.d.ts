import * as $protobuf from "protobufjs";
import Long = require("long");
/** Namespace ov_schema. */
export namespace ov_schema {

    /** Properties of a VerificationKey. */
    interface IVerificationKey {

        /** VerificationKey v0 */
        v0?: (ov_schema.IVerificationKeyV0|null);
    }

    /** Represents a VerificationKey. */
    class VerificationKey implements IVerificationKey {

        /**
         * Constructs a new VerificationKey.
         * @param [properties] Properties to set
         */
        constructor(properties?: ov_schema.IVerificationKey);

        /** VerificationKey v0. */
        public v0?: (ov_schema.IVerificationKeyV0|null);

        /** VerificationKey version. */
        public version?: "v0";

        /**
         * Creates a new VerificationKey instance using the specified properties.
         * @param [properties] Properties to set
         * @returns VerificationKey instance
         */
        public static create(properties?: ov_schema.IVerificationKey): ov_schema.VerificationKey;

        /**
         * Encodes the specified VerificationKey message. Does not implicitly {@link ov_schema.VerificationKey.verify|verify} messages.
         * @param message VerificationKey message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: ov_schema.IVerificationKey, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified VerificationKey message, length delimited. Does not implicitly {@link ov_schema.VerificationKey.verify|verify} messages.
         * @param message VerificationKey message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: ov_schema.IVerificationKey, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a VerificationKey message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns VerificationKey
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): ov_schema.VerificationKey;

        /**
         * Decodes a VerificationKey message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns VerificationKey
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): ov_schema.VerificationKey;

        /**
         * Verifies a VerificationKey message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a VerificationKey message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns VerificationKey
         */
        public static fromObject(object: { [k: string]: any }): ov_schema.VerificationKey;

        /**
         * Creates a plain object from a VerificationKey message. Also converts values to other types if specified.
         * @param message VerificationKey
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: ov_schema.VerificationKey, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this VerificationKey to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for VerificationKey
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a VerificationKeyV0. */
    interface IVerificationKeyV0 {

        /** VerificationKeyV0 publicKey */
        publicKey?: (ov_schema.IPublicKey|null);

        /** VerificationKeyV0 expiresAt */
        expiresAt?: (number|Long|null);
    }

    /** Represents a VerificationKeyV0. */
    class VerificationKeyV0 implements IVerificationKeyV0 {

        /**
         * Constructs a new VerificationKeyV0.
         * @param [properties] Properties to set
         */
        constructor(properties?: ov_schema.IVerificationKeyV0);

        /** VerificationKeyV0 publicKey. */
        public publicKey?: (ov_schema.IPublicKey|null);

        /** VerificationKeyV0 expiresAt. */
        public expiresAt?: (number|Long|null);

        /** VerificationKeyV0 _expiresAt. */
        public _expiresAt?: "expiresAt";

        /**
         * Creates a new VerificationKeyV0 instance using the specified properties.
         * @param [properties] Properties to set
         * @returns VerificationKeyV0 instance
         */
        public static create(properties?: ov_schema.IVerificationKeyV0): ov_schema.VerificationKeyV0;

        /**
         * Encodes the specified VerificationKeyV0 message. Does not implicitly {@link ov_schema.VerificationKeyV0.verify|verify} messages.
         * @param message VerificationKeyV0 message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: ov_schema.IVerificationKeyV0, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified VerificationKeyV0 message, length delimited. Does not implicitly {@link ov_schema.VerificationKeyV0.verify|verify} messages.
         * @param message VerificationKeyV0 message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: ov_schema.IVerificationKeyV0, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a VerificationKeyV0 message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns VerificationKeyV0
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): ov_schema.VerificationKeyV0;

        /**
         * Decodes a VerificationKeyV0 message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns VerificationKeyV0
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): ov_schema.VerificationKeyV0;

        /**
         * Verifies a VerificationKeyV0 message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a VerificationKeyV0 message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns VerificationKeyV0
         */
        public static fromObject(object: { [k: string]: any }): ov_schema.VerificationKeyV0;

        /**
         * Creates a plain object from a VerificationKeyV0 message. Also converts values to other types if specified.
         * @param message VerificationKeyV0
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: ov_schema.VerificationKeyV0, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this VerificationKeyV0 to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for VerificationKeyV0
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a PublicKey. */
    interface IPublicKey {

        /** PublicKey curve25519 */
        curve25519?: (Uint8Array|null);

        /** PublicKey ethereum */
        ethereum?: (Uint8Array|null);
    }

    /** Represents a PublicKey. */
    class PublicKey implements IPublicKey {

        /**
         * Constructs a new PublicKey.
         * @param [properties] Properties to set
         */
        constructor(properties?: ov_schema.IPublicKey);

        /** PublicKey curve25519. */
        public curve25519?: (Uint8Array|null);

        /** PublicKey ethereum. */
        public ethereum?: (Uint8Array|null);

        /** PublicKey type. */
        public type?: ("curve25519"|"ethereum");

        /**
         * Creates a new PublicKey instance using the specified properties.
         * @param [properties] Properties to set
         * @returns PublicKey instance
         */
        public static create(properties?: ov_schema.IPublicKey): ov_schema.PublicKey;

        /**
         * Encodes the specified PublicKey message. Does not implicitly {@link ov_schema.PublicKey.verify|verify} messages.
         * @param message PublicKey message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: ov_schema.IPublicKey, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified PublicKey message, length delimited. Does not implicitly {@link ov_schema.PublicKey.verify|verify} messages.
         * @param message PublicKey message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: ov_schema.IPublicKey, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a PublicKey message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns PublicKey
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): ov_schema.PublicKey;

        /**
         * Decodes a PublicKey message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns PublicKey
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): ov_schema.PublicKey;

        /**
         * Verifies a PublicKey message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a PublicKey message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns PublicKey
         */
        public static fromObject(object: { [k: string]: any }): ov_schema.PublicKey;

        /**
         * Creates a plain object from a PublicKey message. Also converts values to other types if specified.
         * @param message PublicKey
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: ov_schema.PublicKey, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this PublicKey to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for PublicKey
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }
}
