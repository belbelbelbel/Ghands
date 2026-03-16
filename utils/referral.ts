import { Alert, Share } from 'react-native';

type ReferralRole = 'client' | 'provider';

interface ShareReferralOptions {
  role: ReferralRole;
  code?: string | null;
}

export const shareReferral = async ({ role, code }: ShareReferralOptions) => {
  try {
    const baseMessage =
      role === 'provider'
        ? 'Join G-Hands to book trusted service providers for your home and office.'
        : 'Join G-Hands to find trusted service providers for your next job.';

    const codeSnippet = code ? `\n\nUse my referral code: ${code}` : '';

    await Share.share({
      message: `${baseMessage}${codeSnippet}`,
      title: 'Invite to G-Hands',
    });
  } catch (error) {
    Alert.alert('Error', 'Failed to share invitation. Please try again.');
  }
};

