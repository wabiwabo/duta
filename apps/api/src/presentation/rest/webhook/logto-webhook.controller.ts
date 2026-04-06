import { Controller, Post, Body, HttpCode, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../../../shared/decorators/public.decorator';
import { PrismaService } from '../../../infrastructure/persistence/prisma.service';
import { EmailService } from '../../../infrastructure/email/email.service';

@ApiTags('Webhooks')
@SkipThrottle()
@Controller('api/webhooks/logto')
export class LogtoWebhookController {
  private readonly logger = new Logger(LogtoWebhookController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  @Post()
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Logto user lifecycle webhook — sends welcome email on User.Created' })
  async handleEvent(@Body() body: any) {
    // Logto webhook sends: { event: 'User.Created', user: { id, primaryEmail, name, ... } }
    if (body.event === 'User.Created' && body.user?.primaryEmail) {
      const email = body.user.primaryEmail;
      const name = body.user.name || body.user.username || 'User';

      // Send welcome email (fire-and-forget)
      this.emailService
        .sendWelcome(email, {
          userName: name,
          role: 'clipper', // default role
        })
        .catch((err) => this.logger.error('Welcome email failed', err));
    }

    return { ok: true };
  }
}
