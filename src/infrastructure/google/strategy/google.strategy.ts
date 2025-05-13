import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { envConfig } from '../../../config/env.config';
import { StrategyOptions } from 'passport-google-oauth20';
import { VerifyCallback } from 'passport-google-oauth20';
import { GoogleService } from '../service/google.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private googleService: GoogleService) {
    super({
      clientID: envConfig.GOOGLE_CLIENT_ID,
      clientSecret: envConfig.GOOGLE_CLIENT_SECRET,
      callbackURL: envConfig.GOOGLE_REDIRECT_URI,
      scope: ['email', 'profile'],
    } as StrategyOptions);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    try {
      console.log('Google Profile:', JSON.stringify(profile, null, 2));
      const { name, emails, photos, id } = profile;

      if (!emails?.[0]?.value || !name?.givenName || !photos?.[0]?.value) {
        throw new Error(
          'Invalid profile data from Google - missing email, givenName, or photo',
        );
      }

      const user = await this.googleService.validateOAuthLogin({
        email: emails[0].value,
        firstName: name.givenName,
        lastName: name.familyName || '',
        picture: photos[0].value,
        providerId: id,
      });

      done(null, user);
    } catch (error) {
      done(error, false);
    }
  }
}
