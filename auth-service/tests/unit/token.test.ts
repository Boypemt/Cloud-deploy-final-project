import jwt from 'jsonwebtoken';
import { config } from '../../src/config';
import { AuthUser, signToken, verifyToken } from '../../src/utils/token';

// UT-AUTH-03
describe('signToken / verifyToken', () => {
  const user: AuthUser = {
    sub: '66f1aaaaaaaaaaaaaaaaaaaa',
    email: 'demo@campusmart.local',
    name: 'Demo User',
    role: 'user',
  };

  it('signs HS256 and the payload has exactly sub, email, name, role (+ iat/exp)', () => {
    const token = signToken(user);
    const decoded = jwt.decode(token, { complete: true });

    expect(decoded?.header.alg).toBe('HS256');
    // Extra claims would be ignored by product-service, missing ones would get the token rejected.
    expect(Object.keys(decoded?.payload as object).sort()).toEqual([
      'email',
      'exp',
      'iat',
      'name',
      'role',
      'sub',
    ]);
    expect(verifyToken(token)).toMatchObject(user);
  });

  it('round-trips an admin token (role must survive, product-service reads it)', () => {
    expect(verifyToken(signToken({ ...user, role: 'admin' })).role).toBe('admin');
  });

  it('throws on a tampered token', () => {
    const token = signToken(user);
    const [header, payload, signature] = token.split('.');

    // Same payload, one character changed in the signature → the signature no longer matches.
    const brokenSignature = `${header}.${payload}.${signature.slice(0, -1)}${signature.endsWith('a') ? 'b' : 'a'}`;
    expect(() => verifyToken(brokenSignature)).toThrow();

    // Payload edited to role "admin" but signed with the old signature → privilege escalation blocked.
    const forgedPayload = Buffer.from(JSON.stringify({ ...user, role: 'admin' })).toString('base64url');
    expect(() => verifyToken(`${header}.${forgedPayload}.${signature}`)).toThrow();

    expect(() => verifyToken('not-a-jwt')).toThrow();
  });

  it('throws on an expired token', () => {
    const expired = jwt.sign(user, config.jwtSecret, { algorithm: 'HS256', expiresIn: '-1s' });
    expect(() => verifyToken(expired)).toThrow(jwt.TokenExpiredError);
  });

  it('throws on a token signed with another secret', () => {
    const foreign = jwt.sign(user, 'some-other-secret', { algorithm: 'HS256', expiresIn: '1h' });
    expect(() => verifyToken(foreign)).toThrow();
  });

  it('throws when the claims are not a CampusMart user', () => {
    // Correct signature, but the payload is not what the contract promises.
    const noRole = jwt.sign({ sub: '1', email: 'a@b.co', name: 'x' }, config.jwtSecret, { algorithm: 'HS256' });
    expect(() => verifyToken(noRole)).toThrow();

    const badRole = jwt.sign({ ...user, role: 'superadmin' }, config.jwtSecret, { algorithm: 'HS256' });
    expect(() => verifyToken(badRole)).toThrow();
  });

  it('rejects an unsigned "alg: none" token (algorithm confusion)', () => {
    const unsigned = jwt.sign(user, '', { algorithm: 'none' });
    expect(() => verifyToken(unsigned)).toThrow();
  });
});
