/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
import * as $protobuf from "protobufjs/minimal";

// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const ov_schema = $root.ov_schema = (() => {

    /**
     * Namespace ov_schema.
     * @exports ov_schema
     * @namespace
     */
    const ov_schema = {};

    ov_schema.VerificationKey = (function() {

        /**
         * Properties of a VerificationKey.
         * @memberof ov_schema
         * @interface IVerificationKey
         * @property {ov_schema.IVerificationKeyV0|null} [v0] VerificationKey v0
         */

        /**
         * Constructs a new VerificationKey.
         * @memberof ov_schema
         * @classdesc Represents a VerificationKey.
         * @implements IVerificationKey
         * @constructor
         * @param {ov_schema.IVerificationKey=} [properties] Properties to set
         */
        function VerificationKey(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * VerificationKey v0.
         * @member {ov_schema.IVerificationKeyV0|null|undefined} v0
         * @memberof ov_schema.VerificationKey
         * @instance
         */
        VerificationKey.prototype.v0 = null;

        // OneOf field names bound to virtual getters and setters
        let $oneOfFields;

        /**
         * VerificationKey version.
         * @member {"v0"|undefined} version
         * @memberof ov_schema.VerificationKey
         * @instance
         */
        Object.defineProperty(VerificationKey.prototype, "version", {
            get: $util.oneOfGetter($oneOfFields = ["v0"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new VerificationKey instance using the specified properties.
         * @function create
         * @memberof ov_schema.VerificationKey
         * @static
         * @param {ov_schema.IVerificationKey=} [properties] Properties to set
         * @returns {ov_schema.VerificationKey} VerificationKey instance
         */
        VerificationKey.create = function create(properties) {
            return new VerificationKey(properties);
        };

        /**
         * Encodes the specified VerificationKey message. Does not implicitly {@link ov_schema.VerificationKey.verify|verify} messages.
         * @function encode
         * @memberof ov_schema.VerificationKey
         * @static
         * @param {ov_schema.IVerificationKey} message VerificationKey message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        VerificationKey.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.v0 != null && Object.hasOwnProperty.call(message, "v0"))
                $root.ov_schema.VerificationKeyV0.encode(message.v0, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified VerificationKey message, length delimited. Does not implicitly {@link ov_schema.VerificationKey.verify|verify} messages.
         * @function encodeDelimited
         * @memberof ov_schema.VerificationKey
         * @static
         * @param {ov_schema.IVerificationKey} message VerificationKey message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        VerificationKey.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a VerificationKey message from the specified reader or buffer.
         * @function decode
         * @memberof ov_schema.VerificationKey
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {ov_schema.VerificationKey} VerificationKey
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        VerificationKey.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.ov_schema.VerificationKey();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.v0 = $root.ov_schema.VerificationKeyV0.decode(reader, reader.uint32());
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a VerificationKey message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof ov_schema.VerificationKey
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {ov_schema.VerificationKey} VerificationKey
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        VerificationKey.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a VerificationKey message.
         * @function verify
         * @memberof ov_schema.VerificationKey
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        VerificationKey.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            let properties = {};
            if (message.v0 != null && message.hasOwnProperty("v0")) {
                properties.version = 1;
                {
                    let error = $root.ov_schema.VerificationKeyV0.verify(message.v0);
                    if (error)
                        return "v0." + error;
                }
            }
            return null;
        };

        /**
         * Creates a VerificationKey message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof ov_schema.VerificationKey
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {ov_schema.VerificationKey} VerificationKey
         */
        VerificationKey.fromObject = function fromObject(object) {
            if (object instanceof $root.ov_schema.VerificationKey)
                return object;
            let message = new $root.ov_schema.VerificationKey();
            if (object.v0 != null) {
                if (typeof object.v0 !== "object")
                    throw TypeError(".ov_schema.VerificationKey.v0: object expected");
                message.v0 = $root.ov_schema.VerificationKeyV0.fromObject(object.v0);
            }
            return message;
        };

        /**
         * Creates a plain object from a VerificationKey message. Also converts values to other types if specified.
         * @function toObject
         * @memberof ov_schema.VerificationKey
         * @static
         * @param {ov_schema.VerificationKey} message VerificationKey
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        VerificationKey.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (message.v0 != null && message.hasOwnProperty("v0")) {
                object.v0 = $root.ov_schema.VerificationKeyV0.toObject(message.v0, options);
                if (options.oneofs)
                    object.version = "v0";
            }
            return object;
        };

        /**
         * Converts this VerificationKey to JSON.
         * @function toJSON
         * @memberof ov_schema.VerificationKey
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        VerificationKey.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for VerificationKey
         * @function getTypeUrl
         * @memberof ov_schema.VerificationKey
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        VerificationKey.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/ov_schema.VerificationKey";
        };

        return VerificationKey;
    })();

    ov_schema.VerificationKeyV0 = (function() {

        /**
         * Properties of a VerificationKeyV0.
         * @memberof ov_schema
         * @interface IVerificationKeyV0
         * @property {ov_schema.IPublicKey|null} [publicKey] VerificationKeyV0 publicKey
         * @property {number|Long|null} [expiresAt] VerificationKeyV0 expiresAt
         */

        /**
         * Constructs a new VerificationKeyV0.
         * @memberof ov_schema
         * @classdesc Represents a VerificationKeyV0.
         * @implements IVerificationKeyV0
         * @constructor
         * @param {ov_schema.IVerificationKeyV0=} [properties] Properties to set
         */
        function VerificationKeyV0(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * VerificationKeyV0 publicKey.
         * @member {ov_schema.IPublicKey|null|undefined} publicKey
         * @memberof ov_schema.VerificationKeyV0
         * @instance
         */
        VerificationKeyV0.prototype.publicKey = null;

        /**
         * VerificationKeyV0 expiresAt.
         * @member {number|Long|null|undefined} expiresAt
         * @memberof ov_schema.VerificationKeyV0
         * @instance
         */
        VerificationKeyV0.prototype.expiresAt = null;

        // OneOf field names bound to virtual getters and setters
        let $oneOfFields;

        /**
         * VerificationKeyV0 _expiresAt.
         * @member {"expiresAt"|undefined} _expiresAt
         * @memberof ov_schema.VerificationKeyV0
         * @instance
         */
        Object.defineProperty(VerificationKeyV0.prototype, "_expiresAt", {
            get: $util.oneOfGetter($oneOfFields = ["expiresAt"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new VerificationKeyV0 instance using the specified properties.
         * @function create
         * @memberof ov_schema.VerificationKeyV0
         * @static
         * @param {ov_schema.IVerificationKeyV0=} [properties] Properties to set
         * @returns {ov_schema.VerificationKeyV0} VerificationKeyV0 instance
         */
        VerificationKeyV0.create = function create(properties) {
            return new VerificationKeyV0(properties);
        };

        /**
         * Encodes the specified VerificationKeyV0 message. Does not implicitly {@link ov_schema.VerificationKeyV0.verify|verify} messages.
         * @function encode
         * @memberof ov_schema.VerificationKeyV0
         * @static
         * @param {ov_schema.IVerificationKeyV0} message VerificationKeyV0 message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        VerificationKeyV0.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.publicKey != null && Object.hasOwnProperty.call(message, "publicKey"))
                $root.ov_schema.PublicKey.encode(message.publicKey, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            if (message.expiresAt != null && Object.hasOwnProperty.call(message, "expiresAt"))
                writer.uint32(/* id 2, wireType 0 =*/16).int64(message.expiresAt);
            return writer;
        };

        /**
         * Encodes the specified VerificationKeyV0 message, length delimited. Does not implicitly {@link ov_schema.VerificationKeyV0.verify|verify} messages.
         * @function encodeDelimited
         * @memberof ov_schema.VerificationKeyV0
         * @static
         * @param {ov_schema.IVerificationKeyV0} message VerificationKeyV0 message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        VerificationKeyV0.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a VerificationKeyV0 message from the specified reader or buffer.
         * @function decode
         * @memberof ov_schema.VerificationKeyV0
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {ov_schema.VerificationKeyV0} VerificationKeyV0
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        VerificationKeyV0.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.ov_schema.VerificationKeyV0();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.publicKey = $root.ov_schema.PublicKey.decode(reader, reader.uint32());
                        break;
                    }
                case 2: {
                        message.expiresAt = reader.int64();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a VerificationKeyV0 message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof ov_schema.VerificationKeyV0
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {ov_schema.VerificationKeyV0} VerificationKeyV0
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        VerificationKeyV0.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a VerificationKeyV0 message.
         * @function verify
         * @memberof ov_schema.VerificationKeyV0
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        VerificationKeyV0.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            let properties = {};
            if (message.publicKey != null && message.hasOwnProperty("publicKey")) {
                let error = $root.ov_schema.PublicKey.verify(message.publicKey);
                if (error)
                    return "publicKey." + error;
            }
            if (message.expiresAt != null && message.hasOwnProperty("expiresAt")) {
                properties._expiresAt = 1;
                if (!$util.isInteger(message.expiresAt) && !(message.expiresAt && $util.isInteger(message.expiresAt.low) && $util.isInteger(message.expiresAt.high)))
                    return "expiresAt: integer|Long expected";
            }
            return null;
        };

        /**
         * Creates a VerificationKeyV0 message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof ov_schema.VerificationKeyV0
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {ov_schema.VerificationKeyV0} VerificationKeyV0
         */
        VerificationKeyV0.fromObject = function fromObject(object) {
            if (object instanceof $root.ov_schema.VerificationKeyV0)
                return object;
            let message = new $root.ov_schema.VerificationKeyV0();
            if (object.publicKey != null) {
                if (typeof object.publicKey !== "object")
                    throw TypeError(".ov_schema.VerificationKeyV0.publicKey: object expected");
                message.publicKey = $root.ov_schema.PublicKey.fromObject(object.publicKey);
            }
            if (object.expiresAt != null)
                if ($util.Long)
                    (message.expiresAt = $util.Long.fromValue(object.expiresAt)).unsigned = false;
                else if (typeof object.expiresAt === "string")
                    message.expiresAt = parseInt(object.expiresAt, 10);
                else if (typeof object.expiresAt === "number")
                    message.expiresAt = object.expiresAt;
                else if (typeof object.expiresAt === "object")
                    message.expiresAt = new $util.LongBits(object.expiresAt.low >>> 0, object.expiresAt.high >>> 0).toNumber();
            return message;
        };

        /**
         * Creates a plain object from a VerificationKeyV0 message. Also converts values to other types if specified.
         * @function toObject
         * @memberof ov_schema.VerificationKeyV0
         * @static
         * @param {ov_schema.VerificationKeyV0} message VerificationKeyV0
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        VerificationKeyV0.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (options.defaults)
                object.publicKey = null;
            if (message.publicKey != null && message.hasOwnProperty("publicKey"))
                object.publicKey = $root.ov_schema.PublicKey.toObject(message.publicKey, options);
            if (message.expiresAt != null && message.hasOwnProperty("expiresAt")) {
                if (typeof message.expiresAt === "number")
                    object.expiresAt = options.longs === String ? String(message.expiresAt) : message.expiresAt;
                else
                    object.expiresAt = options.longs === String ? $util.Long.prototype.toString.call(message.expiresAt) : options.longs === Number ? new $util.LongBits(message.expiresAt.low >>> 0, message.expiresAt.high >>> 0).toNumber() : message.expiresAt;
                if (options.oneofs)
                    object._expiresAt = "expiresAt";
            }
            return object;
        };

        /**
         * Converts this VerificationKeyV0 to JSON.
         * @function toJSON
         * @memberof ov_schema.VerificationKeyV0
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        VerificationKeyV0.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for VerificationKeyV0
         * @function getTypeUrl
         * @memberof ov_schema.VerificationKeyV0
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        VerificationKeyV0.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/ov_schema.VerificationKeyV0";
        };

        return VerificationKeyV0;
    })();

    ov_schema.PublicKey = (function() {

        /**
         * Properties of a PublicKey.
         * @memberof ov_schema
         * @interface IPublicKey
         * @property {Uint8Array|null} [curve25519] PublicKey curve25519
         * @property {Uint8Array|null} [ethereum] PublicKey ethereum
         */

        /**
         * Constructs a new PublicKey.
         * @memberof ov_schema
         * @classdesc Represents a PublicKey.
         * @implements IPublicKey
         * @constructor
         * @param {ov_schema.IPublicKey=} [properties] Properties to set
         */
        function PublicKey(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * PublicKey curve25519.
         * @member {Uint8Array|null|undefined} curve25519
         * @memberof ov_schema.PublicKey
         * @instance
         */
        PublicKey.prototype.curve25519 = null;

        /**
         * PublicKey ethereum.
         * @member {Uint8Array|null|undefined} ethereum
         * @memberof ov_schema.PublicKey
         * @instance
         */
        PublicKey.prototype.ethereum = null;

        // OneOf field names bound to virtual getters and setters
        let $oneOfFields;

        /**
         * PublicKey type.
         * @member {"curve25519"|"ethereum"|undefined} type
         * @memberof ov_schema.PublicKey
         * @instance
         */
        Object.defineProperty(PublicKey.prototype, "type", {
            get: $util.oneOfGetter($oneOfFields = ["curve25519", "ethereum"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new PublicKey instance using the specified properties.
         * @function create
         * @memberof ov_schema.PublicKey
         * @static
         * @param {ov_schema.IPublicKey=} [properties] Properties to set
         * @returns {ov_schema.PublicKey} PublicKey instance
         */
        PublicKey.create = function create(properties) {
            return new PublicKey(properties);
        };

        /**
         * Encodes the specified PublicKey message. Does not implicitly {@link ov_schema.PublicKey.verify|verify} messages.
         * @function encode
         * @memberof ov_schema.PublicKey
         * @static
         * @param {ov_schema.IPublicKey} message PublicKey message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PublicKey.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.curve25519 != null && Object.hasOwnProperty.call(message, "curve25519"))
                writer.uint32(/* id 2, wireType 2 =*/18).bytes(message.curve25519);
            if (message.ethereum != null && Object.hasOwnProperty.call(message, "ethereum"))
                writer.uint32(/* id 3, wireType 2 =*/26).bytes(message.ethereum);
            return writer;
        };

        /**
         * Encodes the specified PublicKey message, length delimited. Does not implicitly {@link ov_schema.PublicKey.verify|verify} messages.
         * @function encodeDelimited
         * @memberof ov_schema.PublicKey
         * @static
         * @param {ov_schema.IPublicKey} message PublicKey message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PublicKey.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a PublicKey message from the specified reader or buffer.
         * @function decode
         * @memberof ov_schema.PublicKey
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {ov_schema.PublicKey} PublicKey
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PublicKey.decode = function decode(reader, length, error) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.ov_schema.PublicKey();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 2: {
                        message.curve25519 = reader.bytes();
                        break;
                    }
                case 3: {
                        message.ethereum = reader.bytes();
                        break;
                    }
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a PublicKey message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof ov_schema.PublicKey
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {ov_schema.PublicKey} PublicKey
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PublicKey.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a PublicKey message.
         * @function verify
         * @memberof ov_schema.PublicKey
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        PublicKey.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            let properties = {};
            if (message.curve25519 != null && message.hasOwnProperty("curve25519")) {
                properties.type = 1;
                if (!(message.curve25519 && typeof message.curve25519.length === "number" || $util.isString(message.curve25519)))
                    return "curve25519: buffer expected";
            }
            if (message.ethereum != null && message.hasOwnProperty("ethereum")) {
                if (properties.type === 1)
                    return "type: multiple values";
                properties.type = 1;
                if (!(message.ethereum && typeof message.ethereum.length === "number" || $util.isString(message.ethereum)))
                    return "ethereum: buffer expected";
            }
            return null;
        };

        /**
         * Creates a PublicKey message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof ov_schema.PublicKey
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {ov_schema.PublicKey} PublicKey
         */
        PublicKey.fromObject = function fromObject(object) {
            if (object instanceof $root.ov_schema.PublicKey)
                return object;
            let message = new $root.ov_schema.PublicKey();
            if (object.curve25519 != null)
                if (typeof object.curve25519 === "string")
                    $util.base64.decode(object.curve25519, message.curve25519 = $util.newBuffer($util.base64.length(object.curve25519)), 0);
                else if (object.curve25519.length >= 0)
                    message.curve25519 = object.curve25519;
            if (object.ethereum != null)
                if (typeof object.ethereum === "string")
                    $util.base64.decode(object.ethereum, message.ethereum = $util.newBuffer($util.base64.length(object.ethereum)), 0);
                else if (object.ethereum.length >= 0)
                    message.ethereum = object.ethereum;
            return message;
        };

        /**
         * Creates a plain object from a PublicKey message. Also converts values to other types if specified.
         * @function toObject
         * @memberof ov_schema.PublicKey
         * @static
         * @param {ov_schema.PublicKey} message PublicKey
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        PublicKey.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            let object = {};
            if (message.curve25519 != null && message.hasOwnProperty("curve25519")) {
                object.curve25519 = options.bytes === String ? $util.base64.encode(message.curve25519, 0, message.curve25519.length) : options.bytes === Array ? Array.prototype.slice.call(message.curve25519) : message.curve25519;
                if (options.oneofs)
                    object.type = "curve25519";
            }
            if (message.ethereum != null && message.hasOwnProperty("ethereum")) {
                object.ethereum = options.bytes === String ? $util.base64.encode(message.ethereum, 0, message.ethereum.length) : options.bytes === Array ? Array.prototype.slice.call(message.ethereum) : message.ethereum;
                if (options.oneofs)
                    object.type = "ethereum";
            }
            return object;
        };

        /**
         * Converts this PublicKey to JSON.
         * @function toJSON
         * @memberof ov_schema.PublicKey
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        PublicKey.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for PublicKey
         * @function getTypeUrl
         * @memberof ov_schema.PublicKey
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        PublicKey.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/ov_schema.PublicKey";
        };

        return PublicKey;
    })();

    return ov_schema;
})();

export { $root as default };
