import { UserRole, KycStatus, VerificationTier, ClipperTier } from '@prisma/client';

export class UserEntity {
  readonly id: string;
  readonly logtoId: string | null;
  readonly email: string;
  name: string;
  role: UserRole;
  bio: string | null;
  avatarUrl: string | null;
  nicheTags: string[];
  socialLinks: Record<string, string> | null;
  kycStatus: KycStatus;
  clipperScore: number;
  clipperTier: ClipperTier;
  verificationTier: VerificationTier;
  emailVerified: boolean;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(props: Partial<UserEntity> & { id: string; email: string; name: string; role: UserRole }) {
    Object.assign(this, {
      logtoId: null,
      bio: null,
      avatarUrl: null,
      nicheTags: [],
      socialLinks: null,
      kycStatus: KycStatus.none,
      clipperScore: 0,
      clipperTier: ClipperTier.bronze,
      verificationTier: VerificationTier.tier0,
      emailVerified: false,
      ...props,
    });
  }
}
