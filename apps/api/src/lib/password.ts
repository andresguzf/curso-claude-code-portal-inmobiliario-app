import {
  randomBytes,
  scrypt,
  timingSafeEqual,
  type ScryptOptions,
} from "node:crypto";

/**
 * Hashing de contraseñas (spec.md, sección 15).
 *
 * Se usa scrypt, que viene en Node y que OWASP acepta como algoritmo de
 * derivación para contraseñas. Es deliberadamente costoso en tiempo y en
 * memoria: eso es lo que encarece un ataque por fuerza bruta sobre la base de
 * datos robada.
 *
 * Cada contraseña lleva su propia sal aleatoria, de modo que dos personas con
 * la misma contraseña no compartan hash y una tabla precalculada no sirva.
 */

/**
 * `scrypt` con promesas.
 *
 * Se envuelve a mano en lugar de con `promisify` porque este necesita las
 * opciones de coste, y la firma promisificada las pierde.
 */
function deriveKey(
  password: string,
  salt: Buffer,
  keyLength: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) {
        reject(error);
      } else {
        resolve(derivedKey);
      }
    });
  });
}

/** Coste de CPU y memoria: 128 · N · r = 16 MiB por derivación. */
const COST = 16_384;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

/**
 * Los parámetros viajan dentro del propio hash.
 *
 * Así se pueden endurecer más adelante sin invalidar las contraseñas ya
 * guardadas: cada hash recuerda con qué coste se generó.
 */
const ALGORITHM = "scrypt";
const FIELD_SEPARATOR = "$";

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const derivedKey = await deriveKey(password, salt, KEY_LENGTH, {
    N: COST,
    r: BLOCK_SIZE,
    p: PARALLELIZATION,
  });

  return [
    ALGORITHM,
    COST,
    BLOCK_SIZE,
    PARALLELIZATION,
    salt.toString("base64"),
    derivedKey.toString("base64"),
  ].join(FIELD_SEPARATOR);
}

/**
 * Comprueba una contraseña contra su hash.
 *
 * Devuelve `false` ante un hash corrupto o de otro formato en lugar de
 * lanzar: una fila estropeada en la base de datos no debe tumbar el login de
 * todo el mundo.
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const parsed = parseStoredHash(storedHash);

  if (parsed === null) {
    return false;
  }

  const derivedKey = await deriveKey(
    password,
    parsed.salt,
    parsed.expectedKey.length,
    { N: parsed.cost, r: parsed.blockSize, p: parsed.parallelization },
  );

  // Comparación de tiempo constante: una comparación normal se rinde en el
  // primer byte distinto y filtra información sobre el hash.
  return timingSafeEqual(derivedKey, parsed.expectedKey);
}

type ParsedHash = {
  readonly cost: number;
  readonly blockSize: number;
  readonly parallelization: number;
  readonly salt: Buffer;
  readonly expectedKey: Buffer;
};

function parseStoredHash(storedHash: string): ParsedHash | null {
  const parts = storedHash.split(FIELD_SEPARATOR);

  if (parts.length !== 6 || parts[0] !== ALGORITHM) {
    return null;
  }

  const [, cost, blockSize, parallelization, salt, expectedKey] = parts as [
    string,
    string,
    string,
    string,
    string,
    string,
  ];

  const parsedNumbers = [cost, blockSize, parallelization].map(Number);

  if (parsedNumbers.some((value) => !Number.isInteger(value) || value <= 0)) {
    return null;
  }

  const expectedKeyBuffer = Buffer.from(expectedKey, "base64");

  if (expectedKeyBuffer.length === 0) {
    return null;
  }

  return {
    cost: parsedNumbers[0] as number,
    blockSize: parsedNumbers[1] as number,
    parallelization: parsedNumbers[2] as number,
    salt: Buffer.from(salt, "base64"),
    expectedKey: expectedKeyBuffer,
  };
}
