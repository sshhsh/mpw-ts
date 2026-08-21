export const VERSION = 3 as const;

export const MIN_COUNTER = 1;
export const MAX_COUNTER = 0xffffffff;

export function isValidCounter(value: number): boolean {
  return Number.isInteger(value) && value >= MIN_COUNTER && value <= MAX_COUNTER;
}

export const NAMESPACE = 'com.lyndir.masterpassword';
export const AUTHENTICATION_NAMESPACE = NAMESPACE;
export const IDENTIFICATION_NAMESPACE = `${NAMESPACE}.login`;
export const RECOVERY_NAMESPACE = `${NAMESPACE}.answer`;

export const TEMPLATES = {
  maximum: ['anoxxxxxxxxxxxxxxxxx', 'axxxxxxxxxxxxxxxxxno'],
  long: [
    'CvcvnoCvcvCvcv',
    'CvcvCvcvnoCvcv',
    'CvcvCvcvCvcvno',
    'CvccnoCvcvCvcv',
    'CvccCvcvnoCvcv',
    'CvccCvcvCvcvno',
    'CvcvnoCvccCvcv',
    'CvcvCvccnoCvcv',
    'CvcvCvccCvcvno',
    'CvcvnoCvcvCvcc',
    'CvcvCvcvnoCvcc',
    'CvcvCvcvCvccno',
    'CvccnoCvccCvcv',
    'CvccCvccnoCvcv',
    'CvccCvccCvcvno',
    'CvcvnoCvccCvcc',
    'CvcvCvccnoCvcc',
    'CvcvCvccCvccno',
    'CvccnoCvcvCvcc',
    'CvccCvcvnoCvcc',
    'CvccCvcvCvccno',
  ],
  medium: ['CvcnoCvc', 'CvcCvcno'],
  basic: ['aaanaaan', 'aannaaan', 'aaannaaa'],
  short: ['Cvcn'],
  pin: ['nnnn'],
  name: ['cvccvcvcv'],
  phrase: [
    'cvcc cvc cvccvcv cvc',
    'cvc cvccvcvcv cvcv',
    'cv cvccv cvc cvcvccv',
  ],
} as const;

export type TemplateName = keyof typeof TEMPLATES;

export const PASSWORD_CHARACTERS = {
  V: 'AEIOU',
  C: 'BCDFGHJKLMNPQRSTVWXYZ',
  v: 'aeiou',
  c: 'bcdfghjklmnpqrstvwxyz',
  A: 'AEIOUBCDFGHJKLMNPQRSTVWXYZ',
  a: 'AEIOUaeiouBCDFGHJKLMNPQRSTVWXYZbcdfghjklmnpqrstvwxyz',
  n: '0123456789',
  o: "@&%?,=[]_:-+*$#!'^~;()/.",
  x: 'AEIOUaeiouBCDFGHJKLMNPQRSTVWXYZbcdfghjklmnpqrstvwxyz0123456789!@#$%^&*()',
  ' ': ' ',
} as const;

export type TemplateCharacter = keyof typeof PASSWORD_CHARACTERS;
