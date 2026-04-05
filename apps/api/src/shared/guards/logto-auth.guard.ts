import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwksClient } from 'jwks-rsa';
import { verify } from 'jsonwebtoken';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

interface LogtoJwtPayload {
  sub: string;
  aud: string;
  iss: string;
  exp: number;
  iat: number;
  scope?: string;
}

@Injectable()
export class LogtoAuthGuard implements CanActivate {
  private readonly logger = new Logger(LogtoAuthGuard.name);
  private readonly jwksClient: JwksClient;
  private readonly audience: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {
    this.audience = this.configService.get<string>('LOGTO_AUDIENCE')!;

    this.jwksClient = new JwksClient({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
      jwksUri: this.configService.get<string>('LOGTO_JWKS_URI')!,
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.slice(7);

    try {
      const decoded = await this.verifyToken(token);
      request.user = { sub: decoded.sub, scope: decoded.scope };
      return true;
    } catch (error) {
      this.logger.warn(`JWT verification failed: ${error}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private verifyToken(token: string): Promise<LogtoJwtPayload> {
    return new Promise((resolve, reject) => {
      verify(
        token,
        (header, callback) => {
          this.jwksClient.getSigningKey(header.kid, (err, key) => {
            if (err) return callback(err);
            const signingKey = key?.getPublicKey();
            callback(null, signingKey);
          });
        },
        { audience: this.audience, algorithms: ['RS256'] },
        (err, decoded) => {
          if (err) return reject(err);
          resolve(decoded as LogtoJwtPayload);
        },
      );
    });
  }
}
